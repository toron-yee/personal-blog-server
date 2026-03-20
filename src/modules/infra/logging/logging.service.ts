import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';
import { RequestContextService } from './request-context.service';

type LogMetadata = Record<string, unknown>;

@Injectable()
export class AppLoggerService {
  private readonly logger: WinstonLogger;

  constructor(
    private readonly configService: ConfigService,
    private readonly requestContextService: RequestContextService,
  ) {
    this.logger = this.createWinstonLogger();
  }

  log(message: string, context?: string, metadata?: LogMetadata) {
    this.write('info', message, context, undefined, metadata);
  }

  warn(message: string, context?: string, metadata?: LogMetadata) {
    this.write('warn', message, context, undefined, metadata);
  }

  debug(message: string, context?: string, metadata?: LogMetadata) {
    this.write('debug', message, context, undefined, metadata);
  }

  verbose(message: string, context?: string, metadata?: LogMetadata) {
    this.write('verbose', message, context, undefined, metadata);
  }

  error(
    message: string,
    context?: string,
    trace?: string,
    metadata?: LogMetadata,
  ) {
    this.write('error', message, context, trace, metadata);
  }

  private write(
    level: string,
    message: string,
    context?: string,
    trace?: string,
    metadata?: LogMetadata,
  ) {
    const sanitizedMetadata = this.sanitizeMetadata(
      this.mergeContextMetadata(metadata),
    );

    this.logger.log({
      level,
      message,
      context: context || 'App',
      trace,
      metadata: Object.keys(sanitizedMetadata).length > 0 ? sanitizedMetadata : undefined,
    });
  }

  private createWinstonLogger() {
    const env = this.configService.get<string>('NODE_ENV', 'development');
    const service = this.configService.get<string>('APP_NAME', 'personal-blog-server');
    const isProduction = env === 'production';
    const level = this.configService.get<string>(
      'LOG_LEVEL',
      isProduction ? 'info' : 'debug',
    );
    const logDir = this.configService.get<string>('LOG_DIR', 'logs');
    const fileEnabled = this.configService.get<string>(
      'LOG_FILE_ENABLED',
      isProduction ? 'false' : 'true',
    ) === 'true';
    const maxFileSizeMb = this.parsePositiveNumber(
      this.configService.get<string>('LOG_FILE_MAX_SIZE_MB', '20'),
      20,
    );
    const maxFiles = this.parsePositiveNumber(
      this.configService.get<string>('LOG_FILE_MAX_FILES', '14'),
      14,
    );
    const consoleJson = this.configService.get<string>(
      'LOG_CONSOLE_JSON',
      isProduction ? 'true' : 'false',
    ) === 'true';

    if (fileEnabled) {
      mkdirSync(join(process.cwd(), logDir), { recursive: true });
    }

    return createLogger({
      level,
      defaultMeta: { service, env },
      transports: [
        new transports.Console({
          level,
          format: consoleJson ? this.createJsonFormat() : this.createPrettyConsoleFormat(),
        }),
        ...(fileEnabled
          ? [
              new transports.File({
                filename: join(process.cwd(), logDir, 'error.log'),
                level: 'error',
                maxsize: maxFileSizeMb * 1024 * 1024,
                maxFiles,
                format: this.createJsonFormat(),
              }),
              new transports.File({
                filename: join(process.cwd(), logDir, 'combined.log'),
                level,
                maxsize: maxFileSizeMb * 1024 * 1024,
                maxFiles,
                format: this.createJsonFormat(),
              }),
            ]
          : []),
      ],
      exitOnError: false,
    });
  }

  private createJsonFormat() {
    return format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format((info) => {
        if (!info.trace) {
          delete info.trace;
        }
        if (!info.metadata) {
          delete info.metadata;
        }
        return info;
      })(),
      format.json(),
    );
  }

  private createPrettyConsoleFormat() {
    return format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      format.errors({ stack: true }),
      format.colorize({ all: true }),
      format.printf(({ timestamp, level, message, context, trace, metadata, ...rest }) => {
        const mergedMetadata = {
          ...(metadata as LogMetadata | undefined),
          ...rest,
        };
        const metadataText =
          Object.keys(mergedMetadata).length > 0
            ? ` ${this.safeStringify(mergedMetadata)}`
            : '';
        const traceText = typeof trace === 'string' && trace.length > 0 ? `\n${trace}` : '';

        return `${timestamp} ${level} [${context || 'App'}] ${message}${metadataText}${traceText}`;
      }),
    );
  }

  private sanitizeMetadata(metadata?: LogMetadata) {
    if (!metadata) {
      return {};
    }

    try {
      return JSON.parse(
        JSON.stringify(metadata, (key, value) => {
          if (this.shouldRedact(key)) {
            return '[REDACTED]';
          }

          if (value instanceof Error) {
            return {
              name: value.name,
              message: value.message,
              stack: value.stack,
            };
          }

          return value;
        }),
      ) as LogMetadata;
    } catch {
      return {
        metadata: '[unserializable]',
      };
    }
  }

  private shouldRedact(key: string) {
    return /(password|token|authorization|cookie|secret)/i.test(key);
  }

  private mergeContextMetadata(metadata?: LogMetadata) {
    const requestContext = this.requestContextService.getStore();

    if (!requestContext) {
      return metadata;
    }

    return {
      requestId: requestContext.requestId,
      ...(requestContext.userId ? { requestUserId: requestContext.userId } : {}),
      ...(metadata || {}),
    };
  }

  private parsePositiveNumber(value: string, fallback: number) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }

    return Math.floor(parsed);
  }

  private safeStringify(value: unknown) {
    try {
      return JSON.stringify(value);
    } catch {
      return '[unserializable]';
    }
  }
}
