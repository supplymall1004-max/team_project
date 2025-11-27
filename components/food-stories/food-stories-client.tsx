"use client";

/**
 * @file food-stories-client.tsx
 * @description 음식 동화 동영상 클라이언트 컴포넌트. 카드 그리드를 렌더링합니다.
 */

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { FoodStoryVideo } from "@/lib/youtube";
import { FoodStoryCard } from "./food-story-card";
import { Button } from "@/components/ui/button";

interface FoodStoriesClientProps {
  videos: FoodStoryVideo[];
  maxDisplay?: number;
  showViewAll?: boolean;
}

export function FoodStoriesClient({
  videos,
  maxDisplay,
  showViewAll = true
}: FoodStoriesClientProps) {
  const displayVideos = maxDisplay ? videos.slice(0, maxDisplay) : videos;

  if (videos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-pink-100 p-3">
            <BookOpen className="h-6 w-6 text-pink-600" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          곧 재미있는 음식 동화 동영상을 준비하고 있어요!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 모바일: 가로 스크롤 */}
      <div className="flex gap-4 overflow-x-auto pb-4 md:hidden scrollbar-hide">
        {displayVideos.map((video) => (
          <div key={video.id} className="min-w-[280px] max-w-[280px] flex-shrink-0">
            <FoodStoryCard video={video} />
          </div>
        ))}
      </div>

      {/* 데스크톱: 그리드 */}
      <div className="hidden grid-cols-1 gap-4 md:grid lg:grid-cols-3">
        {displayVideos.map((video) => (
          <FoodStoryCard key={video.id} video={video} />
        ))}
      </div>

      {/* 더보기 버튼 */}
      {showViewAll && maxDisplay && videos.length > maxDisplay && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" asChild>
            <Link href="/food-stories">
              모든 동화 동영상 보기 ({videos.length}개)
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
