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
      <section className="px-4 py-12 space-y-8 bg-gradient-to-b from-white via-gray-50/50 to-white">
        {/* 섹션 헤더 - GDWEB 스타일 */}
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <div 
              className="flex items-center justify-center w-14 h-14 rounded-2xl gdweb-gradient-primary shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">커뮤니티</h2>
              <p className="text-sm text-gray-600">
                함께 건강하고 맛있는 삶을 나눠요
              </p>
            </div>
          </div>
          <Link href="/community">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 hover:bg-primary/10 transition-colors"
            >
              전체 보기
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* 카드 - GDWEB 스타일 */}
        <div className="max-w-6xl mx-auto">
          <Card className="gdweb-card border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div 
                  className="flex items-center justify-center w-10 h-10 rounded-xl gdweb-gradient-primary"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
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
        </div>

        {/* CTA 버튼 - GDWEB 스타일 */}
        <div className="flex items-center justify-center max-w-6xl mx-auto">
          <Link href="/community">
            <Button 
              className="w-full sm:w-auto gdweb-btn-primary text-white px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              커뮤니티 둘러보기
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </DirectionalEntrance>
  );
}

