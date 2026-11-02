/**
 * Service Port: NotificationPort
 * Source: SDD/Domain/output-ports.md (Section 4.19)
 */

import type { User } from '../../model/user.js';

export interface Notification {
  subject: string;
  message: string;
}

export interface NotificationResult {
  sent: boolean;
}

export interface NotificationPort {
  send(notification: Notification): Promise<NotificationResult>;
  sendToUser(user: User, notification: Notification): Promise<NotificationResult>;
}
