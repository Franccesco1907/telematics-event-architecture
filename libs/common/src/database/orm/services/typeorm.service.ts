import { EnvironmentService } from '@common/config/environment';
import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly environmentService: EnvironmentService) { }

  public createTypeOrmOptions(): TypeOrmModuleOptions {
    const { host, name, password, port, username } = this.environmentService.database;

    return {
      type: 'postgres',
      host,
      port,
      username,
      password,
      database: name,
      autoLoadEntities: true,
      entities: [], // Auto-load will handle this if entities are in the module scope
      synchronize: this.environmentService.environment !== 'production',
    };
  }
}
