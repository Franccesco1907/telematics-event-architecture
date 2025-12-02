import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import KeyvRedis from '@keyv/redis';
import Keyv from 'keyv';

@Injectable()
export class RedisCacheService implements OnModuleInit {
  private cache: Keyv;
  private defaultTTL: number;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
    this.defaultTTL = this.configService.get('CACHE_TTL', 3600) * 1000; // segundos a ms

    const store = new KeyvRedis(redisUrl);
    this.cache = new Keyv({
      store,
      namespace: 'telematics',
    });

    this.cache.on('error', (err) => {
      console.error('Redis Cache Error:', err);
    });
  }

  async onModuleInit() {
    console.log('Redis Cache Service initialized');
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cache.get(key);
      return value as T;
    } catch (error) {
      console.error(`Error getting key ${key} from cache:`, error);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const ttlMs = ttl ? ttl * 1000 : this.defaultTTL;
      await this.cache.set(key, value, ttlMs);
      return true;
    } catch (error) {
      console.error(`Error setting key ${key} in cache:`, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.cache.delete(key);
      return true;
    } catch (error) {
      console.error(`Error deleting key ${key} from cache:`, error);
      return false;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const value = await this.cache.get(key);
      return value !== undefined;
    } catch (error) {
      console.error(`Error checking key ${key} in cache:`, error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      await this.cache.clear();
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  // Métodos específicos para el dominio de telematics
  async getRulesByVehicleId<T>(vehicleId: number): Promise<T | undefined> {
    return this.get<T>(`rules:vehicle:${vehicleId}`);
  }

  async setRulesByVehicleId<T>(
    vehicleId: number,
    rules: T,
    ttl?: number,
  ): Promise<boolean> {
    return this.set(`rules:vehicle:${vehicleId}`, rules, ttl);
  }

  async getVehicleState<T>(vehicleId: number): Promise<T | undefined> {
    return this.get<T>(`vehicle:state:${vehicleId}`);
  }

  async setVehicleState<T>(
    vehicleId: number,
    state: T,
    ttl?: number,
  ): Promise<boolean> {
    return this.set(`vehicle:state:${vehicleId}`, state, ttl);
  }

  async deleteVehicleCache(vehicleId: number): Promise<boolean> {
    const rulesDeleted = await this.delete(`rules:vehicle:${vehicleId}`);
    const stateDeleted = await this.delete(`vehicle:state:${vehicleId}`);
    return rulesDeleted && stateDeleted;
  }

  // Cache para usuarios
  async getUserById<T>(userId: string): Promise<T | undefined> {
    return this.get<T>(`user:${userId}`);
  }

  async setUserById<T>(userId: string, user: T, ttl?: number): Promise<boolean> {
    return this.set(`user:${userId}`, user, ttl);
  }

  // Cache warming - precalentar cache con reglas críticas
  async warmupCriticalRules<T>(vehicleIds: number[], rulesGetter: (id: number) => Promise<T>): Promise<void> {
    console.log(`Warming up cache for ${vehicleIds.length} vehicles...`);

    const promises = vehicleIds.map(async (vehicleId) => {
      try {
        const rules = await rulesGetter(vehicleId);
        await this.setRulesByVehicleId(vehicleId, rules, 600); // 10 minutos
      } catch (error) {
        console.error(`Error warming up cache for vehicle ${vehicleId}:`, error);
      }
    });

    await Promise.all(promises);
    console.log('Cache warmup completed');
  }

  // Invalidación de cache por patrón
  async invalidatePattern(pattern: string): Promise<void> {
    // Nota: @keyv/redis no soporta nativamente SCAN por patrón
    // En producción, considera usar ioredis directamente para esto
    console.warn(`Pattern invalidation not fully supported: ${pattern}`);
  }
}

