/**
 * @file components/games/fridge-defense/components/tower.tsx
 * @description 개별 타워 컴포넌트
 */

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { Tower as TowerType } from '@/types/game/fridge-defense';
import { TOWERS_DATA } from '../utils/game-constants';

export interface TowerProps {
  tower: TowerType;
  index: number;
  selectedIndex: number | null;
  isAttacking: boolean;
  hasDietBuff: boolean;
  boardWidth: number;
  boardHeight: number;
  onClick: (index: number) => void;
}

export const Tower = React.memo(function Tower({
  tower,
  index,
  selectedIndex,
  isAttacking,
  hasDietBuff,
  boardWidth,
  boardHeight,
  onClick,
}: TowerProps) {
  const towerX = Math.max(30, Math.min(tower.x, boardWidth - 30));
  const towerY = Math.max(30, Math.min(tower.y, boardHeight - 30));
  const towerData = TOWERS_DATA[tower.type];
  
  // 애니메이션 variants
  const getAnimationVariants = (): any => {
    if (!isAttacking) return {};
    
    if (towerData.attackType === 'MELEE') {
      // 닭다리: 회전 애니메이션 (칼처럼 휘두르기)
      return {
        rotate: [0, 45, -20, 0],
        scale: [1, 1.2, 1],
        x: [0, 5, -3, 0],
        y: [0, -3, 2, 0],
        transition: {
          duration: 0.4,
          ease: "easeOut" as const
        }
      };
    } else if (towerData.attackType === 'AOE') {
      // 브로콜리: 위아래 움직임 (때리기)
      return {
        y: [0, -15, 10, 0],
        scale: [1, 1.15, 0.95, 1],
        rotate: [0, -5, 5, 0],
        transition: {
          duration: 0.4,
          ease: "easeOut" as const
        }
      };
    }
    return {};
  };
  
  return (
    <motion.div 
      data-tower-id={tower.id}
      onClick={(e) => {
        e.stopPropagation();
        onClick(index);
      }} 
      className={`absolute flex flex-col items-center cursor-pointer p-1.5 md:p-2 rounded-xl md:rounded-2xl touch-manipulation z-10 ${
        selectedIndex === index ? 'bg-white/30 ring-2 ring-blue-400' : ''
      }`} 
      style={{ 
        left: `${towerX - 30}px`, 
        top: `${towerY - 30}px`,
        transformOrigin: 'center center',
      }}
      animate={isAttacking ? getAnimationVariants() : {}}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* 타워 HP바 (상단) */}
      {tower.hp < tower.maxHp && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 md:w-16 h-1.5 md:h-2 bg-black/20 rounded-full overflow-hidden z-30">
          <motion.div 
            className={`h-full transition-colors ${
              (tower.hp / tower.maxHp) > 0.6 ? 'bg-green-500' : 
              (tower.hp / tower.maxHp) > 0.3 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${(tower.hp / tower.maxHp) * 100}%` }}
            initial={{ width: `${(tower.hp / tower.maxHp) * 100}%` }}
            animate={{ width: `${(tower.hp / tower.maxHp) * 100}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      )}
      
      {/* 버프 표시 */}
      {hasDietBuff && (
        <Sparkles className="text-yellow-400 absolute -top-1 md:-top-2" size={10} />
      )}
      
      {/* 타워 이모지 */}
      <motion.span 
        className="text-3xl md:text-4xl drop-shadow-xl"
        animate={isAttacking && towerData.attackType === 'MELEE' ? {
          rotate: [0, 60, -30, 0],
          transition: { duration: 0.4, ease: "easeOut" }
        } : {}}
      >
        {tower.emoji}
      </motion.span>
      
      {/* 레벨 표시 */}
      <span className="text-[7px] md:text-[8px] font-black text-blue-900 mt-0.5 md:mt-1 uppercase">Lv.{tower.level}</span>
      
      {/* 타워 HP 바 (하단) */}
      {tower.hp < tower.maxHp && (
        <div className="w-full max-w-[40px] h-1 bg-black/20 rounded-full mt-0.5 overflow-hidden border border-white/20">
          <div
            className={`h-full transition-all ${
              tower.hp / tower.maxHp > 0.5 ? 'bg-green-500' : tower.hp / tower.maxHp > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${(tower.hp / tower.maxHp) * 100}%` }}
          />
        </div>
      )}
      
      {/* 공격 타입 표시 */}
      <span className="text-[6px] md:text-[7px] font-bold text-gray-600 mt-0.5">
        {towerData.attackType === 'MELEE' ? '⚔️' : towerData.attackType === 'AOE' ? '💥' : '🎯'}
      </span>
    </motion.div>
  );
});

