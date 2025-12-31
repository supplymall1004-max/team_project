/**
 * @file premium-drawer.ts
 * @description 프리미엄 건강 드로어 타입 정의
 */

import type { Notification } from "./notifications";

/**
 * 건강 상태 요약
 */
export interface HealthStatusSummary {
  healthScore: number;
  activeMedications: number;
  upcomingVaccinations: number;
  lastCheckupDate: string | null;
  bmi: number | null;
}

/**
 * 가족 건강 요약
 */
export interface FamilyHealthSummary {
  familyAverageScore: number;
  familyMembersCount: number;
  familyActiveMedications: number;
  familyUpcomingVaccinations: number;
}

/**
 * 일정 아이템
 */
export interface ScheduleItem {
  id: string;
  type: "vaccination" | "checkup" | "hospital" | "medication";
  title: string;
  date: string;
  time?: string;
  familyMemberName?: string;
  familyMemberId?: string;
  relatedId?: string;
}

/**
 * 가족 공지사항
 */
export interface FamilyAnnouncement {
  id: string;
  title: string;
  message: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  isRead: boolean;
  priority: "low" | "normal" | "high";
}

/**
 * 시스템 공지사항
 */
export interface SystemAnnouncement {
  id: string;
  title: string;
  body: string;
  priority: number;
  activeFrom: string;
  activeUntil: string | null;
}

/**
 * 프리미엄 드로어 데이터
 */
export interface PremiumDrawerData {
  healthStatus: HealthStatusSummary;
  familyHealthSummary: FamilyHealthSummary;
  urgentNotifications: Notification[];
  familyNotifications: Notification[];
  todaySchedule: ScheduleItem[];
  upcomingSchedule: ScheduleItem[];
  familyAnnouncements: FamilyAnnouncement[];
  systemAnnouncements: SystemAnnouncement[];
}

