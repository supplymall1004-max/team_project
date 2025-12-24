/**
 * @file types/lifecycle-notification.ts
 * @description 생애주기별 알림 관련 타입 정의
 */

export interface LifecycleNotificationReminderSettings {
  id: string;
  user_id: string;
  family_member_id?: string | null;
  reminder_enabled: boolean;
  reminder_days_before: number[];
  notification_channels: ('in_app' | 'push' | 'email' | 'sms')[];
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // HH:MM:SS
  quiet_hours_end: string; // HH:MM:SS
  per_notification_settings: Record<string, {
    reminder_days_before?: number[];
    channels?: ('in_app' | 'push' | 'email' | 'sms')[];
  }>;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface LifecycleNotificationReminderSettingsInput {
  reminder_enabled?: boolean;
  reminder_days_before?: number[];
  notification_channels?: ('in_app' | 'push' | 'email' | 'sms')[];
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  per_notification_settings?: Record<string, {
    reminder_days_before?: number[];
    channels?: ('in_app' | 'push' | 'email' | 'sms')[];
  }>;
  timezone?: string;
}

