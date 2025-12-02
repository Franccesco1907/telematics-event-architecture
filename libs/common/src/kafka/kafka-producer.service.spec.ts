import { Test, TestingModule } from '@nestjs/testing';
import { KafkaProducerService } from './kafka-producer.service';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

// Mock de la librería kafkajs
jest.mock('kafkajs', () => {
  const mockProducer = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    send: jest.fn(),
  };

  const mockKafka = {
    producer: jest.fn(() => mockProducer),
  };

  return {
    Kafka: jest.fn(() => mockKafka),
    CompressionTypes: { GZIP: 0 },
  };
});

describe('KafkaProducerService', () => {
  let service: KafkaProducerService;
  let mockProducer: Producer;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaProducerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key, defaultValue) => {
              if (key === 'KAFKA_BROKERS') return 'localhost:9092';
              if (key === 'KAFKA_CLIENT_ID') return 'test-client';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<KafkaProducerService>(KafkaProducerService);
    mockProducer = (service as any).producer; // Acceder al producer privado
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should connect on module init', async () => {
    await service.onModuleInit();
    expect(mockProducer.connect).toHaveBeenCalled();
  });

  it('should send a message', async () => {
    const message = {
      topic: 'test-topic',
      value: { foo: 'bar' },
      key: '123',
    };

    await service.sendMessage(message);

    expect(mockProducer.send).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: message.topic,
        messages: [
          expect.objectContaining({
            key: '123',
            value: JSON.stringify(message.value),
          }),
        ],
      }),
    );
  });

  it('should send batch messages', async () => {
    const messages = [
      { topic: 'topic1', value: { id: 1 } },
      { topic: 'topic1', value: { id: 2 } },
      { topic: 'topic2', value: { id: 3 } },
    ];

    await service.sendBatch(messages);

    const sendMock = mockProducer.send as jest.Mock;
    const topics = sendMock.mock.calls.map(([payload]) => payload.topic);
    expect(new Set(topics)).toEqual(new Set(['topic1', 'topic2']));
  });

  it('should send to priority topic', async () => {
    const value = { alert: 'panic' };
    const vehicleId = 1;

    await service.sendToPriorityTopic(value, vehicleId);

    expect(mockProducer.send).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'panic-priority',
        messages: [
          expect.objectContaining({
            key: '1',
            headers: expect.objectContaining({ priority: 'critical' }),
          }),
        ],
      }),
    );
  });

  it('should handle send error', async () => {
    (mockProducer.send as jest.Mock).mockRejectedValueOnce(new Error('Kafka Error'));

    await expect(
      service.sendMessage({ topic: 'test', value: 'data' }),
    ).rejects.toThrow('Kafka Error');
  });
});
