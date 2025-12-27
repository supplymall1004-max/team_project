/**
 * @file components/game/character-game-canvas.tsx
 * @description 게임 배경 및 네온 말풍선 이벤트 알림 컴포넌트
 *
 * 게임 배경 이미지를 표시하고, 이벤트 발생 시 네온 효과가 적용된 투명 말풍선으로 알림을 표시합니다.
 *
 * 주요 기능:
 * 1. 게임 배경 이미지 표시
 * 2. 네온 효과가 적용된 투명 말풍선 이벤트 알림
 * 3. 게임 이벤트 실시간 감지 및 표시
 *
 * @dependencies
 * - @/components/game/neon-speech-bubble: 네온 말풍선 컴포넌트
 * - @/lib/game/character-game-bridge: 게임 이벤트 브릿지
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getCharacterGameBridge } from "@/lib/game/character-game-bridge";
import { NeonSpeechBubble } from "@/components/game/neon-speech-bubble";
import type { CharacterData } from "@/types/character";

interface CharacterGameCanvasProps {
  characterData: CharacterData;
  onCharacterClick?: () => void;
  onEventTrigger?: (eventType: string) => void;
}

/**
 * 2D 캔버스 기반 게임 뷰 컴포넌트
 */
export function CharacterGameCanvas({
  characterData,
  onCharacterClick,
  onEventTrigger,
}: CharacterGameCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeEventNotification, setActiveEventNotification] = useState<{
    message: string;
    eventType: string;
  } | null>(null);

  // 이벤트 알림 표시
  const showEventNotification = useCallback((message: string, eventType: string) => {
    setActiveEventNotification({ message, eventType });
    
    // 10초 후 자동으로 닫기
    setTimeout(() => {
      setActiveEventNotification(null);
    }, 10000);
  }, []);

  // 이벤트 알림 닫기
  const closeEventNotification = useCallback(() => {
    setActiveEventNotification(null);
  }, []);

  // 게임 이벤트 감지 및 말풍선 알림 표시
  useEffect(() => {
    const bridge = getCharacterGameBridge();
    
    const handleGameEvent = (data: any) => {
      console.log("🎮 게임 이벤트 발생:", data);
      
      // 이벤트 타입에 따른 대화 메시지 설정
      const eventMessages: Record<string, string> = {
        medication: "약 먹을 시간이에요! 약을 주세요! 💊",
        baby_feeding: "우유가 필요해요! 🍼",
        health_checkup: "건강검진 예약이 필요해요! 🏥",
        vaccination: "예방접종을 맞아야 해요! 💉",
        lifecycle_event: "중요한 알림이 있어요! 📢",
        kcdc_alert: "질병청 알림이 있어요! ⚠️",
      };
      
      const message = eventMessages[data.eventType] || "알림이 있어요!";
      const eventType = data.eventType || "unknown";
      
      // 말풍선 알림 표시
      showEventNotification(message, eventType);
      onEventTrigger?.(eventType);
    };

    bridge.on("GameEventTriggered", handleGameEvent);

    // 주기적으로 활성 이벤트 확인 (폴링)
    const checkActiveEvents = async () => {
      try {
        const { getActiveGameEvents } = await import("@/actions/game/character-game-events");
        const events = await getActiveGameEvents(characterData.member.id || null);

        if (events.length > 0) {
          const firstEvent = events[0];
          handleGameEvent({ eventType: firstEvent.event_type });
        }
      } catch (error) {
        console.error("활성 이벤트 확인 실패:", error);
      }
    };

    // 초기 확인 및 30초마다 확인
    checkActiveEvents();
    const interval = setInterval(checkActiveEvents, 30000);

    return () => {
      bridge.off("GameEventTriggered", handleGameEvent);
      clearInterval(interval);
    };
  }, [showEventNotification, onEventTrigger, characterData]);


  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden rounded-lg shadow-2xl"
      style={{ 
        minHeight: "600px",
        backgroundColor: "#F5E6D3", // 배경 이미지가 없을 경우 대체 색상
      }}
    >
      {/* 배경 이미지 */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/game-background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      
      {/* 배경 오버레이 (이미지가 없을 경우 대체) */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(to bottom, #8B7355 0%, #D4C4A8 30%, #F5E6D3 60%, #E8D5B7 100%)",
        }}
      />

      {/* 네온 말풍선 이벤트 알림 */}
      {activeEventNotification && (
        <NeonSpeechBubble
          characterName={characterData.member.name}
          message={activeEventNotification.message}
          eventType={activeEventNotification.eventType}
          onComplete={() => {
            closeEventNotification();
            onEventTrigger?.(activeEventNotification.eventType);
          }}
          onCancel={closeEventNotification}
          position={{ x: 50, y: 30 }}
        />
      )}
    </div>
  );
}

