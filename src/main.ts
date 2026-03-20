import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResultInterceptor } from './common/interceptors/result.interceptor';
import { AppLoggerService } from './modules/infra/logging/logging.service';
import { RequestLoggingInterceptor } from './modules/infra/logging/request-logging.interceptor';

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const logger = app.get(AppLoggerService);
  const requestLoggingInterceptor = app.get(RequestLoggingInterceptor);
  const httpExceptionFilter = app.get(HttpExceptionFilter);
  const env = process.env.NODE_ENV || 'development';

  app.set('trust proxy', 1);

  app.use(helmet({
    contentSecurityPolicy: env === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: env === 'production' ? 100 : 1000,
      message: '请求过于频繁，请稍后再试',
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  const allowedOrigins = configService.get('CORS_ORIGINS', '*').split(',');
  app.enableCors({
    origin: env === 'production' ? allowedOrigins : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  app.useGlobalInterceptors(requestLoggingInterceptor, new ResultInterceptor());
  app.useGlobalFilters(httpExceptionFilter);

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  if (env !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('personal-blog 服务 API')
      .setDescription('personal-blog 服务接口文档')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    writeFileSync(
      join(process.cwd(), 'openapi.local.json'),
      JSON.stringify(document, null, 2),
      'utf8',
    );
  }

  const port = configService.get('PORT', '3000');
  const host = configService.get('LISTEN_HOST', '0.0.0.0');

  await app.listen(port, host);

  if (env === 'production') {
    logger.log('Server started', 'Bootstrap', {
      env,
      host,
      port: Number(port),
    });
  } else {
    const displayHost = configService.get('HOST', 'localhost');
    logger.log('Server started', 'Bootstrap', {
      env,
      host,
      port: Number(port),
      apiUrl: `http://${displayHost}:${port}/api/`,
      docsUrl: `http://${displayHost}:${port}/api/docs`,
      openApiPath: join(process.cwd(), 'openapi.local.json'),
    });
  }

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap();
