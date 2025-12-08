"use client"

import { type Season } from "@/data/seasons"

interface SeasonalFireplaceProps {
  season: Season
}

export function SeasonalFireplace({ season }: SeasonalFireplaceProps) {
  switch (season) {
    case "spring":
      return (
        <div className="relative w-32 h-48">
          {/* Flower Pot */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-16 bg-[#d2691e] rounded-b-lg">
            <div className="absolute -top-2 left-0 right-0 h-4 bg-[#8b4513] rounded-t-lg" />
          </div>
          {/* Flowers */}
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="text-5xl">🌷</div>
            <div className="flex gap-2 -mt-2">
              <div className="text-3xl">🌸</div>
              <div className="text-3xl">🌼</div>
            </div>
          </div>
          {/* Butterfly */}
          <div className="absolute top-4 right-0 text-2xl animate-bounce">🦋</div>
        </div>
      )

    case "summer":
      return (
        <div className="relative w-32 h-48">
          {/* Beach Chair */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-6xl">🏖️</div>
          {/* Umbrella */}
          <div className="absolute top-0 left-0 text-5xl">🏝️</div>
          {/* Ice cream */}
          <div className="absolute bottom-8 right-0 text-3xl animate-pulse">🍦</div>
        </div>
      )

    case "autumn":
      return (
        <div className="relative w-32 h-48">
          {/* Campfire */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            <div className="text-5xl animate-pulse">🔥</div>
            <div className="flex justify-center -mt-2">
              <div className="w-4 h-2 bg-[#8b4513] rounded-sm mx-0.5 rotate-[-20deg]" />
              <div className="w-4 h-2 bg-[#8b4513] rounded-sm mx-0.5" />
              <div className="w-4 h-2 bg-[#8b4513] rounded-sm mx-0.5 rotate-[20deg]" />
            </div>
          </div>
          {/* Mushrooms */}
          <div className="absolute bottom-0 left-0 text-2xl">🍄</div>
          <div className="absolute bottom-4 right-2 text-xl">🍄</div>
          {/* Pumpkin */}
          <div className="absolute top-8 left-4 text-3xl">🎃</div>
        </div>
      )

    case "winter":
      return (
        <div className="relative w-32 h-40 md:w-40 md:h-48">
          {/* Mantle */}
          <div className="absolute -top-2 -left-4 -right-4 h-4 bg-[#5a3d2b] rounded-t-lg shadow-lg" />

          {/* Brick Background */}
          <div className="absolute inset-0 bg-[#8b4513] rounded-b-lg overflow-hidden">
            {/* Brick Pattern */}
            <div className="absolute inset-0 opacity-30">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className={`w-12 h-5 border border-[#654321] ${i % 2 === 0 ? "" : "ml-6"}`} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Fire Opening */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-24 md:w-24 md:h-28 bg-[#1a0f0a] rounded-t-full overflow-hidden">
            {/* Animated Fire */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
              {/* Fire Glow */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-orange-500/50 rounded-full blur-xl animate-pulse" />

              {/* Fire Flames */}
              <div className="relative flex justify-center gap-1">
                <div
                  className="w-3 h-12 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 rounded-full animate-[flicker_0.5s_ease-in-out_infinite]"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-4 h-16 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-300 rounded-full animate-[flicker_0.4s_ease-in-out_infinite]"
                  style={{ animationDelay: "100ms" }}
                />
                <div
                  className="w-3 h-14 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 rounded-full animate-[flicker_0.6s_ease-in-out_infinite]"
                  style={{ animationDelay: "200ms" }}
                />
                <div
                  className="w-4 h-12 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 rounded-full animate-[flicker_0.5s_ease-in-out_infinite]"
                  style={{ animationDelay: "150ms" }}
                />
              </div>

              {/* Logs */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1">
                <div className="w-10 h-3 bg-[#4a3728] rounded-full -rotate-12" />
                <div className="w-10 h-3 bg-[#3d2518] rounded-full rotate-12" />
              </div>
            </div>
          </div>

          {/* Stockings */}
          <div className="absolute -bottom-4 left-0 w-6 h-8 bg-primary rounded-b-lg" />
          <div className="absolute -bottom-4 right-0 w-6 h-8 bg-secondary rounded-b-lg" />
        </div>
      )
  }
}

// 기존 Fireplace 컴포넌트는 하위 호환성을 위해 유지
export function Fireplace() {
  return <SeasonalFireplace season="winter" />
}



