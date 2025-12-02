import { Test, TestingModule } from '@nestjs/testing';

class MockDataSource { }
class MockQueryRunner { }

jest.mock('typeorm', () => ({
  DataSource: MockDataSource,
  QueryRunner: MockQueryRunner,
}));

import { DataSource, QueryRunner } from 'typeorm';

jest.mock('path', () => ({
  resolve: jest.fn(),
}));

jest.mock('fs');

jest.mock('app-root-path', () => ({
  path: '/workspace/backend',
  toString: () => '/workspace/backend',
}));

import { SeedDataUseCase } from './seed-data.use-case';
import * as fs from 'fs';
import * as path from 'path';

describe('SeedDataUseCase', () => {
  let useCase: SeedDataUseCase;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      query: jest.fn(),
    } as unknown as QueryRunner;

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as unknown as DataSource;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedDataUseCase,
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    useCase = module.get<SeedDataUseCase>(SeedDataUseCase);

    (path.resolve as jest.Mock).mockReturnValue('/path/to/seed.sql');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should execute seed successfully', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('INSERT INTO table...');

    const result = await useCase.execute();

    expect(dataSource.createQueryRunner).toHaveBeenCalled();
    expect(queryRunner.connect).toHaveBeenCalled();
    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(queryRunner.query).toHaveBeenCalledWith('INSERT INTO table...');
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
    expect(result).toEqual({ message: 'Database seeded successfully' });
  });

  it('should throw error if seed file not found', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    await expect(useCase.execute()).rejects.toThrow('Seed file not found');
    expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
  });

  it('should rollback transaction on error', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('BAD SQL');
    (queryRunner.query as jest.Mock).mockRejectedValue(new Error('SQL Error'));

    await expect(useCase.execute()).rejects.toThrow('SQL Error');

    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });
});
