/**
 * @file components/game/threejs/family-notification-panel.tsx
 * @description 가족 알림 말풍선 컴포넌트
 *
 * 가족 구성원별 건강 알림을 투명한 말풍선 스타일로 표시합니다.
 * 화면 우측 상단에 부드럽게 표시됩니다.
 *
 * @dependencies
 * - react: useMemo, useState
 * - framer-motion: 애니메이션
 * - @/types/character: CharacterData
 */

"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CharacterData } from "@/types/character";
import { EventNotificationOverlay } from "./event-notification-overlay";

interface FamilyNotificationPanelProps {
  characterData: CharacterData;
  familyMembers: Array<{ id: string; name: string }>;
  onNotificationClick: (notificationId: string) => void;
}

interface NotificationItem {
  id: string;
  memberId: string;
  memberName: string;
  title: string;
  message: string;
  priority: "urgent" | "high" | "normal" | "low";
  type: string;
}

/**
 * 말풍선 스타일 알림 카드 컴포넌트 (네온 효과 포함)
 */
function SpeechBubbleCard({
  notification,
  onClick,
  onClose,
  side = "left", // "left" 또는 "right"
}: {
  notification: NotificationItem;
  onClick: () => void;
  onClose: () => void;
  side?: "left" | "right";
}) {
  // 우선순위별 네온 색상
  const getNeonColor = () => {
    switch (notification.priority) {
      case "urgent":
        return {
          primary: "#ff6b6b",
          secondary: "#ff8c8c",
          glow: "rgba(255, 107, 107, 0.8)",
          border: "border-red-400/50",
          text: "text-red-100",
        };
      case "high":
        return {
          primary: "#ff6b35",
          secondary: "#ff8c42",
          glow: "rgba(255, 107, 53, 0.8)",
          border: "border-orange-400/50",
          text: "text-orange-100",
        };
      case "normal":
        return {
          primary: "#ffe66d",
          secondary: "#ffed8a",
          glow: "rgba(255, 230, 109, 0.8)",
          border: "border-yellow-400/50",
          text: "text-yellow-100",
        };
      case "low":
        return {
          primary: "#4ecdc4",
          secondary: "#6eddd6",
          glow: "rgba(78, 205, 196, 0.8)",
          border: "border-blue-400/50",
          text: "text-blue-100",
        };
      default:
        return {
          primary: "#ff6b35",
          secondary: "#ff8c42",
          glow: "rgba(255, 107, 53, 0.8)",
          border: "border-orange-400/50",
          text: "text-orange-100",
        };
    }
  };

  const neonColor = getNeonColor();
  const priorityIcons = {
    urgent: "🔴",
    high: "🟠",
    normal: "🟡",
    low: "🔵",
  };

  return (
    <motion.div
      className={`relative bg-black/40 backdrop-blur-md border-2 ${neonColor.border} rounded-2xl p-4 shadow-xl cursor-pointer hover:bg-black/50 transition-all`}
      onClick={onClick}
      initial={{ 
        opacity: 0, 
        x: side === "left" ? -20 : 20, 
        scale: 0.9 
      }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        scale: 1 
      }}
      exit={{ 
        opacity: 0, 
        x: side === "left" ? -20 : 20, 
        scale: 0.9 
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        boxShadow: `0 0 10px ${neonColor.glow}, 0 0 20px ${neonColor.glow}, 0 0 30px ${neonColor.glow}`,
      }}
    >
      {/* 네온 효과 애니메이션 */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
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
        style={{
          border: `1px solid ${neonColor.secondary}`,
          boxShadow: `inset 0 0 10px ${neonColor.glow}`,
        }}
      />

      {/* 말풍선 꼬리 - 좌측/우측에 따라 방향 변경 */}
      <div
        className={`absolute -bottom-3 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[12px] border-l-transparent border-r-transparent ${
          side === "left" ? "left-8" : "right-8"
        }`}
        style={{
          borderTopColor: neonColor.primary,
          filter: `drop-shadow(0 0 8px ${neonColor.glow})`,
        }}
      />

      {/* 닫기 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors z-10"
      >
        <X className="w-4 h-4" />
      </button>

      {/* 알림 내용 */}
      <div className="pr-6 relative z-10">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-lg">{priorityIcons[notification.priority]}</span>
          <div className="flex-1 min-w-0">
            <h4 
              className={`font-semibold text-sm mb-1 truncate ${neonColor.text}`}
              style={{
                textShadow: `0 0 5px ${neonColor.glow}`,
              }}
            >
              {notification.title}
            </h4>
            <p 
              className="text-xs opacity-90 line-clamp-2"
              style={{
                textShadow: `0 0 3px ${neonColor.glow}`,
              }}
            >
              {notification.message}
            </p>
          </div>
        </div>
        <div 
          className="text-xs opacity-75 mt-2"
          style={{
            textShadow: `0 0 3px ${neonColor.glow}`,
          }}
        >
          {notification.memberName}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * 가족 알림 말풍선 패널 컴포넌트
 */
export function FamilyNotificationPanel({
  characterData,
  familyMembers,
  onNotificationClick,
}: FamilyNotificationPanelProps) {
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

  // 알림 데이터 통합
  const allNotifications = useMemo(() => {
    const notifications: NotificationItem[] = [];

    // 생애주기 알림 (high)
    characterData.lifecycleNotifications.high.forEach((n) => {
      notifications.push({
        id: n.id,
        memberId: characterData.member.id,
        memberName: characterData.member.name,
        title: n.title,
        message: n.message,
        priority: "high",
        type: "lifecycle",
      });
    });

    // 생애주기 알림 (medium)
    characterData.lifecycleNotifications.medium.forEach((n) => {
      notifications.push({
        id: n.id,
        memberId: characterData.member.id,
        memberName: characterData.member.name,
        title: n.title,
        message: n.message,
        priority: "normal",
        type: "lifecycle",
      });
    });

    // 생애주기 알림 (low)
    characterData.lifecycleNotifications.low.forEach((n) => {
      notifications.push({
        id: n.id,
        memberId: characterData.member.id,
        memberName: characterData.member.name,
        title: n.title,
        message: n.message,
        priority: "low",
        type: "lifecycle",
      });
    });

    // 리마인드 알림 (urgent)
    characterData.reminders.urgent.forEach((r) => {
      notifications.push({
        id: r.id,
        memberId: characterData.member.id,
        memberName: characterData.member.name,
        title: r.title,
        message: r.description,
        priority: "urgent",
        type: r.type,
      });
    });

    // 리마인드 알림 (upcoming)
    characterData.reminders.upcoming.forEach((r) => {
      notifications.push({
        id: r.id,
        memberId: characterData.member.id,
        memberName: characterData.member.name,
        title: r.title,
        message: r.description,
        priority: "normal",
        type: r.type,
      });
    });

    // 약물 복용 알림 (오늘 체크되지 않은 약물)
    characterData.medications.active.forEach((m) => {
      const isChecked = characterData.medications.todayChecked.includes(m.id);
      if (!isChecked) {
        notifications.push({
          id: `medication-${m.id}`,
          memberId: characterData.member.id,
          memberName: characterData.member.name,
          title: "약물 복용",
          message: `${m.medication_name} 복용 시간입니다`,
          priority: "urgent",
          type: "medication",
        });
      }
    });

    // 예방접종 알림 (다음 예정된 예방접종)
    if (characterData.vaccinations.next) {
      notifications.push({
        id: `vaccination-${characterData.vaccinations.next.id}`,
        memberId: characterData.member.id,
        memberName: characterData.member.name,
        title: "예방접종",
        message: `${characterData.vaccinations.next.vaccine_name} 예방접종 예정입니다`,
        priority: "high",
        type: "vaccination",
      });
    }

    // 건강검진 알림 (다음 예정된 건강검진)
    if (characterData.checkups.next) {
      notifications.push({
        id: `checkup-${characterData.checkups.next.id}`,
        memberId: characterData.member.id,
        memberName: characterData.member.name,
        title: "건강검진",
        message: `${characterData.checkups.next.checkup_type || "건강검진"} 예정입니다`,
        priority: "normal",
        type: "checkup",
      });
    }

    // 우선순위별 정렬 및 닫힌 알림 필터링
    return notifications
      .filter((n) => !dismissedNotifications.has(n.id))
      .sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }, [characterData, dismissedNotifications]);

  const handleDismiss = (notificationId: string) => {
    setDismissedNotifications((prev) => new Set([...prev, notificationId]));
  };

  // 알림을 좌우로 분배 (최대 3개씩)
  const leftNotifications = allNotifications.filter((_, index) => index % 2 === 0).slice(0, 3);
  const rightNotifications = allNotifications.filter((_, index) => index % 2 === 1).slice(0, 3);

  return (
    <>
      {/* 좌측 알림 패널 - Canvas 왼쪽 위에 위치 (3D 뷰어 위에 표시) */}
      <div 
        className="absolute top-4 left-4 pointer-events-auto"
        style={{ zIndex: 1000 }}
      >
        <div className="flex flex-col gap-3 max-w-sm">
          <AnimatePresence>
            {leftNotifications.length === 0 ? null : (
              leftNotifications.map((notification) => (
                <SpeechBubbleCard
                  key={notification.id}
                  notification={notification}
                  onClick={() => onNotificationClick(notification.id)}
                  onClose={() => handleDismiss(notification.id)}
                  side="left"
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 우측 알림 패널 - Canvas 왼쪽 위에 위치 (좌측 알림 패널 아래에 배치) */}
      <div 
        className="absolute top-4 left-4 pointer-events-auto"
        style={{ 
          zIndex: 1000,
          marginTop: leftNotifications.length > 0 ? `${leftNotifications.length * 120}px` : '0px',
        }}
      >
        <div className="flex flex-col gap-3 max-w-sm">
          <AnimatePresence>
            {rightNotifications.length > 0 && (
              rightNotifications.map((notification) => (
                <SpeechBubbleCard
                  key={notification.id}
                  notification={notification}
                  onClick={() => onNotificationClick(notification.id)}
                  onClose={() => handleDismiss(notification.id)}
                  side="left"
                />
              ))
            )}
          </AnimatePresence>

          {/* 알림이 더 많은 경우 표시 */}
          {allNotifications.length > 6 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-black/40 backdrop-blur-md border-2 border-white/20 rounded-2xl p-3 text-white/70 text-xs text-center"
              style={{
                boxShadow: "0 0 10px rgba(255, 255, 255, 0.2)",
              }}
            >
              +{allNotifications.length - 6}개의 알림이 더 있습니다
            </motion.div>
          )}
        </div>
      </div>

      {/* 네온 효과 이벤트 알림 (우측 알림 패널 아래에 위치) */}
      <EventNotificationOverlay />
    </>
  );
}
