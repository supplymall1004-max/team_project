/**
 * @file folktale-room.tsx
 * @description 장고의 전래동화 스토리북 플레이어 메인 컴포넌트
 * 
 * GDWEB 기반 디자인 패턴 적용:
 * - 세련된 그라데이션 배경 및 패턴 오버레이
 * - 카드 디자인 패턴 적용
 * - 부드러운 애니메이션 및 트랜지션
 * - 반응형 디자인 강화
 * - 마이크로 인터랙션 추가
 */

"use client"

import { useState, useCallback, useEffect } from "react"
import { FoodStoryVideo } from "@/lib/youtube"
import { GiftBox } from "@/components/storybook/gift-box"
import { VintageTV } from "@/components/storybook/vintage-tv"
import { SeasonalFireplace } from "@/components/storybook/fireplace"
import { SeasonalTree } from "@/components/storybook/christmas-tree"
import { SeasonalEffect } from "@/components/storybook/seasonal-effect"
import { BookOpen, Play, Shuffle, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { type Season, seasonThemes } from "@/data/seasons"
import { getCurrentSeason } from "@/lib/utils/season"

function getEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
}

interface FolktaleRoomProps {
  videos: FoodStoryVideo[]
}

export function FolktaleRoom({ videos }: FolktaleRoomProps) {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(videos[0]?.id || null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState<Season>("spring")

  // 메인 페이지와 동일한 계절 효과 로직: localStorage에서 계절 불러오기 및 전역 이벤트 리스너
  useEffect(() => {
    // 로컬 스토리지에서 선택된 계절 불러오기
    const savedSeason = localStorage.getItem("selected-season");
    if (savedSeason && ["spring", "summer", "autumn", "winter"].includes(savedSeason)) {
      setSelectedSeason(savedSeason as Season);
    } else {
      // 저장된 계절이 없으면 현재 계절 사용
      const currentSeason = getCurrentSeason();
      setSelectedSeason(currentSeason);
    }

    // 전역 이벤트 리스너 추가 (메인 페이지의 계절 변경 이벤트 감지)
    const handleSeasonChange = (event: CustomEvent<{ season: Season }>) => {
      setSelectedSeason(event.detail.season);
    };

    window.addEventListener("season-change", handleSeasonChange as EventListener);

    return () => {
      window.removeEventListener("season-change", handleSeasonChange as EventListener);
    };
  }, []);

  // YouTube IFrame API 로드
  useEffect(() => {
    if (typeof window !== "undefined" && !window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      if (firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
      }
    }
  }, [])

  // 랜덤 재생 함수
  const handleRandomPlay = useCallback(() => {
    if (videos.length === 0) return

    setIsLoading(true)
    setTimeout(() => {
      const otherVideos = videos.filter((video) => video.id !== selectedVideoId)
      const randomVideo =
        otherVideos.length > 0
          ? otherVideos[Math.floor(Math.random() * otherVideos.length)]
          : videos[Math.floor(Math.random() * videos.length)]

      console.groupCollapsed("[FolktaleRoom] 랜덤 재생")
      console.log("랜덤 재생:", randomVideo.title || randomVideo.id)
      console.groupEnd()
      setSelectedVideoId(randomVideo.id)
      setIsLoading(false)
    }, 300)
  }, [selectedVideoId, videos])

  const selectedVideo = videos.find((v) => v.id === selectedVideoId)
  const currentTheme = seasonThemes[selectedSeason]
  // 선택된 비디오의 계절을 사용하거나, 없으면 선택된 계절 사용
  const displaySeason = selectedSeason
  const displayTheme = seasonThemes[displaySeason]

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* 배경 그라데이션 - 계절별 테마 적용 */}
      <div className={cn(
        "fixed inset-0 z-0 transition-all duration-1000",
        `bg-gradient-to-br ${currentTheme.bgGradient}`
      )} />
      
      {/* 패턴 오버레이 */}
      <div 
        className="fixed inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)
          `,
          backgroundSize: '100px 100px',
        }}
      />

      {/* 계절별 파티클 효과 */}
      <SeasonalEffect season={selectedSeason} />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* 헤더 섹션 - GDWEB 타이포그래피 시스템 적용 */}
        <header className="text-center mt-4 mb-8 md:mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span className="text-xs md:text-sm font-semibold text-orange-300">인터랙티브 스토리북</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-300 via-orange-300 to-amber-300 bg-clip-text text-transparent drop-shadow-2xl">
            장고의 전래동화 이야기
          </h1>
          
          <p 
            className="text-sm md:text-base max-w-2xl mx-auto leading-relaxed transition-colors duration-500"
            style={{ color: displayTheme.textColor }}
          >
            전통 전래동화를 동화처럼 들려주는 이야기입니다.<br />
            {displaySeason === "spring" && "🌸 꽃을 클릭하여 다양한 전래동화 이야기를 들어보세요."}
            {displaySeason === "summer" && "🌊 조개를 클릭하여 다양한 전래동화 이야기를 들어보세요."}
            {displaySeason === "autumn" && "🍂 낙엽을 클릭하여 다양한 전래동화 이야기를 들어보세요."}
            {displaySeason === "winter" && "❄️ 아이콘을 클릭하여 다양한 전래동화 이야기를 들어보세요."}
          </p>
        </header>

        {/* 현재 재생 중인 이야기 정보 카드 */}
        {selectedVideo && (
          <div className="max-w-md mx-auto mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div 
              className={cn(
                "backdrop-blur-md rounded-2xl p-4 border shadow-xl transition-all duration-500",
                displayTheme.cardBg,
                displaySeason === "spring" ? "border-pink-300/30" : "border-white/20"
              )}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center transition-all duration-500"
                  style={{
                    background: displaySeason === "spring" 
                      ? "linear-gradient(to bottom right, #ff69b4, #ff1493)"
                      : displaySeason === "summer"
                      ? "linear-gradient(to bottom right, #00bfff, #0099cc)"
                      : displaySeason === "autumn"
                      ? "linear-gradient(to bottom right, #ff6347, #ff4500)"
                      : "linear-gradient(to bottom right, #ffd700, #ffa500)"
                  }}
                >
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p 
                    className="text-xs mb-1 transition-colors duration-500"
                    style={{ color: displayTheme.textMutedColor }}
                  >
                    현재 재생 중
                  </p>
                  <h3 
                    className="text-sm md:text-base font-semibold transition-colors duration-500"
                    style={{ color: displayTheme.textColor }}
                  >
                    {selectedVideo.title}
                  </h3>
                </div>
                <button
                  onClick={handleRandomPlay}
                  disabled={isLoading}
                  className={cn(
                    "p-2 rounded-lg transition-all duration-300",
                    "active:scale-95",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "shadow-lg hover:shadow-xl"
                  )}
                  style={{
                    background: displaySeason === "spring" 
                      ? "linear-gradient(to right, #ff69b4, #ff1493)"
                      : displaySeason === "summer"
                      ? "linear-gradient(to right, #00bfff, #0099cc)"
                      : displaySeason === "autumn"
                      ? "linear-gradient(to right, #ff6347, #ff4500)"
                      : "linear-gradient(to right, #ffd700, #ffa500)"
                  }}
                  aria-label="랜덤 재생"
                >
                  <Shuffle className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Room Layout */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-6 xl:gap-8 pb-20">
          {/* Fireplace - Left Side */}
          <div className="order-3 lg:order-1 lg:w-1/4 flex justify-center animate-fade-in-left">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500" />
              <SeasonalFireplace season={displaySeason} />
            </div>
          </div>

          {/* TV - Center - 카드 디자인 패턴 적용 */}
          <div id="vintage-tv-section" className="order-1 lg:order-2 lg:w-2/4 flex flex-col items-center gap-6 animate-fade-in-up scroll-mt-24" style={{ animationDelay: '0.1s' }}>
            <div className="relative group">
              {/* 글로우 효과 */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-orange-500/30 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* TV 카드 */}
              <div className="relative transform transition-all duration-500 hover:scale-105">
                <VintageTV
                  videoUrl={selectedVideoId ? getEmbedUrl(selectedVideoId) : null}
                  season={selectedSeason}
                  onVideoEnd={handleRandomPlay}
                />
              </div>
            </div>
          </div>

          {/* Seasonal Tree with Gift Boxes - Right Side */}
          <div className="order-2 lg:order-3 lg:w-1/4 flex flex-col items-center gap-6 animate-fade-in-right">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500" />
              <SeasonalTree season={displaySeason} />
            </div>

            {/* Gift Boxes Playlist - 개선된 레이아웃 */}
            <div className="w-full">
              <h3 className="text-sm font-semibold text-gray-300 mb-6 text-center">이야기 선택</h3>
              <div className="flex flex-wrap justify-center gap-x-[60px] gap-y-[120px] max-w-md mx-auto">
                {videos.map((video, index) => (
                  <div key={video.id} id={`gift-box-${video.id}`} className="scroll-mt-24">
                    <GiftBox
                      title={video.title || `Story ${index + 1}`}
                      isSelected={selectedVideoId === video.id}
                      onClick={() => {
                        console.groupCollapsed("[FolktaleRoom] 선물 상자 클릭")
                        console.log("video:", video.title || video.id)
                        console.log("season:", selectedSeason)
                        console.groupEnd()
                        setIsLoading(true)
                        
                        // 비디오 ID 먼저 설정
                        setSelectedVideoId(video.id)
                        
                        // TV 섹션으로 스크롤 이동
                        setTimeout(() => {
                          const tvElement = document.getElementById('vintage-tv-section')
                          if (tvElement) {
                            const headerOffset = 100 // Navbar 높이 + 여유 공간
                            const elementPosition = tvElement.getBoundingClientRect().top
                            const offsetPosition = elementPosition + window.pageYOffset - headerOffset

                            window.scrollTo({
                              top: Math.max(0, offsetPosition),
                              behavior: 'smooth'
                            })
                          }
                        }, 50)
                        
                        setTimeout(() => {
                          setIsLoading(false)
                        }, 300)
                      }}
                      colorIndex={index}
                      season={selectedSeason}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer - 개선된 스타일 */}
        <footer className="text-center mt-12 mb-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div 
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3 rounded-full backdrop-blur-md border transition-all duration-500",
              displayTheme.cardBg,
              displaySeason === "spring" ? "border-pink-300/30" : "border-white/20"
            )}
          >
            <Play 
              className="w-4 h-4 transition-colors duration-500"
              style={{ 
                color: displaySeason === "spring" 
                  ? "#ff69b4"
                  : displaySeason === "summer"
                  ? "#00bfff"
                  : displaySeason === "autumn"
                  ? "#ff6347"
                  : "#ffd700"
              }}
            />
            <p 
              className="text-sm transition-colors duration-500"
              style={{ color: displayTheme.textColor }}
            >
              {displaySeason === "spring" && "🌸 꽃을 클릭하여 이야기를 재생하세요"}
              {displaySeason === "summer" && "🌊 조개를 클릭하여 이야기를 재생하세요"}
              {displaySeason === "autumn" && "🍂 낙엽을 클릭하여 이야기를 재생하세요"}
              {displaySeason === "winter" && "❄️ 아이콘을 클릭하여 이야기를 재생하세요"}
            </p>
          </div>
        </footer>
      </div>

      {/* Warm ambient glow from fireplace - 개선된 효과 */}
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-pink-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="fixed top-1/2 right-0 w-96 h-96 bg-gradient-to-l from-purple-500/10 via-blue-500/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow" style={{ animationDelay: '1s' }} />
    </div>
  )
}

