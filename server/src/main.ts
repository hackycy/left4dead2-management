import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppFilter } from './app.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AppFilter());
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

void bootstrap();
