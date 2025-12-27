/**
 * @file components/game/character-game-hud.tsx
 * @description 캐릭터 게임 HUD (Head-Up Display)
 *
 * 게임 화면 상단에 포인트, 경험치, 레벨 등을 표시하는 HUD 컴포넌트입니다.
 *
 * @dependencies
 * - @/components/ui: shadcn 컴포넌트
 * - @/lib/game/level-system: 레벨 시스템
 */

"use client";

import { Coins, Zap, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface CharacterGameHUDProps {
  points?: number;
  experience?: number;
  level?: number;
  experienceToNextLevel?: number;
  energy?: number;
}

/**
 * 캐릭터 게임 HUD 컴포넌트
 */
export function CharacterGameHUD({
  points = 0,
  experience = 0,
  level = 1,
  experienceToNextLevel = 100,
  energy = 100,
}: CharacterGameHUDProps) {

  // 경험치 진행률 계산
  const experienceProgress = experienceToNextLevel > 0 
    ? (experience / experienceToNextLevel) * 100 
    : 100;

  return (
    <div className="w-full px-4 pt-4 pb-2">
      <Card className="bg-amber-900/90 backdrop-blur-sm border-amber-600/50 p-4 shadow-xl">
        <div className="flex flex-wrap justify-between items-start gap-4">
          {/* 포인트 표시 */}
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            <div>
              <div className="text-xs text-amber-200">포인트</div>
              <div className="text-lg font-bold text-amber-50">{points.toLocaleString()}</div>
            </div>
          </div>

          {/* 레벨 및 경험치 */}
          <div className="flex-1 min-w-[200px] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-orange-400" />
                <div>
                  <div className="text-xs text-amber-200">레벨</div>
                  <div className="text-lg font-bold text-amber-50">Lv. {level}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-amber-200">경험치</div>
                <div className="text-sm font-semibold text-amber-50">
                  {experience.toLocaleString()} / {experienceToNextLevel.toLocaleString()}
                </div>
              </div>
            </div>
            <Progress value={experienceProgress} className="h-2 bg-amber-800/50" />
          </div>

          {/* 에너지 */}
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <div>
              <div className="text-xs text-amber-200">에너지</div>
              <div className="text-lg font-bold text-amber-50">{energy}%</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

