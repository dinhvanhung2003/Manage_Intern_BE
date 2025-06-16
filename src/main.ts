import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule); 

  app.use(cookieParser());
  // sử dụng cookie-parser cho phép xử lý cookie
  app.enableCors({
    origin: 'http://localhost:3001',
    credentials: true,
  });

  // phục vụ ảnh tĩnh từ thư mục uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
