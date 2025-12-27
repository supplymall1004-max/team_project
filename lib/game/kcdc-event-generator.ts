/**
 * @file lib/game/kcdc-event-generator.ts
 * @description 질병청 API 데이터를 게임 이벤트로 변환
 *
 * KCDC 알림 데이터를 캐릭터 게임 이벤트로 변환하여 사용자에게 게임화된 형태로 제공합니다.
 *
 * @dependencies
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/game/character-game-event-scheduler: 게임 이벤트 스케줄러
 * - @/types/game/character-game-events: 게임 이벤트 타입
 * - @/types/kcdc: KCDC 알림 타입
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { createCharacterGameEvent } from "@/lib/game/character-game-event-scheduler";
import type {
  CreateCharacterGameEventParams,
  KCDCAlertEventData,
} from "@/types/game/character-game-events";
import type { KcdcAlert } from "@/types/kcdc";

/**
 * KCDC 알림을 게임 이벤트로 변환
 *
 * @param userId 사용자 ID
 * @param familyMemberId 가족 구성원 ID (선택사항)
 * @returns 생성된 이벤트 개수
 */
export async function generateKCDCGameEvents(
  userId: string,
  familyMemberId?: string | null
): Promise<number> {
  console.group("[KCDCEventGenerator] KCDC 게임 이벤트 생성");
  console.log("userId:", userId);
  console.log("familyMemberId:", familyMemberId);

  try {
    const supabase = getServiceRoleClient();

    // 활성 KCDC 알림 조회
    const { data: alerts, error } = await supabase
      .from("kcdc_alerts")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(10); // 최근 10개 알림만

    if (error) {
      console.error("❌ KCDC 알림 조회 실패:", error);
      console.groupEnd();
      throw error;
    }

    if (!alerts || alerts.length === 0) {
      console.log("✅ 생성할 KCDC 알림이 없습니다.");
      console.groupEnd();
      return 0;
    }

    console.log(`📋 활성 KCDC 알림 ${alerts.length}개 발견`);

    let eventsCreated = 0;
    const now = new Date();

    // 각 알림에 대해 게임 이벤트 생성
    for (const alert of alerts as KcdcAlert[]) {
      // 이미 생성된 이벤트 확인 (중복 방지)
      const { data: existing } = await supabase
        .from("character_game_events")
        .select("id")
        .eq("user_id", userId)
        .eq("family_member_id", familyMemberId || null)
        .eq("event_type", "kcdc_alert")
        .eq("status", "pending")
        .like("event_data->>alert_id", `%${alert.id}%`)
        .single();

      if (existing) {
        continue; // 이미 존재하는 이벤트는 건너뜀
      }

      // 이벤트 데이터 생성
      const eventData: KCDCAlertEventData = {
        alert_type: alert.alert_type,
        title: alert.title,
        content: alert.content,
        severity: alert.severity,
        dialogue_message: createKCDCDialogueMessage(alert),
      };

      // 우선순위 결정
      const priority = alert.severity === "critical" ? "urgent" : alert.severity === "warning" ? "high" : "normal";

      // 게임 이벤트 생성 (즉시 발생)
      const eventParams: CreateCharacterGameEventParams = {
        user_id: userId,
        family_member_id: familyMemberId || null,
        event_type: "kcdc_alert",
        event_data: eventData,
        scheduled_time: now.toISOString(), // 즉시 발생
        priority,
      };

      await createCharacterGameEvent(eventParams);
      eventsCreated++;
    }

    console.log(`✅ KCDC 게임 이벤트 ${eventsCreated}개 생성 완료`);
    console.groupEnd();

    return eventsCreated;
  } catch (error) {
    console.error("❌ KCDC 게임 이벤트 생성 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * KCDC 알림에 맞는 대화 메시지 생성
 */
function createKCDCDialogueMessage(alert: KcdcAlert): string {
  switch (alert.alert_type) {
    case "flu":
      if (alert.flu_stage) {
        return `독감 유행 단계가 '${alert.flu_stage}'입니다. 예방접종을 받으세요!`;
      }
      return "독감 유행 정보가 업데이트되었어요. 예방접종을 확인하세요!";

    case "vaccination":
      if (alert.vaccine_name && alert.target_age_group) {
        return `${alert.vaccine_name} 예방접종이 권장됩니다. (대상: ${alert.target_age_group})`;
      }
      return "예방접종 정보가 업데이트되었어요. 확인해보세요!";

    case "disease_outbreak":
      return `${alert.title}. 주의하세요!`;

    default:
      return alert.title || "건강 관련 알림이 있어요!";
  }
}

/**
 * 모든 사용자에게 KCDC 게임 이벤트 생성
 *
 * @returns 처리 결과
 */
export async function generateKCDCGameEventsForAllUsers(): Promise<{
  processedUsers: number;
  eventsCreated: number;
  errors: number;
}> {
  console.group("[KCDCEventGenerator] 모든 사용자 KCDC 게임 이벤트 생성");
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

    // 각 사용자에 대해 KCDC 이벤트 생성
    for (const user of users) {
      try {
        // 본인용 이벤트
        const userEvents = await generateKCDCGameEvents(user.id, null);
        result.eventsCreated += userEvents;

        // 가족 구성원별 이벤트
        const { data: familyMembers } = await supabase
          .from("family_members")
          .select("id")
          .eq("user_id", user.id);

        if (familyMembers && familyMembers.length > 0) {
          for (const member of familyMembers) {
            const memberEvents = await generateKCDCGameEvents(user.id, member.id);
            result.eventsCreated += memberEvents;
          }
        }

        result.processedUsers++;
      } catch (error) {
        console.error(`❌ 사용자 KCDC 이벤트 생성 실패 (user: ${user.id}):`, error);
        result.errors++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ KCDC 게임 이벤트 생성 완료`);
    console.log(`처리된 사용자: ${result.processedUsers}명`);
    console.log(`생성된 이벤트: ${result.eventsCreated}개`);
    console.log(`오류: ${result.errors}개`);
    console.log(`소요 시간: ${duration}ms`);
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ KCDC 게임 이벤트 생성 실패:", error);
    console.groupEnd();
    throw error;
  }
}

