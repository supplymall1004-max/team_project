/**
 * @file components/game/character-game-placeholder.tsx
 * @description Unity 게임 플레이스홀더 컴포넌트
 *
 * Unity 게임이 없을 때 표시되는 플레이스홀더입니다.
 * 게임 이벤트 시스템은 Unity 없이도 정상 작동합니다.
 *
 * @dependencies
 * - @/components/ui: shadcn 컴포넌트
 * - @/components/game/character-game-canvas: 2D 게임 캔버스
 */

"use client";

import { Home, Users, Heart, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CharacterGameCanvas } from "./character-game-canvas";
import type { CharacterData } from "@/types/character";

interface CharacterGamePlaceholderProps {
  characterName: string;
  characterData?: CharacterData;
  onCharacterClick?: () => void;
  onEventTrigger?: (eventType: string) => void;
}

/**
 * Unity 게임 플레이스홀더 컴포넌트
 */
export function CharacterGamePlaceholder({
  characterName,
  characterData,
  onCharacterClick,
  onEventTrigger,
}: CharacterGamePlaceholderProps) {
  // characterData가 있으면 2D 게임 캔버스 표시
  if (characterData) {
    return (
      <div className="relative w-full h-[600px] rounded-lg overflow-hidden border-2 border-green-400/50 shadow-2xl">
        <CharacterGameCanvas
          characterData={characterData}
          onCharacterClick={onCharacterClick}
          onEventTrigger={onEventTrigger}
        />
      </div>
    );
  }

  // characterData가 없으면 기본 플레이스홀더 표시
  return (
    <div className="relative w-full h-[600px] bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-lg overflow-hidden">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)`,
        }} />
      </div>

      {/* 중앙 콘텐츠 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center">
        {/* 집 아이콘 */}
        <div className="mb-8">
          <div className="relative">
            <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center border-2 border-green-400/30">
              <Home className="w-16 h-16 text-green-400" />
            </div>
            {/* 펄스 애니메이션 */}
            <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" />
          </div>
        </div>

        {/* 제목 */}
        <h2 className="text-3xl font-bold text-white mb-2">
          {characterName}의 집
        </h2>
        <p className="text-gray-400 mb-8">
          Unity 게임이 준비되면 여기에 표시됩니다
        </p>

        {/* 정보 카드 */}
        <div className="grid grid-cols-2 gap-4 max-w-md w-full">
          <Card className="bg-gray-800/50 border-gray-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-400">가족 구성원</p>
                <p className="text-sm font-semibold text-white">활동 중</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-400">건강 관리</p>
                <p className="text-sm font-semibold text-white">실시간</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-400">이벤트</p>
                <p className="text-sm font-semibold text-white">활성화</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-400">게임 시스템</p>
                <p className="text-sm font-semibold text-white">작동 중</p>
              </div>
            </div>
          </Card>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-8 max-w-md">
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4">
            <p className="text-sm text-blue-300">
              💡 <strong>게임 이벤트 시스템은 Unity 없이도 정상 작동합니다.</strong>
              <br />
              약물 복용, 분유 시간, 생애주기 이벤트 알림이 계속 작동합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

