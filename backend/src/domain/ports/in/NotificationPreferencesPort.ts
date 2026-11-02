/**
 * Input Port: NotificationPreferencesPort
 * Source: SDD/Domain/input-ports.md (Section 4.1)
 */

import type { User } from '../../model/user.js';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface UserNotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export interface Notification {
  notificationId: string;
  message: string;
  date: Date;
}

export interface NotificationPreferencesPort {
  consultMyNotificationPreferences(user: User): Promise<UserNotificationPreferences>;
  updateNotificationPreferences(user: User, preferences: UserNotificationPreferences): Promise<UserNotificationPreferences>;
  subscribeToNotificationChannel(user: User, channel: NotificationChannel, contact: string): Promise<void>;
  unsubscribeFromNotificationChannel(user: User, channel: NotificationChannel): Promise<void>;
  consultMyNotificationHistory(user: User, period: DateRange): Promise<Notification[]>;
}
