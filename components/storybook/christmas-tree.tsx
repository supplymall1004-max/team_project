import { type Season } from "@/data/seasons"

interface SeasonalTreeProps {
  season: Season
}

export function SeasonalTree({ season }: SeasonalTreeProps) {
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
        <div className="relative">
          {/* Star on top */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl animate-pulse">⭐</div>

          {/* Tree layers */}
          <div className="relative">
            {/* Top layer */}
            <div className="w-0 h-0 mx-auto border-l-[30px] border-r-[30px] border-b-[40px] border-l-transparent border-r-transparent border-b-secondary" />

            {/* Middle layer */}
            <div className="w-0 h-0 mx-auto -mt-2 border-l-[45px] border-r-[45px] border-b-[50px] border-l-transparent border-r-transparent border-b-secondary" />

            {/* Bottom layer */}
            <div className="w-0 h-0 mx-auto -mt-2 border-l-[60px] border-r-[60px] border-b-[60px] border-l-transparent border-r-transparent border-b-secondary" />

            {/* Ornaments */}
            <div className="absolute top-8 left-6 w-3 h-3 rounded-full bg-primary shadow-lg" />
            <div className="absolute top-12 right-8 w-3 h-3 rounded-full bg-accent shadow-lg" />
            <div className="absolute top-20 left-4 w-3 h-3 rounded-full bg-[#4169e1] shadow-lg" />
            <div className="absolute top-24 right-6 w-3 h-3 rounded-full bg-primary shadow-lg" />
            <div className="absolute top-16 left-10 w-2 h-2 rounded-full bg-accent shadow-lg" />

            {/* Trunk */}
            <div className="w-8 h-6 mx-auto bg-[#8b4513] rounded-b-sm" />
          </div>
        </div>
      )
  }
}

// 기존 ChristmasTree 컴포넌트는 하위 호환성을 위해 유지
export function ChristmasTree() {
  return <SeasonalTree season="winter" />
}



