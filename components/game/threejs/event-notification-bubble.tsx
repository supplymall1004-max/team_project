/**
 * @file components/game/threejs/event-notification-bubble.tsx
 * @description 이벤트 알림 말풍선 컴포넌트
 *
 * 게임창 안에 투명한 말풍선으로 가족들의 이벤트 알림을 표시합니다.
 * - 네온사인 효과
 * - 시야를 가리지 않는 배치
 * - 완료하기 버튼으로 알림 해제
 * - 우선순위별 색상 구분
 *
 * @dependencies
 * - @react-three/drei: Html
 * - @react-three/fiber: useFrame
 * - three: Vector3
 */

"use client";

import { useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, Vector3 } from "three";

export type NotificationPriority = "urgent" | "important" | "normal";

export interface EventNotification {
  id: string;
  message: string;
  priority: NotificationPriority;
  position: [number, number, number];
  familyMember?: string; // 가족 구성원 이름
}

interface EventNotificationBubbleProps {
  notification: EventNotification;
  onComplete: (id: string) => void;
}

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
 * 이벤트 알림 말풍선 컴포넌트
 */
export function EventNotificationBubble({
  notification,
  onComplete,
}: EventNotificationBubbleProps) {
  const groupRef = useRef<Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showCompleteButton, setShowCompleteButton] = useState(false);

  // 카메라를 향하도록 회전 (항상 카메라를 바라보도록)
  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
  });

  const style = priorityStyles[notification.priority];

  // 디버깅: 알림 렌더링 확인
  console.log("💬 알림 말풍선 렌더링:", {
    id: notification.id,
    message: notification.message,
    position: notification.position,
    priority: notification.priority,
  });

  return (
    <group ref={groupRef} position={notification.position}>
      <Html
        center
        transform
        distanceFactor={2}
        occlude={false}
        zIndexRange={[100, 0]}
        style={{
          pointerEvents: "auto",
          userSelect: "none",
          zIndex: 1000,
        }}
        onPointerEnter={() => {
          setIsHovered(true);
          setShowCompleteButton(true);
        }}
        onPointerLeave={() => {
          setIsHovered(false);
          if (!showCompleteButton) {
            setShowCompleteButton(false);
          }
        }}
      >
        <div
          style={{
            position: "relative",
            minWidth: "200px",
            maxWidth: "300px",
            padding: "12px 16px",
            backgroundColor: style.bgColor,
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
          onClick={() => setShowCompleteButton(true)}
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
              marginBottom: showCompleteButton ? "8px" : "0",
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
          {showCompleteButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete(notification.id);
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                marginTop: "8px",
                backgroundColor: `${style.color}40`,
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
                e.currentTarget.style.backgroundColor = `${style.color}60`;
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${style.color}40`;
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              ✓ 완료하기
            </button>
          )}

          {/* 말풍선 꼬리 */}
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
        </div>
      </Html>
    </group>
  );
}

