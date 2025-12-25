/**
 * @file components/games/family-challenge-panel.tsx
 * @description 가족 챌린지 UI
 *
 * 가족 전체가 함께 참여하는 건강 관리 챌린지를 표시하는 UI 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 가족 챌린지 목록 표시
 * 2. 진행 상황 표시
 * 3. 챌린지 참여
 * 4. 보상 표시
 *
 * @dependencies
 * - react: useState, useEffect
 * - framer-motion: 애니메이션
 * - @/components/ui: Card, Button, Progress
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, Trophy, Calendar, CheckCircle2 } from "lucide-react";

interface FamilyChallenge {
  id: string;
  challengeId: string;
  challengeType: "weekly" | "monthly" | "special";
  title: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
  rewardPoints: number;
  startDate: string;
  endDate: string;
}

interface FamilyChallengePanelProps {
  memberId?: string;
  onChallengeComplete?: (challengeId: string, rewardPoints: number) => void;
}

export function FamilyChallengePanel({
  memberId,
  onChallengeComplete,
}: FamilyChallengePanelProps) {
  const [challenges, setChallenges] = useState<FamilyChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  // 챌린지 로드
  const loadChallenges = async () => {
    try {
      // TODO: 실제 API 호출로 대체
      // const response = await fetch(`/api/game/family-challenges`);
      // const data = await response.json();
      
      // 임시 데이터
      const mockChallenges: FamilyChallenge[] = [
        {
          id: "1",
          challengeId: "weekly_family_walk",
          challengeType: "weekly",
          title: "가족 함께 걷기",
          description: "이번 주 가족 모두가 합쳐서 50,000보를 걸어보세요!",
          progress: 0,
          target: 50000,
          completed: false,
          rewardPoints: 500,
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        },
        {
          id: "2",
          challengeId: "monthly_health_goal",
          challengeType: "monthly",
          title: "월간 건강 목표",
          description: "이번 달 가족 모두가 건강 점수 80점 이상을 달성하세요!",
          progress: 0,
          target: 80,
          completed: false,
          rewardPoints: 1000,
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        },
      ];
      setChallenges(mockChallenges);
    } catch (error) {
      console.error("챌린지 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  // 챌린지 진행 업데이트
  const handleUpdateProgress = async (challenge: FamilyChallenge, newProgress: number) => {
    // TODO: 실제 API 호출로 대체
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === challenge.id
          ? {
              ...c,
              progress: newProgress,
              completed: newProgress >= c.target,
            }
          : c
      )
    );
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-pink-500">
        <CardContent className="py-8">
          <div className="text-center text-gray-400">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-pink-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Users className="w-5 h-5 text-pink-400" />
          가족 챌린지
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {challenges.map((challenge, index) => {
          const progressPercent = Math.min(
            (challenge.progress / challenge.target) * 100,
            100
          );
          const daysLeft = Math.ceil(
            (new Date(challenge.endDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          );

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border-2 ${
                challenge.completed
                  ? "bg-green-500/10 border-green-500"
                  : "bg-gray-800/50 border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-2xl">
                    {challenge.challengeType === "weekly" ? "📅" : "🗓️"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white">{challenge.title}</h3>
                      {challenge.completed && (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{challenge.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                      <span>
                        {challenge.progress} / {challenge.target}
                      </span>
                      <span className="text-pink-400">
                        보상: {challenge.rewardPoints} 포인트
                      </span>
                      <span className="text-yellow-400">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {daysLeft}일 남음
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Progress value={progressPercent} className="h-2 mb-2" />

              {!challenge.completed && (
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleUpdateProgress(
                        challenge,
                        Math.min(challenge.progress + challenge.target * 0.1, challenge.target)
                      )
                    }
                  >
                    참여하기
                  </Button>
                </div>
              )}
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}

