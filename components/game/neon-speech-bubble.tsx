/**
 * @file components/game/neon-speech-bubble.tsx
 * @description 네온 효과가 적용된 투명 말풍선 이벤트 알림 컴포넌트
 *
 * 게임 이벤트를 투명한 말풍선 형태로 표시하며, 네온 효과를 적용합니다.
 *
 * @dependencies
 * - framer-motion: 애니메이션
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NeonSpeechBubbleProps {
  characterName: string;
  message: string;
  eventType?: string;
  onComplete?: () => void;
  onCancel?: () => void;
  position?: { x: number; y: number }; // 화면 상대 위치 (0-100)
}

/**
 * 네온 효과가 적용된 투명 말풍선 컴포넌트
 */
export function NeonSpeechBubble({
  characterName,
  message,
  eventType,
  onComplete,
  onCancel,
  position = { x: 50, y: 30 },
}: NeonSpeechBubbleProps) {
  // 이벤트 타입별 네온 색상
  const getNeonColor = () => {
    switch (eventType) {
      case "medication":
        return {
          primary: "#ff6b35", // 주황색
          secondary: "#ff8c42",
          glow: "rgba(255, 107, 53, 0.8)",
        };
      case "baby_feeding":
        return {
          primary: "#ff6b9d", // 핑크색
          secondary: "#ff8cc8",
          glow: "rgba(255, 107, 157, 0.8)",
        };
      case "health_checkup":
        return {
          primary: "#4ecdc4", // 청록색
          secondary: "#6eddd6",
          glow: "rgba(78, 205, 196, 0.8)",
        };
      case "vaccination":
        return {
          primary: "#ffe66d", // 노란색
          secondary: "#ffed8a",
          glow: "rgba(255, 230, 109, 0.8)",
        };
      case "lifecycle_event":
        return {
          primary: "#a8e6cf", // 민트색
          secondary: "#c4f0dc",
          glow: "rgba(168, 230, 207, 0.8)",
        };
      case "kcdc_alert":
        return {
          primary: "#ff6b6b", // 빨간색
          secondary: "#ff8c8c",
          glow: "rgba(255, 107, 107, 0.8)",
        };
      default:
        return {
          primary: "#ff6b35", // 기본 주황색
          secondary: "#ff8c42",
          glow: "rgba(255, 107, 53, 0.8)",
        };
    }
  };

  const neonColor = getNeonColor();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
        className="fixed z-50"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* 네온 효과 말풍선 */}
        <motion.div
          animate={{
            boxShadow: [
              `0 0 10px ${neonColor.glow}, 0 0 20px ${neonColor.glow}, 0 0 30px ${neonColor.glow}`,
              `0 0 15px ${neonColor.glow}, 0 0 25px ${neonColor.glow}, 0 0 35px ${neonColor.glow}`,
              `0 0 10px ${neonColor.glow}, 0 0 20px ${neonColor.glow}, 0 0 30px ${neonColor.glow}`,
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
          style={{
            background: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(10px)",
            border: `2px solid ${neonColor.primary}`,
            borderRadius: "20px",
            padding: "20px 24px",
            minWidth: "280px",
            maxWidth: "400px",
          }}
        >
          {/* 네온 테두리 효과 */}
          <div
            className="absolute inset-0 rounded-[20px]"
            style={{
              border: `1px solid ${neonColor.secondary}`,
              boxShadow: `inset 0 0 10px ${neonColor.glow}`,
              pointerEvents: "none",
            }}
          />

          {/* 말풍선 꼬리 (아래쪽 중앙) */}
          <div
            className="absolute -bottom-3 left-1/2 transform -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: "12px solid transparent",
              borderRight: "12px solid transparent",
              borderTop: `12px solid ${neonColor.primary}`,
              filter: `drop-shadow(0 0 8px ${neonColor.glow})`,
            }}
          />

          {/* 닫기 버튼 */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20"
              aria-label="닫기"
              style={{
                textShadow: `0 0 5px ${neonColor.glow}`,
              }}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* 캐릭터 이름 */}
          <div className="mb-2">
            <h3
              className="text-base font-bold"
              style={{
                color: neonColor.primary,
                textShadow: `0 0 10px ${neonColor.glow}, 0 0 20px ${neonColor.glow}`,
              }}
            >
              {characterName}
            </h3>
          </div>

          {/* 메시지 */}
          <p
            className="text-sm leading-relaxed mb-4"
            style={{
              color: "#ffffff",
              textShadow: `0 0 5px ${neonColor.glow}`,
            }}
          >
            {message}
          </p>

          {/* 액션 버튼 */}
          {onComplete && (
            <div className="flex justify-end gap-2">
              <Button
                onClick={onComplete}
                className="text-sm font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${neonColor.primary}, ${neonColor.secondary})`,
                  border: `1px solid ${neonColor.primary}`,
                  color: "#ffffff",
                  boxShadow: `0 0 10px ${neonColor.glow}, 0 0 20px ${neonColor.glow}`,
                  textShadow: `0 0 5px rgba(0, 0, 0, 0.5)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 15px ${neonColor.glow}, 0 0 30px ${neonColor.glow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 10px ${neonColor.glow}, 0 0 20px ${neonColor.glow}`;
                }}
              >
                확인
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

