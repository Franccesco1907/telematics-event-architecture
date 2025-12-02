import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { VehicleEntity } from './vehicle.entity';
import { RuleEvaluationEntity } from './rule-evaluation.entity';

export enum EventTrigger {
  NORMAL = 'NORMAL',
  PANIC_BUTTON = 'PANIC_BUTTON',
  COLLISION = 'COLLISION',
  SPEED_ALERT = 'SPEED_ALERT',
  GEOFENCE_BREACH = 'GEOFENCE_BREACH',
  TEMPERATURE_ALERT = 'TEMPERATURE_ALERT',
  STOP_UNPLANNED = 'STOP_UNPLANNED',
}

@Entity('telemetry_signals')
@Index('idx_telemetry_vehicle_time', ['vehicleId', 'time'])
export class TelemetrySignalEntity {
  @Column({ name: 'time', type: 'timestamptz', nullable: false, primary: true })
  time: Date;

  @Column({ name: 'vehicle_id', type: 'int', nullable: false, primary: true })
  vehicleId: number;

  @Column({ type: 'double precision', nullable: true })
  latitude: number;

  @Column({ type: 'double precision', nullable: true })
  longitude: number;

  @Column({ type: 'double precision', nullable: true })
  speed: number;

  @Column({
    name: 'event_trigger',
    type: 'enum',
    enum: EventTrigger,
    nullable: true,
    default: EventTrigger.NORMAL,
  })
  eventTrigger: EventTrigger;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Relaciones
  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.telemetrySignals, { 
    createForeignKeyConstraints: false 
  })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: VehicleEntity;

  @OneToMany(() => RuleEvaluationEntity, (evaluation) => evaluation.telemetrySignal)
  evaluations: RuleEvaluationEntity[];
}

