"use client"

import { useEffect, useRef } from "react"
import { type Season, seasonThemes } from "@/data/seasons"
import { cn } from "@/lib/utils"

interface VintageTVProps {
  videoUrl: string | null
  season?: Season
  onVideoEnd?: () => void
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string
          width?: number | string
          height?: number | string
          playerVars?: {
            autoplay?: number
            mute?: number
            enablejsapi?: number
            origin?: string
          }
          events?: {
            onReady?: () => void
            onStateChange?: (event: { data: number }) => void
          }
        }
      ) => {
        destroy: () => void
        setSize: (width: number, height: number) => void
      }
      PlayerState: {
        ENDED: number
      }
    }
  }
}

export function VintageTV({ videoUrl, season = "winter", onVideoEnd }: VintageTVProps) {
  const theme = seasonThemes[season]
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const tvColors = {
    spring: { body: "bg-[#f5e6d3]", frame: "bg-[#d4a574]", inner: "bg-[#c9a27a]" },
    summer: { body: "bg-[#e0f0f8]", frame: "bg-[#5fa8d3]", inner: "bg-[#4a90b5]" },
    autumn: { body: "bg-[#4a3728]", frame: "bg-[#3d2518]", inner: "bg-[#2d1810]" },
    winter: { body: "bg-[#4a3728]", frame: "bg-[#3d2518]", inner: "bg-[#2d1810]" },
  }

  const colors = tvColors[season]

  // YouTube 비디오 ID 추출
  const getVideoId = (url: string | null): string | null => {
    if (!url) return null
    const match = url.match(/embed\/([a-zA-Z0-9_-]+)/)
    return match ? match[1] : null
  }

  useEffect(() => {
    const videoId = getVideoId(videoUrl)
    const container = containerRef.current

    if (!videoId || !container) {
      // 비디오가 없으면 기존 플레이어 정리
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch (e) {
          console.log("플레이어 정리 중 오류:", e)
        }
        playerRef.current = null
      }
      return
    }

    let resizeObserver: ResizeObserver | null = null

    // 플레이어 크기 조정 함수
    const resizePlayer = () => {
      if (playerRef.current && container) {
        const width = container.offsetWidth
        const height = container.offsetHeight
        if (width > 0 && height > 0) {
          try {
            playerRef.current.setSize(width, height)
            console.log("플레이어 크기 조정:", width, "x", height)
          } catch (e) {
            console.log("플레이어 크기 조정 중 오류:", e)
          }
        }
      }
    }

    // YouTube IFrame API가 로드될 때까지 대기
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initPlayer, 100)
        return
      }

      // 기존 플레이어가 있으면 정리
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch (e) {
          console.log("기존 플레이어 정리 중 오류:", e)
        }
        playerRef.current = null
      }

      // 새 플레이어 생성
      try {
        const playerId = `youtube-player-${Date.now()}`
        // 컨테이너 크기 가져오기
        const containerWidth = container.offsetWidth || 320
        const containerHeight = container.offsetHeight || 570
        
        container.innerHTML = `<div id="${playerId}" style="width: 100%; height: 100%; position: relative; min-width: 100%; min-height: 100%;"></div>`

        playerRef.current = new window.YT.Player(playerId, {
          videoId: videoId,
          width: containerWidth,
          height: containerHeight,
          playerVars: {
            autoplay: 1,
            mute: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              // 플레이어가 준비되면 크기를 다시 조정
              resizePlayer()
            },
            onStateChange: (event: { data: number }) => {
              // 비디오가 끝나면 (ENDED = 0) 랜덤 재생 콜백 호출
              if (event.data === window.YT.PlayerState.ENDED && onVideoEnd) {
                console.log("비디오 재생 완료, 랜덤 재생 시작")
                onVideoEnd()
              }
            },
          },
        })

        // 리사이즈 이벤트 리스너 추가
        resizeObserver = new ResizeObserver(() => {
          resizePlayer()
        })
        resizeObserver.observe(container)

        // 윈도우 리사이즈 이벤트도 추가
        window.addEventListener("resize", resizePlayer)
      } catch (error) {
        console.error("YouTube 플레이어 초기화 오류:", error)
        // 오류 발생 시 기본 iframe으로 폴백
        container.innerHTML = `
          <iframe
            src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&enablejsapi=1"
            style="width: 100%; height: 100%; min-width: 100%; min-height: 100%; border: none;"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube Video Player"
          />
        `
      }
    }

    initPlayer()

    // 정리 함수
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      window.removeEventListener("resize", resizePlayer)
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch (e) {
          console.log("플레이어 정리 중 오류:", e)
        }
        playerRef.current = null
      }
    }
  }, [videoUrl, onVideoEnd])

  return (
    <div className="relative transition-all duration-500 group">
      {/* TV Body - GDWEB 카드 디자인 패턴 적용 */}
      <div className={cn(
        "relative rounded-3xl p-3 shadow-2xl border-4",
        "transition-all duration-500",
        "group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)]",
        colors.body,
        colors.frame
      )}>
        {/* TV Screen Frame */}
        <div className={cn(
          "rounded-2xl p-1",
          "transition-all duration-300",
          colors.inner
        )}>
          {/* Screen - 개선된 스타일 */}
          <div className="relative w-[280px] h-[500px] md:w-[360px] md:h-[640px] bg-black rounded-xl overflow-hidden shadow-inner border border-black/30">
            {videoUrl ? (
              <div ref={containerRef} className="w-full h-full" style={{ minWidth: '100%', minHeight: '100%' }} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f1a]">
                <div className="text-center text-white/70 space-y-4">
                  <div className="text-6xl mb-4 animate-pulse">📺</div>
                  <p className="text-sm font-medium">이야기를 선택해주세요</p>
                  <div className="flex gap-2 justify-center mt-4">
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
            
            {/* Screen reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-xl" />
          </div>
        </div>

        {/* TV Controls - 개선된 디자인 */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <div 
            className="w-5 h-5 rounded-full shadow-inner ring-2 ring-white/20 transition-all duration-300 group-hover:ring-white/40" 
            style={{ backgroundColor: theme.accentColor }}
          />
          <div className={cn(
            "w-7 h-7 rounded-full border-2 transition-all duration-300",
            "group-hover:scale-110",
            colors.body,
            colors.frame
          )} />
          <div className={cn(
            "w-7 h-7 rounded-full border-2 transition-all duration-300",
            "group-hover:scale-110",
            colors.body,
            colors.frame
          )} />
        </div>
      </div>

      {/* TV Stand - 개선된 디자인 */}
      <div className="flex justify-center gap-10 mt-3">
        <div className={cn(
          "w-5 h-10 rounded-b-lg transition-all duration-300",
          "group-hover:scale-105",
          colors.frame,
          "shadow-lg"
        )} />
        <div className={cn(
          "w-5 h-10 rounded-b-lg transition-all duration-300",
          "group-hover:scale-105",
          colors.frame,
          "shadow-lg"
        )} />
      </div>
    </div>
  )
}

