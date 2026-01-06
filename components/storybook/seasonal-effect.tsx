/**
 * @file seasonal-effect.tsx
 * @description 계절별 파티클 효과 컴포넌트
 * 
 * 주요 기능:
 * - 봄: 꽃가루 효과 (🌸🌷🌼💮)
 * - 여름: 소나기 효과 (💧🌧️)
 * - 가을: 단풍 효과 (🍂🍁🍃)
 * - 겨울: 눈 효과 (❄️)
 */

"use client"

import { useEffect, useState } from "react"
import { type Season } from "@/data/seasons"

interface Particle {
  id: number
  left: number
  delay: number
  duration: number
  size: number
  rotation: number
}

interface SeasonalEffectProps {
  season: Season
}

export function SeasonalEffect({ season }: SeasonalEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    // 계절별 파티클 개수 조정 (전체 화면을 커버하기 위해 증가)
    const count = season === "winter" ? 80 : season === "autumn" ? 50 : season === "spring" ? 60 : 40
    
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 8 + Math.random() * 15,
      size: season === "winter" ? 2 + Math.random() * 4 : 12 + Math.random() * 16,
      rotation: Math.random() * 360,
    }))
    setParticles(newParticles)
  }, [season])

  const getParticleContent = () => {
    switch (season) {
      case "spring":
        return ["🌸", "🌷", "🌼", "💮", "🌺"]
      case "summer":
        return ["💧", "🌧️", "☔"]
      case "autumn":
        return ["🍂", "🍁", "🍃"]
      case "winter":
        return null // 눈은 CSS로 그려짐
    }
  }

  const particleContent = getParticleContent()

  // 겨울: 눈 효과 (기존 SnowEffect와 유사)
  if (season === "winter") {
    return (
      <div className="fixed inset-0 pointer-events-none z-[1]">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute bg-white rounded-full opacity-80"
            style={{
              left: `${particle.left}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              top: '-10px',
              animationName: 'snowfall',
              animationDuration: `${particle.duration}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
        <style jsx>{`
          @keyframes snowfall {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 0.8;
            }
            90% {
              opacity: 0.8;
            }
            100% {
              transform: translateY(calc(100vh + 200vh)) rotate(360deg);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    )
  }

  // 봄, 여름, 가을: 이모지 파티클 효과
  return (
    <div className="fixed inset-0 pointer-events-none z-[1]">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute opacity-80 select-none"
          style={{
            left: `${particle.left}%`,
            fontSize: `${particle.size}px`,
            top: '-20px',
            animationName: `fall-${season}`,
            animationDuration: `${particle.duration}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: `${particle.delay}s`,
          }}
        >
          {particleContent![particle.id % particleContent!.length]}
        </div>
      ))}
      <style jsx>{`
        @keyframes fall-spring {
          0% {
            transform: translateY(0) rotate(0deg) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          50% {
            transform: translateY(calc(50vh + 100vh)) rotate(180deg) translateX(30px);
          }
          90% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(calc(100vh + 200vh)) rotate(360deg) translateX(-20px);
            opacity: 0;
          }
        }
        @keyframes fall-summer {
          0% {
            transform: translateY(0) scale(0.8) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            transform: translateY(calc(50vh + 100vh)) scale(1.2) translateX(20px);
            opacity: 0.9;
          }
          90% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(calc(100vh + 200vh)) scale(0.8) translateX(-15px);
            opacity: 0;
          }
        }
        @keyframes fall-autumn {
          0% {
            transform: translateY(0) rotate(0deg) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          25% {
            transform: translateY(calc(25vh + 50vh)) rotate(90deg) translateX(50px);
          }
          50% {
            transform: translateY(calc(50vh + 100vh)) rotate(180deg) translateX(-30px);
          }
          75% {
            transform: translateY(calc(75vh + 150vh)) rotate(270deg) translateX(40px);
          }
          90% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(calc(100vh + 200vh)) rotate(360deg) translateX(-20px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

