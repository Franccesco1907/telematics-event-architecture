import { TelemetrySignal } from '../entities';

export interface TelemetryRepository {
  save(signal: TelemetrySignal): Promise<TelemetrySignal>;
  findById(id: string): Promise<TelemetrySignal | null>;
  findByVehicleId(vehicleId: number, limit?: number): Promise<TelemetrySignal[]>;
}

