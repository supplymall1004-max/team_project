/**
 * @file components/games/fridge-defense/components/status-bar.tsx
 * @description 게임 상단 상태바 컴포넌트
 */

"use client";

import React from 'react';
import { Heart, Coins, Play, Pause, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TowerType } from '@/types/game/fridge-defense';
import { TOWERS_DATA } from '../utils/game-constants';

export interface StatusBarProps {
  gold: number;
  lives: number;
  wave: number;
  isPlaying: boolean;
  isGameOver: boolean;
  todayDiet: TowerType[];
  onStartGame: () => void;
  onTogglePlay: () => void;
  isFullscreen?: boolean;
}

export const StatusBar = React.memo(function StatusBar({
  gold,
  lives,
  wave,
  isPlaying,
  isGameOver,
  todayDiet,
  onStartGame,
  onTogglePlay,
  isFullscreen = false,
}: StatusBarProps) {
  console.log('[StatusBar] 렌더링');
  
  return (
    <div className={`w-full bg-gradient-to-r from-[#2d3748] to-[#1a202c] border-b-4 border-[#4a5568] flex items-center justify-between flex-wrap gap-2 z-50 ${isFullscreen ? 'px-2 py-1.5' : 'px-4 py-3'}`}>
      {/* 왼쪽: 골드 및 체력 */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 골드 */}
        <div className={`flex items-center gap-1.5 bg-[#2d3748] rounded-lg border-2 border-[#4a5568] shadow-lg ${isFullscreen ? 'px-2 py-1' : 'px-4 py-2'}`}>
          <Coins className={`text-yellow-400 ${isFullscreen ? 'w-4 h-4' : 'w-5 h-5'}`} />
          <span className={`text-white font-black ${isFullscreen ? 'text-xs' : 'text-sm md:text-base'}`}>Family Treasure:</span>
          <span className={`text-yellow-400 font-black ${isFullscreen ? 'text-sm' : 'text-base md:text-lg'}`}>{gold.toLocaleString()}G</span>
        </div>
        
        {/* 체력 및 웨이브 */}
        <div className={`flex items-center gap-1.5 bg-[#2d3748] rounded-lg border-2 border-[#4a5568] shadow-lg ${isFullscreen ? 'px-2 py-1' : 'px-4 py-2'}`}>
          <Heart className={`text-red-500 ${isFullscreen ? 'w-4 h-4' : 'w-5 h-5'}`} />
          <span className={`text-white font-black ${isFullscreen ? 'text-xs' : 'text-sm md:text-base'}`}>Defense Health:</span>
          <span className={`text-red-400 font-black ${isFullscreen ? 'text-sm' : 'text-base md:text-lg'}`}>{lives}</span>
          <span className={`text-gray-400 ${isFullscreen ? 'mx-1' : 'mx-2'}`}>|</span>
          <span className={`text-white font-black ${isFullscreen ? 'text-xs' : 'text-sm md:text-base'}`}>Wave:</span>
          <span className={`text-blue-400 font-black ${isFullscreen ? 'text-sm' : 'text-base md:text-lg'}`}>{wave}</span>
        </div>

        {/* 버프 상태 (오늘의 식단이 있으면) */}
        {todayDiet.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-1.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg border-2 border-yellow-400 shadow-lg ${isFullscreen ? 'px-2 py-1' : 'px-4 py-2'}`}
          >
            <Sparkles className={`text-yellow-300 ${isFullscreen ? 'w-3 h-3' : 'w-4 h-4'}`} />
            <span className={`text-white font-black uppercase ${isFullscreen ? 'text-[10px]' : 'text-xs md:text-sm'}`}>Meal Buff Active!</span>
            <div className="flex gap-0.5">
              {todayDiet.map((type, idx) => (
                <span key={idx} className={isFullscreen ? 'text-sm' : 'text-lg'}>{TOWERS_DATA[type].emoji}</span>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* 오른쪽: 스테이지 및 컨트롤 */}
      <div className={`flex items-center ${isFullscreen ? 'gap-1.5' : 'gap-3'}`}>
        {/* 스테이지 표시 */}
        <div className={`bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg border-2 border-yellow-300 shadow-lg ${isFullscreen ? 'px-2 py-1' : 'px-4 py-2'}`}>
          <span className={`text-black font-black uppercase ${isFullscreen ? 'text-xs' : 'text-sm md:text-base'}`}>Stage {wave}</span>
        </div>

        {/* 게임 컨트롤 버튼 */}
        <div className={`flex items-center bg-[#2d3748] rounded-lg border-2 border-[#4a5568] ${isFullscreen ? 'px-1 py-0.5' : 'px-2 py-1'}`}>
          <button
            onClick={() => {
              if (!isPlaying && !isGameOver) {
                onStartGame();
              } else if (isPlaying) {
                onTogglePlay();
              }
            }}
            className={`bg-green-600 hover:bg-green-700 rounded flex items-center justify-center transition-all active:scale-95 ${isFullscreen ? 'w-6 h-6' : 'w-8 h-8'}`}
          >
            {!isPlaying && !isGameOver ? (
              <Play className={`text-white ${isFullscreen ? 'w-3 h-3 ml-0.5' : 'w-4 h-4 ml-0.5'}`} />
            ) : isPlaying ? (
              <Pause className={`text-white ${isFullscreen ? 'w-3 h-3' : 'w-4 h-4'}`} />
            ) : (
              <Play className={`text-white ${isFullscreen ? 'w-3 h-3 ml-0.5' : 'w-4 h-4 ml-0.5'}`} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

