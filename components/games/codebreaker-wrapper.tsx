/**
 * @file components/games/codebreaker-wrapper.tsx
 * @description 코드 브레이커 게임 래퍼 컴포넌트
 * 
 * 게임과 게임 정보를 함께 표시하는 통합 컴포넌트입니다.
 */

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import CodebreakerGame from './codebreaker-game';
import { CodebreakerGameInfo } from './codebreaker-game-info';

export function CodebreakerWrapper() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8" suppressHydrationWarning>
      <div className="container mx-auto">
        {/* 게임 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          suppressHydrationWarning
        >
          <CodebreakerGame />
        </motion.div>

        {/* 게임 정보 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          suppressHydrationWarning
        >
          <CodebreakerGameInfo />
        </motion.div>
      </div>
    </div>
  );
}

