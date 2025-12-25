/**
 * @file components/games/badge-gallery.tsx
 * @description 배지 갤러리 확장 UI
 *
 * 수집한 배지 갤러리를 표시하는 UI 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 수집한 배지 목록 표시
 * 2. 미수집 배지 표시 (흐릿하게)
 * 3. 배지 상세 정보 표시
 * 4. 배지 획득 조건 표시
 *
 * @dependencies
 * - react: useState, useEffect
 * - framer-motion: 애니메이션
 * - @/components/ui: Card
 * - @/lib/health/gamification: BADGES, UserGamificationData
 * - @/lib/game/collection-system: calculateCollectionProgress
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Lock, Sparkles } from "lucide-react";
import { BADGES, type Badge, type UserGamificationData } from "@/lib/health/gamification";
import { calculateCollectionProgress } from "@/lib/game/collection-system";

interface BadgeGalleryProps {
  gamificationData?: UserGamificationData;
  onBadgeClick?: (badge: Badge) => void;
}

export function BadgeGallery({ gamificationData, onBadgeClick }: BadgeGalleryProps) {
  const [earnedBadges, setEarnedBadges] = useState<Set<string>>(new Set());
  const [internalGamificationData, setInternalGamificationData] = useState<UserGamificationData | null>(null);
  const [loading, setLoading] = useState(!gamificationData);

  // gamificationData가 없으면 API에서 가져오기
  useEffect(() => {
    if (gamificationData) {
      setInternalGamificationData(gamificationData);
      setLoading(false);
      return;
    }

    const fetchGamificationData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/health/gamification');
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setInternalGamificationData(result.data);
          }
        }
      } catch (error) {
        console.error('게임화 데이터 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGamificationData();
  }, [gamificationData]);

  useEffect(() => {
    const data = gamificationData || internalGamificationData;
    if (data) {
      setEarnedBadges(new Set(data.badges));
    }
  }, [gamificationData, internalGamificationData]);

  // 배지 획득 여부 확인
  const isBadgeEarned = (badge: Badge): boolean => {
    if (earnedBadges.has(badge.id)) return true;
    const data = gamificationData || internalGamificationData;
    if (data && badge.condition(data)) {
      return true;
    }
    return false;
  };

  const earnedCount = BADGES.filter((b) => isBadgeEarned(b)).length;
  const totalCount = BADGES.length;
  const progress = calculateCollectionProgress(earnedCount, totalCount);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-yellow-500">
        <CardContent className="py-8">
          <div className="text-center text-gray-400">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-yellow-500">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            배지 갤러리
          </div>
          <div className="text-sm text-gray-400">
            {earnedCount} / {totalCount} ({progress}%)
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {BADGES.map((badge, index) => {
            const isEarned = isBadgeEarned(badge);

            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onBadgeClick?.(badge)}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isEarned
                    ? "border-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20"
                    : "border-gray-700 bg-gray-800/50 opacity-50"
                }`}
              >
                {!isEarned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <Lock className="w-8 h-8 text-gray-500" />
                  </div>
                )}

                {isEarned && (
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute top-2 right-2"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                  </motion.div>
                )}

                <div className="text-center">
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <h3 className="font-bold text-sm mb-1 text-white">{badge.name}</h3>
                  <p className="text-xs text-gray-400">{badge.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

