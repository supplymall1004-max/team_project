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
import { CheckCircle2, Circle, Trophy, RefreshCw } from "lucide-react";
import { DAILY_QUESTS, calculateQuestProgress, type Quest } from "@/lib/game/quest-system";
import { completeQuest } from "@/actions/game/complete-quest";

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
  const [questProgresses, setQuestProgresses] = useState<Map<string, DailyQuestProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 퀘스트 진행 상황 로드 (useCallback으로 메모이제이션)
  const loadQuestProgresses = useCallback(async () => {
    setRefreshing(true);
    try {
      // TODO: 실제 API 호출로 대체
      // const response = await fetch(`/api/game/daily-quests?date=${new Date().toISOString().split('T')[0]}`);
      // const data = await response.json();
      
      // 임시 데이터
      const progresses = new Map<string, DailyQuestProgress>();
      DAILY_QUESTS.forEach((quest) => {
        progresses.set(quest.id, {
          questId: quest.id,
          progress: 0,
          completed: false,
        });
      });
      setQuestProgresses(progresses);
    } catch (error) {
      console.error("퀘스트 진행 상황 로드 실패:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadQuestProgresses();
  }, [loadQuestProgresses]);

  // 퀘스트 진행 업데이트 (useCallback으로 메모이제이션)
  const handleUpdateProgress = useCallback(async (quest: Quest, newProgress: number) => {
    const result = await completeQuest({
      questId: quest.id,
      progress: newProgress,
    });

    if (result.success) {
      setQuestProgresses((prev) => {
        const updated = new Map(prev);
        const current = updated.get(quest.id) || {
          questId: quest.id,
          progress: 0,
          completed: false,
        };
        updated.set(quest.id, {
          ...current,
          progress: newProgress,
          completed: result.completed || false,
          completedAt: result.completed ? new Date().toISOString() : current.completedAt,
        });
        return updated;
      });

      if (result.completed && result.rewardPoints && onQuestComplete) {
        onQuestComplete(quest, result.rewardPoints);
      }
    }
  }, [onQuestComplete]);

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

              {!progress.completed && (
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleUpdateProgress(quest, Math.min(progress.progress + 1, quest.target))
                    }
                  >
                    진행 업데이트
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleUpdateProgress(quest, quest.target)}
                  >
                    완료하기
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

