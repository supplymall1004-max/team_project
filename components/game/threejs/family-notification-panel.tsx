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
 * 말풍선 스타일 알림 카드 컴포넌트
 */
function SpeechBubbleCard({
  notification,
  onClick,
  onClose,
}: {
  notification: NotificationItem;
  onClick: () => void;
  onClose: () => void;
}) {
  const priorityColors = {
    urgent: "border-red-400/50 text-red-100",
    high: "border-orange-400/50 text-orange-100",
    normal: "border-yellow-400/50 text-yellow-100",
    low: "border-blue-400/50 text-blue-100",
  };

  const priorityIcons = {
    urgent: "🔴",
    high: "🟠",
    normal: "🟡",
    low: "🔵",
  };

  return (
    <motion.div
      className={`relative bg-white/10 backdrop-blur-md border-2 ${priorityColors[notification.priority]} rounded-2xl p-4 shadow-xl cursor-pointer hover:bg-white/15 transition-all`}
      onClick={onClick}
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* 말풍선 꼬리 */}
      <div
        className={`absolute -bottom-3 right-8 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[12px] border-l-transparent border-r-transparent border-t-white/10`}
      />

      {/* 닫기 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* 알림 내용 */}
      <div className="pr-6">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-lg">{priorityIcons[notification.priority]}</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1 truncate">{notification.title}</h4>
            <p className="text-xs opacity-90 line-clamp-2">{notification.message}</p>
          </div>
        </div>
        <div className="text-xs opacity-75 mt-2">
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

  // 최대 3개까지만 표시
  const visibleNotifications = allNotifications.slice(0, 3);

  return (
    <div className="absolute top-20 right-4 z-50 pointer-events-auto">
      <div className="flex flex-col gap-3 max-w-sm">
        <AnimatePresence>
          {visibleNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl p-4 text-white/70 text-sm text-center"
            >
              <Bell className="w-5 h-5 mx-auto mb-2 opacity-50" />
              <p>현재 알림이 없습니다</p>
            </motion.div>
          ) : (
            visibleNotifications.map((notification, index) => (
              <SpeechBubbleCard
                key={notification.id}
                notification={notification}
                onClick={() => onNotificationClick(notification.id)}
                onClose={() => handleDismiss(notification.id)}
              />
            ))
          )}
        </AnimatePresence>

        {/* 알림이 더 많은 경우 표시 */}
        {allNotifications.length > 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl p-3 text-white/70 text-xs text-center"
          >
            +{allNotifications.length - 3}개의 알림이 더 있습니다
          </motion.div>
        )}
      </div>
    </div>
  );
}
