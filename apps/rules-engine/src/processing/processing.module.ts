import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './infrastructure/controllers/health.controller';
import { EvaluateRuleUseCase } from './application';
import { RuleRepositoryImpl } from './infrastructure/repositories';
import { RuleEntity, RuleEvaluationEntity } from '@common/database/orm/entities';
import { KafkaModule } from '@common/kafka';
import { CacheModule } from '@common/cache';

@Module({
  imports: [
    TypeOrmModule.forFeature([RuleEntity, RuleEvaluationEntity]),
    KafkaModule,
    CacheModule,
  ],
  controllers: [HealthController],
  providers: [
    EvaluateRuleUseCase,
    {
      provide: 'RuleRepository',
      useClass: RuleRepositoryImpl,
    },
  ],
  exports: [EvaluateRuleUseCase],
})
export class ProcessingModule {}
