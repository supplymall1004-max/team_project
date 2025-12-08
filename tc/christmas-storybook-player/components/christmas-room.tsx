"use client"

import { useState, useCallback } from "react"
import { youtubeVideos, getEmbedUrl } from "@/data/youtube-videos"
import { GiftBox } from "@/components/gift-box"
import { VintageTV } from "@/components/vintage-tv"
import { Fireplace } from "@/components/fireplace"
import { ChristmasTree } from "@/components/christmas-tree"
import { SnowEffect } from "@/components/snow-effect"

export function ChristmasRoom() {
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

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-[#1a0f0a] via-[#2d1810] to-[#1a0f0a] overflow-hidden">
      {/* Snow Effect */}
      <SnowEffect />

      {/* Window with snowy night view */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-48 h-32 md:w-64 md:h-40 bg-[#0a1628] rounded-lg border-8 border-[#8b4513] shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a2f4a] to-[#0a1628]">
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-snow/80 rounded-t-full" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Title */}
        <h1 className="text-center text-2xl md:text-4xl font-serif text-accent mt-4 mb-8 drop-shadow-lg">
          맛카의 음식 동화 이야기
        </h1>

        {/* Room Layout */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-4">
          {/* Fireplace - Left Side */}
          <div className="order-3 lg:order-1 lg:w-1/4 flex justify-center">
            <Fireplace />
          </div>

          {/* TV - Center */}
          <div className="order-1 lg:order-2 lg:w-2/4 flex justify-center">
            <VintageTV
              videoUrl={selectedVideoId ? getEmbedUrl(selectedVideoId) : null}
              onVideoEnd={handleRandomPlay}
            />
          </div>

          {/* Christmas Tree with Gift Boxes - Right Side */}
          <div className="order-2 lg:order-3 lg:w-1/4 flex flex-col items-center gap-4">
            <ChristmasTree />

            {/* Gift Boxes Playlist */}
            <div className="flex flex-wrap justify-center gap-3 max-w-xs">
              {youtubeVideos.map((video, index) => (
                <GiftBox
                  key={video.id}
                  title={video.title || `Story ${index + 1}`}
                  isSelected={selectedVideoId === video.id}
                  onClick={() => setSelectedVideoId(video.id)}
                  colorIndex={index}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-muted-foreground text-sm mt-8">Click a gift box to play a story</p>
      </div>

      {/* Warm ambient glow from fireplace */}
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-warm-glow/20 rounded-full blur-3xl pointer-events-none" />
    </div>
  )
}
