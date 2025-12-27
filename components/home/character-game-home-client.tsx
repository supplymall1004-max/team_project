/**
 * @file components/home/character-game-home-client.tsx
 * @description 홈화면 게임 스타일 캐릭터창 클라이언트 컴포넌트
 *
 * 게임 화면과 건강 알림을 통합하여 표시합니다.
 * 게임 요소는 제거되고 건강 알림 기능만 유지됩니다.
 *
 * @dependencies
 * - @/components/game/character-game-view: 게임 뷰
 * - @/components/health/health-notification-panel: 건강 알림 패널
 */

"use client";

import { CharacterGameView } from "@/components/game/character-game-view";

interface CharacterGameHomeClientProps {
  cards?: any[];
  defaultMemberId?: string;
}

/**
 * 3D 모델링 뷰어만 표시하는 컴포넌트
 */
export function CharacterGameHomeClient({
  cards,
  defaultMemberId,
}: CharacterGameHomeClientProps) {
  return (
    <div className="relative w-full h-full min-h-[800px]" style={{ width: '100vw', height: '100%', minHeight: '800px' }}>
      <CharacterGameView
        userId={""}
        familyMemberId={""}
        characterName={""}
        characterData={undefined}
        showHUD={false}
      />
      
      {/* 모델 출처 정보 - 게임창 맨 아래 */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-50">
        <p className="text-xs text-gray-400/80 text-center px-4">
          <a 
            href="https://skfb.ly/pCV6K" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-gray-300 underline"
          >
            "Modern apartment interior"
          </a>
          {" "}by{" "}
          <a 
            href="https://sketchfab.com/Katydid" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-gray-300 underline"
          >
            Katydid
          </a>
          {" "}is licensed under{" "}
          <a 
            href="http://creativecommons.org/licenses/by/4.0/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-gray-300 underline"
          >
            Creative Commons Attribution
          </a>
        </p>
      </div>
    </div>
  );
}

