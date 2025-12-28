/**
 * @file components/game/threejs/event-notification-overlay.tsx
 * @description 이벤트 알림 오버레이 컴포넌트 (화면 고정 위치)
 *
 * 네온 효과가 들어간 이벤트 알림을 화면에 고정된 위치로 표시합니다.
 * FamilyNotificationPanel 아래에 위치합니다.
 *
 * @dependencies
 * - framer-motion: 애니메이션
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { EventNotification, NotificationPriority } from "./event-notification-bubble";

// 샘플 알림 데이터 (실제로는 API나 상태 관리에서 가져올 수 있음)
const initialNotifications: Array<EventNotification & { priority: NotificationPriority }> = [
  {
    id: "event-1",
    message: "저녁 식사 준비가 필요해요!",
    priority: "urgent",
    position: [0, 0, 0] as [number, number, number],
    familyMember: "엄마",
  },
  {
    id: "event-2",
    message: "숙제를 도와주세요",
    priority: "important",
    position: [0, 0, 0] as [number, number, number],
    familyMember: "나",
  },
  {
    id: "event-3",
    message: "산책 시간이에요!",
    priority: "normal",
    position: [0, 0, 0] as [number, number, number],
    familyMember: "강아지",
  },
];

/**
 * 우선순위별 색상 및 스타일
 */
const priorityStyles = {
  urgent: {
    color: "#ff0000",
    glowColor: "#ff4444",
    borderColor: "#ff6666",
    bgColor: "rgba(255, 0, 0, 0.15)",
  },
  important: {
    color: "#ffaa00",
    glowColor: "#ffcc44",
    borderColor: "#ffdd66",
    bgColor: "rgba(255, 170, 0, 0.15)",
  },
  normal: {
    color: "#00aaff",
    glowColor: "#44ccff",
    borderColor: "#66ddff",
    bgColor: "rgba(0, 170, 255, 0.15)",
  },
};

/**
 * 이벤트 알림 오버레이 컴포넌트
 */
export function EventNotificationOverlay() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showCompleteButton, setShowCompleteButton] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  // 전체화면 및 가로 모드 감지
  useEffect(() => {
    const checkFullscreen = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    const checkOrientation = () => {
      const isLandscapeMode = window.innerWidth > window.innerHeight;
      setIsLandscape(isLandscapeMode);
    };

    checkFullscreen();
    checkOrientation();

    document.addEventListener('fullscreenchange', checkFullscreen);
    document.addEventListener('webkitfullscreenchange', checkFullscreen);
    document.addEventListener('mozfullscreenchange', checkFullscreen);
    document.addEventListener('MSFullscreenChange', checkFullscreen);
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
      document.removeEventListener('webkitfullscreenchange', checkFullscreen);
      document.removeEventListener('mozfullscreenchange', checkFullscreen);
      document.removeEventListener('MSFullscreenChange', checkFullscreen);
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // 알림 완료 처리
  const handleComplete = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    console.log(`✅ 알림 완료: ${id}`);
  };

  // 알림이 없으면 렌더링하지 않음
  if (notifications.length === 0) {
    return null;
  }

  // 가로 전체 모드일 때는 되돌아가기 버튼과 같은 높이(top-4)에, 일반 모드일 때는 FamilyNotificationPanel 아래에 배치
  const topPosition = (isFullscreen && isLandscape) ? '0' : '200px';

  return (
    <div 
      className="absolute top-4 left-4 pointer-events-auto"
      style={{ 
        zIndex: 1000,
        marginTop: topPosition, // 가로 전체 모드일 때는 되돌아가기 버튼과 같은 높이, 일반 모드일 때는 FamilyNotificationPanel 아래에
      }}
    >
      <div className="flex flex-col gap-4 max-w-sm">
        <AnimatePresence>
          {notifications.map((notification) => {
            const style = priorityStyles[notification.priority];
            const isHovered = hoveredId === notification.id;
            const showButton = showCompleteButton.has(notification.id);

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.9 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => {
                  setHoveredId(notification.id);
                  setShowCompleteButton((prev) => new Set([...prev, notification.id]));
                }}
                onHoverEnd={() => setHoveredId(null)}
                onClick={() => setShowCompleteButton((prev) => new Set([...prev, notification.id]))}
                style={{
                  position: "relative",
                  minWidth: "200px",
                  maxWidth: "300px",
                  padding: "12px 16px",
                  backgroundColor: "transparent",
                  border: `2px solid ${style.borderColor}`,
                  borderRadius: "12px",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  boxShadow: `
                    0 0 10px ${style.glowColor},
                    0 0 20px ${style.glowColor},
                    0 0 30px ${style.glowColor},
                    inset 0 0 10px ${style.glowColor}40
                  `,
                  transition: "all 0.3s ease",
                  transform: isHovered ? "scale(1.05)" : "scale(1)",
                  cursor: "pointer",
                }}
              >
                {/* 네온사인 효과 텍스트 */}
                <div
                  style={{
                    color: style.color,
                    fontSize: "14px",
                    fontWeight: "600",
                    textShadow: `
                      0 0 5px ${style.glowColor},
                      0 0 10px ${style.glowColor},
                      0 0 15px ${style.glowColor},
                      0 0 20px ${style.glowColor}
                    `,
                    lineHeight: "1.4",
                    marginBottom: showButton ? "8px" : "0",
                    transition: "margin-bottom 0.3s ease",
                  }}
                >
                  {notification.familyMember && (
                    <div
                      style={{
                        fontSize: "12px",
                        opacity: 0.9,
                        marginBottom: "4px",
                      }}
                    >
                      👤 {notification.familyMember}
                    </div>
                  )}
                  <div>{notification.message}</div>
                </div>

                {/* 완료하기 버튼 */}
                {showButton && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleComplete(notification.id);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      marginTop: "8px",
                      backgroundColor: "transparent",
                      border: `1px solid ${style.borderColor}`,
                      borderRadius: "6px",
                      color: style.color,
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      textShadow: `
                        0 0 5px ${style.glowColor},
                        0 0 10px ${style.glowColor}
                      `,
                      boxShadow: `
                        0 0 10px ${style.glowColor}60,
                        inset 0 0 5px ${style.glowColor}40
                      `,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${style.color}20`;
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    ✓ 완료하기
                  </button>
                )}

                {/* 말풍선 꼬리 (왼쪽) */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "-8px",
                    left: "20px",
                    width: "0",
                    height: "0",
                    borderLeft: "8px solid transparent",
                    borderRight: "8px solid transparent",
                    borderTop: `8px solid ${style.borderColor}`,
                    filter: `drop-shadow(0 0 5px ${style.glowColor})`,
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

