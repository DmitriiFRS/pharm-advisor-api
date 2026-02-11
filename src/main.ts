import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';

async function bootstrap() {
  // Исправление для сериализации BigInt в JSON (возвращаем как число)
  (BigInt.prototype as any).toJSON = function () {
    return Number(this);
  };

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const uploadsPath = join(__dirname, '..', '..', 'uploads');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  const allowedOrigins = [
    'https://pharmadvisor.uz',
    'https://admin.pharmadvisor.uz',
    'http://localhost:3000',
    'http://localhost:3001',
  ];
  app.useGlobalInterceptors(new TransformResponseInterceptor());
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Домен не разрешен политикой CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
    setHeaders: (res: import('express').Response) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    },
  });

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap().catch((err) => console.error(err));
