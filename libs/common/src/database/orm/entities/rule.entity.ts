import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { CustomBaseEntity } from './base.entity';
import { VehicleEntity } from './vehicle.entity';
import { RuleEvaluationEntity } from './rule-evaluation.entity';
import { NotificationEntity } from './notification.entity';

export enum EventType {
  STOP_UNPLANNED = 'STOP_UNPLANNED',
  PANIC = 'PANIC',
  SPEED_LIMIT = 'SPEED_LIMIT',
  GEOFENCE_EXIT = 'GEOFENCE_EXIT',
  TEMPERATURE_ALERT = 'TEMPERATURE_ALERT',
  COLLISION = 'COLLISION',
  LOW_FUEL = 'LOW_FUEL',
  MAINTENANCE_DUE = 'MAINTENANCE_DUE',
}

export enum ActionType {
  SMS_OWNER = 'SMS_OWNER',
  EMAIL_OWNER = 'EMAIL_OWNER',
  EMAIL_POLICE = 'EMAIL_POLICE',
  CALL_EMERGENCY = 'CALL_EMERGENCY',
  WEBHOOK = 'WEBHOOK',
  PUSH_NOTIFICATION = 'PUSH_NOTIFICATION',
}

@Entity('rules')
export class RuleEntity extends CustomBaseEntity {
  @Column({ name: 'vehicle_id', type: 'int', nullable: false })
  vehicleId: number;

  @Column({ type: 'varchar', length: 50, nullable: false })
  name: string;

  @Column({
    name: 'event_type',
    type: 'enum',
    enum: EventType,
    nullable: false,
  })
  eventType: EventType;

  @Column({ name: 'condition_value', type: 'jsonb', nullable: true })
  conditionValue: Record<string, any>;

  @Column({
    name: 'action_type',
    type: 'enum',
    enum: ActionType,
    nullable: false,
  })
  actionType: ActionType;

  @Column({ type: 'int', default: 1, comment: '1: Normal, 10: Critica (Pánico)' })
  priority: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // Relaciones
  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.rules)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: VehicleEntity;

  @OneToMany(() => RuleEvaluationEntity, (evaluation) => evaluation.rule)
  evaluations: RuleEvaluationEntity[];

  @OneToMany(() => NotificationEntity, (notification) => notification.rule)
  notifications: NotificationEntity[];
}

