import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SeedDataUseCase {
  private readonly logger = new Logger(SeedDataUseCase.name);

  constructor(private readonly dataSource: DataSource) { }

  async execute(): Promise<{ message: string }> {
    this.logger.log('Starting database seeding...');

    const seedFilePath = path.resolve(process.cwd(), 'scripts/seed-data.sql');

    if (!fs.existsSync(seedFilePath)) {
      this.logger.error(`Seed file not found at: ${seedFilePath}`);
      throw new Error('Seed file not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sql = fs.readFileSync(seedFilePath, 'utf8');

      // Execute the SQL script
      await queryRunner.query(sql);

      await queryRunner.commitTransaction();
      this.logger.log('Database seeding completed successfully');

      return { message: 'Database seeded successfully' };
    } catch (error) {
      this.logger.error('Error seeding database:', error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
