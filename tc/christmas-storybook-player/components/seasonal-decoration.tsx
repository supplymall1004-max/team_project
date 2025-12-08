"use client"

import type { Season } from "@/data/seasons"

interface SeasonalDecorationProps {
  season: Season
  position: "left" | "right"
}

export function SeasonalDecoration({ season, position }: SeasonalDecorationProps) {
  if (position === "left") {
    return <LeftDecoration season={season} />
  }
  return <RightDecoration season={season} />
}

function LeftDecoration({ season }: { season: Season }) {
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
        <div className="relative w-32 h-48">
          {/* Fireplace */}
          <div className="relative w-full h-full">
            {/* Mantle */}
            <div className="absolute top-8 left-0 right-0 h-4 bg-[#8b4513] rounded-t-lg" />
            {/* Fireplace body */}
            <div className="absolute top-12 left-2 right-2 h-32 bg-[#2d1810] rounded-b-lg">
              {/* Fire opening */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-black rounded-t-full overflow-hidden">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-4xl animate-pulse">🔥</div>
              </div>
            </div>
            {/* Stockings */}
            <div className="absolute top-10 left-4 text-xl">🧦</div>
            <div className="absolute top-10 right-4 text-xl">🧦</div>
          </div>
        </div>
      )
  }
}

function RightDecoration({ season }: { season: Season }) {
  switch (season) {
    case "spring":
      return (
        <div className="relative w-24 h-32 flex items-end justify-center">
          {/* Bird on branch */}
          <div className="text-4xl">🌳</div>
          <div className="absolute top-2 right-2 text-2xl animate-bounce">🐦</div>
        </div>
      )

    case "summer":
      return (
        <div className="relative w-24 h-32 flex items-end justify-center">
          {/* Palm tree */}
          <div className="text-5xl">🌴</div>
          <div className="absolute bottom-0 left-0 text-2xl">🐚</div>
        </div>
      )

    case "autumn":
      return (
        <div className="relative w-24 h-32 flex items-end justify-center">
          {/* Autumn tree */}
          <div className="text-5xl">🌲</div>
          <div className="absolute bottom-0 left-0 text-xl">🌰</div>
          <div className="absolute bottom-4 right-0 text-xl">🍂</div>
        </div>
      )

    case "winter":
      return (
        <div className="relative w-24 h-32 flex items-end justify-center">
          {/* Christmas Tree */}
          <div className="text-5xl">🎄</div>
          <div className="absolute top-0 right-0 text-xl animate-pulse">⭐</div>
        </div>
      )
  }
}
