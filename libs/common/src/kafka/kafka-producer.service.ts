import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Message, CompressionTypes } from 'kafkajs';

export interface KafkaMessage {
  topic: string;
  key?: string;
  value: any;
  headers?: Record<string, string>;
}

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: this.configService.get('KAFKA_CLIENT_ID', 'telematics-producer'),
      brokers: this.configService.get('KAFKA_BROKERS', 'localhost:9092').split(','),
      connectionTimeout: 10000,
      requestTimeout: 30000,
    });
    console.log('Kafka Brokers Configured:', this.configService.get('KAFKA_BROKERS', 'localhost:9092'));

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    if (!this.isConnected) {
      await this.producer.connect();
      this.isConnected = true;
      console.log('Kafka Producer connected');
    }
  }

  private async disconnect() {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
      console.log('Kafka Producer disconnected');
    }
  }

  async sendMessage(message: KafkaMessage): Promise<void> {
    try {
      await this.producer.send({
        topic: message.topic,
        messages: [
          {
            key: message.key,
            value: JSON.stringify(message.value),
            headers: message.headers,
          },
        ],
        compression: CompressionTypes.GZIP,
      });
    } catch (error) {
      console.error('Error sending message to Kafka:', error);
      throw error;
    }
  }

  async sendBatch(messages: KafkaMessage[]): Promise<void> {
    try {
      const topicMessages = new Map<string, Message[]>();

      // Agrupar mensajes por topic
      messages.forEach((msg) => {
        if (!topicMessages.has(msg.topic)) {
          topicMessages.set(msg.topic, []);
        }

        topicMessages.get(msg.topic)!.push({
          key: msg.key,
          value: JSON.stringify(msg.value),
          headers: msg.headers,
        });
      });

      // Enviar batch por topic
      const batchPromises = Array.from(topicMessages.entries()).map(
        ([topic, msgs]) =>
          this.producer.send({
            topic,
            messages: msgs,
            compression: CompressionTypes.GZIP,
          }),
      );

      await Promise.all(batchPromises);
    } catch (error) {
      console.error('Error sending batch to Kafka:', error);
      throw error;
    }
  }

  async sendToPriorityTopic(value: any, vehicleId: number): Promise<void> {
    await this.sendMessage({
      topic: this.configService.get('KAFKA_TOPIC_PRIORITY', 'panic-priority'),
      key: vehicleId.toString(),
      value,
      headers: {
        priority: 'critical',
        timestamp: new Date().toISOString(),
      },
    });
  }

  async sendToTelemetryStream(value: any, vehicleId: number): Promise<void> {
    await this.sendMessage({
      topic: this.configService.get('KAFKA_TOPIC_TELEMETRY', 'telemetry-stream'),
      key: vehicleId.toString(),
      value,
    });
  }

  async sendToEventsStream(value: any, vehicleId: number): Promise<void> {
    await this.sendMessage({
      topic: this.configService.get('KAFKA_TOPIC_EVENTS', 'events-stream'),
      key: vehicleId.toString(),
      value,
    });
  }
}

