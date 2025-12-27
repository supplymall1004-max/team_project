/**
 * @file components/game/quest-panel.tsx
 * @description 퀘스트 패널 UI 컴포넌트
 */

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, CheckCircle2, Circle } from "lucide-react";
import { getActiveQuests, updateQuestProgress, claimQuestReward } from "@/actions/game/quests";
import { playSound } from "./threejs/sound-system";

interface Quest {
  id: string;
  progress: number;
  completed_at: string | null;
  claimed_at: string | null;
  quest: {
    id: string;
    title: string;
    description: string;
    quest_type: string;
    category: string;
    target_count: number;
    reward_points: number;
    reward_experience: number;
  };
}

interface QuestPanelProps {
  familyMemberId?: string | null;
  onQuestComplete?: (points: number, experience: number) => void;
}

/**
 * 퀘스트 패널 컴포넌트
 */
export function QuestPanel({ familyMemberId, onQuestComplete }: QuestPanelProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null);

  // 퀘스트 로드
  useEffect(() => {
    loadQuests();
    
    // 30초마다 퀘스트 상태 갱신
    const interval = setInterval(loadQuests, 30000);
    return () => clearInterval(interval);
  }, [familyMemberId]);

  const loadQuests = async () => {
    try {
      const result = await getActiveQuests(familyMemberId);
      if (result.success && result.quests) {
        setQuests(result.quests as Quest[]);
      }
    } catch (error) {
      console.error("퀘스트 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (userQuestId: string) => {
    try {
      const result = await claimQuestReward(userQuestId);
      if (result.success && result.rewards) {
        playSound("success");
        onQuestComplete?.(result.rewards.points, result.rewards.experience);
        await loadQuests();
      }
    } catch (error) {
      console.error("보상 수령 실패:", error);
    }
  };

  const getQuestTypeColor = (type: string) => {
    switch (type) {
      case "daily":
        return "bg-blue-500";
      case "weekly":
        return "bg-purple-500";
      case "achievement":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getQuestTypeLabel = (type: string) => {
    switch (type) {
      case "daily":
        return "일일";
      case "weekly":
        return "주간";
      case "achievement":
        return "업적";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500">퀘스트 로딩 중...</div>
      </Card>
    );
  }

  if (quests.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>진행 중인 퀘스트가 없습니다.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">퀘스트</h3>
        <Badge variant="secondary">{quests.length}</Badge>
      </div>

      {quests.map((quest) => {
        const progress = (quest.progress / quest.quest.target_count) * 100;
        const isCompleted = quest.completed_at !== null;
        const isClaimed = quest.claimed_at !== null;

        return (
          <Card
            key={quest.id}
            className={`p-3 cursor-pointer transition-all ${
              isCompleted && !isClaimed
                ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                : ""
            }`}
            onClick={() => setExpandedQuest(expandedQuest === quest.id ? null : quest.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={getQuestTypeColor(quest.quest.quest_type)}>
                    {getQuestTypeLabel(quest.quest.quest_type)}
                  </Badge>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="font-medium text-sm">{quest.quest.title}</span>
                </div>

                {expandedQuest === quest.id && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {quest.quest.description}
                  </p>
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      진행도: {quest.progress} / {quest.quest.target_count}
                    </span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {isCompleted && !isClaimed && (
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      size="sm"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClaimReward(quest.id);
                      }}
                    >
                      보상 수령
                    </Button>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      +{quest.quest.reward_points} 포인트, +{quest.quest.reward_experience} 경험치
                    </span>
                  </div>
                )}

                {isClaimed && (
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                    보상 수령 완료
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </Card>
  );
}

