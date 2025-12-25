/**
 * @file components/games/weekly-leaderboard.tsx
 * @description 주간 리더보드 UI
 *
 * 주간 리더보드를 표시하는 UI 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 주간 건강 점수 랭킹 표시
 * 2. 주간 활동량 랭킹 표시
 * 3. 주간 퀘스트 완료 랭킹 표시
 * 4. 내 순위 하이라이트
 *
 * @dependencies
 * - react: useState, useEffect
 * - framer-motion: 애니메이션
 * - @/components/ui: Card, Tabs, Badge
 * - @/lib/game/leaderboard: LeaderboardType
 * - @/actions/game/get-leaderboard: getLeaderboard
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp, User } from "lucide-react";
import { getLeaderboard } from "@/actions/game/get-leaderboard";
import type { LeaderboardEntry, LeaderboardType } from "@/lib/game/leaderboard";

interface WeeklyLeaderboardProps {
  memberId?: string;
}

export function WeeklyLeaderboard({ memberId }: WeeklyLeaderboardProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardType>("health_score");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  // 리더보드 로드
  const loadLeaderboard = async (type: LeaderboardType) => {
    setLoading(true);
    try {
      const result = await getLeaderboard({
        type,
        topN: 10,
        includeCurrentUser: true,
      });

      if (result.success && result.entries) {
        setEntries(result.entries);
        setCurrentUserRank(result.currentUserRank || null);
      }
    } catch (error) {
      console.error("리더보드 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard(activeTab);
  }, [activeTab]);

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

  const getTabLabel = (type: LeaderboardType) => {
    switch (type) {
      case "health_score":
        return "건강 점수";
      case "activity":
        return "활동량";
      case "quest_completion":
        return "퀘스트 완료";
    }
  };

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
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="w-5 h-5 text-yellow-400" />
          주간 리더보드
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LeaderboardType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="health_score">건강 점수</TabsTrigger>
            <TabsTrigger value="activity">활동량</TabsTrigger>
            <TabsTrigger value="quest_completion">퀘스트 완료</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <div className="space-y-2">
              {entries.map((entry, index) => {
                const isCurrentUser = currentUserRank?.userId === entry.userId;

                return (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-lg border-2 ${
                      isCurrentUser
                        ? "bg-yellow-500/20 border-yellow-500"
                        : "bg-gray-800/50 border-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center">
                          {getRankIcon(entry.rank)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{entry.userName}</span>
                            {isCurrentUser && (
                              <Badge variant="outline" className="text-xs">
                                <User className="w-3 h-3 mr-1" />
                                나
                              </Badge>
                            )}
                          </div>
                          {entry.change !== undefined && entry.change !== 0 && (
                            <div
                              className={`text-xs ${
                                entry.change > 0 ? "text-green-400" : "text-red-400"
                              }`}
                            >
                              {entry.change > 0 ? "↑" : "↓"} {Math.abs(entry.change)}위
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-yellow-400">
                          {entry.score.toLocaleString()}
                        </div>
                        {activeTab === "health_score" && (
                          <div className="text-xs text-gray-400">점</div>
                        )}
                        {activeTab === "activity" && (
                          <div className="text-xs text-gray-400">보</div>
                        )}
                        {activeTab === "quest_completion" && (
                          <div className="text-xs text-gray-400">개</div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* 현재 사용자 순위 (상위 10명에 없는 경우) */}
            {currentUserRank && !entries.some((e) => e.userId === currentUserRank.userId) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-lg border-2 border-yellow-500 bg-yellow-500/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-500">
                      #{currentUserRank.rank}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">나</span>
                        <Badge variant="outline" className="text-xs">
                          <User className="w-3 h-3 mr-1" />
                          내 순위
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-yellow-400">
                      {currentUserRank.score.toLocaleString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

