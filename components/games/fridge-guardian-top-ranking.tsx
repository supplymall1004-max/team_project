/**
 * @file components/games/fridge-guardian-top-ranking.tsx
 * @description 냉장고 파수꾼 게임 상위 3위 랭킹 컴포넌트
 * 
 * 게임 점수 상위 1~3위만 표시하는 간단한 컴포넌트입니다.
 */

"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useAuth } from '@clerk/nextjs';
import { getFamilyRanking } from '@/lib/games/fridge-guardian/supabase';
import { formatScore } from '@/lib/games/fridge-guardian/utils';

interface RankingEntry {
  userId: string;
  userName: string;
  score: number;
  playedAt: string;
  rank: number;
  isCurrentUser: boolean;
}

export function FridgeGuardianTopRanking() {
  const { userId } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadRankings();
    }
  }, [userId]);

  const loadRankings = async () => {
    try {
      setLoading(true);
      
      // 상위 3위만 조회
      const rankingData = await getFamilyRanking(supabase, userId!, 3);
      setRankings(rankingData.slice(0, 3)); // 최대 3개만 표시
      
      console.log('[FridgeGuardianTopRanking] 상위 3위 로드 완료:', rankingData);
    } catch (error) {
      console.error('[FridgeGuardianTopRanking] 랭킹 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="relative">
          <Trophy className="text-yellow-500" size={32} fill="currentColor" />
          <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-black text-yellow-700">1</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="relative">
          <Medal className="text-gray-400" size={32} fill="currentColor" />
          <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-black text-gray-600">2</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="relative">
          <Award className="text-orange-500" size={32} fill="currentColor" />
          <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-black text-orange-700">3</span>
        </div>
      );
    }
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600 border-yellow-300';
    if (rank === 2) return 'from-gray-300 to-gray-500 border-gray-400';
    if (rank === 3) return 'from-orange-400 to-orange-600 border-orange-300';
    return 'from-gray-200 to-gray-400 border-gray-300';
  };

  if (loading) {
    return (
      <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Trophy className="text-yellow-500" size={24} />
          상위 랭킹
        </h2>
        <div className="text-center py-8 text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Trophy className="text-yellow-500" size={24} />
          상위 랭킹
        </h2>
        <div className="text-center py-8 text-gray-500">
          아직 랭킹이 없습니다.<br />
          <span className="text-sm">게임을 플레이하여 첫 번째 기록을 남겨보세요!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Trophy className="text-yellow-500" size={24} />
        상위 랭킹
      </h2>
      
      <div className="space-y-4">
        {rankings.map((entry, index) => (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative overflow-hidden rounded-xl p-4 bg-gradient-to-r ${getRankColor(entry.rank)} border-2 shadow-lg`}
          >
            <div className="flex items-center gap-4">
              {/* 순위 아이콘 */}
              <div className="flex-shrink-0">
                {getRankIcon(entry.rank)}
              </div>
              
              {/* 사용자 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-white text-lg sm:text-xl truncate">
                    {entry.userName}
                  </h3>
                  {entry.isCurrentUser && (
                    <span className="px-2 py-0.5 bg-white/30 rounded-full text-xs font-bold text-white">
                      나
                    </span>
                  )}
                </div>
                <p className="text-white/80 text-xs sm:text-sm">
                  {new Date(entry.playedAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              
              {/* 점수 */}
              <div className="flex-shrink-0 text-right">
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {formatScore(entry.score)}
                </div>
                <div className="text-white/80 text-xs sm:text-sm">점</div>
              </div>
            </div>
            
            {/* 장식 효과 */}
            {entry.rank === 1 && (
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
            )}
          </motion.div>
        ))}
      </div>
      
      {rankings.length < 3 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          {rankings.length === 1 && '2위와 3위를 노려보세요! 🎯'}
          {rankings.length === 2 && '3위를 노려보세요! 🎯'}
        </div>
      )}
    </div>
  );
}

