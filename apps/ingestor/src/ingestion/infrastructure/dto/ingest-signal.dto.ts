import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional } from 'class-validator';
import { SignalType } from '../../domain/entities';

export class IngestSignalDto {
  @ApiProperty({
    description: 'Vehicle ID (numeric)',
    example: 1,
    type: 'number'
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  vehicleId: number;

  @ApiProperty({
    description: 'Type of signal',
    enum: SignalType,
    example: SignalType.GPS
  })
  @IsEnum(SignalType)
  @IsNotEmpty()
  signalType: SignalType;

  @ApiProperty({ description: 'Signal value', example: 120 })
  @IsNotEmpty()
  value: any;

  @ApiProperty({ description: 'Latitude coordinate', example: 4.7110, required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: 'Longitude coordinate', example: -74.0721, required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

