"use client";

/**
 * @file legacy-archive-client.tsx
 * @description 레거시 아카이브 섹션의 인터랙티브 UI. 필터링, 검색, 카드 UI를 담당합니다.
 */

import Link from "next/link";
import { useMemo, useState, useRef, useEffect } from "react";
import { Film, Search, X } from "lucide-react";
import { LegacyFilterState, LegacyVideo } from "@/types/legacy";
import { extractLegacyFilterOptions, filterLegacyVideos } from "@/lib/legacy/filter";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LegacyArchiveClientProps {
  videos: LegacyVideo[];
}

const initialFilters: LegacyFilterState = {
  region: [],
  era: [],
  ingredients: [],
  searchTerm: "",
};

export function LegacyArchiveClient({
  videos,
}: LegacyArchiveClientProps) {
  const [filters, setFilters] = useState<LegacyFilterState>(initialFilters);

  const filterOptions = useMemo(
    () => extractLegacyFilterOptions(videos),
    [videos],
  );

  const filteredVideos = useMemo(
    () => filterLegacyVideos(videos, filters),
    [videos, filters],
  );

  const handleSearch = (term: string) => {
    // 성능 최적화: 프로덕션에서는 로그 최소화
    if (process.env.NODE_ENV === "development") {
      console.groupCollapsed("[LegacyArchive] 검색어 입력");
      console.log("term", term);
      console.groupEnd();
    }
    setFilters((prev) => ({ ...prev, searchTerm: term }));
  };

  const toggleFilter = (type: "region" | "era" | "ingredients", value: string) => {
    setFilters((prev) => {
      const currentSet = new Set(prev[type]);
      if (currentSet.has(value)) {
        currentSet.delete(value);
      } else {
        currentSet.add(value);
      }

      // 성능 최적화: 프로덕션에서는 로그 최소화
      if (process.env.NODE_ENV === "development") {
        console.groupCollapsed("[LegacyArchive] 필터 토글");
        console.log("type", type);
        console.log("value", value);
        console.log("selected", [...currentSet]);
        console.groupEnd();
      }

      return { ...prev, [type]: Array.from(currentSet) };
    });
  };

  const resetFilters = () => {
    // 성능 최적화: 프로덕션에서는 로그 최소화
    if (process.env.NODE_ENV === "development") {
      console.groupCollapsed("[LegacyArchive] 필터 리셋");
      console.log("filters", filters);
      console.groupEnd();
    }
    setFilters(initialFilters);
  };

  return (
    <div className="space-y-6 sm:space-y-10 rounded-2xl sm:rounded-3xl border border-border/80 bg-white/90 p-4 sm:p-6 shadow-lg">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-border/60 bg-white px-3 sm:px-4 py-2 sm:py-3 shadow-inner">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="명인, 지역, 재료를 검색해보세요"
              className="border-none p-0 shadow-none focus-visible:ring-0 text-sm sm:text-base"
              value={filters.searchTerm}
              onChange={(event) => handleSearch(event.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs sm:text-sm">
            필터 초기화
          </Button>
        </div>

        <FilterGroup
          label="지역"
          options={filterOptions.regions}
          selected={filters.region}
          onToggle={(value) => toggleFilter("region", value)}
        />
        <FilterGroup
          label="시대"
          options={filterOptions.eras}
          selected={filters.era}
          onToggle={(value) => toggleFilter("era", value)}
        />
        <FilterGroup
          label="재료"
          options={filterOptions.ingredients}
          selected={filters.ingredients}
          onToggle={(value) => toggleFilter("ingredients", value)}
        />
      </div>

      <div>
        <div className="mb-3 sm:mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-semibold text-orange-600">잊혀진 고대 레시피</p>
            <h3 className="text-xl sm:text-2xl font-bold">시대별 레시피</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              필터 조건에 맞는 영상 {filteredVideos.length}건이 있습니다.
            </p>
          </div>
        </div>
        {filteredVideos.length === 0 ? (
          <div className="rounded-xl sm:rounded-2xl border border-dashed border-border px-4 sm:px-6 py-8 sm:py-12 text-center text-xs sm:text-sm text-muted-foreground">
            조건에 맞는 영상이 없습니다. 필터를 조정해주세요.
          </div>
        ) : (
          <>
            {/* 모바일: 가로 스크롤 */}
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 md:hidden scrollbar-hide">
              {filteredVideos.map((video) => (
                <div key={video.id} className="min-w-[260px] max-w-[260px] sm:min-w-[280px] sm:max-w-[280px] flex-shrink-0">
                  <LegacyVideoCard video={video} />
                </div>
              ))}
            </div>
            {/* 데스크톱: 그리드 */}
            <div className="hidden grid-cols-2 gap-3 sm:gap-4 md:grid lg:grid-cols-3">
              {filteredVideos.map((video) => (
                <LegacyVideoCard key={video.id} video={video} />
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
}

interface FilterGroupProps {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}

function FilterGroup({ label, options, selected, onToggle }: FilterGroupProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={isSelected ? "default" : "outline"}
              className="rounded-full text-xs sm:text-sm h-7 sm:h-8 px-2.5 sm:px-3"
              onClick={() => onToggle(option)}
            >
              {option}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function LegacyVideoCard({ video }: { video: LegacyVideo }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // 유튜브 비디오 ID 추출
  const videoId = extractYouTubeVideoId(video.videoUrl);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null;
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

  const handleCardClick = () => {
    if (isFullscreen) {
      // 전체화면 상태에서 클릭 시 전체화면 해제
      console.log("[LegacyVideoCard] 전체화면 상태에서 클릭 - 전체화면 해제");
      exitFullscreen();
      return;
    }

    if (clickTimeoutRef.current) {
      // 더블 클릭 감지 (300ms 내에 두 번째 클릭)
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      console.log("[LegacyVideoCard] 더블 클릭 - 전체화면 전환:", video.title);
      
      if (!isPlaying) {
        setIsPlaying(true);
      }
      
      // 전체화면 전환
      requestFullscreen();
    } else {
      // 단일 클릭 대기
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        console.log("[LegacyVideoCard] 단일 클릭 - 재생 시작:", video.title);
        
        // 첫 클릭: 재생 시작
        if (!isPlaying) {
          setIsPlaying(true);
          console.log("[LegacyVideoCard] 동영상 재생 모달 열림");
        }
      }, 300); // 300ms 내에 두 번째 클릭이 없으면 단일 클릭으로 처리
    }
  };

  const requestFullscreen = () => {
    // 전체화면 재생을 위해 먼저 재생 상태로 전환
    if (!isPlaying) {
      setIsPlaying(true);
    }
    
    // 약간의 지연 후 전체화면 요청 (iframe이 로드될 시간 확보)
    setTimeout(() => {
      const container = document.getElementById(`video-container-${video.id}`);
      if (container) {
        if (container.requestFullscreen) {
          container.requestFullscreen().then(() => {
            setIsFullscreen(true);
            console.log("[LegacyVideoCard] 전체화면 진입");
          }).catch((err) => {
            console.error("[LegacyVideoCard] 전체화면 진입 실패:", err);
          });
        } else if ((container as any).webkitRequestFullscreen) {
          (container as any).webkitRequestFullscreen();
          setIsFullscreen(true);
        } else if ((container as any).mozRequestFullScreen) {
          (container as any).mozRequestFullScreen();
          setIsFullscreen(true);
        } else if ((container as any).msRequestFullscreen) {
          (container as any).msRequestFullscreen();
          setIsFullscreen(true);
        }
      }
    }, 100);
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        console.log("[LegacyVideoCard] 전체화면 해제");
      }).catch((err) => {
        console.error("[LegacyVideoCard] 전체화면 해제 실패:", err);
      });
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
      setIsFullscreen(false);
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen();
      setIsFullscreen(false);
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 전체화면 상태 변경 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
      if (!isCurrentlyFullscreen && isPlaying) {
        // 전체화면 해제 시 재생 모달도 닫기
        setIsPlaying(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isPlaying]);

  if (!embedUrl) {
    // 유튜브 URL이 아닌 경우 기존 방식으로 처리
    return (
      <div className="flex h-full flex-col rounded-2xl border border-border/70 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg min-h-[280px] md:min-h-0">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 shrink-0">
            <Film className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-orange-600">
              {video.master.title}
            </p>
            <h4 className="text-lg font-bold truncate">{video.title}</h4>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2 md:line-clamp-3">
          {video.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{video.region}</span>
          <span>•</span>
          <span>{video.durationMinutes}분</span>
          {video.premiumOnly && (
            <>
              <span>•</span>
              <span className="font-semibold text-amber-600">프리미엄</span>
            </>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {video.ingredients.slice(0, 3).map((ingredient) => (
            <span
              key={ingredient}
              className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700"
            >
              {ingredient}
            </span>
          ))}
        </div>
        <Button className="mt-4 w-full md:mt-auto" asChild>
          <Link href={`/legacy/${video.slug}`}>상세 보기</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div 
        className="flex h-full flex-col rounded-xl sm:rounded-2xl border border-border/70 bg-white overflow-hidden shadow-sm transition hover:-translate-y-1 hover:shadow-lg min-h-[280px] md:min-h-0 cursor-pointer"
        onClick={handleCardClick}
      >
        {/* 유튜브 썸네일 이미지 */}
        {thumbnailUrl && (
          <div className="relative w-full aspect-video bg-gray-100">
            <img
              src={thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error("[LegacyVideoCard] 썸네일 로딩 실패:", thumbnailUrl);
                // 썸네일 로딩 실패 시 숨김
                e.currentTarget.style.display = "none";
              }}
            />
            {/* 재생 오버레이 */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-white/90 text-orange-600 shadow-lg">
                <svg
                  className="ml-0.5 h-5 w-5 sm:h-7 sm:w-7"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        )}
        
        {/* 카드 콘텐츠 */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-orange-100 text-orange-600 shrink-0">
              <Film className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-orange-600">
                {video.master.title}
              </p>
              <h4 className="text-base sm:text-lg font-bold truncate">{video.title}</h4>
            </div>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground line-clamp-2">
            {video.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2 text-xs text-muted-foreground">
            <span>{video.region}</span>
            <span>•</span>
            <span>{video.durationMinutes}분</span>
            {video.premiumOnly && (
              <>
                <span>•</span>
                <span className="font-semibold text-amber-600">프리미엄</span>
              </>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
            {video.ingredients.slice(0, 3).map((ingredient) => (
              <span
                key={ingredient}
                className="rounded-full bg-orange-50 px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-semibold text-orange-700"
              >
                {ingredient}
              </span>
            ))}
          </div>
          <div className="mt-auto pt-3 text-xs text-muted-foreground text-center">
            <p>클릭: 재생 | 더블클릭: 전체화면</p>
          </div>
        </div>
      </div>

      {/* 재생 모달 */}
      {isPlaying && !isFullscreen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => {
            setIsPlaying(false);
            console.log("[LegacyVideoCard] 동영상 재생 모달 닫힘");
          }}
        >
          <div 
            className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 z-10 rounded-full bg-white/90 p-2 text-black hover:bg-white transition"
              onClick={() => {
                setIsPlaying(false);
                console.log("[LegacyVideoCard] 동영상 재생 모달 닫힘 (X 버튼)");
              }}
            >
              <X className="h-5 w-5" />
            </button>
            <iframe
              ref={iframeRef}
              src={embedUrl}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => console.log("[LegacyVideoCard] 유튜브 플레이어 로드 완료:", video.title)}
            />
          </div>
        </div>
      )}

      {/* 전체화면 재생 컨테이너 (항상 렌더링하되, 전체화면일 때만 표시) */}
      {isPlaying && (
        <div 
          id={`video-container-${video.id}`}
          className={`${isFullscreen ? 'fixed inset-0 z-[9999]' : 'hidden'} bg-black flex items-center justify-center`}
          onClick={isFullscreen ? exitFullscreen : undefined}
        >
          <div 
            className="w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              ref={iframeRef}
              src={embedUrl}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {isFullscreen && (
            <button
              className="absolute top-4 right-4 z-10 rounded-full bg-white/90 p-3 text-black hover:bg-white transition"
              onClick={exitFullscreen}
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
      )}
    </>
  );
}

