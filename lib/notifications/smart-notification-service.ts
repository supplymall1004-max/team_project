/**
 * @file lib/notifications/smart-notification-service.ts
 * @description 스마트 알림 서비스
 * 
 * 꼭 해야 할 일을 놓쳤을 때 자동으로 알림을 보내는 스마트 알림 기능입니다.
 * - 예방주사를 놓쳤을 때
 * - 약물 복용을 놓쳤을 때
 * - 건강검진을 놓쳤을 때
 * - 반려동물 백신을 놓쳤을 때
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * 스마트 알림 민감도 설정
 */
export type SmartNotificationSensitivity = 'low' | 'medium' | 'high';

/**
 * 놓친 일정 정보
 */
export interface MissedItem {
  type: 'vaccination' | 'medication' | 'checkup' | 'pet_vaccination' | 'pet_lifecycle';
  id: string;
  userId: string;
  familyMemberId?: string;
  title: string;
  description: string;
  dueDate: Date;
  daysOverdue: number;
  priority: 'high' | 'medium' | 'low';
}

/**
 * 스마트 알림 발송 결과
 */
export interface SmartNotificationResult {
  processed: number;
  notificationsSent: number;
  errors: number;
  missedItems: MissedItem[];
}

/**
 * 사용자의 알림 설정 조회
 * @param userId users 테이블의 id (UUID)
 */
async function getUserNotificationSettings(userId: string): Promise<{
  smartNotifications: boolean;
  smartNotificationSensitivity: SmartNotificationSensitivity;
} | null> {
  const supabase = getServiceRoleClient();
  
  const { data: user, error } = await supabase
    .from("users")
    .select("notification_settings")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return null;
  }

  const settings = user.notification_settings as any;
  return {
    smartNotifications: settings?.smartNotifications ?? true,
    smartNotificationSensitivity: settings?.smartNotificationSensitivity ?? 'medium',
  };
}

/**
 * 놓친 예방주사 감지
 */
async function detectMissedVaccinations(
  userId: string,
  sensitivity: SmartNotificationSensitivity
): Promise<MissedItem[]> {
  const supabase = getServiceRoleClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 민감도에 따른 기간 설정
  const daysThreshold = {
    low: 7,    // 7일 이상 지난 것만
    medium: 14, // 14일 이상 지난 것만
    high: 3,   // 3일 이상 지난 것만
  }[sensitivity];

  const thresholdDate = new Date(today);
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

  // 놓친 예방주사 조회
  const { data: schedules, error } = await supabase
    .from("user_vaccination_schedules")
    .select(`
      id,
      user_id,
      family_member_id,
      vaccine_name,
      recommended_date,
      priority,
      status,
      family_members(name)
    `)
    .eq("user_id", userId)
    .eq("status", "pending")
    .lte("recommended_date", today.toISOString().split('T')[0])
    .gte("recommended_date", thresholdDate.toISOString().split('T')[0]);

  if (error || !schedules) {
    return [];
  }

  return schedules.map((schedule) => {
    const dueDate = new Date(schedule.recommended_date);
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // family_members는 배열일 수 있으므로 첫 번째 요소를 가져옴
    const familyMember = Array.isArray(schedule.family_members) 
      ? schedule.family_members[0] 
      : schedule.family_members;
    const memberName = familyMember?.name || '가족 구성원';
    
    return {
      type: 'vaccination' as const,
      id: schedule.id,
      userId: schedule.user_id,
      familyMemberId: schedule.family_member_id,
      title: `${schedule.vaccine_name} 접종`,
      description: `${memberName}님의 예방주사가 ${daysOverdue}일 지났습니다.`,
      dueDate,
      daysOverdue,
      priority: schedule.priority === 'required' ? 'high' : 'medium',
    };
  });
}

/**
 * 놓친 약물 복용 감지
 */
async function detectMissedMedications(
  userId: string,
  sensitivity: SmartNotificationSensitivity
): Promise<MissedItem[]> {
  const supabase = getServiceRoleClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 오늘 복용하지 않은 약물 조회
  const { data: medications, error } = await supabase
    .from("user_medications")
    .select(`
      id,
      user_id,
      family_member_id,
      medication_name,
      dosage,
      frequency,
      family_members(name)
    `)
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error || !medications) {
    return [];
  }

  const missedItems: MissedItem[] = [];

  for (const medication of medications) {
    // 오늘 복용 기록 확인
    const { data: todayLogs } = await supabase
      .from("medication_reminder_logs")
      .select("id")
      .eq("medication_id", medication.id)
      .eq("reminder_date", today.toISOString().split('T')[0])
      .eq("status", "confirmed")
      .limit(1);

    // 복용하지 않은 경우
    if (!todayLogs || todayLogs.length === 0) {
      // 복용 시간이 지났는지 확인 (저녁 9시 이후)
      const now = new Date();
      if (now.getHours() >= 21) {
        // family_members는 배열일 수 있으므로 첫 번째 요소를 가져옴
        const familyMember = Array.isArray(medication.family_members) 
          ? medication.family_members[0] 
          : medication.family_members;
        const memberName = familyMember?.name || '가족 구성원';
        
        missedItems.push({
          type: 'medication' as const,
          id: medication.id,
          userId: medication.user_id,
          familyMemberId: medication.family_member_id,
          title: `${medication.medication_name} 복용`,
          description: `${memberName}님의 ${medication.medication_name} 복용을 잊으셨나요?`,
          dueDate: today,
          daysOverdue: 0,
          priority: 'high',
        });
      }
    }
  }

  return missedItems;
}

/**
 * 놓친 건강검진 감지
 */
async function detectMissedCheckups(
  userId: string,
  sensitivity: SmartNotificationSensitivity
): Promise<MissedItem[]> {
  const supabase = getServiceRoleClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 민감도에 따른 기간 설정
  const daysThreshold = {
    low: 30,   // 30일 이상 지난 것만
    medium: 14, // 14일 이상 지난 것만
    high: 7,  // 7일 이상 지난 것만
  }[sensitivity];

  const thresholdDate = new Date(today);
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

  // 놓친 건강검진 조회
  const { data: checkups, error } = await supabase
    .from("user_health_checkup_recommendations")
    .select(`
      id,
      user_id,
      family_member_id,
      checkup_name,
      checkup_type,
      recommended_date,
      priority,
      status,
      family_members(name)
    `)
    .eq("user_id", userId)
    .eq("status", "pending")
    .lte("recommended_date", today.toISOString().split('T')[0])
    .gte("recommended_date", thresholdDate.toISOString().split('T')[0]);

  if (error || !checkups) {
    return [];
  }

  return checkups.map((checkup) => {
    const dueDate = new Date(checkup.recommended_date);
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // family_members는 배열일 수 있으므로 첫 번째 요소를 가져옴
    const familyMember = Array.isArray(checkup.family_members) 
      ? checkup.family_members[0] 
      : checkup.family_members;
    const memberName = familyMember?.name || '가족 구성원';
    
    return {
      type: 'checkup' as const,
      id: checkup.id,
      userId: checkup.user_id,
      familyMemberId: checkup.family_member_id,
      title: `${checkup.checkup_name} 검진`,
      description: `${memberName}님의 건강검진이 ${daysOverdue}일 지났습니다.`,
      dueDate,
      daysOverdue,
      priority: checkup.priority === 'high' ? 'high' : 'medium',
    };
  });
}

/**
 * 놓친 반려동물 백신 감지
 */
async function detectMissedPetVaccinations(
  userId: string,
  sensitivity: SmartNotificationSensitivity
): Promise<MissedItem[]> {
  const supabase = getServiceRoleClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 민감도에 따른 기간 설정
  const daysThreshold = {
    low: 14,   // 14일 이상 지난 것만
    medium: 7, // 7일 이상 지난 것만
    high: 3,  // 3일 이상 지난 것만
  }[sensitivity];

  const thresholdDate = new Date(today);
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

  // 반려동물 조회
  const { data: pets, error: petsError } = await supabase
    .from("family_members")
    .select("id, name, user_id")
    .eq("user_id", userId)
    .eq("member_type", "pet");

  if (petsError || !pets) {
    return [];
  }

  const missedItems: MissedItem[] = [];

  for (const pet of pets) {
    // 반려동물 백신 기록 조회
    const { data: vaccinations, error } = await supabase
      .from("user_vaccination_records")
      .select("id, vaccine_name, scheduled_date, completed_date")
      .eq("family_member_id", pet.id)
      .is("completed_date", null)
      .not("scheduled_date", "is", null)
      .lte("scheduled_date", today.toISOString().split('T')[0])
      .gte("scheduled_date", thresholdDate.toISOString().split('T')[0]);

    if (error || !vaccinations) continue;

    for (const vaccination of vaccinations) {
      const dueDate = new Date(vaccination.scheduled_date!);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      missedItems.push({
        type: 'pet_vaccination' as const,
        id: vaccination.id,
        userId: pet.user_id,
        familyMemberId: pet.id,
        title: `${pet.name}의 ${vaccination.vaccine_name} 접종`,
        description: `${pet.name}의 백신 접종이 ${daysOverdue}일 지났습니다.`,
        dueDate,
        daysOverdue,
        priority: 'high',
      });
    }
  }

  return missedItems;
}

/**
 * 스마트 알림 발송
 */
async function sendSmartNotification(item: MissedItem): Promise<boolean> {
  const supabase = getServiceRoleClient();

  try {
    // 알림 메시지 생성
    let title: string;
    let message: string;

    switch (item.type) {
      case 'vaccination':
        title = `⚠️ 예방주사 놓침: ${item.title}`;
        message = item.description;
        break;
      case 'medication':
        title = `⚠️ 약물 복용 누락: ${item.title}`;
        message = item.description;
        break;
      case 'checkup':
        title = `⚠️ 건강검진 놓침: ${item.title}`;
        message = item.description;
        break;
      case 'pet_vaccination':
        title = `⚠️ 반려동물 백신 놓침: ${item.title}`;
        message = item.description;
        break;
      default:
        title = `⚠️ 놓친 일정: ${item.title}`;
        message = item.description;
    }

    // 알림 기록
    const { error } = await supabase
      .from("notifications")
      .insert({
        user_id: item.userId,
        family_member_id: item.familyMemberId,
        type: item.type === 'pet_vaccination' || item.type === 'pet_lifecycle' ? 'pet_healthcare' : 'health',
        category: 'overdue',
        channel: 'in_app',
        title,
        message,
        status: 'sent',
        priority: item.priority === 'high' ? 'urgent' : 'high',
        sent_at: new Date().toISOString(),
        related_id: item.id,
        related_type: item.type === 'vaccination' ? 'vaccination_schedule' : 
                     item.type === 'medication' ? 'medication_record' :
                     item.type === 'checkup' ? 'health_checkup' : 'pet_lifecycle_event',
        context_data: {
          days_overdue: item.daysOverdue,
          smart_notification: true,
        },
      });

    if (error) {
      console.error(`❌ 스마트 알림 발송 실패 (${item.type}):`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`❌ 스마트 알림 발송 중 오류 (${item.type}):`, error);
    return false;
  }
}

/**
 * 스마트 알림 스케줄러
 * 모든 사용자의 놓친 일정을 확인하고 알림 발송
 */
export async function scheduleSmartNotifications(): Promise<SmartNotificationResult> {
  console.group("[SmartNotificationService] 스마트 알림 스케줄링 시작");

  const result: SmartNotificationResult = {
    processed: 0,
    notificationsSent: 0,
    errors: 0,
    missedItems: [],
  };

  try {
    const supabase = getServiceRoleClient();

    // 모든 사용자 조회
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id");

    if (usersError || !users) {
      console.error("❌ 사용자 조회 실패:", usersError);
      console.groupEnd();
      return result;
    }

    console.log(`📋 처리 대상 사용자: ${users.length}명`);

    for (const user of users) {
      try {
        result.processed++;

        // 사용자의 알림 설정 확인
        const settings = await getUserNotificationSettings(user.id);
        
        if (!settings || !settings.smartNotifications) {
          console.log(`⏭️ ${user.id}: 스마트 알림 비활성화`);
          continue;
        }

        console.log(`🔍 ${user.id}: 놓친 일정 확인 중...`);

        // 놓친 일정 감지
        const missedVaccinations = await detectMissedVaccinations(user.id, settings.smartNotificationSensitivity);
        const missedMedications = await detectMissedMedications(user.id, settings.smartNotificationSensitivity);
        const missedCheckups = await detectMissedCheckups(user.id, settings.smartNotificationSensitivity);
        const missedPetVaccinations = await detectMissedPetVaccinations(user.id, settings.smartNotificationSensitivity);

        const allMissedItems = [
          ...missedVaccinations,
          ...missedMedications,
          ...missedCheckups,
          ...missedPetVaccinations,
        ];

        result.missedItems.push(...allMissedItems);

        // 알림 발송
        for (const item of allMissedItems) {
          const success = await sendSmartNotification(item);
          if (success) {
            result.notificationsSent++;
          } else {
            result.errors++;
          }
        }

        if (allMissedItems.length > 0) {
          console.log(`✅ ${user.id}: ${allMissedItems.length}건의 놓친 일정 발견, 알림 발송 완료`);
        }
      } catch (error) {
        result.errors++;
        console.error(`❌ ${user.id}: 처리 중 오류`, error);
      }
    }

    console.log(`✅ 스마트 알림 스케줄링 완료: 처리 ${result.processed}명, 발송 ${result.notificationsSent}건, 오류 ${result.errors}건`);
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ 예상치 못한 오류:", error);
    console.groupEnd();
    return result;
  }
}

