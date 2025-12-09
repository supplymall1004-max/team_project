/**
 * @file lib/kcdc/periodic-service-scheduler.ts
 * @description 주기적 건강 관리 서비스 일정 계산 로직
 * 
 * 주기 유형에 따라 다음 서비스 일정을 자동으로 계산합니다.
 */

import type { CycleType, PeriodicHealthService } from "@/types/kcdc";

/**
 * 다음 서비스 일정 계산
 * 
 * @param lastServiceDate 마지막 서비스 받은 날짜 (YYYY-MM-DD 형식)
 * @param cycleType 주기 유형
 * @param cycleDays 주기 일수 (custom인 경우 필수)
 * @returns 다음 서비스 예정일 (YYYY-MM-DD 형식)
 */
export function calculateNextServiceDate(
  lastServiceDate: string | null | undefined,
  cycleType: CycleType,
  cycleDays?: number | null
): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 마지막 서비스일이 없으면 오늘 기준으로 계산
  const baseDate = lastServiceDate
    ? new Date(lastServiceDate)
    : today;

  baseDate.setHours(0, 0, 0, 0);

  const nextDate = new Date(baseDate);

  switch (cycleType) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case "quarterly":
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case "custom":
      if (!cycleDays || cycleDays <= 0) {
        throw new Error("custom 주기인 경우 cycleDays는 필수입니다.");
      }
      nextDate.setDate(nextDate.getDate() + cycleDays);
      break;
    default:
      throw new Error(`알 수 없는 주기 유형: ${cycleType}`);
  }

  // 다음 일정이 오늘보다 이전이면 오늘 기준으로 재계산
  if (nextDate < today) {
    return calculateNextServiceDate(
      today.toISOString().split("T")[0],
      cycleType,
      cycleDays
    );
  }

  return nextDate.toISOString().split("T")[0];
}

/**
 * 향후 1년치 서비스 일정 생성
 * 
 * @param service 주기적 서비스 정보
 * @returns 서비스 일정 배열 (날짜, 서비스명 포함)
 */
export function generateServiceSchedule(
  service: PeriodicHealthService
): Array<{ date: string; serviceName: string; daysUntil: number }> {
  const schedule: Array<{ date: string; serviceName: string; daysUntil: number }> = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentDate = new Date(service.next_service_date);
  currentDate.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setFullYear(endDate.getFullYear() + 1);

  while (currentDate <= endDate) {
    const daysUntil = Math.ceil(
      (currentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    schedule.push({
      date: currentDate.toISOString().split("T")[0],
      serviceName: service.service_name,
      daysUntil,
    });

    // 다음 일정 계산
    currentDate = new Date(
      calculateNextServiceDate(
        currentDate.toISOString().split("T")[0],
        service.cycle_type,
        service.cycle_days ?? undefined
      )
    );
    currentDate.setHours(0, 0, 0, 0);
  }

  return schedule;
}

/**
 * 알림 날짜 계산
 * 
 * @param serviceDueDate 서비스 예정일
 * @param reminderDaysBefore 알림 일수 전
 * @returns 알림 날짜 (YYYY-MM-DD 형식)
 */
export function calculateReminderDate(
  serviceDueDate: string,
  reminderDaysBefore: number
): string {
  const dueDate = new Date(serviceDueDate);
  dueDate.setHours(0, 0, 0, 0);
  dueDate.setDate(dueDate.getDate() - reminderDaysBefore);

  return dueDate.toISOString().split("T")[0];
}

/**
 * 서비스가 곧 다가오는지 확인
 * 
 * @param nextServiceDate 다음 서비스 예정일
 * @param reminderDaysBefore 알림 일수 전
 * @returns 다가오는 서비스 여부
 */
export function isServiceUpcoming(
  nextServiceDate: string,
  reminderDaysBefore: number
): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reminderDate = new Date(
    calculateReminderDate(nextServiceDate, reminderDaysBefore)
  );
  reminderDate.setHours(0, 0, 0, 0);

  return today >= reminderDate;
}

/**
 * 서비스가 연체되었는지 확인
 * 
 * @param nextServiceDate 다음 서비스 예정일
 * @returns 연체 여부
 */
export function isServiceOverdue(nextServiceDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(nextServiceDate);
  dueDate.setHours(0, 0, 0, 0);

  return today > dueDate;
}

