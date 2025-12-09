/**
 * @file lib/kcdc/periodic-service-manager.ts
 * @description 주기적 건강 관리 서비스 관리 로직
 * 
 * 예방접종, 건강검진, 구충제 복용 등 주기적 서비스를 통합 관리합니다.
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import {
  calculateNextServiceDate,
  calculateReminderDate,
} from "./periodic-service-scheduler";
import type {
  PeriodicHealthService,
  PeriodicServiceType,
  CycleType,
} from "@/types/kcdc";

/**
 * 주기적 서비스 생성 파라미터
 */
export interface CreatePeriodicServiceParams {
  userId: string;
  familyMemberId?: string | null;
  serviceType: PeriodicServiceType;
  serviceName: string;
  cycleType: CycleType;
  cycleDays?: number | null;
  lastServiceDate?: string | null;
  reminderDaysBefore?: number;
  reminderEnabled?: boolean;
  notes?: string | null;
}

/**
 * 주기적 서비스 수정 파라미터
 */
export interface UpdatePeriodicServiceParams {
  serviceName?: string;
  cycleType?: CycleType;
  cycleDays?: number | null;
  lastServiceDate?: string | null;
  nextServiceDate?: string | null;
  reminderDaysBefore?: number;
  reminderEnabled?: boolean;
  notes?: string | null;
  isActive?: boolean;
}

/**
 * 주기적 서비스 목록 조회
 * 
 * @param userId 사용자 ID
 * @param familyMemberId 가족 구성원 ID (선택사항)
 * @param isActive 활성 상태 필터 (선택사항)
 * @returns 주기적 서비스 목록
 */
export async function getPeriodicServices(
  userId: string,
  familyMemberId?: string | null,
  isActive?: boolean
): Promise<PeriodicHealthService[]> {
  console.group("[PeriodicServiceManager] 서비스 목록 조회");
  console.log("userId:", userId);
  console.log("familyMemberId:", familyMemberId);
  console.log("isActive:", isActive);

  const supabase = getServiceRoleClient();

  let query = supabase
    .from("user_periodic_health_services")
    .select("*")
    .eq("user_id", userId)
    .order("next_service_date", { ascending: true });

  if (familyMemberId) {
    query = query.eq("family_member_id", familyMemberId);
  } else {
    query = query.is("family_member_id", null);
  }

  if (isActive !== undefined) {
    query = query.eq("is_active", isActive);
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ 조회 실패:", error);
    console.groupEnd();
    throw new Error(`주기적 서비스 조회 실패: ${error.message}`);
  }

  console.log("✅ 조회 성공:", data?.length || 0, "개");
  console.groupEnd();

  return (data || []) as PeriodicHealthService[];
}

/**
 * 주기적 서비스 생성
 * 
 * @param params 생성 파라미터
 * @returns 생성된 서비스
 */
export async function createPeriodicService(
  params: CreatePeriodicServiceParams
): Promise<PeriodicHealthService> {
  console.group("[PeriodicServiceManager] 서비스 생성");
  console.log("params:", params);

  const supabase = getServiceRoleClient();

  // 다음 서비스 일정 계산
  const nextServiceDate = params.lastServiceDate
    ? calculateNextServiceDate(
        params.lastServiceDate,
        params.cycleType,
        params.cycleDays ?? undefined
      )
    : calculateNextServiceDate(
        null,
        params.cycleType,
        params.cycleDays ?? undefined
      );

  const serviceData = {
    user_id: params.userId,
    family_member_id: params.familyMemberId || null,
    service_type: params.serviceType,
    service_name: params.serviceName,
    cycle_type: params.cycleType,
    cycle_days: params.cycleDays || null,
    last_service_date: params.lastServiceDate || null,
    next_service_date: nextServiceDate,
    reminder_days_before: params.reminderDaysBefore ?? 7,
    reminder_enabled: params.reminderEnabled ?? true,
    notes: params.notes || null,
    is_active: true,
  };

  const { data, error } = await supabase
    .from("user_periodic_health_services")
    .insert(serviceData)
    .select()
    .single();

  if (error) {
    console.error("❌ 생성 실패:", error);
    console.groupEnd();
    throw new Error(`주기적 서비스 생성 실패: ${error.message}`);
  }

  console.log("✅ 생성 성공:", data.id);
  console.groupEnd();

  return data as PeriodicHealthService;
}

/**
 * 주기적 서비스 수정
 * 
 * @param serviceId 서비스 ID
 * @param userId 사용자 ID
 * @param params 수정 파라미터
 * @returns 수정된 서비스
 */
export async function updatePeriodicService(
  serviceId: string,
  userId: string,
  params: UpdatePeriodicServiceParams
): Promise<PeriodicHealthService> {
  console.group("[PeriodicServiceManager] 서비스 수정");
  console.log("serviceId:", serviceId);
  console.log("params:", params);

  const supabase = getServiceRoleClient();

  // 기존 서비스 조회
  const { data: existingService, error: fetchError } = await supabase
    .from("user_periodic_health_services")
    .select("*")
    .eq("id", serviceId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existingService) {
    console.error("❌ 서비스 조회 실패:", fetchError);
    console.groupEnd();
    throw new Error("서비스를 찾을 수 없습니다.");
  }

  // 다음 서비스 일정 재계산 (필요한 경우)
  let nextServiceDate = params.nextServiceDate;
  if (
    params.lastServiceDate !== undefined ||
    params.cycleType !== undefined ||
    params.cycleDays !== undefined
  ) {
    const lastDate =
      params.lastServiceDate !== undefined
        ? params.lastServiceDate
        : existingService.last_service_date;
    const cycleType =
      params.cycleType !== undefined
        ? params.cycleType
        : existingService.cycle_type;
    const cycleDays =
      params.cycleDays !== undefined
        ? params.cycleDays
        : existingService.cycle_days;

    nextServiceDate = calculateNextServiceDate(
      lastDate,
      cycleType,
      cycleDays ?? undefined
    );
  }

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (params.serviceName !== undefined) updateData.service_name = params.serviceName;
  if (params.cycleType !== undefined) updateData.cycle_type = params.cycleType;
  if (params.cycleDays !== undefined) updateData.cycle_days = params.cycleDays;
  if (params.lastServiceDate !== undefined)
    updateData.last_service_date = params.lastServiceDate;
  if (nextServiceDate !== undefined)
    updateData.next_service_date = nextServiceDate;
  if (params.reminderDaysBefore !== undefined)
    updateData.reminder_days_before = params.reminderDaysBefore;
  if (params.reminderEnabled !== undefined)
    updateData.reminder_enabled = params.reminderEnabled;
  if (params.notes !== undefined) updateData.notes = params.notes;
  if (params.isActive !== undefined) updateData.is_active = params.isActive;

  const { data, error } = await supabase
    .from("user_periodic_health_services")
    .update(updateData)
    .eq("id", serviceId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("❌ 수정 실패:", error);
    console.groupEnd();
    throw new Error(`주기적 서비스 수정 실패: ${error.message}`);
  }

  console.log("✅ 수정 성공:", data.id);
  console.groupEnd();

  return data as PeriodicHealthService;
}

/**
 * 주기적 서비스 삭제
 * 
 * @param serviceId 서비스 ID
 * @param userId 사용자 ID
 */
export async function deletePeriodicService(
  serviceId: string,
  userId: string
): Promise<void> {
  console.group("[PeriodicServiceManager] 서비스 삭제");
  console.log("serviceId:", serviceId);

  const supabase = getServiceRoleClient();

  const { error } = await supabase
    .from("user_periodic_health_services")
    .delete()
    .eq("id", serviceId)
    .eq("user_id", userId);

  if (error) {
    console.error("❌ 삭제 실패:", error);
    console.groupEnd();
    throw new Error(`주기적 서비스 삭제 실패: ${error.message}`);
  }

  console.log("✅ 삭제 성공");
  console.groupEnd();
}

/**
 * 서비스 완료 처리
 * 
 * @param serviceId 서비스 ID
 * @param userId 사용자 ID
 * @param completedDate 완료일 (선택사항, 기본값: 오늘)
 * @returns 업데이트된 서비스
 */
export async function completePeriodicService(
  serviceId: string,
  userId: string,
  completedDate?: string
): Promise<PeriodicHealthService> {
  console.group("[PeriodicServiceManager] 서비스 완료 처리");
  console.log("serviceId:", serviceId);
  console.log("completedDate:", completedDate);

  const supabase = getServiceRoleClient();

  // 기존 서비스 조회
  const { data: existingService, error: fetchError } = await supabase
    .from("user_periodic_health_services")
    .select("*")
    .eq("id", serviceId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existingService) {
    console.error("❌ 서비스 조회 실패:", fetchError);
    console.groupEnd();
    throw new Error("서비스를 찾을 수 없습니다.");
  }

  const completionDate =
    completedDate || new Date().toISOString().split("T")[0];

  // 다음 서비스 일정 계산
  const nextServiceDate = calculateNextServiceDate(
    completionDate,
    existingService.cycle_type,
    existingService.cycle_days ?? undefined
  );

  const { data, error } = await supabase
    .from("user_periodic_health_services")
    .update({
      last_service_date: completionDate,
      next_service_date: nextServiceDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", serviceId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("❌ 완료 처리 실패:", error);
    console.groupEnd();
    throw new Error(`서비스 완료 처리 실패: ${error.message}`);
  }

  console.log("✅ 완료 처리 성공:", data.id);
  console.log("다음 일정:", data.next_service_date);
  console.groupEnd();

  return data as PeriodicHealthService;
}

/**
 * 다가오는 서비스 목록 조회 (7일 이내)
 * 
 * @param userId 사용자 ID
 * @param days 일수 (기본값: 7)
 * @returns 다가오는 서비스 목록
 */
export async function getUpcomingServices(
  userId: string,
  days: number = 7
): Promise<PeriodicHealthService[]> {
  console.group("[PeriodicServiceManager] 다가오는 서비스 조회");
  console.log("userId:", userId);
  console.log("days:", days);

  const supabase = getServiceRoleClient();

  const today = new Date().toISOString().split("T")[0];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  const endDateStr = endDate.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("user_periodic_health_services")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .eq("reminder_enabled", true)
    .gte("next_service_date", today)
    .lte("next_service_date", endDateStr)
    .order("next_service_date", { ascending: true });

  if (error) {
    console.error("❌ 조회 실패:", error);
    console.groupEnd();
    throw new Error(`다가오는 서비스 조회 실패: ${error.message}`);
  }

  console.log("✅ 조회 성공:", data?.length || 0, "개");
  console.groupEnd();

  return (data || []) as PeriodicHealthService[];
}

