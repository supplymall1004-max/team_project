"use client"

interface GiftBoxProps {
  title: string
  isSelected: boolean
  onClick: () => void
  colorIndex: number
}

const giftColors = [
  { box: "bg-primary", ribbon: "bg-accent" },
  { box: "bg-secondary", ribbon: "bg-primary" },
  { box: "bg-accent", ribbon: "bg-primary" },
  { box: "bg-[#8b4513]", ribbon: "bg-accent" },
  { box: "bg-[#4169e1]", ribbon: "bg-snow" },
  { box: "bg-[#9932cc]", ribbon: "bg-accent" },
]

export function GiftBox({ title, isSelected, onClick, colorIndex }: GiftBoxProps) {
  const colors = giftColors[colorIndex % giftColors.length]

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
      {isSelected && <div className="absolute inset-0 bg-accent/50 rounded-lg blur-xl -z-10" />}

      {/* Gift Box */}
      <div className={`relative w-16 h-14 ${colors.box} rounded-md shadow-lg`}>
        {/* Vertical Ribbon */}
        <div className={`absolute left-1/2 -translate-x-1/2 w-2 h-full ${colors.ribbon}`} />

        {/* Horizontal Ribbon */}
        <div className={`absolute top-1/2 -translate-y-1/2 w-full h-2 ${colors.ribbon}`} />

        {/* Bow */}
        <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-4 ${colors.ribbon} rounded-full`} />

        {/* Selection indicator */}
        {isSelected && <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse" />}
      </div>

      {/* Title Label */}
      <div
        className={`
        absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap
        text-xs font-medium px-2 py-0.5 rounded
        ${isSelected ? "bg-accent text-accent-foreground" : "bg-card text-card-foreground"}
        transition-colors duration-300
      `}
      >
        {title.length > 10 ? `${title.slice(0, 10)}...` : title}
      </div>
    </button>
  )
}
