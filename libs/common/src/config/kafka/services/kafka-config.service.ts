import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaConfig } from '../interfaces';

@Injectable()
export class KafkaConfigService {
  constructor(private readonly configService: ConfigService) {}

  getKafkaConfig(): KafkaConfig {
    return {
      clientId: this.configService.get<string>('KAFKA_CLIENT_ID', 'telematics-client'),
      brokers: this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
      groupId: this.configService.get<string>('KAFKA_GROUP_ID', 'telematics-group'),
    };
  }

  getKafkaBrokers(): string[] {
    return this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(',');
  }

  getKafkaClientId(): string {
    return this.configService.get<string>('KAFKA_CLIENT_ID', 'telematics-client');
  }

  getKafkaGroupId(): string {
    return this.configService.get<string>('KAFKA_GROUP_ID', 'telematics-group');
  }
}

