import { Injectable, Logger, Inject } from '@nestjs/common';
import { TelemetrySignal, SignalType } from '../../domain/entities';
import { TelemetryRepository } from '../../domain/repositories';
import { KafkaProducerService } from '@common/kafka';
import { RedisCacheService } from '@common/cache';
import { getUniqueId } from '@common';

@Injectable()
export class IngestSignalUseCase {
  private readonly logger = new Logger(IngestSignalUseCase.name);

  constructor(
    @Inject('TelemetryRepository')
    private readonly telemetryRepository: TelemetryRepository,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly cacheService: RedisCacheService,
  ) { }

  async execute(signalData: Partial<TelemetrySignal>): Promise<TelemetrySignal> {
    // 1. Validar datos de la señal
    this.validateSignalData(signalData);

    // 2. Crear la señal
    const signal: TelemetrySignal = {
      id: signalData.id || getUniqueId(),
      vehicleId: signalData.vehicleId!,
      signalType: signalData.signalType!,
      value: signalData.value,
      timestamp: signalData.timestamp || new Date(),
      latitude: signalData.latitude,
      longitude: signalData.longitude,
      metadata: signalData.metadata || {},
    };

    try {
      // 3. Guardar en base de datos (TimescaleDB)
      const savedSignal = await this.telemetryRepository.save(signal);
      this.logger.log(
        `Signal saved for vehicle ${signal.vehicleId} - Type: ${signal.signalType}`,
      );

      // 4. Actualizar estado del vehículo en Redis (no bloqueante)
      this.updateVehicleState(signal).catch((err) => {
        this.logger.warn(`Could not update vehicle state in cache: ${err.message}`);
      });

      // 5. Determinar prioridad y publicar en Kafka (no bloqueante)
      this.publishToKafka(signal).catch((err) => {
        this.logger.warn(`Could not publish to Kafka: ${err.message}`);
      });

      return savedSignal;
    } catch (error) {
      this.logger.error(
        `Error ingesting signal for vehicle ${signal.vehicleId}:`,
        error,
      );
      throw error;
    }
  }

  async executeBatch(signals: Partial<TelemetrySignal>[]): Promise<TelemetrySignal[]> {
    this.logger.log(`Processing batch of ${signals.length} signals`);

    const processedSignals: TelemetrySignal[] = [];

    // Procesar en paralelo pero con límite
    const batchSize = 50;
    for (let i = 0; i < signals.length; i += batchSize) {
      const batch = signals.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((signal) => this.execute(signal).catch((err) => {
          this.logger.error(`Failed to process signal:`, err);
          return null;
        })),
      );

      processedSignals.push(...results.filter((s) => s !== null) as TelemetrySignal[]);
    }

    return processedSignals;
  }

  private validateSignalData(signalData: Partial<TelemetrySignal>): void {
    if (!signalData.vehicleId) {
      throw new Error('Vehicle ID is required');
    }

    if (!signalData.signalType) {
      throw new Error('Signal type is required');
    }

    if (signalData.signalType === SignalType.GPS) {
      if (signalData.latitude === undefined || signalData.longitude === undefined) {
        throw new Error('GPS signals require latitude and longitude');
      }
    }
  }

  private async updateVehicleState(signal: TelemetrySignal): Promise<void> {
    try {
      const currentState = await this.cacheService.getVehicleState<any>(
        signal.vehicleId,
      );

      const newState = {
        ...currentState,
        lastSignalTime: signal.timestamp,
        lastSignalType: signal.signalType,
        latitude: signal.latitude || currentState?.latitude,
        longitude: signal.longitude || currentState?.longitude,
        speed: signal.value?.speed || currentState?.speed,
        lastUpdate: new Date(),
      };

      await this.cacheService.setVehicleState(signal.vehicleId, newState, 3600); // 1 hora
    } catch (error) {
      this.logger.warn(
        `Could not update vehicle state in cache for ${signal.vehicleId}`,
      );
    }
  }

  private async publishToKafka(signal: TelemetrySignal): Promise<void> {
    // Determinar si es una señal crítica (pánico)
    const isCritical = this.isCriticalSignal(signal);

    if (isCritical) {
      // Publicar en topic de prioridad para respuesta < 2 segundos
      await this.kafkaProducer.sendToPriorityTopic(
        {
          signalId: signal.id,
          vehicleId: signal.vehicleId,
          signalType: signal.signalType,
          timestamp: signal.timestamp,
          value: signal.value,
          metadata: signal.metadata,
        },
        signal.vehicleId,
      );
      this.logger.warn(
        `CRITICAL signal published to priority topic for vehicle ${signal.vehicleId}`,
      );
    } else {
      // Publicar en topic normal de telemetría
      await this.kafkaProducer.sendToTelemetryStream(
        {
          signalId: signal.id,
          vehicleId: signal.vehicleId,
          signalType: signal.signalType,
          timestamp: signal.timestamp,
          value: signal.value,
          latitude: signal.latitude,
          longitude: signal.longitude,
          metadata: signal.metadata,
        },
        signal.vehicleId,
      );
    }
  }

  private isCriticalSignal(signal: TelemetrySignal): boolean {
    // Señales críticas: botón de pánico, colisión, etc.
    const criticalTypes = [
      SignalType.PANIC_BUTTON,
      'collision',
      'emergency',
    ];

    if (criticalTypes.includes(signal.signalType as any)) {
      return true;
    }

    // También considerar eventos en metadata
    if (signal.metadata?.emergency === true) {
      return true;
    }

    if (signal.metadata?.eventTrigger === 'PANIC_BUTTON') {
      return true;
    }

    return false;
  }
}
