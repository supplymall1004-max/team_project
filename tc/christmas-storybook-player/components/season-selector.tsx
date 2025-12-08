"use client"

import { type Season, seasonThemes } from "@/data/seasons"

interface SeasonSelectorProps {
  currentSeason: Season
  onSeasonChange: (season: Season) => void
}

export function SeasonSelector({ currentSeason, onSeasonChange }: SeasonSelectorProps) {
  const seasons: Season[] = ["spring", "summer", "autumn", "winter"]

  return (
    <div className="flex gap-2 bg-black/30 backdrop-blur-md rounded-full p-2">
      {seasons.map((season) => {
        const theme = seasonThemes[season]
        const isActive = currentSeason === season

        return (
          <button
            key={season}
            onClick={() => onSeasonChange(season)}
            className={`
              relative flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300
              ${isActive ? "bg-white/90 text-gray-800 shadow-lg scale-105" : "bg-white/20 text-white hover:bg-white/30"}
            `}
            title={theme.nameKo}
          >
            <span className="text-lg">{theme.icon}</span>
            <span className="hidden md:inline text-sm font-medium">{theme.nameKo}</span>
          </button>
        )
      })}
    </div>
  )
}
