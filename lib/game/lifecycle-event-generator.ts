/**
 * @file lib/game/lifecycle-event-generator.ts
 * @description 생애주기별 알림을 게임 이벤트로 변환
 *
 * 생애주기별 알림(notifications 테이블)을 캐릭터 게임 이벤트로 변환하여
 * 게임 내에서 캐릭터가 알림을 전달하도록 합니다.
 *
 * @dependencies
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/game/character-game-event-scheduler: 게임 이벤트 스케줄러
 * - @/types/game/character-game-events: 게임 이벤트 타입
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { createCharacterGameEvent } from "@/lib/game/character-game-event-scheduler";
import type {
  CreateCharacterGameEventParams,
  LifecycleEventData,
} from "@/types/game/character-game-events";

/**
 * 생애주기별 알림을 게임 이벤트로 변환
 *
 * @param userId 사용자 ID
 * @param familyMemberId 가족 구성원 ID (선택사항)
 * @returns 생성된 이벤트 개수
 */
export async function generateLifecycleGameEvents(
  userId: string,
  familyMemberId?: string | null
): Promise<number> {
  console.group("[LifecycleEventGenerator] 생애주기 게임 이벤트 생성");
  console.log("userId:", userId);
  console.log("familyMemberId:", familyMemberId);

  try {
    const supabase = getServiceRoleClient();

    // 활성 생애주기별 알림 조회
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("family_member_id", familyMemberId || null)
      .eq("type", "lifecycle_event")
      .in("status", ["pending", "sent"])
      .order("priority", { ascending: false })
      .order("scheduled_at", { ascending: true })
      .limit(20); // 최근 20개 알림만

    if (error) {
      console.error("❌ 생애주기 알림 조회 실패:", error);
      console.groupEnd();
      throw error;
    }

    if (!notifications || notifications.length === 0) {
      console.log("✅ 생성할 생애주기 알림이 없습니다.");
      console.groupEnd();
      return 0;
    }

    console.log(`📋 활성 생애주기 알림 ${notifications.length}개 발견`);

    let eventsCreated = 0;
    const now = new Date();

    // 각 알림에 대해 게임 이벤트 생성
    for (const notification of notifications) {
      // 이미 생성된 이벤트 확인 (중복 방지)
      const { data: existing } = await supabase
        .from("character_game_events")
        .select("id")
        .eq("user_id", userId)
        .eq("family_member_id", familyMemberId || null)
        .eq("event_type", "lifecycle_event")
        .eq("status", "pending")
        .like("event_data->>notification_id", `%${notification.id}%`)
        .single();

      if (existing) {
        continue; // 이미 존재하는 이벤트는 건너뜀
      }

      // 알림 예정일 확인
      const scheduledTime = notification.scheduled_at
        ? new Date(notification.scheduled_at)
        : now;

      // 이미 지난 알림은 생성하지 않음 (3일 이내만 허용)
      const daysDiff = Math.floor((scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < -3) {
        continue; // 3일 이상 지난 알림은 건너뜀
      }

      // 이벤트 데이터 생성
      const eventData: LifecycleEventData = {
        notification_id: notification.id,
        event_code: notification.context_data?.event_code || "",
        event_name: notification.context_data?.event_name || notification.title,
        event_type: notification.context_data?.event_type || "milestone",
        category: notification.category,
        days_until: notification.context_data?.days_until || daysDiff,
        dialogue_message: createLifecycleDialogueMessage(notification),
        has_professional_info: notification.context_data?.has_professional_info || false,
        requires_user_choice: notification.context_data?.requires_user_choice || false,
      };

      // 우선순위 결정
      let priority: "low" | "normal" | "high" | "urgent" = "normal";
      if (notification.priority === "urgent") {
        priority = "urgent";
      } else if (notification.priority === "high") {
        priority = "high";
      } else if (notification.priority === "low") {
        priority = "low";
      }

      // 게임 이벤트 생성
      const eventParams: CreateCharacterGameEventParams = {
        user_id: userId,
        family_member_id: familyMemberId || null,
        event_type: "lifecycle_event",
        event_data: eventData,
        scheduled_time: scheduledTime.toISOString(),
        priority,
      };

      await createCharacterGameEvent(eventParams);
      eventsCreated++;
    }

    console.log(`✅ 생애주기 게임 이벤트 ${eventsCreated}개 생성 완료`);
    console.groupEnd();

    return eventsCreated;
  } catch (error) {
    console.error("❌ 생애주기 게임 이벤트 생성 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 생애주기 알림에 맞는 대화 메시지 생성
 */
function createLifecycleDialogueMessage(notification: any): string {
  const eventName = notification.context_data?.event_name || notification.title;
  const daysUntil = notification.context_data?.days_until;

  if (daysUntil !== null && daysUntil !== undefined) {
    if (daysUntil < 0) {
      return `${eventName}이(가) 지났어요. 확인해주세요!`;
    } else if (daysUntil === 0) {
      return `오늘 ${eventName}이(가) 있어요!`;
    } else if (daysUntil <= 7) {
      return `${daysUntil}일 후 ${eventName}이(가) 있어요. 준비하세요!`;
    } else {
      return `${eventName}이(가) ${daysUntil}일 남았어요.`;
    }
  }

  return notification.message || `${eventName} 알림이 있어요!`;
}

/**
 * 모든 사용자에게 생애주기 게임 이벤트 생성
 *
 * @returns 처리 결과
 */
export async function generateLifecycleGameEventsForAllUsers(): Promise<{
  processedUsers: number;
  eventsCreated: number;
  errors: number;
}> {
  console.group("[LifecycleEventGenerator] 모든 사용자 생애주기 게임 이벤트 생성");
  const startTime = Date.now();

  const result = {
    processedUsers: 0,
    eventsCreated: 0,
    errors: 0,
  };

  try {
    const supabase = getServiceRoleClient();

    // 최근 30일 내 활동한 사용자 조회
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .limit(1000);

    if (usersError) {
      console.error("❌ 사용자 조회 실패:", usersError);
      console.groupEnd();
      throw usersError;
    }

    if (!users || users.length === 0) {
      console.log("✅ 처리할 사용자가 없습니다.");
      console.groupEnd();
      return result;
    }

    console.log(`📋 처리 대상 사용자: ${users.length}명`);

    // 각 사용자에 대해 생애주기 이벤트 생성
    for (const user of users) {
      try {
        // 본인용 이벤트
        const userEvents = await generateLifecycleGameEvents(user.id, null);
        result.eventsCreated += userEvents;

        // 가족 구성원별 이벤트
        const { data: familyMembers } = await supabase
          .from("family_members")
          .select("id")
          .eq("user_id", user.id);

        if (familyMembers && familyMembers.length > 0) {
          for (const member of familyMembers) {
            const memberEvents = await generateLifecycleGameEvents(user.id, member.id);
            result.eventsCreated += memberEvents;
          }
        }

        result.processedUsers++;
      } catch (error) {
        console.error(`❌ 사용자 생애주기 이벤트 생성 실패 (user: ${user.id}):`, error);
        result.errors++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ 생애주기 게임 이벤트 생성 완료`);
    console.log(`처리된 사용자: ${result.processedUsers}명`);
    console.log(`생성된 이벤트: ${result.eventsCreated}개`);
    console.log(`오류: ${result.errors}개`);
    console.log(`소요 시간: ${duration}ms`);
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ 생애주기 게임 이벤트 생성 실패:", error);
    console.groupEnd();
    throw error;
  }
}

