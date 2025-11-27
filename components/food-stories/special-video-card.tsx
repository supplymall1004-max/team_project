"use client";

/**
 * @file special-video-card.tsx
 * @description 특별 동영상 카드 컴포넌트. 세로가 길게 늘어난 디자인을 사용합니다.
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Play, Star, Calendar } from "lucide-react";
import { FoodStoryVideo } from "@/lib/youtube";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DOUBLE_CLICK_THRESHOLD_MS,
  isWithinDoubleClickWindow,
} from "@/lib/interactions/double-click-detector";

interface SpecialVideoCardProps {
  video: FoodStoryVideo;
}

export function SpecialVideoCard({ video }: SpecialVideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [formattedDate, setFormattedDate] = useState<string>("");
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const lastClickTimeRef = useRef<number | null>(null);

  const handleDialogOpenChange = (open: boolean) => {
    if (!open && isFullscreen) {
      void exitFullscreen();
    }
    if (!open) {
      console.log("[SpecialVideoCard] 특별 동영상 재생 종료:", video.title);
    }
    setIsPlaying(open);
  };

  const enterFullscreen = async () => {
    if (!videoContainerRef.current) {
      console.warn("[SpecialVideoCard] 전체화면 진입 실패: 컨테이너가 없습니다.");
      return;
    }

    try {
      await videoContainerRef.current.requestFullscreen();
      console.log("[SpecialVideoCard] 전체화면 진입 완료:", video.title);
    } catch (error) {
      console.error("[SpecialVideoCard] 전체화면 진입 실패:", error);
    }
  };

  const exitFullscreen = async () => {
    if (!document.fullscreenElement) {
      setIsFullscreen(false);
      return;
    }

    try {
      await document.exitFullscreen();
      console.log("[SpecialVideoCard] 전체화면 종료 완료:", video.title);
    } catch (error) {
      console.error("[SpecialVideoCard] 전체화면 종료 실패:", error);
    }
  };

  const handleVideoAreaClick = () => {
    const now = Date.now();
    const lastClickTime = lastClickTimeRef.current;
    const isDoubleClick = isWithinDoubleClickWindow(
      lastClickTime,
      now,
      DOUBLE_CLICK_THRESHOLD_MS,
    );

    lastClickTimeRef.current = now;

    if (isFullscreen) {
      console.log("[SpecialVideoCard] 전체화면 상태 단일 클릭 -> 종료:", video.title);
      void exitFullscreen();
      lastClickTimeRef.current = null;
      return;
    }

    if (isDoubleClick && isPlaying) {
      console.log(
        "[SpecialVideoCard] 더블 클릭 감지 -> 전체화면 진입 시도:",
        video.title,
      );
      lastClickTimeRef.current = null;
      void enterFullscreen();
      return;
    }

    if (!isPlaying) {
      console.log("[SpecialVideoCard] 단일 클릭 -> 재생 시작:", video.title);
      setIsPlaying(true);
    }
  };

  // Hydration 에러 방지: 클라이언트에서만 날짜 포맷팅
  useEffect(() => {
    setFormattedDate(formatDate(video.publishedAt));
  }, [video.publishedAt]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen =
        document.fullscreenElement === videoContainerRef.current;
      setIsFullscreen(isNowFullscreen);
      console.log(
        "[SpecialVideoCard] fullscreenchange 이벤트:",
        isNowFullscreen ? "진입" : "종료",
        video.title,
      );
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [video.title]);

  return (
    <div className="group relative mx-auto w-full max-w-[320px] lg:max-w-none overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg transition-all hover:scale-105 hover:shadow-xl">
      {/* 썸네일 이미지 - 늘어난 세로 비율 (9:40) */}
      <div className="relative aspect-[9/40] overflow-hidden">
        {!imageError ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover transition-transform group-hover:scale-110"
            onError={() => {
              console.warn("[SpecialVideoCard] 썸네일 로드 실패, 기본 이미지 사용:", video.title);
              setImageError(true);
            }}
            sizes="(max-width: 768px) 280px, (max-width: 1024px) 320px, 360px"
          />
        ) : (
          // 기본 썸네일 (이미지 로드 실패 시)
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-200">
            <div className="text-center">
              <div className="mb-3 rounded-full bg-orange-200 p-4">
                <Play className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-orange-700">특별 동영상</p>
            </div>
          </div>
        )}

        {/* 특별 동영상 배지 */}
        <div className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-md">
          <Star className="inline h-3 w-3 fill-current" />
          <span className="ml-1">특별</span>
        </div>

        {/* 플레이 버튼 오버레이 */}
        <button
          type="button"
          onClick={handleVideoAreaClick}
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 text-white opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="특별 동영상 재생"
        >
          <span className="flex items-center rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-gray-900 shadow-lg">
            <Play className="mr-2 h-4 w-4" />
            {isPlaying ? "재생 중" : "클릭해서 재생"}
          </span>
          <span className="mt-3 text-xs text-white/80">
            한 번 클릭: 재생 • 두 번 클릭: 전체화면
          </span>
        </button>
      </div>

      <Dialog open={isPlaying} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-sm p-0">
          <div className="aspect-[9/40]" ref={videoContainerRef}>
            <iframe
              src={`${video.embedUrl}?autoplay=1&rel=0`}
              title={video.title}
              className="h-full w-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() =>
                console.log("[SpecialVideoCard] 유튜브 플레이어 로드 완료:", video.title)
              }
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* 카드 내용 */}
      <div className="p-4">
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{formattedDate || video.publishedAt}</span>
        </div>

        <h3 className="mb-3 text-lg font-bold leading-tight line-clamp-2 text-gray-900">
          {video.title}
        </h3>

        {/* 특별 동영상 설명 */}
        <div className="mb-3 rounded-lg bg-white/60 p-3 text-sm text-gray-700">
          <p className="leading-relaxed">
            특별한 음식 이야기를 담은 동영상입니다.
            <br />
            맛있는 비밀을 함께 알아봐요!
          </p>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex flex-col gap-2">
          <Button
            variant="default"
            size="sm"
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            onClick={() => window.open(video.url, "_blank")}
          >
            <Play className="mr-2 h-4 w-4" />
            유튜브에서 보기
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
            onClick={() => window.open("/special-video", "_self")}
          >
            <Star className="mr-2 h-4 w-4" />
            특별 동영상 페이지로
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
