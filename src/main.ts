import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 🔓 Enable CORS so your Vercel frontend can talk to this backend
  app.enableCors({
    origin: '*', // For development. You can restrict this to your specific Vercel URL later!
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Set global API prefix
  app.setGlobalPrefix('api');
  
  // Register globals
  app.useGlobalInterceptors(new TenantInterceptor());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Get port from environment or default to 3000
  const port = process.env.PORT || 3000;
  
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on port: ${port}`);
}
bootstrap();