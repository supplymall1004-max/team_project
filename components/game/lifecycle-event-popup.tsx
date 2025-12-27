/**
 * @file components/game/lifecycle-event-popup.tsx
 * @description 생애주기 이벤트 팝업 알림 컴포넌트
 *
 * 생애주기 이벤트가 발생할 때 게임 내 알림과 함께 팝업으로도 표시합니다.
 *
 * @dependencies
 * - @/components/ui: shadcn 컴포넌트
 * - @/types/game/character-game-events: 게임 이벤트 타입
 */

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, AlertCircle, Info, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CharacterGameEvent, LifecycleEventData } from "@/types/game/character-game-events";
import { completeGameEventAction } from "@/actions/game/character-game-events";

interface LifecycleEventPopupProps {
  event: CharacterGameEvent;
  onClose: () => void;
  onComplete?: () => void;
}

/**
 * 생애주기 이벤트 팝업 컴포넌트
 */
export function LifecycleEventPopup({
  event,
  onClose,
  onComplete,
}: LifecycleEventPopupProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const eventData = event.event_data as LifecycleEventData;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleComplete = async () => {
    try {
      setIsCompleting(true);
      await completeGameEventAction(event.id);
      onComplete?.();
      handleClose();
    } catch (error) {
      console.error("이벤트 완료 처리 실패:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  // 우선순위에 따른 아이콘 및 색상
  const getPriorityConfig = () => {
    switch (event.priority) {
      case "urgent":
        return {
          icon: AlertCircle,
          color: "text-red-400",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/50",
        };
      case "high":
        return {
          icon: AlertCircle,
          color: "text-orange-400",
          bgColor: "bg-orange-500/10",
          borderColor: "border-orange-500/50",
        };
      case "normal":
        return {
          icon: Info,
          color: "text-blue-400",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/50",
        };
      default:
        return {
          icon: Calendar,
          color: "text-gray-400",
          bgColor: "bg-gray-500/10",
          borderColor: "border-gray-500/50",
        };
    }
  };

  const config = getPriorityConfig();
  const Icon = config.icon;

  // 이벤트 타입 한글명
  const getEventTypeLabel = () => {
    const typeMap: Record<string, string> = {
      vaccination: "예방접종",
      health_checkup: "건강검진",
      milestone: "생애 마일스톤",
      sensitive_health: "건강 이벤트",
      education: "교육",
      military: "군대",
      career: "직장",
      family_formation: "가족 형성",
      housing_finance: "주거 및 경제",
      legal_social: "사회적 권리",
      senior_retirement: "시니어 및 은퇴",
      lifestyle: "라이프스타일",
    };
    return typeMap[eventData.event_type] || "생애주기 이벤트";
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            exit={{ y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <Card
              className={`${config.bgColor} ${config.borderColor} border-2 shadow-2xl`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${config.color}`} />
                    <div>
                      <CardTitle className="text-white">{eventData.event_name}</CardTitle>
                      <CardDescription className="text-gray-400 mt-1">
                        {getEventTypeLabel()}
                      </CardDescription>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="닫기"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 메시지 */}
                <p className="text-gray-300 leading-relaxed">
                  {eventData.dialogue_message || "알림이 있어요!"}
                </p>

                {/* 일정 정보 */}
                {eventData.days_until !== null && eventData.days_until !== undefined && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {eventData.days_until < 0 ? (
                      <span>이벤트가 지났습니다</span>
                    ) : eventData.days_until === 0 ? (
                      <span>오늘 예정된 이벤트입니다</span>
                    ) : (
                      <span>{eventData.days_until}일 후 예정</span>
                    )}
                  </div>
                )}

                {/* 전문의 정보 필요 시 */}
                {eventData.has_professional_info && (
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                      <p className="text-sm text-blue-300">
                        전문의 정보가 제공됩니다. 자세한 내용을 확인하세요.
                      </p>
                    </div>
                  </div>
                )}

                {/* 우선순위 배지 */}
                <div className="flex items-center justify-between">
                  <Badge
                    className={`${config.bgColor} ${config.color} ${config.borderColor} border`}
                  >
                    {event.priority === "urgent"
                      ? "긴급"
                      : event.priority === "high"
                        ? "높음"
                        : event.priority === "normal"
                          ? "보통"
                          : "낮음"}
                  </Badge>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleComplete}
                    disabled={isCompleting}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  >
                    {isCompleting ? (
                      "처리 중..."
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        확인 완료
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleClose}
                    variant="outline"
                    className="flex-1"
                  >
                    나중에
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

