"use client"

import { useState, useCallback } from "react"
import { youtubeVideos, getEmbedUrl } from "@/data/youtube-videos"
import { type Season, seasonThemes } from "@/data/seasons"
import { SeasonSelector } from "@/components/season-selector"
import { SeasonalEffect } from "@/components/seasonal-effect"
import { VintageTV } from "@/components/vintage-tv"
import { PlaylistItem } from "@/components/playlist-item"
import { SeasonalDecoration } from "@/components/seasonal-decoration"

export function SeasonalRoom() {
  const [season, setSeason] = useState<Season>("winter")
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(youtubeVideos[0]?.id || null)

  // 랜덤 재생 함수
  const handleRandomPlay = useCallback(() => {
    if (youtubeVideos.length === 0) return

    // 현재 재생 중인 비디오를 제외한 나머지 중에서 랜덤 선택
    const otherVideos = youtubeVideos.filter((video) => video.id !== selectedVideoId)
    const randomVideo =
      otherVideos.length > 0
        ? otherVideos[Math.floor(Math.random() * otherVideos.length)]
        : youtubeVideos[Math.floor(Math.random() * youtubeVideos.length)]

    console.log("랜덤 재생:", randomVideo.title || randomVideo.id)
    setSelectedVideoId(randomVideo.id)
  }, [selectedVideoId])

  const theme = seasonThemes[season]

  return (
    <div
      className={`relative w-full min-h-screen bg-gradient-to-b ${theme.bgGradient} overflow-hidden transition-all duration-700`}
    >
      {/* Seasonal Particle Effect */}
      <SeasonalEffect season={season} />

      {/* Window */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-48 h-32 md:w-64 md:h-40 rounded-lg border-8 border-[#8b4513] shadow-lg overflow-hidden">
        <div className={`absolute inset-0 ${theme.windowBg}`}>
          {season === "winter" && <div className="absolute bottom-0 left-0 right-0 h-8 bg-white/80 rounded-t-full" />}
          {season === "summer" && <div className="absolute top-2 right-4 text-4xl">☀️</div>}
          {season === "spring" && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-green-400/60 to-transparent" />
          )}
          {season === "autumn" && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-orange-600/40 to-transparent" />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Title */}
        <div className="flex justify-center items-center mt-4 mb-8">
          <h1
            className="text-center text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif px-4 py-2 md:px-6 md:py-3 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transition-colors duration-500 inline-block rounded-lg bg-black/20 backdrop-blur-sm"
            style={{ color: theme.titleColor }}
          >
            <div className="block">맛카의 음식</div>
            <div className="block">동화 이야기</div>
          </h1>
        </div>

        {/* Room Layout */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-4">
          {/* Left Decoration */}
          <div className="order-3 lg:order-1 lg:w-1/4 flex justify-center">
            <SeasonalDecoration season={season} position="left" />
          </div>

          {/* TV - Center */}
          <div className="order-1 lg:order-2 lg:w-2/4 flex flex-col items-center gap-4">
            <VintageTV
              videoUrl={selectedVideoId ? getEmbedUrl(selectedVideoId) : null}
              season={season}
              onVideoEnd={handleRandomPlay}
            />
            {/* Season Selector */}
            <SeasonSelector currentSeason={season} onSeasonChange={setSeason} />
          </div>

          {/* Right Decoration with Playlist */}
          <div className="order-2 lg:order-3 lg:w-1/4 flex flex-col items-center gap-4">
            <SeasonalDecoration season={season} position="right" />

            {/* Playlist */}
            <div className="flex flex-wrap justify-center gap-3 max-w-xs">
              {youtubeVideos.map((video, index) => (
                <PlaylistItem
                  key={video.id}
                  title={video.title || `Story ${index + 1}`}
                  isSelected={selectedVideoId === video.id}
                  onClick={() => setSelectedVideoId(video.id)}
                  colorIndex={index}
                  season={season}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm mt-8 opacity-70 text-white drop-shadow">
          {season === "spring" && "꽃을 클릭하여 이야기를 재생하세요"}
          {season === "summer" && "조개를 클릭하여 이야기를 재생하세요"}
          {season === "autumn" && "도토리를 클릭하여 이야기를 재생하세요"}
          {season === "winter" && "선물 상자를 클릭하여 이야기를 재생하세요"}
        </p>
      </div>

      {/* Ambient glow */}
      <div
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20 transition-colors duration-700"
        style={{ backgroundColor: theme.accentColor }}
      />
    </div>
  )
}
