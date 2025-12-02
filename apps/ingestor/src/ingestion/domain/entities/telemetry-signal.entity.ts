export enum SignalType {
  GPS = 'gps',
  SPEED = 'speed',
  DIRECTION = 'direction',
  LOAD_SENSOR = 'load_sensor',
  TEMPERATURE = 'temperature',
  CAMERA = 'camera',
  PANIC_BUTTON = 'panic_button',
}

export interface TelemetrySignal {
  id: string;
  vehicleId: number;
  signalType: SignalType;
  value: any;
  timestamp: Date;
  latitude?: number;
  longitude?: number;
  metadata?: Record<string, any>;
}

