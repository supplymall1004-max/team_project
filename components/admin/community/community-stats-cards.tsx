/**
 * @file components/admin/community/community-stats-cards.tsx
 * @description 커뮤니티 통계 카드 컴포넌트
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminCommunityStats } from "@/types/admin/community";
import { Users, MessageSquare, Heart, Activity } from "lucide-react";

interface CommunityStatsCardsProps {
  stats: AdminCommunityStats;
}

export function CommunityStatsCards({ stats }: CommunityStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">전체 그룹</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalGroups}</div>
          <p className="text-xs text-muted-foreground">
            활성 그룹: {stats.activeGroups}개
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">전체 게시글</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPosts}</div>
          <p className="text-xs text-muted-foreground">
            댓글: {stats.totalComments}개
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">전체 좋아요</CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalLikes}</div>
          <p className="text-xs text-muted-foreground">
            평균 게시글당: {stats.totalPosts > 0 ? Math.round(stats.totalLikes / stats.totalPosts) : 0}개
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">활성 사용자</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeUsers}</div>
          <p className="text-xs text-muted-foreground">
            최근 30일 활동 사용자
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

