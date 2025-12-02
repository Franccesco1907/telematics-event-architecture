export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBHOOK = 'webhook',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  RETRY = 'retry',
}

export interface Notification {
  id: string;
  vehicleId: string;
  ruleId: string;
  type: NotificationType;
  recipient: string;
  subject?: string;
  message: string;
  status: NotificationStatus;
  attempts: number;
  maxAttempts: number;
  sentAt?: Date;
  createdAt: Date;
  metadata?: Record<string, any>;
}

