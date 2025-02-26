import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseFilter } from './response.filter';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);

  app.useGlobalFilters(new ResponseFilter());

  await app.listen(configService.get<string>('SERVER_PORT') || 3000, '0.0.0.0');
}

void bootstrap();
