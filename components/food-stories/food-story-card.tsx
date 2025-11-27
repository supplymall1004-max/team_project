"use client";

/**
 * @file food-story-card.tsx
 * @description 음식 동화 동영상 카드 컴포넌트. 썸네일 미리보기와 클릭시 재생 기능을 제공합니다.
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import { Play, Calendar } from "lucide-react";
import { FoodStoryVideo } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface FoodStoryCardProps {
  video: FoodStoryVideo;
  layout?: "default" | "shorts";
}

export function FoodStoryCard({ video, layout = "default" }: FoodStoryCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [formattedDate, setFormattedDate] = useState<string>("");
  const isShortsLayout = layout === "shorts";
  const aspectClass = isShortsLayout ? "aspect-[9/16]" : "aspect-video";
  const dialogWidthClass = isShortsLayout ? "max-w-sm" : "max-w-4xl";

  const handlePlayClick = () => {
    console.log("[FoodStoryCard] 동화 동영상 재생 시작:", video.title);
    setIsPlaying(true);
  };

  const handleCloseModal = () => {
    console.log("[FoodStoryCard] 동화 동영상 재생 종료:", video.title);
    setIsPlaying(false);
  };

  // Hydration 에러 방지: 클라이언트에서만 날짜 포맷팅
  useEffect(() => {
    setFormattedDate(formatDate(video.publishedAt));
  }, [video.publishedAt]);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm transition-all hover:shadow-lg",
        isShortsLayout ? "mx-auto w-full max-w-[240px]" : "w-full max-w-sm"
      )}
    >
      {/* 썸네일 이미지 */}
      <div className={cn("relative overflow-hidden", aspectClass)}>
        {!imageError ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            onError={() => {
              console.warn("[FoodStoryCard] 썸네일 로드 실패, 기본 이미지 사용:", video.title);
              setImageError(true);
            }}
            sizes={
              isShortsLayout
                ? "(max-width: 768px) 160px, (max-width: 1024px) 220px, 240px"
                : "(max-width: 768px) 280px, (max-width: 1024px) 320px, 400px"
            }
          />
        ) : (
          // 기본 썸네일 (이미지 로드 실패 시)
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
            <div className="text-center">
              <div className="mb-2 rounded-full bg-orange-200 p-3">
                <Play className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-orange-700">동화 동영상</p>
            </div>
          </div>
        )}

        {/* 플레이 버튼 오버레이 */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
          <Dialog open={isPlaying} onOpenChange={setIsPlaying}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="rounded-full bg-white/90 text-black hover:bg-white"
                onClick={handlePlayClick}
              >
                <Play className="h-5 w-5 fill-current" />
              </Button>
            </DialogTrigger>
            <DialogContent className={cn(dialogWidthClass, "p-0")}>
              <div className={aspectClass}>
                <iframe
                  src={`${video.embedUrl}?autoplay=1&rel=0`}
                  title={video.title}
                  className="h-full w-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onLoad={() => console.log("[FoodStoryCard] 유튜브 플레이어 로드 완료:", video.title)}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 카드 내용 */}
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{formattedDate || video.publishedAt}</span>
        </div>

        <h3 className="mb-2 text-lg font-bold leading-tight line-clamp-2">
          {video.title}
        </h3>

        {/* 추가 정보 */}
        <div className="flex items-center justify-between text-sm">
          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
            음식 동화
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-orange-600 hover:text-orange-700"
            onClick={() => window.open(video.url, '_blank')}
          >
            유튜브에서 보기
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * 날짜를 한국어 형식으로 포맷팅합니다.
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "오늘";
    } else if (diffDays === 1) {
      return "어제";
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  } catch (error) {
    console.error("[formatDate] 날짜 포맷팅 실패:", error);
    return dateString;
  }
}
