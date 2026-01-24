/**
 * @file components/games/fridge-defense/components/projectile.tsx
 * @description 투사체 컴포넌트
 */

"use client";

import React from 'react';
import type { Projectile as ProjectileType } from '@/types/game/fridge-defense';

export interface ProjectileProps {
  projectile: ProjectileType;
}

export const Projectile = React.memo(function Projectile({
  projectile,
}: ProjectileProps) {
  return (
    <div 
      className="absolute w-2 h-2 md:w-3 md:h-3 rounded-full z-15 pointer-events-none shadow-lg" 
      style={{ 
        left: `${projectile.x}px`, 
        top: `${projectile.y}px`,
        backgroundColor: projectile.color,
        boxShadow: `0 0 8px ${projectile.color}`,
      }}
    />
  );
});

