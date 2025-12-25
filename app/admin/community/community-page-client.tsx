/**
 * @file app/admin/community/community-page-client.tsx
 * @description 관리자 커뮤니티 관리 페이지 클라이언트 컴포넌트
 *
 * 주요 기능:
 * 1. 탭 전환 (대시보드, 그룹, 게시글, 댓글)
 * 2. 각 탭별 데이터 조회 및 표시
 */

"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommunityStatsCards } from "@/components/admin/community/community-stats-cards";
import { GroupsTable } from "@/components/admin/community/groups-table";
import { PostsTable } from "@/components/admin/community/posts-table";
import { CommentsTable } from "@/components/admin/community/comments-table";
import type { AdminCommunityStats } from "@/types/admin/community";

interface CommunityPageClientProps {
  initialStats?: AdminCommunityStats;
}

export function CommunityPageClient({ initialStats }: CommunityPageClientProps) {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="h-full p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">커뮤니티 관리</h1>
        <p className="text-muted-foreground mt-2">
          그룹, 게시글, 댓글을 관리하고 커뮤니티 활동을 모니터링하세요
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">대시보드</TabsTrigger>
          <TabsTrigger value="groups">그룹</TabsTrigger>
          <TabsTrigger value="posts">게시글</TabsTrigger>
          <TabsTrigger value="comments">댓글</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          {initialStats && <CommunityStatsCards stats={initialStats} />}
        </TabsContent>

        <TabsContent value="groups" className="mt-6">
          <GroupsTable />
        </TabsContent>

        <TabsContent value="posts" className="mt-6">
          <PostsTable />
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          <CommentsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

