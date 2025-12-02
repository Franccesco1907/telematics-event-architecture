import { Test, TestingModule } from '@nestjs/testing';
import { RedisCacheService } from './redis-cache.service';
import { ConfigService } from '@nestjs/config';

// Mock keyv + keyv-redis
const mockKeyv = {
  on: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
};

jest.mock('keyv', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockKeyv),
}));

jest.mock('@keyv/redis', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('RedisCacheService', () => {
  let service: RedisCacheService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisCacheService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key, defaultValue) => {
              if (key === 'CACHE_TTL') return 3600;
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RedisCacheService>(RedisCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('basic operations', () => {
    it('should get a value', async () => {
      mockKeyv.get.mockResolvedValue('test-value');
      const result = await service.get('key');
      expect(result).toBe('test-value');
      expect(mockKeyv.get).toHaveBeenCalledWith('key');
    });

    it('should return undefined on get error', async () => {
      mockKeyv.get.mockRejectedValue(new Error('Redis error'));
      const result = await service.get('key');
      expect(result).toBeUndefined();
    });

    it('should set a value', async () => {
      mockKeyv.set.mockResolvedValue(true);
      const result = await service.set('key', 'value');
      expect(result).toBe(true);
      expect(mockKeyv.set).toHaveBeenCalledWith('key', 'value', 3600000);
    });

    it('should return false on set error', async () => {
      mockKeyv.set.mockRejectedValue(new Error('Redis error'));
      const result = await service.set('key', 'value');
      expect(result).toBe(false);
    });

    it('should delete a value', async () => {
      mockKeyv.delete.mockResolvedValue(true);
      const result = await service.delete('key');
      expect(result).toBe(true);
    });
  });

  describe('domain specific methods', () => {
    it('should get rules by vehicle id', async () => {
      await service.getRulesByVehicleId(1);
      expect(mockKeyv.get).toHaveBeenCalledWith('rules:vehicle:1');
    });

    it('should set rules by vehicle id', async () => {
      await service.setRulesByVehicleId(1, []);
      expect(mockKeyv.set).toHaveBeenCalledWith('rules:vehicle:1', [], 3600000);
    });

    it('should warmup critical rules', async () => {
      const mockGetter = jest.fn().mockResolvedValue(['rule1']);
      const vehicleIds = [1, 2];

      await service.warmupCriticalRules(vehicleIds, mockGetter);

      expect(mockGetter).toHaveBeenCalledTimes(2);
      expect(mockKeyv.set).toHaveBeenCalledTimes(2);
      expect(mockKeyv.set).toHaveBeenCalledWith('rules:vehicle:1', ['rule1'], 600000);
    });
  });
});
