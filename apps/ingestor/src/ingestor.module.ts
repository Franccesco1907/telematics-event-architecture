import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { IngestionModule } from './ingestion/ingestion.module';
import { 
  AllExceptionFilter, 
  ResponseInterceptor, 
  LoggingInterceptor,
  EnvironmentModule,
  DatabaseModule,
  KafkaConfigModule,
} from '@common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EnvironmentModule,
    DatabaseModule,
    KafkaConfigModule,
    IngestionModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class IngestorModule { }
