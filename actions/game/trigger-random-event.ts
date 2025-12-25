/**
 * @file actions/game/trigger-random-event.ts
 * @description 랜덤 이벤트 트리거 Server Action
 *
 * 랜덤 이벤트 발생 조건을 확인하고 이벤트를 트리거하여 보상을 지급합니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/lib/game/random-events: selectRandomEvent, getEventById, getCurrentSeason
 * - @/lib/health/gamification: addPoints
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import {
  selectRandomEvent,
  getEventById,
  type EventType,
  type RandomEvent,
} from "@/lib/game/random-events";
import { addPoints } from "@/lib/health/gamification";

interface TriggerRandomEventParams {
  eventType: EventType;
  eventId?: string; // 특정 이벤트 ID (선택적)
}

export async function triggerRandomEvent(
  params: TriggerRandomEventParams
): Promise<{
  success: boolean;
  error?: string;
  event?: RandomEvent;
  rewardPoints?: number;
}> {
  try {
    console.group("[TriggerRandomEvent] 랜덤 이벤트 트리거 시작");
    console.log("params", params);

    const { userId } = await auth();
    if (!userId) {
      console.error("❌ 로그인이 필요합니다");
      console.groupEnd();
      return { success: false, error: "로그인이 필요합니다." };
    }

    const user = await ensureSupabaseUser();
    if (!user) {
      console.error("❌ 사용자 정보를 찾을 수 없습니다");
      console.groupEnd();
      return { success: false, error: "사용자 정보를 찾을 수 없습니다." };
    }

    const supabase = getServiceRoleClient();
    const today = new Date().toISOString().split("T")[0];

    // 이벤트 선택
    let event: RandomEvent | null = null;
    if (params.eventId) {
      event = getEventById(params.eventId);
      if (!event) {
        console.error("❌ 이벤트를 찾을 수 없습니다");
        console.groupEnd();
        return { success: false, error: "이벤트를 찾을 수 없습니다." };
      }
    } else {
      event = selectRandomEvent(params.eventType);
      if (!event) {
        console.error("❌ 사용 가능한 이벤트가 없습니다");
        console.groupEnd();
        return { success: false, error: "사용 가능한 이벤트가 없습니다." };
      }
    }

    // 오늘 이미 발생한 이벤트인지 확인
    const { data: existingEvent } = await supabase
      .from("random_events")
      .select("*")
      .eq("user_id", user.id)
      .eq("event_id", event.id)
      .eq("triggered_at::date", today)
      .single();

    if (existingEvent && !existingEvent.completed) {
      // 이미 발생했지만 완료하지 않은 경우
      console.log("이미 발생한 이벤트:", existingEvent.id);
      console.groupEnd();
      return {
        success: true,
        event,
        rewardPoints: 0,
      };
    }

    if (existingEvent?.completed) {
      console.log("오늘 이미 완료한 이벤트입니다");
      console.groupEnd();
      return {
        success: false,
        error: "오늘 이미 완료한 이벤트입니다.",
      };
    }

    // 이벤트 발생 기록
    const { data: eventRecord, error: insertError } = await supabase
      .from("random_events")
      .insert({
        user_id: user.id,
        event_id: event.id,
        event_type: event.type,
        reward_points: event.rewardPoints,
        completed: false,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("❌ 이벤트 기록 저장 실패:", insertError);
      console.groupEnd();
      return { success: false, error: insertError.message };
    }

    console.log("✅ 랜덤 이벤트 발생:", event.title);
    console.groupEnd();

    return {
      success: true,
      event,
      rewardPoints: 0, // 완료 시 지급
    };
  } catch (error) {
    console.error("❌ 랜덤 이벤트 트리거 중 오류:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

/**
 * 랜덤 이벤트 완료 처리
 */
export async function completeRandomEvent(
  eventId: string
): Promise<{ success: boolean; error?: string; rewardPoints?: number }> {
  try {
    console.group("[CompleteRandomEvent] 랜덤 이벤트 완료 처리");
    console.log("eventId", eventId);

    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const user = await ensureSupabaseUser();
    if (!user) {
      return { success: false, error: "사용자 정보를 찾을 수 없습니다." };
    }

    const supabase = getServiceRoleClient();
    const event = getEventById(eventId);

    if (!event) {
      return { success: false, error: "이벤트를 찾을 수 없습니다." };
    }

    // 이벤트 완료 처리
    const { data: eventRecord, error: updateError } = await supabase
      .from("random_events")
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("event_id", eventId)
      .eq("completed", false)
      .select("id, reward_points")
      .single();

    if (updateError || !eventRecord) {
      console.error("❌ 이벤트 완료 처리 실패:", updateError);
      return { success: false, error: updateError?.message || "이벤트를 찾을 수 없습니다." };
    }

    // 보상 지급
    await addPoints(user.id, event.rewardPoints, `랜덤 이벤트 완료: ${event.title}`);

    console.log("✅ 랜덤 이벤트 완료 처리 완료");
    console.log("보상 포인트:", event.rewardPoints);
    console.groupEnd();

    return {
      success: true,
      rewardPoints: event.rewardPoints,
    };
  } catch (error) {
    console.error("❌ 랜덤 이벤트 완료 처리 중 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

