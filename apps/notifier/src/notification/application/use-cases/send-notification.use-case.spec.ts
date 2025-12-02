import { Test, TestingModule } from '@nestjs/testing';
import { SendNotificationUseCase } from './send-notification.use-case';
import { NotificationRepository } from '../../domain/repositories';
import { NotificationType, NotificationStatus } from '../../domain/entities';

describe('SendNotificationUseCase', () => {
  let useCase: SendNotificationUseCase;
  let notificationRepository: NotificationRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendNotificationUseCase,
        {
          provide: 'NotificationRepository',
          useValue: {
            save: jest.fn(),
            updateStatus: jest.fn(),
            incrementAttempts: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<SendNotificationUseCase>(SendNotificationUseCase);
    notificationRepository = module.get<NotificationRepository>('NotificationRepository');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const config = {
      vehicleId: '1',
      ruleId: 'rule-1',
      type: NotificationType.EMAIL,
      recipient: 'test@example.com',
      message: 'Test Message',
    };

    it('should create notification and attempt to send it', async () => {
      const savedNotification = {
        ...config,
        id: 'notif-1',
        status: NotificationStatus.PENDING,
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
      };

      (notificationRepository.save as jest.Mock).mockResolvedValue(savedNotification);
      
      // Force success for sendEmail
      jest.spyOn(Math, 'random').mockReturnValue(0.9); // > 0.1 success

      await useCase.execute(config);

      expect(notificationRepository.save).toHaveBeenCalled();
      expect(notificationRepository.updateStatus).toHaveBeenCalledWith(
        'notif-1',
        NotificationStatus.SENT,
      );
    });

    it('should handle failed send attempt', async () => {
      const savedNotification = {
        ...config,
        id: 'notif-1',
        status: NotificationStatus.PENDING,
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
      };
      const updatedNotification = { ...savedNotification, attempts: 1 };

      (notificationRepository.save as jest.Mock).mockResolvedValue(savedNotification);
      (notificationRepository.incrementAttempts as jest.Mock).mockResolvedValue(updatedNotification);
      
      // Force failure for sendEmail
      jest.spyOn(Math, 'random').mockReturnValue(0.0); // < 0.1 fail

      await useCase.execute(config);

      expect(notificationRepository.incrementAttempts).toHaveBeenCalledWith('notif-1');
      expect(notificationRepository.updateStatus).not.toHaveBeenCalled();
    });
  });
});

