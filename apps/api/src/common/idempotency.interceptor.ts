import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
  applyDecorators,
  UseInterceptors,
  SetMetadata,
} from '@nestjs/common';
import { Observable, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PrismaClient } from '@rupeeroute/domain';
import { defaultIdempotencyExpiry, hashRequest, idempotencyConflict } from '@rupeeroute/domain';

export const IDEMPOTENT_KEY = 'idempotent';

export const Idempotent = () =>
  applyDecorators(SetMetadata(IDEMPOTENT_KEY, true), UseInterceptors(IdempotencyInterceptor));

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaClient) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      body: unknown;
      method: string;
    }>();
    const response = context
      .switchToHttp()
      .getResponse<{ status: (code: number) => { json: (body: unknown) => void } }>();

    if (request.method === 'GET') {
      return next.handle();
    }

    const key = request.headers['idempotency-key'];
    if (!key) {
      return next.handle();
    }

    const requestHash = hashRequest(request.body);

    return from(this.prisma.idempotencyKey.findUnique({ where: { key } })).pipe(
      switchMap((existing) => {
        if (existing) {
          if (idempotencyConflict(existing, requestHash)) {
            throw new ConflictException('Idempotency key reused with different payload');
          }
          if (existing.responseBody !== null && existing.statusCode !== null) {
            response.status(existing.statusCode).json(existing.responseBody);
            return of(null);
          }
        }

        return next.handle().pipe(
          switchMap(async (body) => {
            await this.prisma.idempotencyKey.upsert({
              where: { key },
              create: {
                key,
                requestHash,
                responseBody: body as object,
                statusCode: 200,
                expiresAt: defaultIdempotencyExpiry(),
              },
              update: {
                responseBody: body as object,
                statusCode: 200,
              },
            });
            return body as unknown;
          }),
        );
      }),
    );
  }
}
