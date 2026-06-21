import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiEnvSchema, assertSandboxMode, parseEnv, resolveFeatureFlags } from '@rupeeroute/config';
import { createCorrelationMiddleware, createLogger } from '@rupeeroute/observability';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { buildHelmetConfig } from './security/helmet.config';

async function bootstrap() {
  const env = parseEnv(apiEnvSchema);
  const flags = resolveFeatureFlags(env);
  assertSandboxMode(flags);

  const logger = createLogger({ service: 'api', level: env.LOG_LEVEL, pretty: true });

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.use(createCorrelationMiddleware());
  app.use(helmet(buildHelmetConfig()));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3003', 'http://localhost:8081'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Idempotency-Key',
      'x-webhook-signature',
      'x-correlation-id',
    ],
  });

  const config = new DocumentBuilder()
    .setTitle('RupeeRoute API')
    .setDescription(
      'Sandbox remittance API — see packages/api-contracts/openapi.yaml for contract source.',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(env.API_PORT);
  logger.info({ port: env.API_PORT, sandboxMode: !flags.liveTransfersEnabled }, 'API started');
}

void bootstrap();
