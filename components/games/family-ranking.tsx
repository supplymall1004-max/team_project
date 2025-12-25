/**
 * @file components/games/family-ranking.tsx
 * @description 가족 랭킹 UI
 *
 * 가족 내 건강 점수 및 활동량 랭킹을 표시하는 UI 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 건강 점수 랭킹 표시
 * 2. 활동량 랭킹 표시
 * 3. 내 순위 하이라이트
 *
 * @dependencies
 * - react: useState, useEffect
 * - framer-motion: 애니메이션
 * - @/components/ui: Card, Badge
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";

interface FamilyMemberRanking {
  memberId: string;
  name: string;
  healthScore: number;
  activityScore: number;
  rank: number;
  isCurrentUser?: boolean;
}

interface FamilyRankingProps {
  memberId?: string;
  rankingType?: "health" | "activity";
}

export function FamilyRanking({ memberId, rankingType = "health" }: FamilyRankingProps) {
  const [rankings, setRankings] = useState<FamilyMemberRanking[]>([]);
  const [loading, setLoading] = useState(true);

  // 랭킹 로드
  const loadRankings = async () => {
    try {
      // TODO: 실제 API 호출로 대체
      // const response = await fetch(`/api/game/family-ranking?type=${rankingType}`);
      // const data = await response.json();
      
      // 임시 데이터
      const mockRankings: FamilyMemberRanking[] = [
        {
          memberId: "1",
          name: "아빠",
          healthScore: 85,
          activityScore: 90,
          rank: 1,
          isCurrentUser: memberId === "1",
        },
        {
          memberId: "2",
          name: "엄마",
          healthScore: 80,
          activityScore: 85,
          rank: 2,
          isCurrentUser: memberId === "2",
        },
        {
          memberId: "3",
          name: "아이",
          healthScore: 75,
          activityScore: 70,
          rank: 3,
          isCurrentUser: memberId === "3",
        },
      ];
      setRankings(mockRankings);
    } catch (error) {
      console.error("랭킹 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRankings();
  }, [rankingType, memberId]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-400" />;
      default:
        return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-blue-500">
        <CardContent className="py-8">
          <div className="text-center text-gray-400">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          가족 랭킹
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rankings.map((member, index) => (
          <motion.div
            key={member.memberId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border-2 ${
              member.isCurrentUser
                ? "bg-blue-500/20 border-blue-500"
                : "bg-gray-800/50 border-gray-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center">
                  {getRankIcon(member.rank)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{member.name}</span>
                    {member.isCurrentUser && (
                      <Badge variant="outline" className="text-xs">
                        나
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {rankingType === "health"
                      ? `건강 점수: ${member.healthScore}점`
                      : `활동 점수: ${member.activityScore}점`}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-400">
                  {rankingType === "health"
                    ? member.healthScore
                    : member.activityScore}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

