import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { CustomBaseEntity } from './base.entity';
import { UserEntity } from './user.entity';
import { RuleEntity } from './rule.entity';
import { TelemetrySignalEntity } from './telemetry-signal.entity';

export enum VehicleType {
  TRUCK = 'TRUCK',
  CAR = 'CAR',
  MOTO = 'MOTO',
}

@Entity('vehicles')
export class VehicleEntity extends CustomBaseEntity {
  @Column({ name: 'owner_id', type: 'int', nullable: false })
  ownerId: number;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: false })
  plate: string;

  @Column({
    name: 'vehicle_type',
    type: 'enum',
    enum: VehicleType,
    nullable: false,
  })
  vehicleType: VehicleType;

  @Column({
    name: 'device_imei',
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: false,
  })
  deviceImei: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // Relaciones
  @ManyToOne(() => UserEntity, (user) => user.vehicles)
  @JoinColumn({ name: 'owner_id' })
  owner: UserEntity;

  @OneToMany(() => RuleEntity, (rule) => rule.vehicle)
  rules: RuleEntity[];

  @OneToMany(() => TelemetrySignalEntity, (signal) => signal.vehicle)
  telemetrySignals: TelemetrySignalEntity[];
}

