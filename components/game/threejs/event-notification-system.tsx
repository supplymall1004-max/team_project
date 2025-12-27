/**
 * @file components/game/threejs/event-notification-system.tsx
 * @description 이벤트 알림 시스템 컴포넌트
 *
 * 가족 구성원들의 이벤트 알림을 관리하고 표시합니다.
 * - 여러 알림 동시 표시
 * - 우선순위별 색상 구분
 * - 완료 시 알림 제거
 *
 * @dependencies
 * - @react-three/drei: Html
 * - @react-three/fiber: useFrame
 */

"use client";

import { useState, useEffect } from "react";
import { EventNotificationBubble, type EventNotification, type NotificationPriority } from "./event-notification-bubble";

// 샘플 알림 데이터 (실제로는 API나 상태 관리에서 가져올 수 있음)
// 카메라가 아파트 내부 중앙에 있으므로, 카메라 시야 안에 배치
const initialNotifications: EventNotification[] = [
  {
    id: "1",
    message: "저녁 식사 준비가 필요해요!",
    priority: "urgent",
    position: [0, 1.5, -1] as [number, number, number], // 카메라 앞쪽, 약간 위
    familyMember: "엄마",
  },
  {
    id: "2",
    message: "숙제를 도와주세요",
    priority: "important",
    position: [-1.5, 1.2, -0.5] as [number, number, number], // 왼쪽, 약간 위
    familyMember: "나",
  },
  {
    id: "3",
    message: "산책 시간이에요!",
    priority: "normal",
    position: [1.5, 1, -0.5] as [number, number, number], // 오른쪽, 약간 위
    familyMember: "강아지",
  },
];

/**
 * 이벤트 알림 시스템 컴포넌트
 */
export function EventNotificationSystem() {
  const [notifications, setNotifications] = useState<EventNotification[]>(initialNotifications);

  // 알림 완료 처리
  const handleComplete = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    console.log(`✅ 알림 완료: ${id}`);
  };

  // 디버깅: 알림 상태 확인
  console.log("🔔 알림 시스템 상태:", {
    notificationsCount: notifications.length,
    notifications: notifications.map((n) => ({
      id: n.id,
      message: n.message,
      position: n.position,
    })),
  });

  // 알림이 없으면 렌더링하지 않음
  if (notifications.length === 0) {
    return null;
  }

  return (
    <>
      {notifications.map((notification) => (
        <EventNotificationBubble
          key={notification.id}
          notification={notification}
          onComplete={handleComplete}
        />
      ))}
    </>
  );
}

