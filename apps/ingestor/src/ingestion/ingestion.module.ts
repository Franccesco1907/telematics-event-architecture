import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController, IngestionController, SeedController } from './infrastructure/controllers';
import { IngestSignalUseCase, SeedDataUseCase } from './application';
import { TelemetryRepositoryImpl } from './infrastructure/repositories';
import { TelemetrySignalEntity } from '@common/database/orm/entities';
import { KafkaModule } from '@common/kafka';
import { CacheModule } from '@common/cache';

@Module({
  imports: [
    TypeOrmModule.forFeature([TelemetrySignalEntity]),
    KafkaModule,
    CacheModule,
  ],
  controllers: [HealthController, IngestionController, SeedController],
  providers: [
    IngestSignalUseCase,
    SeedDataUseCase,
    {
      provide: 'TelemetryRepository',
      useClass: TelemetryRepositoryImpl,
    },
  ],
  exports: [IngestSignalUseCase],
})
export class IngestionModule { }
