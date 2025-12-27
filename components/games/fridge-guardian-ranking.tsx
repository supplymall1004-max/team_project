/**
 * @file components/games/fridge-guardian-ranking.tsx
 * @description 냉장고 파수꾼 게임 랭킹 컴포넌트
 * 
 * 게임 점수 랭킹을 표시하는 컴포넌트입니다.
 */

"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useAuth } from '@clerk/nextjs';
import { getFamilyRanking, getUserHighScore } from '@/lib/games/fridge-guardian/supabase';
import { formatScore } from '@/lib/games/fridge-guardian/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RankingEntry {
  userId: string;
  userName: string;
  score: number;
  playedAt: string;
  rank: number;
  isCurrentUser: boolean;
}

export function FridgeGuardianRanking() {
  const { userId } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [myHighScore, setMyHighScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadRankings();
    }
  }, [userId]);

  const loadRankings = async () => {
    try {
      setLoading(true);
      
      // 랭킹 조회
      const rankingData = await getFamilyRanking(supabase, userId!, 10);
      setRankings(rankingData);
      
      // 내 최고 점수 조회
      const { score } = await getUserHighScore(supabase, userId!);
      setMyHighScore(score);
      
      console.log('[FridgeGuardianRanking] 랭킹 로드 완료:', { rankings: rankingData, myHighScore: score });
    } catch (error) {
      console.error('[FridgeGuardianRanking] 랭킹 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="text-yellow-500" size={24} />;
    if (rank === 2) return <Medal className="text-gray-400" size={24} />;
    if (rank === 3) return <Award className="text-orange-500" size={24} />;
    return <span className="text-gray-400 font-bold">{rank}</span>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>랭킹</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy size={20} />
          냉장고 파수꾼 랭킹
        </CardTitle>
      </CardHeader>
      <CardContent>
        {myHighScore > 0 && (
          <div className="mb-6 p-4 bg-sky-50 rounded-xl border border-sky-200">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <TrendingUp size={16} />
              내 최고 점수
            </div>
            <div className="text-2xl font-black text-sky-600">
              {formatScore(myHighScore)}점
            </div>
          </div>
        )}
        
        {rankings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            아직 랭킹이 없습니다.<br />
            게임을 플레이하여 첫 번째 기록을 남겨보세요!
          </div>
        ) : (
          <div className="space-y-2">
            {rankings.map((entry, index) => (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-4 p-3 rounded-xl ${
                  entry.isCurrentUser 
                    ? 'bg-sky-100 border-2 border-sky-400' 
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex-shrink-0 w-8 flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-800">
                    {entry.userName}
                    {entry.isCurrentUser && <span className="ml-2 text-xs text-sky-600">(나)</span>}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(entry.playedAt).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                <div className="text-lg font-black text-gray-800">
                  {formatScore(entry.score)}점
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        <button
          onClick={loadRankings}
          className="mt-4 w-full py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          새로고침
        </button>
      </CardContent>
    </Card>
  );
}

