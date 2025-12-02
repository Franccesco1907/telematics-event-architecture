import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TelemetryRepositoryImpl } from './telemetry.repository.impl';
import { TelemetrySignalEntity } from '@common/database/orm/entities';
import { Repository } from 'typeorm';
import { SignalType } from '../../domain/entities';

describe('TelemetryRepositoryImpl', () => {
  let repository: TelemetryRepositoryImpl;
  let typeOrmRepository: Repository<TelemetrySignalEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelemetryRepositoryImpl,
        {
          provide: getRepositoryToken(TelemetrySignalEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
            })),
          },
        },
      ],
    }).compile();

    repository = module.get<TelemetryRepositoryImpl>(TelemetryRepositoryImpl);
    typeOrmRepository = module.get<Repository<TelemetrySignalEntity>>(
      getRepositoryToken(TelemetrySignalEntity),
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('save', () => {
    it('should save a telemetry signal', async () => {
      const signal = {
        id: 'test-id',
        vehicleId: 1,
        signalType: SignalType.GPS,
        value: { speed: 100 },
        timestamp: new Date(),
        latitude: 10,
        longitude: 20,
        metadata: {},
      };

      const entity = {
        time: signal.timestamp,
        vehicleId: signal.vehicleId,
        latitude: signal.latitude,
        longitude: signal.longitude,
        speed: 100,
        eventTrigger: 'NORMAL',
        metadata: {},
      } as TelemetrySignalEntity;

      (typeOrmRepository.create as jest.Mock).mockReturnValue(entity);
      (typeOrmRepository.save as jest.Mock).mockResolvedValue(entity);

      const result = await repository.save(signal);

      expect(typeOrmRepository.create).toHaveBeenCalled();
      expect(typeOrmRepository.save).toHaveBeenCalledWith(entity);
      expect(result.vehicleId).toBe(signal.vehicleId);
    });
  });

  describe('findByVehicleId', () => {
    it('should return signals for a vehicle', async () => {
      const vehicleId = 1;
      const entity = {
        time: new Date(),
        vehicleId: 1,
        latitude: 10,
        longitude: 20,
        speed: 100,
        eventTrigger: 'NORMAL',
        metadata: {},
      } as TelemetrySignalEntity;

      (typeOrmRepository.find as jest.Mock).mockResolvedValue([entity]);

      const result = await repository.findByVehicleId(vehicleId);

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { vehicleId },
        order: { time: 'DESC' },
        take: 100,
      });
      expect(result).toHaveLength(1);
      expect(result[0].vehicleId).toBe(vehicleId);
    });
  });
});

