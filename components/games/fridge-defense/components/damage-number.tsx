/**
 * @file components/games/fridge-defense/components/damage-number.tsx
 * @description 데미지 숫자 팝업 컴포넌트
 */

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import type { DamageNumber as DamageNumberType } from '@/types/game/fridge-defense';

export interface DamageNumberProps {
  damageNumber: DamageNumberType;
  boardWidth: number;
  boardHeight: number;
}

export const DamageNumber = React.memo(function DamageNumber({
  damageNumber,
  boardWidth,
  boardHeight,
}: DamageNumberProps) {
  const padding = 20;
  const damageX = Math.max(padding, Math.min(damageNumber.x, boardWidth - padding));
  const damageY = Math.max(padding, Math.min(damageNumber.y, boardHeight - padding));
  const displayVal = Math.abs(damageNumber.val);
  
  // 유효한 위치인지 확인
  if (damageX < 0 || damageX > boardWidth || damageY < 0 || damageY > boardHeight) {
    return null;
  }
  
  return (
    <motion.span 
      key={damageNumber.id} 
      initial={{ opacity: 1, y: damageY, scale: 0.8 }} 
      animate={{ opacity: 0, y: damageY - 50, scale: 1.2 }} 
      transition={{ duration: 1, ease: "easeOut" }}
      className={`absolute font-black text-sm md:text-lg z-50 pointer-events-none drop-shadow-lg ${
        damageNumber.isTowerDamage ? 'text-yellow-500' : 'text-red-600'
      }`}
      style={{ 
        left: `${damageX}px`, 
        top: `${damageY}px`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      -{displayVal}
    </motion.span>
  );
});

