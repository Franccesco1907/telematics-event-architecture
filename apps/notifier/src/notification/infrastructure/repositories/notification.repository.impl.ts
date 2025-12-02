import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotificationEntity,
  NotificationStatus as EntityNotificationStatus,
  NotificationType as EntityNotificationType,
} from '@common/database/orm/entities';
import { NotificationRepository } from '../../domain/repositories';
import { Notification, NotificationStatus, NotificationType } from '../../domain/entities';

@Injectable()
export class NotificationRepositoryImpl implements NotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
  ) {}

  async save(notification: Notification): Promise<Notification> {
    const entity = this.notificationRepository.create({
      vehicleId: parseInt(notification.vehicleId),
      ruleId: parseInt(notification.ruleId),
      type: this.mapNotificationType(notification.type),
      recipient: notification.recipient,
      subject: notification.subject,
      message: notification.message,
      status: this.mapNotificationStatus(notification.status),
      attempts: notification.attempts,
      maxAttempts: notification.maxAttempts,
      sentAt: notification.sentAt,
      metadata: notification.metadata,
    });

    const saved = await this.notificationRepository.save(entity);
    return this.mapEntityToDomain(saved);
  }

  async findById(id: string): Promise<Notification | null> {
    const entity = await this.notificationRepository.findOne({
      where: { id: parseInt(id) },
    });

    return entity ? this.mapEntityToDomain(entity) : null;
  }

  async findByStatus(status: NotificationStatus): Promise<Notification[]> {
    const entityStatus = this.mapNotificationStatus(status);
    const entities = await this.notificationRepository.find({
      where: { status: entityStatus },
      order: { createdAt: 'ASC' },
    });

    return entities.map((entity) => this.mapEntityToDomain(entity));
  }

  async findByVehicleId(vehicleId: string, limit: number = 50): Promise<Notification[]> {
    const entities = await this.notificationRepository.find({
      where: { vehicleId: parseInt(vehicleId) },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return entities.map((entity) => this.mapEntityToDomain(entity));
  }

  async updateStatus(id: string, status: NotificationStatus): Promise<Notification> {
    const entity = await this.notificationRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!entity) {
      throw new Error(`Notification with id ${id} not found`);
    }

    entity.status = this.mapNotificationStatus(status);

    if (status === NotificationStatus.SENT) {
      entity.sentAt = new Date();
    }

    const updated = await this.notificationRepository.save(entity);
    return this.mapEntityToDomain(updated);
  }

  async incrementAttempts(id: string): Promise<Notification> {
    const entity = await this.notificationRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!entity) {
      throw new Error(`Notification with id ${id} not found`);
    }

    entity.attempts += 1;

    // Si alcanzó el máximo de intentos, marcar como fallida
    if (entity.attempts >= entity.maxAttempts) {
      entity.status = EntityNotificationStatus.FAILED;
    } else {
      entity.status = EntityNotificationStatus.RETRY;
    }

    const updated = await this.notificationRepository.save(entity);
    return this.mapEntityToDomain(updated);
  }

  async findPendingRetries(): Promise<Notification[]> {
    const entities = await this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.status IN (:...statuses)', {
        statuses: [EntityNotificationStatus.PENDING, EntityNotificationStatus.RETRY],
      })
      .andWhere('notification.attempts < notification.maxAttempts')
      .orderBy('notification.createdAt', 'ASC')
      .getMany();

    return entities.map((entity) => this.mapEntityToDomain(entity));
  }

  private mapEntityToDomain(entity: NotificationEntity): Notification {
    return {
      id: entity.id.toString(),
      vehicleId: entity.vehicleId.toString(),
      ruleId: entity.ruleId.toString(),
      type: this.mapEntityNotificationType(entity.type),
      recipient: entity.recipient,
      subject: entity.subject,
      message: entity.message,
      status: this.mapEntityNotificationStatus(entity.status),
      attempts: entity.attempts,
      maxAttempts: entity.maxAttempts,
      sentAt: entity.sentAt,
      createdAt: entity.createdAt,
      metadata: entity.metadata,
    };
  }

  private mapNotificationType(type: NotificationType): EntityNotificationType {
    const mapping: Record<NotificationType, EntityNotificationType> = {
      [NotificationType.EMAIL]: EntityNotificationType.EMAIL,
      [NotificationType.SMS]: EntityNotificationType.SMS,
      [NotificationType.PUSH]: EntityNotificationType.PUSH,
      [NotificationType.WEBHOOK]: EntityNotificationType.WEBHOOK,
    };

    return mapping[type] || EntityNotificationType.EMAIL;
  }

  private mapEntityNotificationType(type: EntityNotificationType): NotificationType {
    const mapping: Record<EntityNotificationType, NotificationType> = {
      [EntityNotificationType.EMAIL]: NotificationType.EMAIL,
      [EntityNotificationType.SMS]: NotificationType.SMS,
      [EntityNotificationType.PUSH]: NotificationType.PUSH,
      [EntityNotificationType.WEBHOOK]: NotificationType.WEBHOOK,
      [EntityNotificationType.CALL]: NotificationType.SMS, // Mapeo default
    };

    return mapping[type] || NotificationType.EMAIL;
  }

  private mapNotificationStatus(status: NotificationStatus): EntityNotificationStatus {
    const mapping: Record<NotificationStatus, EntityNotificationStatus> = {
      [NotificationStatus.PENDING]: EntityNotificationStatus.PENDING,
      [NotificationStatus.SENT]: EntityNotificationStatus.SENT,
      [NotificationStatus.FAILED]: EntityNotificationStatus.FAILED,
      [NotificationStatus.RETRY]: EntityNotificationStatus.RETRY,
    };

    return mapping[status] || EntityNotificationStatus.PENDING;
  }

  private mapEntityNotificationStatus(status: EntityNotificationStatus): NotificationStatus {
    const mapping: Record<EntityNotificationStatus, NotificationStatus> = {
      [EntityNotificationStatus.PENDING]: NotificationStatus.PENDING,
      [EntityNotificationStatus.SENT]: NotificationStatus.SENT,
      [EntityNotificationStatus.FAILED]: NotificationStatus.FAILED,
      [EntityNotificationStatus.RETRY]: NotificationStatus.RETRY,
    };

    return mapping[status] || NotificationStatus.PENDING;
  }
}

