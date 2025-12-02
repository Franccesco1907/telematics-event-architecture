import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RuleRepositoryImpl } from './rule.repository.impl';
import { RuleEntity } from '@common/database/orm/entities';
import { Repository } from 'typeorm';
import { RuleCondition, RuleAction } from '../../domain/entities';

describe('RuleRepositoryImpl', () => {
  let repository: RuleRepositoryImpl;
  let typeOrmRepository: Repository<RuleEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuleRepositoryImpl,
        {
          provide: getRepositoryToken(RuleEntity),
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

    repository = module.get<RuleRepositoryImpl>(RuleRepositoryImpl);
    typeOrmRepository = module.get<Repository<RuleEntity>>(getRepositoryToken(RuleEntity));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByVehicleId', () => {
    it('should return rules for a vehicle', async () => {
      const vehicleId = 1;
      const entity = {
        id: 1,
        vehicleId: 1,
        name: 'Test Rule',
        eventType: 'SPEED',
        conditionValue: { condition: 'greater_than', threshold: 100 },
        actionType: 'EMAIL_OWNER',
        priority: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as RuleEntity;

      (typeOrmRepository.find as jest.Mock).mockResolvedValue([entity]);

      const result = await repository.findByVehicleId(vehicleId);

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { vehicleId, isActive: true },
        order: { priority: 'DESC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].condition).toBe(RuleCondition.GREATER_THAN);
    });
  });

  describe('save', () => {
    it('should save a rule', async () => {
      const rule = {
        id: '1',
        vehicleId: 1,
        signalType: 'SPEED',
        condition: RuleCondition.GREATER_THAN,
        threshold: 100,
        action: RuleAction.SEND_EMAIL,
        priority: 5,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const entity = {
        id: 1,
        vehicleId: 1,
        name: 'Unnamed Rule',
        eventType: 'SPEED_LIMIT',
        conditionValue: { threshold: 100, condition: 'greater_than' },
        actionType: 'EMAIL_OWNER',
        priority: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as RuleEntity;

      (typeOrmRepository.create as jest.Mock).mockReturnValue(entity);
      (typeOrmRepository.save as jest.Mock).mockResolvedValue(entity);

      const result = await repository.save(rule);

      expect(typeOrmRepository.create).toHaveBeenCalled();
      expect(typeOrmRepository.save).toHaveBeenCalled();
      expect(result.id).toBe('1');
    });
  });
});
