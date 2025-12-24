/**
 * @file lib/health/lifecycle-notification-generator.ts
 * @description 생애주기별 네온 알림 생성 서비스
 * 
 * 가족 구성원의 생애주기를 계산하고, 마스터 데이터를 기반으로 알림을 생성합니다.
 * - 예방접종 알림
 * - 건강검진 알림
 * - 생애주기 이벤트 알림
 */

import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { calculateHumanLifecycle, HumanLifecycleStage } from './lifecycle-calculator';
import { LIFECYCLE_EVENT_MASTER, getEventsByLifecycleStage, type LifecycleEventMaster } from './lifecycle-master-data';
/**
 * 생년월일로 나이(개월) 계산
 */
function calculateAgeMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  
  const years = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth();
  const days = today.getDate() - birth.getDate();
  
  let totalMonths = years * 12 + months;
  
  // 생일이 아직 지나지 않았으면 1개월 빼기
  if (days < 0) {
    totalMonths--;
  }
  
  return totalMonths;
}

export interface LifecycleNotification {
  id?: string;
  user_id: string;
  family_member_id?: string;
  type: 'lifecycle_event';
  category: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'failed' | 'dismissed' | 'confirmed' | 'missed' | 'cancelled';
  scheduled_at?: Date;
  context_data?: Record<string, any>;
}

/**
 * 우선순위 계산
 * @param daysUntil 알림 예정일까지 남은 일수
 * @returns 우선순위
 */
function calculatePriority(daysUntil: number | null): 'low' | 'normal' | 'high' | 'urgent' {
  if (daysUntil === null) return 'low';
  if (daysUntil < 0) return 'urgent'; // 지난 알림
  if (daysUntil === 0) return 'high'; // 당일
  if (daysUntil <= 7) return 'high'; // 이번 주
  if (daysUntil <= 30) return 'normal'; // 이번 달
  return 'low'; // 그 이후
}

/**
 * 가족 구성원의 생애주기별 알림 생성
 * @param userId 사용자 ID
 * @param familyMemberId 가족 구성원 ID (없으면 본인)
 * @returns 생성된 알림 목록
 */
export async function generateLifecycleNotifications(
  userId: string,
  familyMemberId?: string
): Promise<LifecycleNotification[]> {
  console.group('[LifecycleNotificationGenerator] 생애주기별 알림 생성');
  console.log('사용자 ID:', userId, '가족 구성원 ID:', familyMemberId);

  try {
    const supabase = getServiceRoleClient();
    const notifications: LifecycleNotification[] = [];

    // 가족 구성원 정보 조회
    let member: {
      id: string;
      name: string;
      birth_date: string | null;
      gender: string | null;
    } | null = null;

    if (familyMemberId) {
      const { data, error } = await supabase
        .from('family_members')
        .select('id, name, birth_date, gender')
        .eq('id', familyMemberId)
        .eq('user_id', userId)
        .eq('member_type', 'human')
        .single();

      if (error || !data) {
        console.error('❌ 가족 구성원 조회 실패:', error);
        console.groupEnd();
        return [];
      }
      member = data;
    } else {
      // 본인 정보 조회
      const { data: userData } = await supabase
        .from('users')
        .select('id, name')
        .eq('id', userId)
        .single();

      if (!userData) {
        console.error('❌ 사용자 조회 실패');
        console.groupEnd();
        return [];
      }

      // 본인의 생년월일은 health_profile에서 가져와야 할 수도 있음
      // 일단 기본 구조만 작성
      member = {
        id: userId,
        name: userData.name || '본인',
        birth_date: null,
        gender: null,
      };
    }

    if (!member.birth_date) {
      console.warn('⚠️ 생년월일 정보가 없어 알림을 생성할 수 없습니다.');
      console.groupEnd();
      return [];
    }

    // 생애주기 계산
    const lifecycleInfo = calculateHumanLifecycle(member.birth_date);
    const stage = lifecycleInfo.stage;

    // 해당 생애주기 단계의 이벤트 조회
    const applicableEvents = getEventsByLifecycleStage(
      stage,
      member.gender as 'male' | 'female' | undefined
    );

    // 기존 알림 조회 (중복 방지)
    const { data: existingNotifications } = await supabase
      .from('notifications')
      .select('context_data')
      .eq('user_id', userId)
      .eq('family_member_id', familyMemberId || null)
      .eq('type', 'lifecycle_event')
      .in('status', ['pending', 'sent']);

    const existingEventCodes = new Set(
      existingNotifications?.map((n) => n.context_data?.event_code).filter(Boolean) || []
    );

    // 각 이벤트에 대해 알림 생성
    for (const event of applicableEvents) {
      // 중복 체크
      if (existingEventCodes.has(event.event_code)) {
        continue;
      }

      // 나이 조건 확인
      const ageMonths = calculateAgeMonths(member.birth_date);
      const ageYears = lifecycleInfo.age.years;

      if (event.target_age_months !== undefined) {
        if (ageMonths < event.target_age_months) {
          continue; // 아직 시기가 아님
        }
        // 이미 지난 이벤트는 제외 (예방접종 등은 한 번만)
        if (ageMonths > event.target_age_months + 3) {
          continue;
        }
      }

      if (event.target_age_years !== undefined) {
        if (ageYears < event.target_age_years) {
          continue; // 아직 시기가 아님
        }
      }

      // 알림 예정일 계산
      let scheduledDate: Date | null = null;
      if (event.target_age_months !== undefined) {
        const birth = new Date(member.birth_date);
        scheduledDate = new Date(birth);
        scheduledDate.setMonth(scheduledDate.getMonth() + event.target_age_months);
      } else if (event.target_age_years !== undefined) {
        const birth = new Date(member.birth_date);
        scheduledDate = new Date(birth);
        scheduledDate.setFullYear(scheduledDate.getFullYear() + event.target_age_years);
      }

      // 우선순위 계산
      let daysUntil: number | null = null;
      if (scheduledDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        scheduledDate.setHours(0, 0, 0, 0);
        daysUntil = Math.ceil((scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }

      const priority = calculatePriority(daysUntil);

      // 알림 생성
      const notification: LifecycleNotification = {
        user_id: userId,
        family_member_id: familyMemberId,
        type: 'lifecycle_event',
        category: event.category,
        title: `${member.name}님의 ${event.event_name}`,
        message: event.description,
        priority,
        status: 'pending',
        scheduled_at: scheduledDate || undefined,
        context_data: {
          event_code: event.event_code,
          event_name: event.event_name,
          event_type: event.event_type,
          member_name: member.name,
          days_until: daysUntil,
          has_professional_info: event.has_professional_info || false,
          requires_user_choice: event.requires_user_choice || false,
        },
      };

      notifications.push(notification);
    }

    console.log(`✅ ${notifications.length}개의 알림 생성 완료`);
    console.groupEnd();

    return notifications;
  } catch (error) {
    console.error('❌ 생애주기별 알림 생성 실패:', error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 알림을 데이터베이스에 저장
 */
export async function saveLifecycleNotifications(
  notifications: LifecycleNotification[]
): Promise<{ saved: number; errors: number }> {
  if (notifications.length === 0) {
    return { saved: 0, errors: 0 };
  }

  try {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('notifications')
      .insert(
        notifications.map((n) => ({
          user_id: n.user_id,
          family_member_id: n.family_member_id || null,
          type: n.type,
          category: n.category,
          title: n.title,
          message: n.message,
          priority: n.priority,
          status: n.status,
          scheduled_at: n.scheduled_at?.toISOString() || null,
          context_data: n.context_data || {},
          channel: 'in_app',
        }))
      )
      .select();

    if (error) {
      console.error('❌ 알림 저장 실패:', error);
      return { saved: 0, errors: notifications.length };
    }

    return { saved: data?.length || 0, errors: 0 };
  } catch (error) {
    console.error('❌ 알림 저장 오류:', error);
    return { saved: 0, errors: notifications.length };
  }
}

