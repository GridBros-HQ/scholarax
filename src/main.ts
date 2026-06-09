import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Set global API prefix
  app.setGlobalPrefix('api');
  
  // Register globals
  app.useGlobalInterceptors(new TenantInterceptor());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Get port from environment or default to 3000
  const port = process.env.PORT || 3000;
  
  await app.listen(port);
  console.log(`Application is running on port: ${port}`);
}
bootstrap();
