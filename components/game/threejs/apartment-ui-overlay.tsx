/**
 * @file components/game/threejs/apartment-ui-overlay.tsx
 * @description 아파트 UI 오버레이 컴포넌트
 *
 * 3D 아파트 화면 위에 표시되는 UI 요소들을 관리합니다.
 * 카메라 리셋 버튼과 알림 패널을 포함합니다.
 *
 * @dependencies
 * - react: useState
 * - framer-motion: 애니메이션
 * - @/components/ui: Button
 * - lucide-react: 아이콘
 * - @/types/character: CharacterData
 * - @/components/game/threejs/family-notification-panel: FamilyNotificationPanel
 */

"use client";

import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CharacterData } from "@/types/character";
import { FamilyNotificationPanel } from "./family-notification-panel";

interface ApartmentUIOverlayProps {
  characterData: CharacterData;
  familyMembers: Array<{
    id: string;
    name: string;
  }>;
  onCameraReset: () => void;
  onNotificationClick: (notificationId: string) => void;
}

/**
 * 아파트 UI 오버레이 컴포넌트
 */
export function ApartmentUIOverlay({
  characterData,
  familyMembers,
  onCameraReset,
  onNotificationClick,
}: ApartmentUIOverlayProps) {
  return (
    <div 
      className="absolute inset-0 pointer-events-none" 
      style={{ zIndex: 1000 }}
    >
      {/* 카메라 리셋 버튼 (우측 상단) - 3D 뷰어 위에 표시 */}
      <div 
        className="absolute top-4 right-4 pointer-events-auto"
        style={{ zIndex: 1001 }}
      >
        <Button
          onClick={onCameraReset}
          className="bg-black/80 hover:bg-black/90 backdrop-blur-md text-white border border-white/30 shadow-xl"
          size="icon"
          title="초기 뷰로 돌아가기"
        >
          <Home className="w-5 h-5" />
        </Button>
      </div>

      {/* 알림 패널 (좌측/우측) - 3D 뷰어 위에 표시 */}
      <FamilyNotificationPanel
        characterData={characterData}
        familyMembers={familyMembers}
        onNotificationClick={onNotificationClick}
      />
    </div>
  );
}

