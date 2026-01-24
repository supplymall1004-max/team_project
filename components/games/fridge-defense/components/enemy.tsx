/**
 * @file components/games/fridge-defense/components/enemy.tsx
 * @description 개별 적 컴포넌트
 */

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import type { Enemy as EnemyType } from '@/types/game/fridge-defense';
import { ENEMY_TYPES } from '../utils/game-constants';

export interface EnemyProps {
  enemy: EnemyType;
  boardWidth: number;
  boardHeight: number;
}

export const Enemy = React.memo(function Enemy({
  enemy,
  boardWidth,
  boardHeight,
}: EnemyProps) {
  const enemyX = Math.max(0, Math.min(enemy.x, boardWidth));
  const enemyY = Math.max(0, Math.min(enemy.y, boardHeight));
  const isAttackingTower = enemy.targetTowerId !== null && enemy.targetTowerId !== undefined;
  const enemyType = ENEMY_TYPES[enemy.type];
  const now = Date.now();
  const attackRate = enemyType ? (enemyType.attackRate || 2000) : 2000;
  const timeSinceLastAttack = now - (enemy.lastAttack || 0);
  const isAttacking = isAttackingTower && timeSinceLastAttack < attackRate * 0.4;
  
  // 적 타입별 공격 애니메이션
  const getEnemyAttackAnimation = (): any => {
    if (!isAttacking) return {};
    
    switch (enemy.type) {
      case 'FAST': // 막대사탕: 휘두르기
        return {
          rotate: [0, 30, -30, 0],
          scale: [1, 1.2, 1],
          x: [0, 8, -8, 0],
          transition: {
            duration: 0.35,
            ease: "easeOut" as const
          }
        };
      case 'NORMAL': // 곰팡이: 균 뿌리기
        return {
          scale: [1, 1.15, 0.9, 1],
          y: [0, -5, 3, 0],
          rotate: [0, 10, -10, 0],
          transition: {
            duration: 0.4,
            ease: "easeOut" as const
          }
        };
      case 'TANK': // 포테이토: 던지기
        return {
          scale: [1, 1.3, 1],
          y: [0, -10, 0],
          rotate: [0, 15, -15, 0],
          transition: {
            duration: 0.5,
            ease: "easeOut" as const
          }
        };
      case 'BOSS': // 보스: 강력한 공격
        return {
          scale: [1, 1.4, 0.95, 1.2, 1],
          rotate: [0, 20, -20, 10, 0],
          x: [0, 10, -10, 5, 0],
          y: [0, -8, 5, -3, 0],
          transition: {
            duration: 0.6,
            ease: "easeOut" as const
          }
        };
      default:
        return {
          scale: [1, 1.2, 1],
          transition: { duration: 0.3, ease: "easeOut" as const }
        };
    }
  };
  
  return (
    <motion.div 
      key={enemy.id} 
      className="absolute z-20 pointer-events-none" 
      style={{ 
        left: `${enemyX - 20}px`, 
        top: `${enemyY - 20}px`,
        transform: 'translate(0, 0)',
        transformOrigin: 'center center'
      }}
      animate={isAttacking ? getEnemyAttackAnimation() : {}}
    >
      <span className="text-2xl md:text-3xl filter drop-shadow-md block">{enemy.emoji}</span>
      
      {/* 타워 공격 중 표시 */}
      {isAttackingTower && (
        <motion.div 
          className="absolute -top-2 left-1/2 -translate-x-1/2 text-red-500 text-xs md:text-sm font-bold"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            duration: 0.5, 
            repeat: Infinity,
            ease: "easeInOut" as const
          }}
        >
          ⚔️
        </motion.div>
      )}
      
      {/* 공격 이펙트 (타입별) */}
      {isAttacking && (
        <>
          {enemy.type === 'FAST' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 2],
                rotate: [0, 180, 360]
              }}
              transition={{ duration: 0.35 }}
            >
              <span className="text-lg text-yellow-300">✨</span>
            </motion.div>
          )}
          {enemy.type === 'NORMAL' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0.8, 1.2, 1.5],
                y: [0, -10, -20]
              }}
              transition={{ duration: 0.4 }}
            >
              <span className="text-sm text-green-300">💨</span>
            </motion.div>
          )}
          {enemy.type === 'TANK' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, y: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0.5, 1.2, 1.8],
                y: [0, -15, -30],
                rotate: [0, 360]
              }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-base text-orange-400">💥</span>
            </motion.div>
          )}
          {enemy.type === 'BOSS' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 1, 0.8, 0],
                scale: [0.5, 1.5, 2, 2.5],
                rotate: [0, 180, 360]
              }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-xl text-red-400">🔥</span>
            </motion.div>
          )}
        </>
      )}
      
      {/* HP 바 */}
      <div className="w-6 md:w-8 h-0.5 md:h-1 bg-black/10 rounded-full mt-0.5 md:mt-1 overflow-hidden">
        <div 
          className="h-full bg-red-500 transition-all" 
          style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} 
        />
      </div>
    </motion.div>
  );
});

