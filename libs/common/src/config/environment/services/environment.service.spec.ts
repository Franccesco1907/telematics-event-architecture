import { Test, TestingModule } from '@nestjs/testing';
import { EnvironmentService } from './environment.service';
import { ConfigService } from '@nestjs/config';

describe('EnvironmentService', () => {
  let service: EnvironmentService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnvironmentService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'API_PORT':
                  return 3000;
                case 'NODE_ENV':
                  return 'development';
                case 'TIMEOUT':
                  return '5000';
                case 'CORS_ORIGINS':
                  return 'http://localhost:3000,http://example.com';
                case 'CORS_METHODS':
                  return 'GET,HEAD,PUT,PATCH,POST,DELETE';
                case 'CORS_ALLOWED_HEADERS':
                  return 'Content-Type,Authorization';
                case 'CORS_EXPOSED_HEADERS':
                  return 'Content-Length';
                case 'CORS_CREDENTIALS':
                  return true;
                case 'DATABASE_HOST':
                  return 'localhost';
                case 'DATABASE_PORT':
                  return 5432;
                case 'DATABASE_USERNAME':
                  return 'user';
                case 'DATABASE_PASSWORD':
                  return 'password';
                case 'DATABASE_NAME':
                  return 'dbname';
                case 'CACHE_HOST':
                  return 'redis';
                case 'CACHE_PORT':
                  return 6379;
                case 'CACHE_PASSWORD':
                  return 'cachepassword';
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EnvironmentService>(EnvironmentService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get apiPort', () => {
    expect(service.apiPort).toBe(3000);
    expect(configService.get).toHaveBeenCalledWith('API_PORT');
  });

  it('should get environment', () => {
    expect(service.environment).toBe('development');
    expect(configService.get).toHaveBeenCalledWith('NODE_ENV');
  });

  it('should get timeout', () => {
    expect(service.timeout).toBe(5000);
    expect(configService.get).toHaveBeenCalledWith('TIMEOUT');
  });

  describe('cors', () => {
    it('should get cors configuration with multiple origins', () => {
      const expectedCorsConfig = {
        origin: ['http://localhost:3000', 'http://example.com'],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: 'Content-Type,Authorization',
        exposedHeaders: 'Content-Length',
        credentials: true,
      };
      expect(service.cors).toEqual(expectedCorsConfig);
      expect(configService.get).toHaveBeenCalledWith('CORS_ORIGINS');
      expect(configService.get).toHaveBeenCalledWith('CORS_METHODS');
      expect(configService.get).toHaveBeenCalledWith('CORS_ALLOWED_HEADERS');
      expect(configService.get).toHaveBeenCalledWith('CORS_EXPOSED_HEADERS');
      expect(configService.get).toHaveBeenCalledWith('CORS_CREDENTIALS');
    });

    it('should handle empty CORS_ORIGINS', () => {
      (configService.get as jest.Mock).mockReturnValueOnce('');
      const expectedCorsConfig = {
        origin: [],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: 'Content-Type,Authorization',
        exposedHeaders: 'Content-Length',
        credentials: true,
      };
      expect(service.cors).toEqual(expectedCorsConfig);
    });
  });

  describe('database', () => {
    it('should get database configuration', () => {
      const expectedDatabaseConfig = {
        host: 'localhost',
        port: 5432,
        username: 'user',
        password: 'password',
        name: 'dbname',
      };
      expect(service.database).toEqual(expectedDatabaseConfig);
      expect(configService.get).toHaveBeenCalledWith('DATABASE_HOST');
      expect(configService.get).toHaveBeenCalledWith('DATABASE_PORT');
      expect(configService.get).toHaveBeenCalledWith('DATABASE_USERNAME');
      expect(configService.get).toHaveBeenCalledWith('DATABASE_PASSWORD');
      expect(configService.get).toHaveBeenCalledWith('DATABASE_NAME');
    });
  });

  describe('cache', () => {
    it('should get cache configuration', () => {
      const expectedCacheConfig = {
        host: 'redis',
        port: 6379,
        password: 'cachepassword',
      };
      expect(service.cache).toEqual(expectedCacheConfig);
      expect(configService.get).toHaveBeenCalledWith('CACHE_HOST');
      expect(configService.get).toHaveBeenCalledWith('CACHE_PORT');
      expect(configService.get).toHaveBeenCalledWith('CACHE_PASSWORD');
    });
  });
});

