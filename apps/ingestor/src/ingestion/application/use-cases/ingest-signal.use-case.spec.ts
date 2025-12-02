import { Test, TestingModule } from '@nestjs/testing';
import { IngestSignalUseCase } from './ingest-signal.use-case';
import { TelemetryRepository } from '../../domain/repositories';
import { KafkaProducerService } from '@common/kafka';
import { RedisCacheService } from '@common/cache';
import { SignalType, TelemetrySignal } from '../../domain/entities';

// Mock getUniqueId since it is imported directly
jest.mock('@common', () => ({
  ...jest.requireActual('@common'),
  getUniqueId: jest.fn().mockReturnValue('unique-id'),
}));

describe('IngestSignalUseCase', () => {
  let useCase: IngestSignalUseCase;
  let telemetryRepository: TelemetryRepository;
  let kafkaProducer: KafkaProducerService;
  let cacheService: RedisCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestSignalUseCase,
        {
          provide: 'TelemetryRepository',
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: KafkaProducerService,
          useValue: {
            sendToTelemetryStream: jest.fn(),
            sendToPriorityTopic: jest.fn(),
          },
        },
        {
          provide: RedisCacheService,
          useValue: {
            getVehicleState: jest.fn(),
            setVehicleState: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<IngestSignalUseCase>(IngestSignalUseCase);
    telemetryRepository = module.get<TelemetryRepository>('TelemetryRepository');
    kafkaProducer = module.get<KafkaProducerService>(KafkaProducerService);
    cacheService = module.get<RedisCacheService>(RedisCacheService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const signalData: Partial<TelemetrySignal> = {
      vehicleId: 1,
      signalType: SignalType.GPS,
      latitude: 10.0,
      longitude: 20.0,
      timestamp: new Date(),
      value: { speed: 50 },
    };

    it('should successfully ingest a valid signal', async () => {
      const savedSignal = { ...signalData, id: 'unique-id' };
      (telemetryRepository.save as jest.Mock).mockResolvedValue(savedSignal);
      (cacheService.getVehicleState as jest.Mock).mockResolvedValue({});

      const result = await useCase.execute(signalData);

      expect(result).toEqual(savedSignal);
      expect(telemetryRepository.save).toHaveBeenCalled();
      expect(cacheService.setVehicleState).toHaveBeenCalled();
      expect(kafkaProducer.sendToTelemetryStream).toHaveBeenCalled();
    });

    it('should throw error if vehicleId is missing', async () => {
      await expect(useCase.execute({ ...signalData, vehicleId: undefined })).rejects.toThrow(
        'Vehicle ID is required',
      );
    });

    it('should throw error if signalType is missing', async () => {
      await expect(useCase.execute({ ...signalData, signalType: undefined })).rejects.toThrow(
        'Signal type is required',
      );
    });

    it('should throw error if GPS signal missing coordinates', async () => {
      await expect(
        useCase.execute({ ...signalData, signalType: SignalType.GPS, latitude: undefined }),
      ).rejects.toThrow('GPS signals require latitude and longitude');
    });

    it('should send critical signals to priority topic', async () => {
      const criticalSignalData = {
        ...signalData,
        signalType: SignalType.PANIC_BUTTON,
      };
      const savedSignal = { ...criticalSignalData, id: 'unique-id' };

      (telemetryRepository.save as jest.Mock).mockResolvedValue(savedSignal);

      await useCase.execute(criticalSignalData);

      expect(kafkaProducer.sendToPriorityTopic).toHaveBeenCalled();
      expect(kafkaProducer.sendToTelemetryStream).not.toHaveBeenCalled();
    });
  });
});

