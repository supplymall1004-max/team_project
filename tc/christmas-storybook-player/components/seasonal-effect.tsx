"use client"

import { useEffect, useState } from "react"
import { type Season, seasonThemes } from "@/data/seasons"

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
  const theme = seasonThemes[season]

  useEffect(() => {
    const count = season === "winter" ? 50 : season === "autumn" ? 30 : season === "spring" ? 40 : 20
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 5 + Math.random() * 10,
      size: season === "winter" ? 2 + Math.random() * 4 : 8 + Math.random() * 12,
      rotation: Math.random() * 360,
    }))
    setParticles(newParticles)
  }, [season])

  const getParticleContent = () => {
    switch (season) {
      case "spring":
        return ["🌸", "🌷", "🌼", "💮"]
      case "summer":
        return ["☀️", "✨", "🌟"]
      case "autumn":
        return ["🍂", "🍁", "🍃"]
      case "winter":
        return null // Uses CSS circles for snow
    }
  }

  const particleContent = getParticleContent()

  if (season === "winter") {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full opacity-80"
            style={{
              left: `${particle.left}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: theme.particleColor,
              animationName: "snowfall",
              animationDuration: `${particle.duration}s`,
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
        <style jsx>{`
          @keyframes snowfall {
            0% {
              transform: translateY(-10px) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 0.8;
            }
            90% {
              opacity: 0.8;
            }
            100% {
              transform: translateY(100vh) rotate(360deg);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute opacity-80"
          style={{
            left: `${particle.left}%`,
            fontSize: `${particle.size}px`,
            animationName: `fall-${season}`,
            animationDuration: `${particle.duration}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDelay: `${particle.delay}s`,
          }}
        >
          {particleContent![particle.id % particleContent!.length]}
        </div>
      ))}
      <style jsx>{`
        @keyframes fall-spring {
          0% {
            transform: translateY(-20px) rotate(0deg) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          50% {
            transform: translateY(50vh) rotate(180deg) translateX(30px);
          }
          90% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(100vh) rotate(360deg) translateX(-20px);
            opacity: 0;
          }
        }
        @keyframes fall-summer {
          0% {
            transform: translateY(-20px) scale(0.8);
            opacity: 0;
          }
          50% {
            transform: translateY(50vh) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) scale(0.8);
            opacity: 0;
          }
        }
        @keyframes fall-autumn {
          0% {
            transform: translateY(-20px) rotate(0deg) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          25% {
            transform: translateY(25vh) rotate(90deg) translateX(50px);
          }
          50% {
            transform: translateY(50vh) rotate(180deg) translateX(-30px);
          }
          75% {
            transform: translateY(75vh) rotate(270deg) translateX(40px);
          }
          90% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(100vh) rotate(360deg) translateX(-20px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
