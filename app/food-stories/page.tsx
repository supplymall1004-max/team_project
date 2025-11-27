/**
 * @file app/food-stories/page.tsx
 * @description 음식 동화 동영상 전체 목록 페이지
 */

import { Metadata } from "next";
import { BookOpen, Heart } from "lucide-react";
import { Section } from "@/components/section";
import { groupFoodStoriesByDate } from "@/lib/youtube";
import { parseFoodStoryVideos } from "@/lib/youtube-server";
import { FoodStoriesClient } from "@/components/food-stories/food-stories-client";

export const metadata: Metadata = {
  title: "음식 동화 동영상 | 맛있는 이야기",
  description: "맛있는 음식의 탄생 이야기를 동화처럼 들려드려요. 매일 새로운 음식 이야기를 만나보세요.",
};

export default async function FoodStoriesPage() {
  let videos;

  try {
    videos = await parseFoodStoryVideos();
    console.log(`[FoodStoriesPage] ${videos.length}개의 동화 동영상을 로드했습니다.`);
  } catch (error) {
    console.error("[FoodStoriesPage] 동화 동영상 로드 실패:", error);
    videos = [];
  }

  const groupedVideos = groupFoodStoriesByDate(videos);
  const sortedDates = Object.keys(groupedVideos).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-8">
      {/* 헤더 섹션 */}
      <Section
        title="음식 동화 동영상"
        description="맛있는 음식의 탄생 이야기를 동화처럼 들려드려요"
      >
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-100 to-purple-100 text-pink-600">
              <BookOpen className="h-8 w-8" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            맛있는 이야기, 음식 동화
          </h1>
          <p className="text-lg text-muted-foreground">
            매일 새로운 음식 이야기를 동영상으로 만나보세요.
            <br />
            김치부터 다양한 음식의 탄생 비밀을 들려드려요.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Heart className="h-4 w-4 text-pink-500" />
            <span>현재 {videos.length}개의 동화 동영상이 준비되어 있어요</span>
          </div>
        </div>
      </Section>

      {/* 동영상 목록 */}
      {videos.length === 0 ? (
        <Section title="준비 중인 동화" description="곧 재미있는 이야기를 준비하고 있어요">
          <div className="rounded-3xl border border-dashed border-border bg-gradient-to-br from-pink-50 to-purple-50 p-12 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-pink-400" />
            <h3 className="mb-2 text-xl font-bold">음식 동화 준비 중</h3>
            <p className="text-muted-foreground">
              맛있는 음식들의 탄생 이야기를 모으고 있어요.
              <br />
              곧 첫 번째 동화를 선보일게요!
            </p>
          </div>
        </Section>
      ) : (
        <div className="space-y-8">
          {/* 날짜별 그룹화된 목록 */}
          {sortedDates.map((date) => (
            <Section
              key={date}
              title={formatSectionTitle(date)}
              description={`${groupedVideos[date].length}개의 동화 동영상`}
            >
              <FoodStoriesClient
                videos={groupedVideos[date]}
                showViewAll={false}
              />
            </Section>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 섹션 제목을 포맷팅합니다.
 */
function formatSectionTitle(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "🍽️ 오늘의 음식 동화";
    } else if (diffDays === -1) {
      return "📖 어제의 음식 동화";
    } else if (diffDays > 0) {
      return `📅 ${date.toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric'
      })} 예정`;
    } else {
      return `📚 ${date.toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric'
      })} 음식 동화`;
    }
  } catch (error) {
    console.error("[formatSectionTitle] 날짜 포맷팅 실패:", error);
    return "음식 동화";
  }
}
