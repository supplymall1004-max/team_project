"use client"

import type { Season } from "@/data/seasons"

interface PlaylistItemProps {
  title: string
  isSelected: boolean
  onClick: () => void
  colorIndex: number
  season: Season
}

const seasonalStyles = {
  spring: {
    items: ["🌸", "🌷", "🌼", "🌺", "💐", "🌻"],
    selectedBg: "bg-pink-400",
    labelBg: "bg-pink-100 text-pink-800",
  },
  summer: {
    items: ["🐚", "🌊", "⭐", "🦀", "🐠", "🏖️"],
    selectedBg: "bg-cyan-400",
    labelBg: "bg-cyan-100 text-cyan-800",
  },
  autumn: {
    items: ["🌰", "🍂", "🍁", "🎃", "🍄", "🌾"],
    selectedBg: "bg-orange-400",
    labelBg: "bg-orange-100 text-orange-800",
  },
  winter: {
    items: ["🎁", "🎄", "⛄", "🔔", "🎅", "🦌"],
    selectedBg: "bg-yellow-400",
    labelBg: "bg-red-100 text-red-800",
  },
}

export function PlaylistItem({ title, isSelected, onClick, colorIndex, season }: PlaylistItemProps) {
  const styles = seasonalStyles[season]
  const icon = styles.items[colorIndex % styles.items.length]

  return (
    <button
      onClick={onClick}
      className={`
        relative group cursor-pointer transition-all duration-300
        hover:scale-110 hover:-translate-y-1
        ${isSelected ? "scale-110 -translate-y-2" : ""}
      `}
    >
      {/* Glow effect when selected */}
      {isSelected && <div className={`absolute inset-0 ${styles.selectedBg} rounded-full blur-xl -z-10 opacity-50`} />}

      {/* Icon Container */}
      <div
        className={`
        relative w-16 h-16 flex items-center justify-center text-4xl
        transition-transform duration-300
        ${isSelected ? "animate-bounce" : ""}
      `}
      >
        {icon}

        {/* Selection indicator */}
        {isSelected && (
          <div className={`absolute -top-1 -right-1 w-3 h-3 ${styles.selectedBg} rounded-full animate-pulse`} />
        )}
      </div>

      {/* Title Label */}
      <div
        className={`
          absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap
          text-xs font-medium px-2 py-0.5 rounded shadow-md
          ${isSelected ? styles.labelBg : "bg-white/80 text-gray-700"}
          transition-colors duration-300
        `}
      >
        {title.length > 10 ? `${title.slice(0, 10)}...` : title}
      </div>
    </button>
  )
}
