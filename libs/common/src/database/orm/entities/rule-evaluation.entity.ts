import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CustomBaseEntity } from './base.entity';
import { RuleEntity } from './rule.entity';
import { VehicleEntity } from './vehicle.entity';
import { TelemetrySignalEntity } from './telemetry-signal.entity';

@Entity('rule_evaluations')
export class RuleEvaluationEntity extends CustomBaseEntity {
  @Column({ name: 'rule_id', type: 'int', nullable: false })
  ruleId: number;

  @Column({ name: 'vehicle_id', type: 'int', nullable: false })
  vehicleId: number;

  @Column({ name: 'signal_time', type: 'timestamptz', nullable: false })
  signalTime: Date;

  @Column({ type: 'boolean', nullable: false })
  triggered: boolean;

  @Column({ name: 'evaluated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  evaluatedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  result: Record<string, any>;

  // Relaciones
  @ManyToOne(() => RuleEntity, (rule) => rule.evaluations)
  @JoinColumn({ name: 'rule_id' })
  rule: RuleEntity;

  @ManyToOne(() => VehicleEntity)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: VehicleEntity;

  @ManyToOne(() => TelemetrySignalEntity, (signal) => signal.evaluations, { 
    createForeignKeyConstraints: false 
  })
  @JoinColumn([
    { name: 'signal_time', referencedColumnName: 'time' },
    { name: 'vehicle_id', referencedColumnName: 'vehicleId' },
  ])
  telemetrySignal: TelemetrySignalEntity;
}

