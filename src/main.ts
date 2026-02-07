import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const uploadsPath = join(__dirname, '..', '..', 'uploads');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalInterceptors(new TransformResponseInterceptor());
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
    setHeaders: (res: import('express').Response) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    },
  });

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap().catch((err) => console.error(err));
