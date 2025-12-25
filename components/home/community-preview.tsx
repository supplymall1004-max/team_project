/**
 * @file components/home/community-preview.tsx
 * @description 커뮤니티 미리보기 컴포넌트
 *
 * 메인 페이지에 표시되는 커뮤니티 섹션 미리보기입니다.
 * 인기 그룹과 최신 게시글을 보여줍니다.
 *
 * @dependencies
 * - @/components/community/group-list: GroupList
 * - @/components/community/post-list: PostList
 * - @/actions/community/list-groups: listGroups
 */

"use client";

import Link from "next/link";
import { Users, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GroupList } from "@/components/community/group-list";
import { DirectionalEntrance } from "@/components/motion/directional-entrance";

export function CommunityPreview() {
  return (
    <DirectionalEntrance direction="up" delay={0.1}>
      <section className="px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">커뮤니티</h2>
              <p className="text-sm text-muted-foreground">
                함께 건강하고 맛있는 삶을 나눠요
              </p>
            </div>
          </div>
          <Link href="/community">
            <Button variant="ghost" size="sm" className="gap-2">
              전체 보기
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              인기 그룹
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GroupList
              initialParams={{
                limit: 6,
                is_public: true,
              }}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-center">
          <Link href="/community">
            <Button className="w-full sm:w-auto">
              커뮤니티 둘러보기
            </Button>
          </Link>
        </div>
      </section>
    </DirectionalEntrance>
  );
}

