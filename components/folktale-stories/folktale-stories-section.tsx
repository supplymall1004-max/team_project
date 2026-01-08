/**
 * @file folktale-stories-section.tsx
 * @description 전래동화 동영상 섹션 컴포넌트
 */

import Link from "next/link";
import { Section } from "@/components/section";
import { parseFolktaleVideos } from "@/lib/youtube-server";
import { FolktaleStoriesClient } from "./folktale-stories-client";
import { FolktaleStoryCard } from "./folktale-story-card";

interface FolktaleStoriesSectionProps {
  id?: string;
  title?: string;
  description?: string;
  showAllLink?: boolean;
}

export async function FolktaleStoriesSection({
  id = "folktale-stories",
  title = "장고의 전래동화",
  description = "전통 전래동화를 동화처럼 들려드려요",
  showAllLink = true,
}: FolktaleStoriesSectionProps) {
  let videos;

  try {
    videos = await parseFolktaleVideos();
    console.log(`[FolktaleStoriesSection] ${videos.length}개의 전래동화 동영상을 로드했습니다.`);
  } catch (error) {
    console.error("[FolktaleStoriesSection] 전래동화 동영상 로드 실패:", error);
    videos = [];
  }

  const firstVideo = videos[0];
  const secondVideo = videos[1];
  const remainingVideos = videos.slice(2);

  return (
    <Section id={id} title={title} description={description}>
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          {showAllLink && videos.length > 0 && (
            <Link
              href="/folktale-stories"
              className="text-sm font-medium text-pink-600 hover:text-pink-700"
            >
              전체 보기 →
            </Link>
          )}
        </div>

        {/* 첫 두 동영상 그리드 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 justify-items-center">
          {firstVideo && <FolktaleStoryCard video={firstVideo} layout="default" />}

          {secondVideo ? (
            <FolktaleStoryCard video={secondVideo} layout="default" />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-border/60 bg-white/60 p-6 text-center text-sm text-muted-foreground">
              함께 보여줄 전래동화를 준비 중이에요.
            </div>
          )}
        </div>

        {/* 나머지 동화 동영상 목록 */}
        {remainingVideos.length > 0 && (
          <FolktaleStoriesClient videos={remainingVideos} maxDisplay={2} />
        )}
      </div>
    </Section>
  );
}

