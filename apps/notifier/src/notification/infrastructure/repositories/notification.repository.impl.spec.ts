import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationRepositoryImpl } from './notification.repository.impl';
import { NotificationEntity, NotificationStatus as EntityNotificationStatus, NotificationType as EntityNotificationType } from '@common/database/orm/entities';
import { Repository } from 'typeorm';
import { NotificationType, NotificationStatus } from '../../domain/entities';

describe('NotificationRepositoryImpl', () => {
  let repository: NotificationRepositoryImpl;
  let typeOrmRepository: Repository<NotificationEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationRepositoryImpl,
        {
          provide: getRepositoryToken(NotificationEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<NotificationRepositoryImpl>(NotificationRepositoryImpl);
    typeOrmRepository = module.get<Repository<NotificationEntity>>(
      getRepositoryToken(NotificationEntity),
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('save', () => {
    it('should save a notification', async () => {
      const notification = {
        id: '1',
        vehicleId: '1',
        ruleId: '1',
        type: NotificationType.EMAIL,
        recipient: 'test@example.com',
        subject: 'Test',
        message: 'Test Message',
        status: NotificationStatus.PENDING,
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
      };

      const entity = {
        id: 1,
        vehicleId: 1,
        ruleId: 1,
        type: EntityNotificationType.EMAIL,
        recipient: 'test@example.com',
        subject: 'Test',
        message: 'Test Message',
        status: EntityNotificationStatus.PENDING,
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
      } as NotificationEntity;

      (typeOrmRepository.create as jest.Mock).mockReturnValue(entity);
      (typeOrmRepository.save as jest.Mock).mockResolvedValue(entity);

      const result = await repository.save(notification);

      expect(typeOrmRepository.create).toHaveBeenCalled();
      expect(typeOrmRepository.save).toHaveBeenCalled();
      expect(result.id).toBe('1');
    });
  });

  describe('updateStatus', () => {
    it('should update notification status', async () => {
      const id = '1';
      const entity = {
        id: 1,
        vehicleId: 1,
        ruleId: 1,
        type: EntityNotificationType.EMAIL,
        status: EntityNotificationStatus.PENDING,
        createdAt: new Date(),
      } as NotificationEntity;

      (typeOrmRepository.findOne as jest.Mock).mockResolvedValue(entity);
      (typeOrmRepository.save as jest.Mock).mockImplementation((e) => Promise.resolve(e));

      const result = await repository.updateStatus(id, NotificationStatus.SENT);

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result.status).toBe(NotificationStatus.SENT);
      expect(result.sentAt).toBeDefined();
    });

    it('should throw error if notification not found', async () => {
      (typeOrmRepository.findOne as jest.Mock).mockResolvedValue(null);
      await expect(repository.updateStatus('999', NotificationStatus.SENT)).rejects.toThrow();
    });
  });
});

