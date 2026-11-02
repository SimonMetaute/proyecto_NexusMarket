/**
 * Adapter: MockNotificationPort.
 *
 * Development-grade stub of `NotificationPort`.
 */
import type { NotificationPort } from '../../domain/ports/out/NotificationPort.js';
import type { User } from '../../domain/model/user.js';

export class MockNotificationPort implements NotificationPort {
  async send(notification: { subject: string; message: string }): Promise<{ sent: boolean }> {
    return { sent: true };
  }

  async sendToUser(user: User, notification: { subject: string; message: string }): Promise<{ sent: boolean }> {
    return { sent: true };
  }
}
