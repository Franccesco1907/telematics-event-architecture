import { Test, TestingModule } from '@nestjs/testing';
import { EnvironmentService } from '@common/config/environment';
import { TypeOrmConfigService } from './typeorm.service';

describe('TypeOrmConfigService', () => {
  let service: TypeOrmConfigService;
  let environmentService: EnvironmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmConfigService,
        {
          provide: EnvironmentService,
          useValue: {
            database: {
              host: 'test_host',
              port: 5432,
              username: 'test_user',
              password: 'test_password',
              name: 'test_db',
            },
            environment: 'development',
          },
        },
      ],
    }).compile();

    service = module.get<TypeOrmConfigService>(TypeOrmConfigService);
    environmentService = module.get<EnvironmentService>(EnvironmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTypeOrmOptions', () => {
    it('should return the correct TypeOrmModuleOptions for development environment', () => {
      const options = service.createTypeOrmOptions() as any;

      expect(options.type).toBe('postgres');
      expect(options.host).toBe(environmentService.database.host);
      expect(options.port).toBe(environmentService.database.port);
      expect(options.username).toBe(environmentService.database.username);
      expect(options.password).toBe(environmentService.database.password);
      expect(options.database).toBe(environmentService.database.name);
      expect(options.entities).toBeInstanceOf(Array);
      expect(options.autoLoadEntities).toBe(true);
      expect(options.synchronize).toBe(true); // Development environment
    });

    it('should return synchronize: false for production environment', async () => {
      const prodModule: TestingModule = await Test.createTestingModule({
        providers: [
          TypeOrmConfigService,
          {
            provide: EnvironmentService,
            useValue: {
              database: {
                host: 'prod_host',
                port: 5432,
                username: 'prod_user',
                password: 'prod_password',
                name: 'prod_db',
              },
              environment: 'production',
            },
          },
        ],
      }).compile();

      const prodService = prodModule.get<TypeOrmConfigService>(TypeOrmConfigService);
      const options = prodService.createTypeOrmOptions();

      expect(options.synchronize).toBe(false); // Production environment
    });

    it('should use default values if environment variables are not set', async () => {
      const defaultModule: TestingModule = await Test.createTestingModule({
        providers: [
          TypeOrmConfigService,
          {
            provide: EnvironmentService,
            useValue: {
              database: {}, // Simulate empty database config
              environment: 'development',
            },
          },
        ],
      }).compile();

      const defaultService = defaultModule.get<TypeOrmConfigService>(TypeOrmConfigService);
      const options = defaultService.createTypeOrmOptions() as any;

      expect(options.type).toBe('postgres');
      expect(options.host).toBeUndefined();
      expect(options.port).toBeUndefined();
      expect(options.username).toBeUndefined();
      expect(options.password).toBeUndefined();
      expect(options.database).toBeUndefined();
      expect(options.synchronize).toBe(true);
    });
  });
});

