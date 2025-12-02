import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Kafka,
  Consumer,
  EachMessagePayload,
  ConsumerRunConfig,
  KafkaMessage,
} from 'kafkajs';

export type MessageHandler = (payload: {
  topic: string;
  partition: number;
  message: KafkaMessage;
  data: any;
}) => Promise<void>;

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumers: Map<string, Consumer> = new Map();
  private messageHandlers: Map<string, MessageHandler> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: this.configService.get('KAFKA_CLIENT_ID', 'telematics-consumer'),
      brokers: this.configService.get('KAFKA_BROKERS', 'localhost:9092').split(','),
      connectionTimeout: 10000,
      requestTimeout: 30000,
    });
  }

  async onModuleInit() {
    // Los consumers se registran dinámicamente
  }

  async onModuleDestroy() {
    await this.disconnectAll();
  }

  async subscribe(
    groupId: string,
    topics: string[],
    handler: MessageHandler,
    fromBeginning = false,
  ): Promise<void> {
    const consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    await consumer.connect();
    await consumer.subscribe({
      topics,
      fromBeginning,
    });

    this.consumers.set(groupId, consumer);
    this.messageHandlers.set(groupId, handler);

    await consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        try {
          const data = JSON.parse(payload.message.value?.toString() || '{}');
          await handler({
            topic: payload.topic,
            partition: payload.partition,
            message: payload.message,
            data,
          });
        } catch (error) {
          console.error(
            `Error processing message from ${payload.topic}:`,
            error,
          );
          // Aquí se podría implementar lógica de Dead Letter Queue
        }
      },
    });

    console.log(`Kafka Consumer (${groupId}) subscribed to topics: ${topics.join(', ')}`);
  }

  async subscribeToPriorityTopic(handler: MessageHandler): Promise<void> {
    await this.subscribe('priority-consumer-group', [this.configService.get('KAFKA_TOPIC_PRIORITY', 'panic-priority')], handler, false);
  }

  async subscribeToTelemetryStream(handler: MessageHandler): Promise<void> {
    await this.subscribe(
      'telemetry-consumer-group',
      [this.configService.get('KAFKA_TOPIC_TELEMETRY', 'telemetry-stream')],
      handler,
      false,
    );
  }

  async subscribeToEventsStream(handler: MessageHandler): Promise<void> {
    await this.subscribe('events-consumer-group', [this.configService.get('KAFKA_TOPIC_EVENTS', 'events-stream')], handler, false);
  }

  private async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.consumers.values()).map((consumer) =>
      consumer.disconnect(),
    );

    await Promise.all(disconnectPromises);
    this.consumers.clear();
    this.messageHandlers.clear();
    console.log('All Kafka Consumers disconnected');
  }

  async pause(groupId: string): Promise<void> {
    const consumer = this.consumers.get(groupId);
    if (consumer) {
      await consumer.pause([{ topic: '*' }]);
    }
  }

  async resume(groupId: string): Promise<void> {
    const consumer = this.consumers.get(groupId);
    if (consumer) {
      await consumer.resume([{ topic: '*' }]);
    }
  }
}

