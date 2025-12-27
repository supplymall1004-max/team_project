/**
 * @file components/game/lifecycle-event-popup-provider.tsx
 * @description 생애주기 이벤트 팝업 Provider
 *
 * 활성 생애주기 게임 이벤트를 감지하고 팝업으로 표시합니다.
 *
 * @dependencies
 * - @/components/game/lifecycle-event-popup: 생애주기 이벤트 팝업
 * - @/actions/game/character-game-events: Server Actions
 */

"use client";

import { useEffect, useState } from "react";
import { LifecycleEventPopup } from "@/components/game/lifecycle-event-popup";
import { getActiveGameEvents } from "@/actions/game/character-game-events";
import type { CharacterGameEvent } from "@/types/game/character-game-events";

interface LifecycleEventPopupProviderProps {
  userId: string;
  familyMemberId?: string | null;
  enabled?: boolean;
}

/**
 * 생애주기 이벤트 팝업 Provider
 */
export function LifecycleEventPopupProvider({
  userId,
  familyMemberId,
  enabled = true,
}: LifecycleEventPopupProviderProps) {
  const [activeEvent, setActiveEvent] = useState<CharacterGameEvent | null>(null);
  const [dismissedEvents, setDismissedEvents] = useState<Set<string>>(new Set());

  // 활성 생애주기 이벤트 확인
  useEffect(() => {
    if (!enabled) return;

    const checkActiveEvents = async () => {
      try {
        const events = await getActiveGameEvents(familyMemberId || null);

        // 생애주기 이벤트만 필터링
        const lifecycleEvents = events.filter(
          (e) => e.event_type === "lifecycle_event" && !dismissedEvents.has(e.id)
        );

        if (lifecycleEvents.length > 0) {
          // 가장 우선순위가 높은 이벤트 선택
          const highestPriorityEvent = lifecycleEvents.sort((a, b) => {
            const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          })[0];

          setActiveEvent(highestPriorityEvent);
        }
      } catch (error) {
        console.error("생애주기 이벤트 확인 실패:", error);
      }
    };

    // 초기 확인
    checkActiveEvents();

    // 1분마다 확인
    const interval = setInterval(checkActiveEvents, 60000);

    return () => clearInterval(interval);
  }, [familyMemberId, enabled, dismissedEvents]);

  const handleClose = () => {
    if (activeEvent) {
      setDismissedEvents((prev) => new Set(prev).add(activeEvent.id));
      setActiveEvent(null);
    }
  };

  const handleComplete = () => {
    if (activeEvent) {
      setDismissedEvents((prev) => new Set(prev).add(activeEvent.id));
      setActiveEvent(null);
    }
  };

  if (!activeEvent) {
    return null;
  }

  return (
    <LifecycleEventPopup
      event={activeEvent}
      onClose={handleClose}
      onComplete={handleComplete}
    />
  );
}

