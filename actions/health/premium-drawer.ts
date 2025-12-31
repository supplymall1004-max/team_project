/**
 * @file actions/health/premium-drawer.ts
 * @description 프리미엄 건강 드로어 데이터 조회 Server Action
 *
 * 냉장고 테마 드로어에 표시할 모든 건강 관련 데이터를 조회합니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth, currentUser
 * - @/lib/supabase/server: createClerkSupabaseClient
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/lib/health/medication-reminder-service: getUserMedicationReminders
 * - @/types/premium-drawer: PremiumDrawerData
 * - @/types/notifications: Notification
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { getUserMedicationReminders } from "@/lib/health/medication-reminder-service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PremiumDrawerData,
  HealthStatusSummary,
  FamilyHealthSummary,
  ScheduleItem,
  FamilyAnnouncement,
  SystemAnnouncement,
} from "@/types/premium-drawer";
import type { Notification } from "@/types/notifications";

/**
 * 프리미엄 드로어 데이터 조회
 */
export async function getPremiumDrawerData(): Promise<PremiumDrawerData> {
  console.group("[getPremiumDrawerData] 프리미엄 드로어 데이터 조회 시작");

  try {
    // 1. 사용자 인증 확인 (Clerk)
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      throw new Error("인증이 필요합니다.");
    }

    // 2. Supabase 클라이언트 생성
    const supabase = await createClerkSupabaseClient();

    // 3. 사용자 확인 및 동기화
    const userData = await ensureSupabaseUser();
    if (!userData) {
      console.error("❌ 사용자 동기화 실패");
      console.groupEnd();
      throw new Error("사용자 정보를 동기화할 수 없습니다.");
    }

    const userId = userData.id;
    console.log("✅ 사용자 확인 완료:", userId);

    // 4. 병렬로 데이터 조회
    const [
      healthStatus,
      familyHealthSummary,
      urgentNotifications,
      familyNotifications,
      todaySchedule,
      upcomingSchedule,
      familyAnnouncements,
      systemAnnouncements,
    ] = await Promise.all([
      getHealthStatusSummary(supabase, userId),
      getFamilyHealthSummary(supabase, userId),
      getUrgentNotifications(supabase, userId),
      getFamilyNotifications(supabase, userId),
      getTodaySchedule(supabase, userId),
      getUpcomingSchedule(supabase, userId),
      getFamilyAnnouncements(supabase, userId),
      getSystemAnnouncements(),
    ]);

    const result: PremiumDrawerData = {
      healthStatus,
      familyHealthSummary,
      urgentNotifications,
      familyNotifications,
      todaySchedule,
      upcomingSchedule,
      familyAnnouncements,
      systemAnnouncements,
    };

    console.log("✅ 프리미엄 드로어 데이터 조회 완료");
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ 프리미엄 드로어 데이터 조회 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 건강 상태 요약 조회
 */
async function getHealthStatusSummary(
  supabase: Awaited<ReturnType<typeof createClerkSupabaseClient>>,
  userId: string
): Promise<HealthStatusSummary> {
  try {
    // 가족 구성원 조회 (본인 포함)
    const { data: member, error: memberError } = await supabase
      .from("family_members")
      .select("health_score, id")
      .eq("user_id", userId)
      .is("family_member_id", null) // 본인만
      .maybeSingle();

    const healthScore = member?.health_score || 0;

    // 복용 중인 약물 수
    const { data: medications, error: medError } = await supabase
      .from("medication_records")
      .select("id")
      .eq("user_id", userId)
      .is("family_member_id", null)
      .or("end_date.is.null,end_date.gte." + new Date().toISOString().split("T")[0]);

    const activeMedications = medications?.length || 0;

    // 다가오는 예방접종 수 (7일 이내)
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const { data: vaccinations, error: vacError } = await supabase
      .from("vaccination_schedules")
      .select("id")
      .eq("user_id", userId)
      .is("family_member_id", null)
      .gte("scheduled_date", new Date().toISOString().split("T")[0])
      .lte("scheduled_date", sevenDaysLater.toISOString().split("T")[0]);

    const upcomingVaccinations = vaccinations?.length || 0;

    // 최근 건강검진 날짜
    const { data: checkup, error: checkupError } = await supabase
      .from("user_health_checkup_records")
      .select("checkup_date")
      .eq("user_id", userId)
      .is("family_member_id", null)
      .order("checkup_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastCheckupDate = checkup?.checkup_date || null;

    // BMI 계산 (건강 프로필에서)
    const { data: profile, error: profileError } = await supabase
      .from("user_health_profiles")
      .select("height_cm, weight_kg")
      .eq("user_id", userId)
      .maybeSingle();

    let bmi: number | null = null;
    if (profile?.height_cm && profile?.weight_kg) {
      const heightM = profile.height_cm / 100;
      bmi = profile.weight_kg / (heightM * heightM);
      bmi = Math.round(bmi * 10) / 10; // 소수점 1자리
    }

    return {
      healthScore,
      activeMedications,
      upcomingVaccinations,
      lastCheckupDate,
      bmi,
    };
  } catch (error) {
    console.error("❌ 건강 상태 요약 조회 오류:", error);
    return {
      healthScore: 0,
      activeMedications: 0,
      upcomingVaccinations: 0,
      lastCheckupDate: null,
      bmi: null,
    };
  }
}

/**
 * 가족 건강 요약 조회
 */
async function getFamilyHealthSummary(
  supabase: Awaited<ReturnType<typeof createClerkSupabaseClient>>,
  userId: string
): Promise<FamilyHealthSummary> {
  try {
    // 가족 구성원 조회
    const { data: members, error: membersError } = await supabase
      .from("family_members")
      .select("health_score, id")
      .eq("user_id", userId);

    const familyMembers = members || [];
    const familyMembersCount = familyMembers.length;

    // 가족 평균 건강 점수
    const totalScore = familyMembers.reduce(
      (sum: number, m: any) => sum + (m.health_score || 0),
      0
    );
    const familyAverageScore =
      familyMembersCount > 0 ? Math.round(totalScore / familyMembersCount) : 0;

    // 가족 전체 복용 중인 약물 수
    const { data: familyMedications, error: medError } = await supabase
      .from("medication_records")
      .select("id")
      .eq("user_id", userId)
      .or("end_date.is.null,end_date.gte." + new Date().toISOString().split("T")[0]);

    const familyActiveMedications = familyMedications?.length || 0;

    // 가족 전체 다가오는 예방접종 수
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const { data: familyVaccinations, error: vacError } = await supabase
      .from("vaccination_schedules")
      .select("id")
      .eq("user_id", userId)
      .gte("scheduled_date", new Date().toISOString().split("T")[0])
      .lte("scheduled_date", sevenDaysLater.toISOString().split("T")[0]);

    const familyUpcomingVaccinations = familyVaccinations?.length || 0;

    return {
      familyAverageScore,
      familyMembersCount,
      familyActiveMedications,
      familyUpcomingVaccinations,
    };
  } catch (error) {
    console.error("❌ 가족 건강 요약 조회 오류:", error);
    return {
      familyAverageScore: 0,
      familyMembersCount: 0,
      familyActiveMedications: 0,
      familyUpcomingVaccinations: 0,
    };
  }
}

/**
 * 중요 알림 조회 (urgent, high 우선순위)
 */
async function getUrgentNotifications(
  supabase: Awaited<ReturnType<typeof createClerkSupabaseClient>>,
  userId: string
): Promise<Notification[]> {
  try {
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    // 일반 알림 조회
    const { data: notifications, error: notifError } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .in("priority", ["urgent", "high"])
      .in("status", ["pending", "sent"])
      .or(
        `scheduled_at.is.null,scheduled_at.lte.${sevenDaysLater.toISOString()}`
      )
      .order("priority", { ascending: true })
      .order("scheduled_at", { ascending: true })
      .limit(5);

    if (notifError) {
      console.error("❌ 중요 알림 조회 실패:", notifError);
    }

    // 약물 복용 알림도 추가 (오늘 날짜)
    const serviceSupabase = getServiceRoleClient();
    const medicationReminders = await getUserMedicationReminders(
      userId,
      null,
      new Date()
    );

    // 약물 알림을 Notification 형식으로 변환
    const medicationNotifications: Notification[] = [];
    for (const reminder of medicationReminders) {
      if (reminder.status === "pending" || reminder.status === "notified") {
        // 약물 정보 조회
        const { data: medication } = await serviceSupabase
          .from("medication_records")
          .select("medication_name, family_member_id")
          .eq("id", reminder.medication_record_id)
          .maybeSingle();

        if (medication) {
          medicationNotifications.push({
            id: reminder.id,
            user_id: userId,
            family_member_id: medication.family_member_id,
            type: "medication",
            category: "reminder",
            channel: "in_app",
            title: `${medication.medication_name} 복용 시간`,
            message: `${medication.medication_name}을(를) 복용할 시간입니다.`,
            status: reminder.status === "notified" ? "sent" : "pending",
            priority: "urgent",
            context_data: {},
            scheduled_at: reminder.scheduled_time,
            sent_at: reminder.notified_at,
            read_at: null,
            confirmed_at: reminder.confirmed_at,
            related_id: reminder.id,
            related_type: "medication_record",
            recipient: null,
            error_message: null,
            retry_count: 0,
            is_test: false,
            created_at: reminder.created_at,
            updated_at: reminder.updated_at,
          });
        }
      }
    }

    // 알림 통합 및 정렬
    const allNotifications = [
      ...(notifications || []),
      ...medicationNotifications,
    ];

    // 중복 제거 및 정렬
    const uniqueNotifications = Array.from(
      new Map(allNotifications.map((n) => [n.id, n])).values()
    ).sort((a, b) => {
      const priorityOrder = { urgent: 1, high: 2, normal: 3, low: 4 };
      return (
        (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4)
      );
    });

    return uniqueNotifications.slice(0, 5);
  } catch (error) {
    console.error("❌ 중요 알림 조회 오류:", error);
    return [];
  }
}

/**
 * 가족 구성원 관련 알림 조회
 */
async function getFamilyNotifications(
  supabase: Awaited<ReturnType<typeof createClerkSupabaseClient>>,
  userId: string
): Promise<Notification[]> {
  try {
    // 가족 구성원 ID 목록 조회
    const { data: members } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", userId);

    const familyMemberIds = members?.map((m: any) => m.id) || [];

    if (familyMemberIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .in("family_member_id", familyMemberIds)
      .in("priority", ["urgent", "high"])
      .in("status", ["pending", "sent"])
      .order("priority", { ascending: true })
      .order("scheduled_at", { ascending: true })
      .limit(5);

    if (error) {
      console.error("❌ 가족 알림 조회 실패:", error);
      return [];
    }

    return (data || []) as Notification[];
  } catch (error) {
    console.error("❌ 가족 알림 조회 오류:", error);
    return [];
  }
}

/**
 * 오늘 일정 조회
 */
async function getTodaySchedule(
  supabase: Awaited<ReturnType<typeof createClerkSupabaseClient>>,
  userId: string
): Promise<ScheduleItem[]> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const scheduleItems: ScheduleItem[] = [];

    // 예방접종 일정
    const { data: vaccinations } = await supabase
      .from("vaccination_schedules")
      .select("id, scheduled_date, vaccination_name, family_member_id")
      .eq("user_id", userId)
      .eq("scheduled_date", today);

    if (vaccinations) {
      for (const vac of vaccinations) {
        // 가족 구성원 이름 조회
        let familyMemberName: string | undefined;
        if (vac.family_member_id) {
          const { data: member } = await supabase
            .from("family_members")
            .select("name")
            .eq("id", vac.family_member_id)
            .maybeSingle();
          familyMemberName = member?.name;
        }

        scheduleItems.push({
          id: vac.id,
          type: "vaccination",
          title: vac.vaccination_name || "예방접종",
          date: vac.scheduled_date,
          familyMemberName,
          familyMemberId: vac.family_member_id,
          relatedId: vac.id,
        });
      }
    }

    // 건강검진 일정
    const { data: checkups } = await supabase
      .from("user_health_checkup_records")
      .select("id, checkup_date, checkup_type, family_member_id")
      .eq("user_id", userId)
      .eq("checkup_date", today);

    if (checkups) {
      for (const checkup of checkups) {
        let familyMemberName: string | undefined;
        if (checkup.family_member_id) {
          const { data: member } = await supabase
            .from("family_members")
            .select("name")
            .eq("id", checkup.family_member_id)
            .maybeSingle();
          familyMemberName = member?.name;
        }

        scheduleItems.push({
          id: checkup.id,
          type: "checkup",
          title: checkup.checkup_type || "건강검진",
          date: checkup.checkup_date,
          familyMemberName,
          familyMemberId: checkup.family_member_id,
          relatedId: checkup.id,
        });
      }
    }

    // 약물 복용 알림 (오늘)
    const medicationReminders = await getUserMedicationReminders(userId, null, new Date());
    for (const reminder of medicationReminders) {
      const scheduledTime = new Date(reminder.scheduled_time);
      const reminderDate = scheduledTime.toISOString().split("T")[0];
      
      if (reminderDate === today) {
        // 약물 정보 조회 (service role 클라이언트 사용)
        const serviceSupabase = getServiceRoleClient();
        const { data: medication } = await serviceSupabase
          .from("medication_records")
          .select("medication_name, family_member_id")
          .eq("id", reminder.medication_record_id)
          .maybeSingle();

        let familyMemberName: string | undefined;
        if (medication?.family_member_id) {
          const { data: member } = await serviceSupabase
            .from("family_members")
            .select("name")
            .eq("id", medication.family_member_id)
            .maybeSingle();
          familyMemberName = member?.name;
        }

        scheduleItems.push({
          id: reminder.id,
          type: "medication",
          title: medication?.medication_name || "약물 복용",
          date: reminderDate,
          time: scheduledTime.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          familyMemberName,
          familyMemberId: medication?.family_member_id,
          relatedId: reminder.medication_record_id,
        });
      }
    }

    return scheduleItems.sort((a, b) => {
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      return a.date.localeCompare(b.date);
    });
  } catch (error) {
    console.error("❌ 오늘 일정 조회 오류:", error);
    return [];
  }
}

/**
 * 다가오는 일정 조회 (7일 이내)
 */
async function getUpcomingSchedule(
  supabase: Awaited<ReturnType<typeof createClerkSupabaseClient>>,
  userId: string
): Promise<ScheduleItem[]> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const endDate = sevenDaysLater.toISOString().split("T")[0];

    const scheduleItems: ScheduleItem[] = [];

    // 예방접종 일정
    const { data: vaccinations } = await supabase
      .from("vaccination_schedules")
      .select("id, scheduled_date, vaccination_name, family_member_id")
      .eq("user_id", userId)
      .gte("scheduled_date", today)
      .lte("scheduled_date", endDate);

    if (vaccinations) {
      for (const vac of vaccinations) {
        let familyMemberName: string | undefined;
        if (vac.family_member_id) {
          const { data: member } = await supabase
            .from("family_members")
            .select("name")
            .eq("id", vac.family_member_id)
            .maybeSingle();
          familyMemberName = member?.name;
        }

        scheduleItems.push({
          id: vac.id,
          type: "vaccination",
          title: vac.vaccination_name || "예방접종",
          date: vac.scheduled_date,
          familyMemberName,
          familyMemberId: vac.family_member_id,
          relatedId: vac.id,
        });
      }
    }

    // 건강검진 일정
    const { data: checkups } = await supabase
      .from("user_health_checkup_records")
      .select("id, checkup_date, checkup_type, family_member_id")
      .eq("user_id", userId)
      .gte("checkup_date", today)
      .lte("checkup_date", endDate);

    if (checkups) {
      for (const checkup of checkups) {
        let familyMemberName: string | undefined;
        if (checkup.family_member_id) {
          const { data: member } = await supabase
            .from("family_members")
            .select("name")
            .eq("id", checkup.family_member_id)
            .maybeSingle();
          familyMemberName = member?.name;
        }

        scheduleItems.push({
          id: checkup.id,
          type: "checkup",
          title: checkup.checkup_type || "건강검진",
          date: checkup.checkup_date,
          familyMemberName,
          familyMemberId: checkup.family_member_id,
          relatedId: checkup.id,
        });
      }
    }

    return scheduleItems.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("❌ 다가오는 일정 조회 오류:", error);
    return [];
  }
}

/**
 * 가족 공지사항 조회
 */
async function getFamilyAnnouncements(
  supabase: Awaited<ReturnType<typeof createClerkSupabaseClient>>,
  userId: string
): Promise<FamilyAnnouncement[]> {
  try {
    // 가족 그룹 조회
    const { data: familyGroups } = await supabase
      .from("family_group_members")
      .select("family_group_id")
      .eq("user_id", userId);

    if (!familyGroups || familyGroups.length === 0) {
      return [];
    }

    const familyGroupIds = familyGroups.map((fg: any) => fg.family_group_id);

    // 가족 공지사항 조회 (기존 notifications 테이블 활용)
    const { data: notifications } = await supabase
      .from("notifications")
      .select("id, title, message, user_id, created_at, priority, read_at")
      .eq("user_id", userId)
      .eq("type", "system")
      .eq("category", "general")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!notifications) {
      return [];
    }

    // 작성자 이름 조회
    const announcements: FamilyAnnouncement[] = [];
    for (const notif of notifications) {
      const { data: user } = await supabase
        .from("users")
        .select("name")
        .eq("id", notif.user_id)
        .maybeSingle();

      announcements.push({
        id: notif.id,
        title: notif.title || "공지사항",
        message: notif.message || "",
        createdBy: notif.user_id,
        createdByName: user?.name || "알 수 없음",
        createdAt: notif.created_at,
        isRead: !!notif.read_at,
        priority: (notif.priority as "low" | "normal" | "high") || "normal",
      });
    }

    return announcements;
  } catch (error) {
    console.error("❌ 가족 공지사항 조회 오류:", error);
    return [];
  }
}

/**
 * 시스템 공지사항 조회
 */
async function getSystemAnnouncements(): Promise<SystemAnnouncement[]> {
  try {
    const serviceSupabase = getServiceRoleClient();
    const { data, error } = await serviceSupabase
      .from("popup_announcements")
      .select("*")
      .eq("status", "published")
      .lte("active_from", new Date().toISOString())
      .or("active_until.is.null,active_until.gte." + new Date().toISOString())
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) {
      console.error("❌ 시스템 공지사항 조회 실패:", error);
      return [];
    }

    return (data || []).map((announcement: any) => ({
      id: announcement.id,
      title: announcement.title,
      body: announcement.body || announcement.message || "",
      priority: announcement.priority || 0,
      activeFrom: announcement.active_from,
      activeUntil: announcement.active_until,
    }));
  } catch (error) {
    console.error("❌ 시스템 공지사항 조회 오류:", error);
    return [];
  }
}

