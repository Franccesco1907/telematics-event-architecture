import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, DeepPartial, EntityTarget, FindOptionsWhere, QueryRunner, Repository, SelectQueryBuilder } from 'typeorm';
import { CustomBaseEntity } from '../entities/base.entity';
import { BaseRepositoryInterface } from '../interfaces';

@Injectable()
export abstract class OrmBaseRepository<T extends CustomBaseEntity> implements BaseRepositoryInterface<T> {
  protected readonly repository: Repository<T>;
  constructor(
    target: EntityTarget<T>,
    @InjectDataSource() dataSource: DataSource,
    private readonly queryRunner?: QueryRunner,
  ) {
    this.repository = queryRunner ? queryRunner.manager.getRepository(target) : dataSource.getRepository(target);
  }

  async findOneByOrFail(where: FindOptionsWhere<T>): Promise<T> {
    const entity = await this.repository.findOneBy(where);
    if (!entity || entity.deletedAt !== null) {
      const conditions = Object.entries(where)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      throw new NotFoundException(`Entity with conditions ${conditions} not found`);
    }
    return entity;
  }

  async findOneByIdOrFail(id: number): Promise<T> {
    return this.findOneByOrFail({ id } as FindOptionsWhere<T>);
  }

  async findOneById(id: number): Promise<T | null> {
    return this.repository.findOne({ where: { id, deletedAt: null } as unknown as FindOptionsWhere<T> });
  }

  async findMany(conditions: FindOptionsWhere<T> = {}): Promise<T[]> {
    return this.repository.findBy({ ...conditions, deletedAt: null } as FindOptionsWhere<T>);
  }

  async findOneBy(conditions: Partial<T>): Promise<T | null> {
    return this.repository.findOne({ where: { ...conditions, deletedAt: null } as FindOptionsWhere<T> });
  }

  async create(partial: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(partial);
    return this.repository.save(entity);
  }

  async update(id: number, partial: DeepPartial<T>): Promise<T> {
    const entity = await this.findOneByIdOrFail(id);
    this.repository.merge(entity, partial);
    return this.repository.save(entity);
  }

  async softDelete(id: number): Promise<void> {
    const entity = await this.findOneByIdOrFail(id);
    if (entity.deletedAt !== null) {
      throw new BadRequestException(`Entity with id ${id} is already deleted`);
    }
    await this.repository.softRemove(entity);
  }

  protected createQueryBuilder(alias: string): SelectQueryBuilder<T> {
    return this.repository.createQueryBuilder(alias);
  }

  protected get entityManager() {
    return this.repository.manager;
  }

  protected get currentQueryRunner() {
    return this.queryRunner;
  }
}
