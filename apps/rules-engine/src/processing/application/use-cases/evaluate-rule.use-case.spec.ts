import { Test, TestingModule } from '@nestjs/testing';
import { EvaluateRuleUseCase } from './evaluate-rule.use-case';
import { RuleRepository } from '../../domain/repositories';
import { RedisCacheService } from '@common/cache';
import { KafkaProducerService } from '@common/kafka';
import { Rule, RuleCondition, RuleAction } from '../../domain/entities';

describe('EvaluateRuleUseCase', () => {
  let useCase: EvaluateRuleUseCase;
  let ruleRepository: RuleRepository;
  let cacheService: RedisCacheService;
  let kafkaProducer: KafkaProducerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluateRuleUseCase,
        {
          provide: 'RuleRepository',
          useValue: {
            findByVehicleId: jest.fn(),
          },
        },
        {
          provide: RedisCacheService,
          useValue: {
            getRulesByVehicleId: jest.fn(),
            setRulesByVehicleId: jest.fn(),
            deleteVehicleCache: jest.fn(),
          },
        },
        {
          provide: KafkaProducerService,
          useValue: {
            sendToPriorityTopic: jest.fn(),
            sendToEventsStream: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<EvaluateRuleUseCase>(EvaluateRuleUseCase);
    ruleRepository = module.get<RuleRepository>('RuleRepository');
    cacheService = module.get<RedisCacheService>(RedisCacheService);
    kafkaProducer = module.get<KafkaProducerService>(KafkaProducerService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const vehicleId = 1;
    const signalType = 'SPEED';
    const signalValue = 120;

    const mockRule: Rule = {
      id: 'rule-1',
      vehicleId,
      signalType: 'SPEED',
      condition: RuleCondition.GREATER_THAN,
      threshold: 100,
      priority: 5,
      enabled: true,
      action: RuleAction.SEND_EMAIL, // Fixed: using enum instead of string 'notify'
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should evaluate rules from cache if available', async () => {
      (cacheService.getRulesByVehicleId as jest.Mock).mockResolvedValue([mockRule]);

      const result = await useCase.execute(vehicleId, signalType, signalValue);

      expect(cacheService.getRulesByVehicleId).toHaveBeenCalledWith(vehicleId);
      expect(ruleRepository.findByVehicleId).not.toHaveBeenCalled();
      expect(result.triggered).toBe(true);
      expect(result.evaluations).toHaveLength(1);
      expect(kafkaProducer.sendToEventsStream).toHaveBeenCalled();
    });

    it('should fetch rules from DB if cache miss', async () => {
      (cacheService.getRulesByVehicleId as jest.Mock).mockResolvedValue(null);
      (ruleRepository.findByVehicleId as jest.Mock).mockResolvedValue([mockRule]);

      const result = await useCase.execute(vehicleId, signalType, signalValue);

      expect(ruleRepository.findByVehicleId).toHaveBeenCalledWith(vehicleId);
      expect(cacheService.setRulesByVehicleId).toHaveBeenCalled();
      expect(result.triggered).toBe(true);
    });

    it('should handle critical events with priority topic', async () => {
      const criticalRule = { ...mockRule, priority: 10 };
      (cacheService.getRulesByVehicleId as jest.Mock).mockResolvedValue([criticalRule]);

      await useCase.execute(vehicleId, signalType, signalValue);

      expect(kafkaProducer.sendToPriorityTopic).toHaveBeenCalled();
    });

    it('should not trigger if condition is not met', async () => {
      (cacheService.getRulesByVehicleId as jest.Mock).mockResolvedValue([mockRule]);
      const lowSignalValue = 80; // Less than threshold 100

      const result = await useCase.execute(vehicleId, signalType, lowSignalValue);

      expect(result.triggered).toBe(false);
      expect(kafkaProducer.sendToEventsStream).not.toHaveBeenCalled();
    });
  });
});
