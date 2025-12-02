import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentModule } from '@common/config/environment';
import { TypeOrmConfigService } from '../services/typeorm.service';
import {
  UserEntity,
  VehicleEntity,
  RuleEntity,
  TelemetrySignalEntity,
  NotificationEntity,
  RuleEvaluationEntity,
} from '../entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [EnvironmentModule],
      useClass: TypeOrmConfigService,
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      VehicleEntity,
      RuleEntity,
      TelemetrySignalEntity,
      NotificationEntity,
      RuleEvaluationEntity,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class OrmDatabaseModule {}
