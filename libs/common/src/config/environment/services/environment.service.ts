import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheConfig, CorsConfig, DataBaseConfig } from '../interfaces';

@Injectable()
export class EnvironmentService {
  constructor(private configService: ConfigService) { }

  get apiPort(): number {
    return this.configService.get<number>('API_PORT')!;
  }

  get environment(): string {
    return this.configService.get<string>('NODE_ENV')!;
  }

  get timeout(): number {
    return +this.configService.get<number>('TIMEOUT')!;
  }

  get cors(): CorsConfig {
    const originArray = this.configService
      .get<string>('CORS_ORIGINS')!
      .split(',')
      .filter((origin) => origin.trim() !== '');
    return {
      origin: originArray,
      methods: this.configService.get<string>('CORS_METHODS')!,
      allowedHeaders: this.configService.get<string>('CORS_ALLOWED_HEADERS')!,
      exposedHeaders: this.configService.get<string>('CORS_EXPOSED_HEADERS')!,
      credentials: this.configService.get<boolean>('CORS_CREDENTIALS')!,
    };
  }

  get database(): DataBaseConfig {
    return {
      host: this.configService.get<string>('DATABASE_HOST')!,
      port: this.configService.get<number>('DATABASE_PORT')!,
      username: this.configService.get<string>('DATABASE_USERNAME')!,
      password: this.configService.get<string>('DATABASE_PASSWORD')!,
      name: this.configService.get<string>('DATABASE_NAME')!,
    };
  }

  get cache(): CacheConfig {
    return {
      host: this.configService.get<string>('CACHE_HOST')!,
      port: this.configService.get<number>('CACHE_PORT')!,
      password: this.configService.get<string>('CACHE_PASSWORD')!,
    }
  }
}
