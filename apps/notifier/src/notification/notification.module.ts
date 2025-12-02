import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './infrastructure/controllers/health.controller';
import { SendNotificationUseCase } from './application';
import { NotificationRepositoryImpl } from './infrastructure/repositories';
import { NotificationEntity } from '@common/database/orm/entities';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity])],
  controllers: [HealthController],
  providers: [
    SendNotificationUseCase,
    {
      provide: 'NotificationRepository',
      useClass: NotificationRepositoryImpl,
    },
  ],
  exports: [SendNotificationUseCase],
})
export class NotificationModule {}

