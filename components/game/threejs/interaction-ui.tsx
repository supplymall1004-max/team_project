/**
 * @file components/game/threejs/interaction-ui.tsx
 * @description 상호작용 UI 컴포넌트
 *
 * Phase 5: 게임 UI 및 HUD
 * - 상호작용 가능한 오브젝트 하이라이트
 * - 상호작용 프롬프트 (E키로 상호작용 등)
 * - 대화창 UI
 *
 * @dependencies
 * - React: useState, useEffect
 * - Tailwind CSS: 스타일링
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Html } from "@react-three/drei";

interface InteractionUIProps {
  isInteractable?: boolean;
  interactionText?: string;
  interactionKey?: string;
  onInteract?: () => void;
  position?: [number, number, number];
}

/**
 * 상호작용 UI 컴포넌트
 * 상호작용 가능한 오브젝트 근처에 표시되는 프롬프트
 * Canvas 내부에서 사용되므로 Html 컴포넌트로 감싸야 함
 */
export function InteractionUI({
  isInteractable = false,
  interactionText = "상호작용",
  interactionKey = "E",
  onInteract,
  position,
}: InteractionUIProps) {
  const [isKeyPressed, setIsKeyPressed] = useState(false);
  const portalRef = useRef<HTMLElement | null>(null);

  // 클라이언트 사이드에서만 portal 참조 설정
  useEffect(() => {
    if (typeof window !== "undefined") {
      portalRef.current = document.body;
    }
  }, []);

  useEffect(() => {
    if (!isInteractable) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === interactionKey.toLowerCase()) {
        setIsKeyPressed(true);
        onInteract?.();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === interactionKey.toLowerCase()) {
        setIsKeyPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isInteractable, interactionKey, onInteract]);

  if (!isInteractable) {
    return null;
  }

  // Canvas 내부에서 사용되므로 Html 컴포넌트로 감싸서 렌더링
  // position이 제공되면 해당 위치에, 없으면 화면 중앙에 표시
  const content = (
    <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 animate-pulse pointer-events-none">
      {/* SVG 아이콘 대신 텍스트 사용 (Canvas 내부에서 SVG 사용 시 오류 방지) */}
      <span className="text-white text-lg">✋</span>
      <span className="text-white text-sm font-semibold">
        [{interactionKey}] {interactionText}
      </span>
    </div>
  );

  if (position) {
    return (
      <Html position={position} center>
        {content}
      </Html>
    );
  }

  // position이 없으면 화면 중앙에 표시 (카메라 앞에 배치)
  // Html의 portal 옵션을 사용하여 DOM의 다른 위치에 렌더링
  // SSR을 고려하여 portalRef.current가 있을 때만 portal 사용
  return (
    <Html
      position={[0, 0, -5]}
      center
      {...(portalRef.current && { portal: { current: portalRef.current } })}
      transform
      style={{
        pointerEvents: "none",
        zIndex: 20,
      }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      {content}
    </Html>
  );
}

/**
 * 대화창 UI 컴포넌트
 */
interface DialogueUIProps {
  isOpen: boolean;
  speaker?: string;
  message: string;
  onClose?: () => void;
}

export function DialogueUI({
  isOpen,
  speaker = "NPC",
  message,
  onClose,
}: DialogueUIProps) {
  const portalRef = useRef<HTMLElement | null>(null);

  // 클라이언트 사이드에서만 portal 참조 설정
  useEffect(() => {
    if (typeof window !== "undefined") {
      portalRef.current = document.body;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  // Canvas 내부에서 사용되므로 Html 컴포넌트로 감싸서 렌더링
  // SSR을 고려하여 portalRef.current가 있을 때만 portal 사용
  return (
    <Html
      position={[0, -2, -5]}
      center
      {...(portalRef.current && { portal: { current: portalRef.current } })}
      transform
      style={{
        pointerEvents: "auto",
        zIndex: 30,
      }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl"
    >
      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-6 w-full">
        <div className="text-orange-400 text-lg font-bold mb-2">{speaker}</div>
        <div className="text-white text-base leading-relaxed mb-4">{message}</div>
        <div className="text-gray-400 text-sm text-right">
          [Enter] 또는 [ESC]로 닫기
        </div>
      </div>
    </Html>
  );
}

