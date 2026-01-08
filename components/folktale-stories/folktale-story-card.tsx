"use client";

/**
 * @file folktale-story-card.tsx
 * @description 전래동화 동영상 카드 컴포넌트. 썸네일 미리보기와 클릭시 재생 기능을 제공합니다.
 * 날짜 표시 없이 제목만 표시합니다.
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { FoodStoryVideo } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface FolktaleStoryCardProps {
  video: FoodStoryVideo;
  layout?: "default" | "shorts";
}

export function FolktaleStoryCard({ video, layout = "default" }: FolktaleStoryCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isShortsLayout = layout === "shorts";
  const aspectClass = isShortsLayout ? "aspect-[9/16]" : "aspect-video";
  const dialogWidthClass = isShortsLayout ? "max-w-sm" : "max-w-4xl";

  const handlePlayClick = () => {
    console.log("[FolktaleStoryCard] 전래동화 동영상 재생 시작:", video.title);
    setIsPlaying(true);
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden border border-border/70 shadow-sm transition-all hover:shadow-lg",
        isShortsLayout 
          ? "mx-auto w-full max-w-[160px] lg:max-w-[180px] rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 hover:scale-105 hover:shadow-xl" 
          : "w-full max-w-sm rounded-2xl bg-white"
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
              console.warn("[FolktaleStoryCard] 썸네일 로드 실패, 기본 이미지 사용:", video.title);
              setImageError(true);
            }}
            sizes={
              isShortsLayout
                ? "(max-width: 768px) 140px, (max-width: 1024px) 160px, 180px"
                : "(max-width: 768px) 280px, (max-width: 1024px) 320px, 400px"
            }
          />
        ) : (
          // 기본 썸네일 (이미지 로드 실패 시)
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
            <div className="text-center">
              <div className={cn("mb-2 rounded-full bg-orange-200", isShortsLayout ? "p-2 mb-1.5" : "p-3")}>
                <Play className={cn("text-orange-600", isShortsLayout ? "h-4 w-4" : "h-6 w-6")} />
              </div>
              <p className={cn("font-medium text-orange-700", isShortsLayout ? "text-[10px]" : "text-sm")}>전래동화 동영상</p>
            </div>
          </div>
        )}

        {/* 플레이 버튼 오버레이 */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            size={isShortsLayout ? "sm" : "lg"}
            className={cn("rounded-full bg-white/90 text-black hover:bg-white", isShortsLayout && "h-8 w-8 p-0")}
            onClick={handlePlayClick}
          >
            <Play className={cn("fill-current", isShortsLayout ? "h-3 w-3" : "h-5 w-5")} />
          </Button>
          {isPlaying && (
            <Dialog open={isPlaying} onOpenChange={setIsPlaying}>
              <DialogContent className={cn(dialogWidthClass, "p-0")}>
                <DialogTitle className="sr-only">{video.title}</DialogTitle>
                <div className={aspectClass}>
                  <iframe
                    src={`${video.embedUrl}?autoplay=1&rel=0`}
                    title={video.title}
                    className="h-full w-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => console.log("[FolktaleStoryCard] 유튜브 플레이어 로드 완료:", video.title)}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* 카드 내용 */}
      <div className={cn(isShortsLayout ? "p-2" : "p-4")}>
        <h3 className={cn("mb-2 font-bold leading-tight line-clamp-2", isShortsLayout ? "text-sm" : "text-lg")}>
          {video.title}
        </h3>

        {/* 추가 정보 */}
        <div className={cn("flex items-center justify-between", isShortsLayout ? "text-[10px]" : "text-sm")}>
          <span className={cn("rounded-full bg-orange-50 font-medium text-orange-700", isShortsLayout ? "px-2 py-0.5 text-[9px]" : "px-3 py-1 text-xs")}>
            전래동화
          </span>
          <Button
            variant="ghost"
            size="sm"
            className={cn("text-orange-600 hover:text-orange-700", isShortsLayout && "text-[10px] py-0.5 h-auto")}
            onClick={() => window.open(video.url, '_blank')}
          >
            유튜브에서 보기
          </Button>
        </div>
      </div>
    </div>
  );
}

