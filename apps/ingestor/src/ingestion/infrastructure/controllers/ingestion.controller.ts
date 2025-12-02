import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IngestSignalUseCase } from '../../application';
import { IngestSignalDto } from '../dto';

@ApiTags('ingestion')
@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestSignalUseCase: IngestSignalUseCase) {}

  @Post('signal')
  @ApiOperation({ summary: 'Ingest a telemetry signal' })
  @ApiResponse({ status: 201, description: 'Signal ingested successfully' })
  @ApiResponse({ status: 400, description: 'Invalid signal data' })
  async ingestSignal(@Body() dto: IngestSignalDto) {
    return await this.ingestSignalUseCase.execute(dto);
  }
}

