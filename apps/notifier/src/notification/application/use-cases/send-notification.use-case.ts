import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  Notification,
  NotificationType,
  NotificationStatus,
} from '../../domain/entities';
import { NotificationRepository } from '../../domain/repositories';

interface NotificationConfig {
  vehicleId: string;
  ruleId: string;
  type: NotificationType;
  recipient: string;
  subject?: string;
  message: string;
  metadata?: Record<string, any>;
  priority?: number;
}

@Injectable()
export class SendNotificationUseCase {
  private readonly logger = new Logger(SendNotificationUseCase.name);

  constructor(
    @Inject('NotificationRepository')
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(config: NotificationConfig): Promise<Notification> {
    const notification: Notification = {
      id: this.generateId(),
      vehicleId: config.vehicleId,
      ruleId: config.ruleId,
      type: config.type,
      recipient: config.recipient,
      subject: config.subject,
      message: config.message,
      status: NotificationStatus.PENDING,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
      metadata: config.metadata,
    };

    try {
      // 1. Guardar en base de datos primero
      const savedNotification = await this.notificationRepository.save(notification);

      // 2. Intentar enviar la notificación
      await this.attemptSend(savedNotification);

      return savedNotification;
    } catch (error) {
      this.logger.error(
        `Error creating notification for vehicle ${config.vehicleId}:`,
        error,
      );
      throw error;
    }
  }

  async attemptSend(notification: Notification): Promise<boolean> {
    try {
      this.logger.log(
        `Attempting to send ${notification.type} notification (attempt ${notification.attempts + 1}/${notification.maxAttempts})`,
      );

      // Enviar según el tipo
      let success = false;

      switch (notification.type) {
        case NotificationType.EMAIL:
          success = await this.sendEmail(notification);
          break;

        case NotificationType.SMS:
          success = await this.sendSMS(notification);
          break;

        case NotificationType.PUSH:
          success = await this.sendPushNotification(notification);
          break;

        case NotificationType.WEBHOOK:
          success = await this.sendWebhook(notification);
          break;

        default:
          this.logger.warn(
            `Unknown notification type: ${notification.type}`,
          );
          success = false;
      }

      if (success) {
        // Marcar como enviada
        await this.notificationRepository.updateStatus(
          notification.id,
          NotificationStatus.SENT,
        );
        this.logger.log(
          `Notification ${notification.id} sent successfully`,
        );
        return true;
      } else {
        // Incrementar intentos y programar reintento
        await this.handleFailedAttempt(notification);
        return false;
      }
    } catch (error) {
      this.logger.error(
        `Error sending notification ${notification.id}:`,
        error,
      );
      await this.handleFailedAttempt(notification);
      return false;
    }
  }

  async retryPendingNotifications(): Promise<void> {
    this.logger.log('Checking for pending notifications to retry...');

    try {
      const pendingNotifications =
        await this.notificationRepository.findByStatus(
          NotificationStatus.PENDING,
        );

      const retryNotifications =
        await this.notificationRepository.findByStatus(
          NotificationStatus.RETRY,
        );

      const allPending = [...pendingNotifications, ...retryNotifications];

      this.logger.log(
        `Found ${allPending.length} notifications to process`,
      );

      for (const notification of allPending) {
        // Verificar que no haya excedido el máximo de intentos
        if (notification.attempts < notification.maxAttempts) {
          await this.attemptSend(notification);
          
          // Delay entre envíos para no saturar APIs externas
          await this.delay(100);
        }
      }
    } catch (error) {
      this.logger.error('Error retrying notifications:', error);
    }
  }

  private async handleFailedAttempt(notification: Notification): Promise<void> {
    const updated = await this.notificationRepository.incrementAttempts(
      notification.id,
    );

    if (updated.attempts >= updated.maxAttempts) {
      this.logger.error(
        `Notification ${notification.id} failed after ${updated.maxAttempts} attempts`,
      );
    } else {
      this.logger.warn(
        `Notification ${notification.id} failed, will retry (${updated.attempts}/${updated.maxAttempts})`,
      );
    }
  }

  private async sendEmail(notification: Notification): Promise<boolean> {
    // Implementar integración con servicio de email (SendGrid, AWS SES, etc.)
    this.logger.log(
      `Sending email to ${notification.recipient}: ${notification.subject}`,
    );

    // TODO: Implementar integración real
    // Simulación
    const success = Math.random() > 0.1; // 90% de éxito

    if (success) {
      this.logger.log(`Email sent to ${notification.recipient}`);
    } else {
      this.logger.error(
        `Failed to send email to ${notification.recipient}`,
      );
    }

    return success;
  }

  private async sendSMS(notification: Notification): Promise<boolean> {
    // Implementar integración con Twilio, AWS SNS, etc.
    this.logger.log(
      `Sending SMS to ${notification.recipient}: ${notification.message.substring(0, 50)}...`,
    );

    // TODO: Implementar integración real
    // Ejemplo con Twilio:
    // const client = twilio(accountSid, authToken);
    // await client.messages.create({
    //   body: notification.message,
    //   to: notification.recipient,
    //   from: twilioPhoneNumber,
    // });

    // Simulación
    const success = Math.random() > 0.05; // 95% de éxito

    if (success) {
      this.logger.log(`SMS sent to ${notification.recipient}`);
    } else {
      this.logger.error(
        `Failed to send SMS to ${notification.recipient}`,
      );
    }

    return success;
  }

  private async sendPushNotification(
    notification: Notification,
  ): Promise<boolean> {
    // Implementar integración con Firebase Cloud Messaging, OneSignal, etc.
    this.logger.log(
      `Sending push notification to ${notification.recipient}`,
    );

    // TODO: Implementar integración real
    // Simulación
    const success = Math.random() > 0.08; // 92% de éxito

    if (success) {
      this.logger.log(
        `Push notification sent to ${notification.recipient}`,
      );
    } else {
      this.logger.error(
        `Failed to send push notification to ${notification.recipient}`,
      );
    }

    return success;
  }

  private async sendWebhook(notification: Notification): Promise<boolean> {
    // Implementar llamada HTTP a webhook
    this.logger.log(
      `Sending webhook to ${notification.recipient}`,
    );

    try {
      // TODO: Implementar con axios o fetch
      // const response = await axios.post(notification.recipient, {
      //   vehicleId: notification.vehicleId,
      //   ruleId: notification.ruleId,
      //   message: notification.message,
      //   metadata: notification.metadata,
      // });

      // Simulación
      const success = Math.random() > 0.15; // 85% de éxito

      if (success) {
        this.logger.log(`Webhook sent to ${notification.recipient}`);
      } else {
        this.logger.error(
          `Failed to send webhook to ${notification.recipient}`,
        );
      }

      return success;
    } catch (error) {
      this.logger.error(`Webhook error:`, error);
      return false;
    }
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Método para envío masivo (útil para notificaciones de emergencia)
  async sendBulkNotifications(
    configs: NotificationConfig[],
  ): Promise<Notification[]> {
    this.logger.log(`Sending ${configs.length} bulk notifications`);

    const results: Notification[] = [];

    for (const config of configs) {
      try {
        const notification = await this.execute(config);
        results.push(notification);
      } catch (error) {
        this.logger.error(
          `Failed to send notification for vehicle ${config.vehicleId}`,
        );
      }

      // Pequeño delay para no saturar
      await this.delay(50);
    }

    return results;
  }
}

