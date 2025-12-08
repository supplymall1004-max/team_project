/**
 * @file gift-box.tsx
 * @description 선물 상자 컴포넌트 - GDWEB 카드 디자인 패턴 적용
 * 
 * 주요 기능:
 * - 호버 효과 및 선택 상태 표시
 * - 부드러운 애니메이션 및 트랜지션
 * - 접근성 지원
 */

"use client"

import { cn } from "@/lib/utils"

interface GiftBoxProps {
  title: string
  isSelected: boolean
  onClick: () => void
  colorIndex: number
}

const giftColors = [
  { box: "bg-gradient-to-br from-orange-500 to-amber-500", ribbon: "bg-white" },
  { box: "bg-gradient-to-br from-purple-500 to-pink-500", ribbon: "bg-white" },
  { box: "bg-gradient-to-br from-blue-500 to-cyan-500", ribbon: "bg-white" },
  { box: "bg-gradient-to-br from-green-500 to-emerald-500", ribbon: "bg-white" },
  { box: "bg-gradient-to-br from-red-500 to-rose-500", ribbon: "bg-white" },
  { box: "bg-gradient-to-br from-indigo-500 to-purple-500", ribbon: "bg-white" },
]

export function GiftBox({ title, isSelected, onClick, colorIndex }: GiftBoxProps) {
  const colors = giftColors[colorIndex % giftColors.length]

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative group cursor-pointer transition-all duration-500 ease-out",
        "hover:scale-110 hover:-translate-y-2",
        "active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        isSelected && "scale-110 -translate-y-2"
      )}
      aria-label={`${title} 이야기 재생`}
      aria-pressed={isSelected}
    >
      {/* Glow effect when selected - GDWEB 패턴 */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/50 via-amber-500/50 to-orange-500/50 rounded-lg blur-xl -z-10 animate-pulse" />
      )}

      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-md" />

      {/* Gift Box - 개선된 디자인 */}
      <div className={cn(
        "relative w-16 h-14 rounded-lg shadow-xl",
        "transition-all duration-300",
        colors.box,
        isSelected && "shadow-2xl ring-2 ring-white/50",
        "group-hover:shadow-2xl"
      )}>
        {/* Vertical Ribbon */}
        <div className={cn(
          "absolute left-1/2 -translate-x-1/2 w-2 h-full",
          colors.ribbon,
          "opacity-90"
        )} />

        {/* Horizontal Ribbon */}
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 w-full h-2",
          colors.ribbon,
          "opacity-90"
        )} />

        {/* Bow - 개선된 디자인 */}
        <div className={cn(
          "absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-4 rounded-full",
          colors.ribbon,
          "shadow-md",
          "transition-transform duration-300",
          "group-hover:scale-110"
        )} />

        {/* Selection indicator - 개선된 스타일 */}
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse shadow-lg ring-2 ring-white" />
        )}

        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Title Label - 가시성 개선된 스타일 */}
      <div
        className={cn(
          "absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap z-10",
          "text-sm font-bold px-3 py-1.5 rounded-lg",
          "transition-all duration-300",
          "backdrop-blur-md",
          "shadow-lg",
          isSelected 
            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xl scale-105 ring-2 ring-white/50" 
            : "bg-black/80 text-white border-2 border-white/30",
          "group-hover:scale-105 group-hover:bg-black/90 group-hover:shadow-xl"
        )}
      >
        {title.length > 12 ? `${title.slice(0, 12)}...` : title}
      </div>
    </button>
  )
}

