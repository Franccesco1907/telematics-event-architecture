import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaConfigService } from '../services';

@Module({
  imports: [ConfigModule],
  providers: [KafkaConfigService],
  exports: [KafkaConfigService],
})
export class KafkaConfigModule {}

