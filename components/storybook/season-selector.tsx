/**
 * @file season-selector.tsx
 * @description 계절 테마 선택 컴포넌트
 * 
 * 주요 기능:
 * - 봄, 여름, 가을, 겨울 테마 선택
 * - 선택된 테마 하이라이트
 * - 부드러운 애니메이션 및 트랜지션
 * - 작고 세련된 디자인
 */

"use client"

import { type Season, seasonThemes } from "@/data/seasons"
import { cn } from "@/lib/utils"

interface SeasonSelectorProps {
  selectedSeason: Season
  onSeasonChange: (season: Season) => void
}

export function SeasonSelector({ selectedSeason, onSeasonChange }: SeasonSelectorProps) {
  const seasons: Season[] = ["spring", "summer", "autumn", "winter"]

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex items-center justify-center gap-2 mb-3">
        {seasons.map((season) => {
          const theme = seasonThemes[season]
          const isSelected = selectedSeason === season

          return (
            <button
              key={season}
              onClick={() => {
                console.groupCollapsed("[SeasonSelector] 계절 테마 변경")
                console.log("season:", theme.nameKo)
                console.groupEnd()
                onSeasonChange(season)
              }}
              className={cn(
                "relative group rounded-lg px-3 py-2 transition-all duration-300",
                "border backdrop-blur-sm",
                "hover:scale-110 hover:shadow-lg",
                "active:scale-95",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1",
                isSelected
                  ? "border-orange-400/60 bg-gradient-to-br from-orange-500/40 to-amber-500/40 shadow-md ring-1 ring-orange-400/50 scale-105"
                  : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10"
              )}
              aria-label={`${theme.nameKo} 테마 선택`}
              aria-pressed={isSelected}
            >
              {/* 선택 표시 - 작은 점 */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full shadow-md ring-1 ring-white/50">
                  <div className="w-1 h-1 bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
              )}

              {/* 계절 아이콘 - 작게 */}
              <div className="text-xl leading-none">{theme.icon}</div>

              {/* 호버 글로우 효과 */}
              <div className={cn(
                "absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-md",
                season === "spring" && "bg-pink-500/20",
                season === "summer" && "bg-blue-500/20",
                season === "autumn" && "bg-orange-500/20",
                season === "winter" && "bg-cyan-500/20"
              )} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

