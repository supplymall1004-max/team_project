/**
 * @file lib/game/character-game-event-manager.ts
 * @description 캐릭터 게임 이벤트 매니저
 *
 * 게임 이벤트의 활성화, 완료 처리, 포인트 지급 등을 관리합니다.
 *
 * @dependencies
 * - @/lib/supabase/service-role: Supabase 서비스 역할 클라이언트
 * - @/lib/game/character-game-event-scheduler: 이벤트 스케줄러
 * - @/lib/health/gamification: 포인트 시스템
 * - @/lib/game/level-system: 레벨 시스템
 * - @/types/game/character-game-events: 게임 이벤트 타입
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { addPoints } from "@/lib/health/gamification";
import { convertHealthScoreToExperience } from "@/lib/game/level-system";
import type {
  CharacterGameEvent,
  CharacterGameEventResponse,
  CompleteCharacterGameEventParams,
  CharacterGameInteraction,
} from "@/types/game/character-game-events";

/**
 * 이벤트 활성화 (이벤트 시간이 되었을 때)
 */
export async function activateGameEvent(
  eventId: string,
  userId: string
): Promise<CharacterGameEvent> {
  console.group("[CharacterGameEventManager] 이벤트 활성화");
  console.log("eventId:", eventId);
  console.log("userId:", userId);

  const supabase = getServiceRoleClient();

  // 이벤트 조회 및 권한 확인
  const { data: event, error: fetchError } = await supabase
    .from("character_game_events")
    .select("*")
    .eq("id", eventId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !event) {
    console.error("❌ 이벤트 조회 실패:", fetchError);
    console.groupEnd();
    throw new Error("이벤트를 찾을 수 없습니다.");
  }

  if (event.status !== "pending") {
    console.log("⚠️ 이벤트가 이미 활성화되었거나 완료되었습니다.");
    console.groupEnd();
    return event as CharacterGameEvent;
  }

  // 이벤트 상태를 active로 변경
  const { data: updatedEvent, error: updateError } = await supabase
    .from("character_game_events")
    .update({ status: "active" })
    .eq("id", eventId)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError) {
    console.error("❌ 이벤트 활성화 실패:", updateError);
    console.groupEnd();
    throw new Error(`이벤트 활성화 실패: ${updateError.message}`);
  }

  console.log("✅ 이벤트 활성화 완료");
  console.groupEnd();

  return updatedEvent as CharacterGameEvent;
}

/**
 * 이벤트 완료 처리
 */
export async function completeGameEvent(
  params: CompleteCharacterGameEventParams
): Promise<CharacterGameEventResponse> {
  console.group("[CharacterGameEventManager] 이벤트 완료 처리");
  console.log("params:", params);

  try {
    const supabase = getServiceRoleClient();

    // 이벤트 조회 및 권한 확인
    const { data: event, error: fetchError } = await supabase
      .from("character_game_events")
      .select("*")
      .eq("id", params.event_id)
      .eq("user_id", params.user_id)
      .single();

    if (fetchError || !event) {
      console.error("❌ 이벤트 조회 실패:", fetchError);
      console.groupEnd();
      return {
        success: false,
        points_earned: 0,
        experience_earned: 0,
        error: "이벤트를 찾을 수 없습니다.",
      };
    }

    if (event.status === "completed") {
      console.log("⚠️ 이벤트가 이미 완료되었습니다.");
      console.groupEnd();
      return {
        success: true,
        event: event as CharacterGameEvent,
        points_earned: event.points_earned,
        experience_earned: event.experience_earned,
      };
    }

    // 포인트 및 경험치 계산
    const pointsEarned = params.points_earned ?? calculatePointsForEvent(event);
    const experienceEarned = params.experience_earned ?? calculateExperienceForEvent(event);

    // 이벤트 완료 처리
    const { data: updatedEvent, error: updateError } = await supabase
      .from("character_game_events")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        points_earned: pointsEarned,
        experience_earned: experienceEarned,
      })
      .eq("id", params.event_id)
      .eq("user_id", params.user_id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ 이벤트 완료 처리 실패:", updateError);
      console.groupEnd();
      return {
        success: false,
        points_earned: 0,
        experience_earned: 0,
        error: `이벤트 완료 처리 실패: ${updateError.message}`,
      };
    }

    // 포인트 지급
    const pointsResult = await addPoints(params.user_id, pointsEarned, `게임 이벤트 완료: ${event.event_type}`);

    // 상호작용 기록 생성
    await createGameInteraction({
      user_id: params.user_id,
      family_member_id: event.family_member_id,
      event_id: event.id,
      interaction_type: "event_completed",
      interaction_data: {
        event_type: event.event_type,
        event_data: event.event_data,
      },
      points_earned: pointsEarned,
      experience_earned: experienceEarned,
    });

    console.log("✅ 이벤트 완료 처리 완료");
    console.log("포인트:", pointsEarned);
    console.log("경험치:", experienceEarned);
    console.groupEnd();

    return {
      success: true,
      event: updatedEvent as CharacterGameEvent,
      points_earned: pointsEarned,
      experience_earned: experienceEarned,
      new_total_points: pointsResult.newTotalPoints,
    };
  } catch (error) {
    console.error("❌ 이벤트 완료 처리 중 오류:", error);
    console.groupEnd();
    return {
      success: false,
      points_earned: 0,
      experience_earned: 0,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

/**
 * 이벤트별 포인트 계산
 */
function calculatePointsForEvent(event: any): number {
  const basePoints: Record<string, number> = {
    medication: 50,
    baby_feeding: 30,
    health_checkup: 100,
    vaccination: 80,
    kcdc_alert: 20,
    lifecycle_event: 60,
    custom: 40,
  };

  const priorityMultiplier: Record<string, number> = {
    low: 0.5,
    normal: 1.0,
    high: 1.5,
    urgent: 2.0,
  };

  const base = basePoints[event.event_type] || 40;
  const multiplier = priorityMultiplier[event.priority] || 1.0;

  return Math.floor(base * multiplier);
}

/**
 * 이벤트별 경험치 계산
 */
function calculateExperienceForEvent(event: any): number {
  // 포인트의 10배를 경험치로 변환
  const points = calculatePointsForEvent(event);
  return points * 10;
}

/**
 * 게임 상호작용 기록 생성
 */
export async function createGameInteraction(
  params: Omit<CharacterGameInteraction, "id" | "created_at">
): Promise<CharacterGameInteraction> {
  console.group("[CharacterGameEventManager] 게임 상호작용 기록 생성");
  console.log("params:", params);

  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from("character_game_interactions")
    .insert({
      user_id: params.user_id,
      family_member_id: params.family_member_id || null,
      event_id: params.event_id || null,
      interaction_type: params.interaction_type,
      interaction_data: params.interaction_data,
      points_earned: params.points_earned,
      experience_earned: params.experience_earned,
    })
    .select()
    .single();

  if (error) {
    console.error("❌ 상호작용 기록 생성 실패:", error);
    console.groupEnd();
    throw new Error(`상호작용 기록 생성 실패: ${error.message}`);
  }

  console.log("✅ 상호작용 기록 생성 완료:", data.id);
  console.groupEnd();

  return data as CharacterGameInteraction;
}

/**
 * 사용자의 활성 이벤트 목록 조회
 */
export async function getUserActiveEvents(
  userId: string,
  familyMemberId?: string | null
): Promise<CharacterGameEvent[]> {
  console.group("[CharacterGameEventManager] 사용자 활성 이벤트 조회");
  console.log("userId:", userId);
  console.log("familyMemberId:", familyMemberId);

  const supabase = getServiceRoleClient();
  const now = new Date();

  let query = supabase
    .from("character_game_events")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["pending", "active"])
    .lte("scheduled_time", now.toISOString())
    .order("priority", { ascending: false })
    .order("scheduled_time", { ascending: true });

  if (familyMemberId !== undefined) {
    if (familyMemberId) {
      query = query.eq("family_member_id", familyMemberId);
    } else {
      query = query.is("family_member_id", null);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ 활성 이벤트 조회 실패:", error);
    console.groupEnd();
    throw new Error(`활성 이벤트 조회 실패: ${error.message}`);
  }

  console.log(`✅ 활성 이벤트 ${data?.length || 0}개 조회 완료`);
  console.groupEnd();

  return (data || []) as CharacterGameEvent[];
}

