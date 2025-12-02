import { Test, TestingModule } from '@nestjs/testing';
import { IngestionController } from './ingestion.controller';
import { IngestSignalUseCase } from '../../application';
import { IngestSignalDto } from '../dto';
import { SignalType } from '../../domain/entities';

describe('IngestionController', () => {
  let controller: IngestionController;
  let ingestSignalUseCase: IngestSignalUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestionController],
      providers: [
        {
          provide: IngestSignalUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<IngestionController>(IngestionController);
    ingestSignalUseCase = module.get<IngestSignalUseCase>(IngestSignalUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should ingest a signal', async () => {
    const dto: IngestSignalDto = {
      vehicleId: 1,
      signalType: SignalType.GPS,
      latitude: 10,
      longitude: 20,
      value: {},
      // timestamp removed as it is not in IngestSignalDto
    };

    const expectedResult = { id: 'test-id', ...dto };
    (ingestSignalUseCase.execute as jest.Mock).mockResolvedValue(expectedResult);

    const result = await controller.ingestSignal(dto);

    expect(result).toEqual(expectedResult);
    expect(ingestSignalUseCase.execute).toHaveBeenCalledWith(dto);
  });
});
