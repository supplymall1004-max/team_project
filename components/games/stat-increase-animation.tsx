/**
 * @file components/games/stat-increase-animation.tsx
 * @description 스탯 증가 애니메이션 컴포넌트
 *
 * 캐릭터의 스탯 증가를 시각적으로 표현하는 애니메이션 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 숫자 카운트업 애니메이션
 * 2. 스탯 증가 시각 효과
 * 3. 보상 포인트 표시
 *
 * @dependencies
 * - react: useState, useEffect
 * - framer-motion: 애니메이션
 * - @/components/ui: Card
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Sparkles } from "lucide-react";

interface StatIncreaseAnimationProps {
  statName: string;
  oldValue: number;
  newValue: number;
  unit?: string;
  rewardPoints?: number;
  onComplete?: () => void;
  duration?: number; // 애니메이션 지속 시간 (ms)
}

export function StatIncreaseAnimation({
  statName,
  oldValue,
  newValue,
  unit = "",
  rewardPoints,
  onComplete,
  duration = 2000,
}: StatIncreaseAnimationProps) {
  const [currentValue, setCurrentValue] = useState(oldValue);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const increment = (newValue - oldValue) / (duration / 16); // 60fps 기준
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 이징 함수 적용 (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const value = oldValue + (newValue - oldValue) * easedProgress;

      setCurrentValue(Math.floor(value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrentValue(newValue);
        setTimeout(() => {
          setShow(false);
          onComplete?.();
        }, 1000);
      }
    };

    requestAnimationFrame(animate);
  }, [oldValue, newValue, duration, onComplete]);

  if (!show) return null;

  const increase = newValue - oldValue;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.8 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-none"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-gradient-to-br from-green-900/95 to-emerald-900/95 border-4 border-green-500 rounded-lg p-6 shadow-2xl text-center min-w-[300px]"
        >
          {/* 스탯 이름 */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-4"
          >
            <h3 className="text-xl font-bold text-white mb-2">{statName}</h3>
            <div className="flex items-center justify-center gap-2 text-green-400">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm">증가!</span>
            </div>
          </motion.div>

          {/* 숫자 카운트업 */}
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="mb-4"
          >
            <div className="text-5xl font-bold text-green-400">
              {currentValue.toLocaleString()}
              {unit && <span className="text-2xl ml-2">{unit}</span>}
            </div>
            {increase > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-yellow-400 mt-2"
              >
                +{increase.toLocaleString()}
                {unit && <span className="text-lg ml-1">{unit}</span>}
              </motion.div>
            )}
          </motion.div>

          {/* 보상 포인트 */}
          {rewardPoints && rewardPoints > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-2 text-yellow-400"
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-lg font-bold">
                보상: {rewardPoints} 포인트 획득!
              </span>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * 인라인 스탯 증가 표시 컴포넌트 (팝업 없이)
 */
interface InlineStatIncreaseProps {
  oldValue: number;
  newValue: number;
  unit?: string;
  className?: string;
}

export function InlineStatIncrease({
  oldValue,
  newValue,
  unit = "",
  className,
}: InlineStatIncreaseProps) {
  const [currentValue, setCurrentValue] = useState(oldValue);

  useEffect(() => {
    const duration = 1000;
    const increment = (newValue - oldValue) / (duration / 16);
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const value = oldValue + (newValue - oldValue) * easedProgress;

      setCurrentValue(Math.floor(value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrentValue(newValue);
      }
    };

    requestAnimationFrame(animate);
  }, [oldValue, newValue]);

  const increase = newValue - oldValue;

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      <span className="text-white">{currentValue.toLocaleString()}</span>
      {unit && <span className="text-gray-400 ml-1">{unit}</span>}
      {increase > 0 && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-green-400 ml-2 font-bold"
        >
          +{increase.toLocaleString()}
        </motion.span>
      )}
    </motion.span>
  );
}

