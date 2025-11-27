/**
 * @file app/special-video/page.tsx
 * @description 특별 동영상 전용 페이지
 */

import { Metadata } from "next";
import { Star, Sparkles, Heart, Play } from "lucide-react";
import { Section } from "@/components/section";
import { SpecialVideoCard } from "@/components/food-stories/special-video-card";
import { parseFoodStoryVideos } from "@/lib/youtube-server";
import { FoodStoryVideo } from "@/lib/youtube";

export const metadata: Metadata = {
  title: "특별 동영상 | 맛있는 이야기",
  description: "특별한 음식 이야기를 담은 동영상을 만나보세요. 맛있는 비밀과 탄생 이야기를 영상으로 확인하세요.",
};

export default async function SpecialVideoPage() {
  let videos;

  try {
    videos = await parseFoodStoryVideos();
    console.log(`[SpecialVideoPage] ${videos.length}개의 동화 동영상을 로드했습니다.`);
  } catch (error) {
    console.error("[SpecialVideoPage] 동화 동영상 로드 실패:", error);
    videos = [];
  }

  // 특별 동영상으로 지정할 영상들 (현재는 docs/youtube.md에 있는 모든 영상)
  const specialVideos = videos;
  console.log(
    `[SpecialVideoPage] 레이아웃 설정 완료: 모바일 1열 · 데스크톱 2열 · 총 ${specialVideos.length}개 카드`
  );

  return (
    <div className="space-y-8">
      {/* 헤더 섹션 */}
      <Section
        title="✨ 특별 동영상"
        description="더 특별한 음식 이야기를 영상으로 만나보세요"
      >
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 via-orange-100 to-pink-100 shadow-lg">
                <Star className="h-10 w-10 text-amber-600" />
              </div>
              <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            특별한 맛의 비밀
          </h1>
          <p className="text-lg text-muted-foreground">
            평범한 음식 속에 숨겨진 특별한 이야기들.
            <br />
            맛있는 탄생 비밀을 영상으로 확인하세요.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Heart className="h-4 w-4 text-pink-500" />
            <span>현재 {specialVideos.length}개의 특별 동영상이 준비되어 있어요</span>
          </div>
        </div>
      </Section>

      {/* 특별 동영상 목록 */}
      {specialVideos.length === 0 ? (
        <Section title="준비 중인 특별 동영상" description="더 특별한 이야기를 준비하고 있어요">
          <div className="rounded-3xl border border-dashed border-border bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 p-12 text-center">
            <Star className="mx-auto mb-4 h-12 w-12 text-amber-400" />
            <h3 className="mb-2 text-xl font-bold">특별 동영상 준비 중</h3>
            <p className="text-muted-foreground">
              더 특별한 음식 이야기를 모으고 있어요.
              <br />
              곧 첫 번째 특별 동영상을 선보일게요!
            </p>
          </div>
        </Section>
      ) : (
        <Section
          title="🎬 특별 동영상 모음"
          description="하나하나가 특별한 이야기들"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 justify-items-center">
            {specialVideos.map((video) => (
              <SpecialVideoCard key={video.id} video={video} />
            ))}
          </div>

          {/* 추가 설명 */}
          <div className="mt-8 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-white p-3 shadow-sm">
                <Play className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900">
              더 많은 특별한 이야기들
            </h3>
            <p className="text-muted-foreground">
              앞으로 더 다양한 음식들의 특별한 탄생 이야기를 영상으로 선보일게요.
              <br />
              기대해주세요!
            </p>
          </div>
        </Section>
      )}
    </div>
  );
}

