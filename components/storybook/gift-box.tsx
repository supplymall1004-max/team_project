/**
 * @file gift-box.tsx
 * @description 계절별 아이콘 컴포넌트 - GDWEB 카드 디자인 패턴 적용
 * 
 * 주요 기능:
 * - 호버 효과 및 선택 상태 표시
 * - 부드러운 애니메이션 및 트랜지션
 * - 접근성 지원
 * - 계절별 테마 아이콘만 표시 (크리스마스 상자 제거)
 */

"use client"

import { cn } from "@/lib/utils"
import { type Season, seasonThemes } from "@/data/seasons"

interface GiftBoxProps {
  title: string
  isSelected: boolean
  onClick: () => void
  colorIndex: number
  season?: Season // 계절 테마 정보
  icon?: string // 비디오 아이콘 (이모지 등, 있으면 우선 표시)
}

// 계절별 아이콘 배열 - 각 계절은 해당 계절의 아이콘만 사용
// 봄 테마: 봄 아이콘만 (🌸, 🌷, 🌼, 🌺, 💐, 🌻, 🌹, 🦋)
// 여름 테마: 여름 아이콘만 (🌊, 🐚, ⭐, 🦀, 🐠, 🏖️, 🏝️, 🍉)
// 가을 테마: 가을 아이콘만 (🍂, 🍁, 🌰, 🎃, 🍄, 🌾, 🍇, 🥮)
// 겨울 테마: 겨울 아이콘만 (❄️, 🎁, 🎄, ⛄, 🔔, 🎅, 🦌, ☃️)
const seasonalIcons: Record<Season, string[]> = {
  spring: ["🌸", "🌷", "🌼", "🌺", "💐", "🌻", "🌹", "🦋"],
  summer: ["🌊", "🐚", "⭐", "🦀", "🐠", "🏖️", "🏝️", "🍉"],
  autumn: ["🍂", "🍁", "🌰", "🎃", "🍄", "🌾", "🍇", "🥮"],
  winter: ["❄️", "🎁", "🎄", "⛄", "🔔", "🎅", "🦌", "☃️"],
}

// 계절별 스타일 정의
const seasonalStyles = {
  spring: {
    selectedBg: "bg-pink-400",
    labelBg: "bg-pink-100 text-pink-800",
    glowColor: "from-pink-500/50 via-rose-500/50 to-pink-500/50",
  },
  summer: {
    selectedBg: "bg-cyan-400",
    labelBg: "bg-cyan-100 text-cyan-800",
    glowColor: "from-cyan-500/50 via-blue-500/50 to-cyan-500/50",
  },
  autumn: {
    selectedBg: "bg-orange-400",
    labelBg: "bg-orange-100 text-orange-800",
    glowColor: "from-orange-500/50 via-amber-500/50 to-orange-500/50",
  },
  winter: {
    selectedBg: "bg-yellow-400",
    labelBg: "bg-red-100 text-red-800",
    glowColor: "from-yellow-500/50 via-amber-500/50 to-yellow-500/50",
  },
}

export function GiftBox({ title, isSelected, onClick, colorIndex, season = "winter", icon }: GiftBoxProps) {
  // 각 계절별로 해당 계절의 아이콘만 표시되도록 보장
  // 봄 테마는 봄 아이콘만, 여름 테마는 여름 아이콘만, 가을 테마는 가을 아이콘만, 겨울 테마는 겨울 아이콘만 사용
  const validSeason: Season = (season && season in seasonalIcons ? season : "winter") as Season
  
  // 해당 계절의 아이콘 배열만 사용 (다른 계절 아이콘은 절대 사용하지 않음)
  const icons = seasonalIcons[validSeason]
  
  // 해당 계절의 아이콘 배열에서만 선택 (다른 계절 아이콘은 선택되지 않음)
  const seasonIcon = icons[colorIndex % icons.length]
  
  // icon prop이 있으면 우선적으로 사용, 없으면 계절 아이콘 사용
  const displayIcon = icon || seasonIcon
  
  const styles = seasonalStyles[validSeason]
  
  // 디버깅: 잘못된 계절이 전달되면 콘솔에 경고
  if (process.env.NODE_ENV === "development" && season && !(season in seasonalIcons)) {
    console.warn(`[GiftBox] 잘못된 계절 정보: ${season}, 기본값(winter) 사용`)
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative group cursor-pointer transition-all duration-500 ease-out",
        "hover:scale-110 hover:-translate-y-1",
        "active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        isSelected && "scale-110 -translate-y-2"
      )}
      aria-label={`${title} 이야기 재생`}
      aria-pressed={isSelected}
    >
      {/* Glow effect when selected - 계절별 색상 */}
      {isSelected && (
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r rounded-full blur-xl -z-10 animate-pulse",
          `bg-gradient-to-r ${styles.glowColor}`
        )} />
      )}

      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-md" />

      {/* 계절 아이콘 컨테이너 */}
      <div
        className={cn(
          "relative w-16 h-16 flex items-center justify-center text-4xl",
          "transition-transform duration-300",
          isSelected && "animate-bounce"
        )}
      >
        {displayIcon}

        {/* Selection indicator */}
        {isSelected && (
          <div className={cn(
            "absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse",
            styles.selectedBg
          )} />
        )}
      </div>

      {/* Title Label - 계절별 스타일 */}
      <div
        className={cn(
          "absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap",
          "text-xs font-medium px-2 py-0.5 rounded shadow-md",
          "transition-colors duration-300",
          isSelected ? styles.labelBg : "bg-white/80 text-gray-700"
        )}
      >
        {title.length > 10 ? `${title.slice(0, 10)}...` : title}
      </div>
    </button>
  )
}

