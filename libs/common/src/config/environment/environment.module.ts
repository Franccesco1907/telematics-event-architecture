import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnvironmentService } from './services/environment.service';
import { EnvironmentVariables } from './validations/environment.validation';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config: Record<string, unknown>) => {
        const validatedConfig = plainToInstance(
          EnvironmentVariables,
          config,
          { enableImplicitConversion: true },
        );
        const errors = validateSync(validatedConfig, {
          skipMissingProperties: false,
        });

        if (errors.length > 0) {
          throw new Error(errors.toString());
        }
        return validatedConfig;
      },
    }),
  ],
  providers: [EnvironmentService],
  exports: [EnvironmentService],
})
export class EnvironmentModule { }
