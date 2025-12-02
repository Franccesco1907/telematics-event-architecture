import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SeedDataUseCase } from '../../application/use-cases/seed-data.use-case';

@ApiTags('Ingestion')
@Controller('ingestion')
export class SeedController {
  constructor(private readonly seedDataUseCase: SeedDataUseCase) { }

  @Post('seed')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Seed database with initial test data' })
  @ApiResponse({ status: 201, description: 'Database seeded successfully' })
  async seedDatabase() {
    return this.seedDataUseCase.execute();
  }
}
