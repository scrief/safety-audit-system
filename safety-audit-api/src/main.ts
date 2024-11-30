import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { json } from 'express';
import * as process from 'process';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // Increase payload size limit
  app.use(json({ limit: '50mb' }));
  
  // Enable CORS with multiple origins
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Add global prefix
  app.setGlobalPrefix('api');

  // Try different ports if default is in use
  const tryPort = async (startPort: number, maxAttempts: number = 5): Promise<number> => {
    for (let i = 0; i < maxAttempts; i++) {
      const port = startPort + i;
      try {
        await app.listen(port);
        return port;
      } catch (error: any) {
        if (error?.code !== 'EADDRINUSE') throw error;
        logger.warn(`Port ${port} is in use, trying next port...`);
      }
    }
    throw new Error('No available ports found');
  };

  try {
    const port = await tryPort(3001);
    logger.log(`Application is running on: http://localhost:${port}`);
    logger.log(`API endpoints available at: http://localhost:${port}/api`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
