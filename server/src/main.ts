import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseFilter } from './response.filter';
import {
  ExpressAdapter,
  type NestExpressApplication,
} from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ResponseInterceptor } from './response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
  );

  const configService = app.get(ConfigService);

  app.useGlobalFilters(new ResponseFilter());

  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.listen(configService.get<string>('SERVER_PORT') || 3000, '0.0.0.0');
}

void bootstrap();
