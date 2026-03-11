import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ResultInterceptor } from './common/interceptors/result.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalInterceptors(new ResultInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // 配置静态资源访问（用于本地存储）
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  const config = new DocumentBuilder()
    .setTitle('Yee-Tool服务 API')
    .setDescription('Yee-Tool服务接口文档')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const PORT = configService.get('PORT', '3000');
  await app.listen(PORT);

  console.log(`服务器地址: http://10.4.45.192:${PORT}/api/ 或 http://localhost:${PORT}/api/ \n API 文档: http://10.4.45.192:${PORT}/api/docs`);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
