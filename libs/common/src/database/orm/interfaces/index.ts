import { DeepPartial, FindOptionsWhere } from 'typeorm';

interface ReadableRepositoryInterface<T> {
  findOneById(id: number): Promise<T | null>;
  findOneBy(conditions: Partial<T>): Promise<T | null>;
  findMany(conditions: FindOptionsWhere<T>): Promise<T[]>
}

interface WritableRepositoryInterface<T> {
  create(data: DeepPartial<T>): Promise<T>;
  update(id: number, data: DeepPartial<T>): Promise<T>;
  softDelete(id: number): Promise<void>;
}

interface FindOrFailRepositoryInterface<T> {
  findOneByIdOrFail(id: number): Promise<T>;
  findOneByOrFail(where: FindOptionsWhere<T>): Promise<T>;
}

export interface BaseRepositoryInterface<T>
  extends ReadableRepositoryInterface<T>,
  WritableRepositoryInterface<T>,
  FindOrFailRepositoryInterface<T> { }
