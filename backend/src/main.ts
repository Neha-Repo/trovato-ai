import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:8100',
      'http://localhost:8101',
      'http://localhost',
      'capacitor://localhost',
    ],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');

  console.log(
    `🚀 Trovato AI Backend running on port ${process.env.PORT ?? 3000}`,
  );
}

void bootstrap();
