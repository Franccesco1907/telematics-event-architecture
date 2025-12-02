import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IngestorModule } from './ingestor.module';

async function bootstrap() {
  const app = await NestFactory.create(IngestorModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Telematics Ingestor API')
    .setDescription('API for ingesting telemetry signals from vehicles')
    .setVersion('1.0')
    .addTag('ingestion')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.INGESTOR_PORT || process.env.API_PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Ingestor is running on: http://0.0.0.0:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api`);
}
bootstrap();
