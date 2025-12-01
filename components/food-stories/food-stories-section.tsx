/**
 * @file food-stories-section.tsx
 * @description 음식 동화 동영상 섹션 컴포넌트. 레거시 아카이브에 통합됩니다.
 */

import Link from "next/link";
import { Section } from "@/components/section";
import { parseFoodStoryVideos } from "@/lib/youtube-server";
import { FoodStoriesClient } from "./food-stories-client";
import { FoodStoryCard } from "./food-story-card";

interface FoodStoriesSectionProps {
  id?: string;
  title?: string;
  description?: string;
  showAllLink?: boolean;
}

export async function FoodStoriesSection({
  id = "food-stories",
  title = "음식 동화 동영상",
  description = "맛있는 음식의 탄생 이야기를 동화처럼 들려드려요",
  showAllLink = true,
}: FoodStoriesSectionProps) {
  let videos;

  try {
    videos = await parseFoodStoryVideos();
    console.log(`[FoodStoriesSection] ${videos.length}개의 동화 동영상을 로드했습니다.`);
  } catch (error) {
    console.error("[FoodStoriesSection] 동화 동영상 로드 실패:", error);
    videos = [];
  }

  // 특별 동영상 찾기 (불고기의 탄생)
  const specialVideo = videos.find(video => video.title === "불고기의 탄생");
  const companionVideos = videos.filter(video => video.id !== specialVideo?.id);
  const firstCompanion = companionVideos[0];

  return (
    <Section id={id} title={title} description={description}>
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          {showAllLink && videos.length > 0 && (
            <Link
              href="/food-stories"
              className="text-sm font-medium text-pink-600 hover:text-pink-700"
            >
              전체 보기 →
            </Link>
          )}
        </div>

        {/* 특별 동영상과 일반 동화 동영상 그리드 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 justify-items-center">
          {specialVideo && <FoodStoryCard video={specialVideo} layout="default" />}

          {firstCompanion ? (
            <FoodStoryCard video={firstCompanion} layout="default" />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-border/60 bg-white/60 p-6 text-center text-sm text-muted-foreground">
              함께 보여줄 음식 동화를 준비 중이에요.
            </div>
          )}
        </div>

        {/* 나머지 동화 동영상 목록 */}
        {companionVideos.length > 1 && (
          <FoodStoriesClient videos={companionVideos.slice(1)} maxDisplay={2} />
        )}
      </div>
    </Section>
  );
}
