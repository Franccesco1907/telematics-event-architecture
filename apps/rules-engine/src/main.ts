import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { RulesEngineModule } from './rules-engine.module';

async function bootstrap() {
  const app = await NestFactory.create(RulesEngineModule);

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
    .setTitle('Telematics Rules Engine API')
    .setDescription('API for evaluating rules against telemetry signals')
    .setVersion('1.0')
    .addTag('processing')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.RULES_ENGINE_PORT || process.env.API_PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Rules Engine is running on: http://0.0.0.0:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api`);
}
bootstrap();
