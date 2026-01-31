import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalInterceptors(new TransformResponseInterceptor());
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap().catch((err) => console.error(err));
