import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CustomBaseEntity } from './base.entity';
import { VehicleEntity } from './vehicle.entity';
import { RuleEntity } from './rule.entity';

export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  WEBHOOK = 'WEBHOOK',
  CALL = 'CALL',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  RETRY = 'RETRY',
}

@Entity('notifications')
export class NotificationEntity extends CustomBaseEntity {
  @Column({ name: 'vehicle_id', type: 'int', nullable: false })
  vehicleId: number;

  @Column({ name: 'rule_id', type: 'int', nullable: false })
  ruleId: number;

  @Column({
    type: 'enum',
    enum: NotificationType,
    nullable: false,
  })
  type: NotificationType;

  @Column({ type: 'varchar', length: 200, nullable: false })
  recipient: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  subject: string;

  @Column({ type: 'text', nullable: false })
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ name: 'max_attempts', type: 'int', default: 3 })
  maxAttempts: number;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Relaciones
  @ManyToOne(() => VehicleEntity, { createForeignKeyConstraints: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: VehicleEntity;

  @ManyToOne(() => RuleEntity, (rule) => rule.notifications)
  @JoinColumn({ name: 'rule_id' })
  rule: RuleEntity;
}

