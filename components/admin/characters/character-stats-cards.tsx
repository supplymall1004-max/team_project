/**
 * @file components/admin/characters/character-stats-cards.tsx
 * @description 캐릭터 통계 카드 컴포넌트
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminCharacterStats } from "@/types/admin/character";
import { Users, Heart, TrendingUp, Target } from "lucide-react";

interface CharacterStatsCardsProps {
  stats: AdminCharacterStats;
}

export function CharacterStatsCards({ stats }: CharacterStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">전체 캐릭터</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCharacters}</div>
          <p className="text-xs text-muted-foreground">
            가족 구성원 수
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">평균 건강 점수</CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageHealthScore.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">
            / 100점 만점
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">평균 레벨</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageLevel.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">
            레벨
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">활성 퀘스트</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeQuests}</div>
          <p className="text-xs text-muted-foreground">
            진행 중인 퀘스트
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

