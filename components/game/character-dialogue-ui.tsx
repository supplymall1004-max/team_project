/**
 * @file components/game/character-dialogue-ui.tsx
 * @description 캐릭터 대화 UI 컴포넌트
 *
 * 게임 이벤트 발생 시 캐릭터가 플레이어에게 말하는 대화 말풍선을 표시합니다.
 *
 * @dependencies
 * - framer-motion: 애니메이션
 * - @/types/game/character-game-events: 대화 메시지 타입
 */

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DialogueMessage } from "@/types/game/character-game-events";

interface CharacterDialogueUIProps {
  dialogue: DialogueMessage;
  onClose?: () => void;
  onAction?: (action: string) => void;
  actionLabel?: string;
  showCloseButton?: boolean;
}

/**
 * 캐릭터 대화 UI 컴포넌트
 */
export function CharacterDialogueUI({
  dialogue,
  onClose,
  onAction,
  actionLabel = "확인",
  showCloseButton = true,
}: CharacterDialogueUIProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300); // 애니메이션 완료 후 콜백 호출
  };

  const handleAction = () => {
    onAction?.("confirm");
    handleClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4"
        >
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 rounded-2xl shadow-2xl border-2 border-amber-400 p-6 relative"
            style={{
              filter: "drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3))",
            }}
          >
            {/* 말풍선 꼬리 (아래쪽 중앙) */}
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[12px] border-transparent border-t-amber-100" />
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[14px] border-r-[14px] border-t-[14px] border-transparent border-t-amber-400" style={{ zIndex: -1 }} />

            {/* 캐릭터 이름 */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-amber-900">{dialogue.character_name}</h3>
              {showCloseButton && (
                <button
                  onClick={handleClose}
                  className="text-amber-600 hover:text-amber-800 transition-colors w-6 h-6 flex items-center justify-center rounded-full hover:bg-amber-200"
                  aria-label="닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 대화 메시지 */}
            <p className="text-amber-900 mb-4 leading-relaxed font-medium">{dialogue.message}</p>

            {/* 액션 버튼 */}
            {onAction && (
              <div className="flex justify-end gap-2">
                <Button
                  onClick={handleAction}
                  className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md"
                >
                  {actionLabel}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * 게임 이벤트용 대화 UI (약 주기, 분유 주기 등)
 */
interface GameEventDialogueProps {
  characterName: string;
  message: string;
  eventType: string;
  onComplete: () => void;
  onCancel?: () => void;
}

export function GameEventDialogue({
  characterName,
  message,
  eventType,
  onComplete,
  onCancel,
}: GameEventDialogueProps) {
  const getActionLabel = () => {
    switch (eventType) {
      case "medication":
        return "약 주기";
      case "baby_feeding":
        return "분유 주기";
      case "health_checkup":
        return "일정 확인";
      case "vaccination":
        return "일정 확인";
      default:
        return "확인";
    }
  };

  return (
    <CharacterDialogueUI
      dialogue={{
        character_name: characterName,
        message,
      }}
      onAction={onComplete}
      actionLabel={getActionLabel()}
      onClose={onCancel}
    />
  );
}

