"use client"

import { useEffect, useRef } from "react"
import { type Season, seasonThemes } from "@/data/seasons"

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
        
        container.innerHTML = `<div id="${playerId}" style="width: 100%; height: 100%; position: relative;"></div>`

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
            style="width: 100%; height: 100%; border: none;"
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
    <div className="relative transition-all duration-500">
      {/* TV Body */}
      <div className={`relative ${colors.body} rounded-2xl p-4 shadow-2xl border-4 ${colors.frame}`}>
        {/* TV Screen Frame */}
        <div className={`${colors.inner} rounded-xl p-3`}>
          {/* Screen */}
          <div className="relative w-[280px] h-[500px] md:w-[320px] md:h-[570px] bg-black rounded-lg overflow-hidden">
            {videoUrl ? (
              <div ref={containerRef} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a]">
                <div className="text-center text-white/60">
                  <div className="text-4xl mb-2">📺</div>
                  <p className="text-sm">Select a story to play</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TV Controls */}
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: theme.accentColor }} />
          <div className={`w-6 h-6 rounded-full ${colors.body} border-2 ${colors.frame}`} />
          <div className={`w-6 h-6 rounded-full ${colors.body} border-2 ${colors.frame}`} />
        </div>
      </div>

      {/* TV Stand */}
      <div className="flex justify-center gap-8 mt-2">
        <div className={`w-4 h-8 ${colors.frame} rounded-b-lg`} />
        <div className={`w-4 h-8 ${colors.frame} rounded-b-lg`} />
      </div>
    </div>
  )
}
