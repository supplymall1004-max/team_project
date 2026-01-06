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
      <section className="px-4 py-12 space-y-8 bg-gradient-to-b from-white via-orange-50/30 to-white">
        {/* 섹션 헤더 - 홈페이지 디자인과 일관성 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <div 
              className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              }}
            >
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">커뮤니티</h2>
              <p className="text-sm text-gray-600">
                함께 건강하고 맛있는 삶을 나눠요
              </p>
            </div>
          </div>
          <Link href="/community">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 transition-all"
            >
              전체 보기
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* 카드 - 홈페이지 디자인과 일관성 */}
        <div className="max-w-6xl mx-auto">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
                <div 
                  className="flex items-center justify-center w-10 h-10 rounded-xl transition-all hover:scale-110"
                  style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  }}
                >
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <span>인기 그룹</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <GroupList
                initialParams={{
                  limit: 6,
                  is_public: true,
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* CTA 버튼 - 홈페이지 디자인과 일관성 */}
        <div className="flex items-center justify-center max-w-6xl mx-auto">
          <Link href="/community">
            <Button 
              className="w-full sm:w-auto text-white px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
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

