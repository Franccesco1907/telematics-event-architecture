import { Column, Entity, OneToMany } from 'typeorm';
import { CustomBaseEntity } from './base.entity';
import { VehicleEntity } from './vehicle.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  DRIVER = 'DRIVER',
}

@Entity('users')
export class UserEntity extends CustomBaseEntity {
  @Column({ name: 'full_name', type: 'varchar', length: 100, nullable: true })
  fullName: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    nullable: false,
  })
  role: UserRole;

  // Relaciones
  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.owner)
  vehicles: VehicleEntity[];
}

