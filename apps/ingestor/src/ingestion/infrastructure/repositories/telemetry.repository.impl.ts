import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelemetrySignalEntity } from '@common/database/orm/entities';
import { TelemetryRepository } from '../../domain/repositories';
import { TelemetrySignal } from '../../domain/entities';

@Injectable()
export class TelemetryRepositoryImpl implements TelemetryRepository {
  constructor(
    @InjectRepository(TelemetrySignalEntity)
    private readonly telemetryRepository: Repository<TelemetrySignalEntity>,
  ) { }

  async save(signal: TelemetrySignal): Promise<TelemetrySignal> {
    const entity = this.telemetryRepository.create({
      time: signal.timestamp,
      vehicleId: signal.vehicleId,
      latitude: signal.latitude,
      longitude: signal.longitude,
      speed: signal.value?.speed || signal.value,
      eventTrigger: this.mapSignalTypeToEventTrigger(signal.signalType as any),
      metadata: signal.metadata || {},
    });

    const saved = await this.telemetryRepository.save(entity);
    return this.mapEntityToDomain(saved);
  }

  async findById(id: string): Promise<TelemetrySignal | null> {
    // Para telemetry signals, el ID sería una combinación de time + vehicleId
    const [time, vehicleId] = id.split('_');
    const entity = await this.telemetryRepository.findOne({
      where: {
        time: new Date(time),
        vehicleId: parseInt(vehicleId),
      },
    });

    return entity ? this.mapEntityToDomain(entity) : null;
  }

  async findByVehicleId(
    vehicleId: number,
    limit: number = 100,
  ): Promise<TelemetrySignal[]> {
    const entities = await this.telemetryRepository.find({
      where: { vehicleId },
      order: { time: 'DESC' },
      take: limit,
    });

    return entities.map((entity) => this.mapEntityToDomain(entity));
  }

  async findLatestByVehicleId(vehicleId: number): Promise<TelemetrySignal | null> {
    const entity = await this.telemetryRepository.findOne({
      where: { vehicleId },
      order: { time: 'DESC' },
    });

    return entity ? this.mapEntityToDomain(entity) : null;
  }

  async findByVehicleIdAndTimeRange(
    vehicleId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<TelemetrySignal[]> {
    const entities = await this.telemetryRepository
      .createQueryBuilder('signal')
      .where('signal.vehicleId = :vehicleId', { vehicleId: parseInt(vehicleId) })
      .andWhere('signal.time BETWEEN :startTime AND :endTime', {
        startTime,
        endTime,
      })
      .orderBy('signal.time', 'DESC')
      .getMany();

    return entities.map((entity) => this.mapEntityToDomain(entity));
  }

  private mapEntityToDomain(entity: TelemetrySignalEntity): TelemetrySignal {
    return {
      id: `${entity.time.toISOString()}_${entity.vehicleId}`,
      vehicleId: entity.vehicleId,
      signalType: 'GPS' as any, // Inferir del eventTrigger o metadata
      value: entity.speed || entity.metadata,
      timestamp: entity.time,
      latitude: entity.latitude,
      longitude: entity.longitude,
      metadata: entity.metadata,
    };
  }

  private mapSignalTypeToEventTrigger(signalType: string): any {
    const mapping: Record<string, string> = {
      panic_button: 'PANIC_BUTTON',
      speed: 'SPEED_ALERT',
      gps: 'NORMAL',
      temperature: 'TEMPERATURE_ALERT',
    };

    return mapping[signalType] || 'NORMAL';
  }
}

