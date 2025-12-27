/**
 * @file components/game/character-game-event-notification.tsx
 * @description 게임 이벤트 알림 컴포넌트
 *
 * 활성 게임 이벤트를 실시간으로 감지하고 알림을 표시합니다.
 *
 * @dependencies
 * - @/components/game/character-dialogue-ui: 대화 UI
 * - @/lib/game/character-auto-walk: 자동 이동
 * - @/actions/game/character-game-events: Server Actions
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { GameEventDialogue } from "@/components/game/character-dialogue-ui";
import { moveCharacterToPlayer } from "@/lib/game/character-auto-walk";
import { getActiveGameEvents, completeGameEventAction } from "@/actions/game/character-game-events";
import type { CharacterGameEvent } from "@/types/game/character-game-events";

interface CharacterGameEventNotificationProps {
  userId: string;
  familyMemberId: string;
  characterName: string;
  onEventComplete?: (event: CharacterGameEvent, points: number, experience: number) => void;
}

/**
 * 게임 이벤트 알림 컴포넌트
 */
export function CharacterGameEventNotification({
  userId,
  familyMemberId,
  characterName,
  onEventComplete,
}: CharacterGameEventNotificationProps) {
  const [activeEvent, setActiveEvent] = useState<CharacterGameEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 활성 이벤트 확인
  const checkActiveEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const events = await getActiveGameEvents(familyMemberId);

      if (events && events.length > 0) {
        // 가장 우선순위가 높은 이벤트 선택
        const event = events[0];
        setActiveEvent(event);

        // 캐릭터를 플레이어 위치로 이동
        try {
          await moveCharacterToPlayer(userId, familyMemberId);
        } catch (error) {
          console.error("❌ 캐릭터 이동 실패:", error);
          // 이동 실패해도 이벤트는 표시
        }
      } else {
        setActiveEvent(null);
      }
    } catch (error) {
      console.error("❌ 활성 이벤트 확인 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, familyMemberId]);

  // 초기 로드 및 주기적 확인
  useEffect(() => {
    // 초기 확인
    checkActiveEvents();

    // 30초마다 이벤트 확인
    const interval = setInterval(checkActiveEvents, 30000);

    return () => clearInterval(interval);
  }, [checkActiveEvents]);

  // 이벤트 완료 처리
  const handleEventComplete = useCallback(async () => {
    if (!activeEvent) return;

    try {
      setIsLoading(true);
      const result = await completeGameEventAction(
        activeEvent.id,
        undefined,
        undefined
      );

      if (result.success && result.event) {
        console.log("✅ 이벤트 완료 처리 완료");
        console.log("포인트:", result.points_earned);
        console.log("경험치:", result.experience_earned);

        // 콜백 호출
        onEventComplete?.(result.event, result.points_earned, result.experience_earned);

        // 이벤트 초기화
        setActiveEvent(null);

        // 잠시 후 다음 이벤트 확인
        setTimeout(() => {
          checkActiveEvents();
        }, 2000);
      }
    } catch (error) {
      console.error("❌ 이벤트 완료 처리 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeEvent, onEventComplete, checkActiveEvents]);

  // 이벤트 취소
  const handleEventCancel = useCallback(() => {
    setActiveEvent(null);
  }, []);

  if (!activeEvent) {
    return null;
  }

  // 이벤트 데이터에서 대화 메시지 추출
  const dialogueMessage = (activeEvent.event_data as any)?.dialogue_message || "알림이 있어요!";

  return (
    <GameEventDialogue
      characterName={characterName}
      message={dialogueMessage}
      eventType={activeEvent.event_type}
      onComplete={handleEventComplete}
      onCancel={handleEventCancel}
    />
  );
}

