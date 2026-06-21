import pino, { type Logger, type LoggerOptions } from 'pino';
import { redactPii } from './pii-redaction.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface CreateLoggerOptions {
  service: string;
  level?: LogLevel;
  pretty?: boolean;
}

export function createLogger(options: CreateLoggerOptions): Logger {
  const loggerOptions: LoggerOptions = {
    level: options.level ?? 'info',
    base: { service: options.service },
    serializers: {
      err: pino.stdSerializers.err,
    },
    hooks: {
      logMethod(args, method, level) {
        void level;
        const sanitized = args.map((arg) =>
          typeof arg === 'object' && arg !== null ? redactPii(arg) : arg,
        );
        Reflect.apply(method, this, sanitized);
      },
    },
  };

  if (options.pretty && process.env.NODE_ENV !== 'production') {
    return pino({
      ...loggerOptions,
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard' },
      },
    });
  }

  return pino(loggerOptions);
}
