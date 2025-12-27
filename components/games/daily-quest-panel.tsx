/**
 * @file components/games/daily-quest-panel.tsx
 * @description 일일 퀘스트 패널
 *
 * 일일 퀘스트 목록 및 진행 상황을 표시하는 UI 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 일일 퀘스트 목록 표시
 * 2. 진행 상황 표시
 * 3. 퀘스트 완료 처리
 * 4. 보상 표시
 *
 * @dependencies
 * - react: useState, useEffect
 * - framer-motion: 애니메이션
 * - @/components/ui: Card, Button, Progress
 * - @/lib/game/quest-system: DAILY_QUESTS, calculateQuestProgress
 * - @/actions/game/complete-quest: completeQuest
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Trophy, RefreshCw } from "lucide-react";
import { DAILY_QUESTS, calculateQuestProgress, type Quest } from "@/lib/game/quest-system";
import { refreshAllDailyQuests } from "@/actions/game/auto-update-quests";
import { useAuth } from "@clerk/nextjs";

interface DailyQuestProgress {
  questId: string;
  progress: number;
  completed: boolean;
  completedAt?: string;
}

interface DailyQuestPanelProps {
  memberId?: string;
  onQuestComplete?: (quest: Quest, rewardPoints: number) => void;
}

export function DailyQuestPanel({ memberId, onQuestComplete }: DailyQuestPanelProps) {
  const { userId } = useAuth();
  const [questProgresses, setQuestProgresses] = useState<Map<string, DailyQuestProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 퀘스트 진행 상황 자동 로드 및 주기적 업데이트
  const loadQuestProgresses = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setRefreshing(true);
    try {
      // 모든 일일 퀘스트 자동 새로고침
      const result = await refreshAllDailyQuests(memberId || null);
      
      if (result.success) {
        // 데이터베이스에서 최신 진행 상황 조회
        const today = new Date().toISOString().split("T")[0];
        const response = await fetch(
          `/api/game/daily-quests?date=${today}&memberId=${memberId || ""}`
        );
        
        if (response.ok) {
          const data = await response.json();
          const progresses = new Map<string, DailyQuestProgress>();
          
          DAILY_QUESTS.forEach((quest) => {
            const questData = data.quests?.find((q: any) => q.quest_id === quest.id);
            progresses.set(quest.id, {
              questId: quest.id,
              progress: questData?.progress || 0,
              completed: questData?.completed || false,
              completedAt: questData?.completed_at || undefined,
            });
          });
          
          setQuestProgresses(progresses);
        } else {
          // API가 없으면 기본값 설정
          const progresses = new Map<string, DailyQuestProgress>();
          DAILY_QUESTS.forEach((quest) => {
            progresses.set(quest.id, {
              questId: quest.id,
              progress: 0,
              completed: false,
            });
          });
          setQuestProgresses(progresses);
        }
      }
    } catch (error) {
      console.error("퀘스트 진행 상황 로드 실패:", error);
      // 오류 시 기본값 설정
      const progresses = new Map<string, DailyQuestProgress>();
      DAILY_QUESTS.forEach((quest) => {
        progresses.set(quest.id, {
          questId: quest.id,
          progress: 0,
          completed: false,
        });
      });
      setQuestProgresses(progresses);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, memberId]);

  // 초기 로드 및 주기적 업데이트
  useEffect(() => {
    loadQuestProgresses();
    
    // 30초마다 자동으로 업데이트
    const interval = setInterval(loadQuestProgresses, 30000);
    
    return () => clearInterval(interval);
  }, [loadQuestProgresses]);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-purple-500">
        <CardContent className="py-8">
          <div className="text-center text-gray-400">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-purple-500">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-400" />
            일일 퀘스트
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadQuestProgresses}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAILY_QUESTS.map((quest, index) => {
          const progress = questProgresses.get(quest.id) || {
            questId: quest.id,
            progress: 0,
            completed: false,
          };
          const progressPercent = calculateQuestProgress(progress.progress, quest.target);

          return (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border-2 ${
                progress.completed
                  ? "bg-green-500/10 border-green-500"
                  : "bg-gray-800/50 border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-2xl">{quest.icon || "📋"}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white">{quest.title}</h3>
                      {progress.completed && (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{quest.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <span>
                        {progress.progress} / {quest.target} {quest.unit || ""}
                      </span>
                      <span className="text-purple-400">
                        보상: {quest.rewardPoints} 포인트
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Progress
                value={progressPercent}
                className="h-2 mb-2"
              />

              {/* 자동 추적 안내 메시지 */}
              {!progress.completed && (
                <p className="text-xs text-gray-400 mt-2">
                  💡 실제 건강 활동이 자동으로 반영됩니다
                </p>
              )}
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}

