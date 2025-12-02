import { Notification, NotificationStatus } from '../entities';

export interface NotificationRepository {
  save(notification: Notification): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  findByStatus(status: NotificationStatus): Promise<Notification[]>;
  findByVehicleId(vehicleId: string, limit?: number): Promise<Notification[]>;
  updateStatus(id: string, status: NotificationStatus): Promise<Notification>;
  incrementAttempts(id: string): Promise<Notification>;
}

