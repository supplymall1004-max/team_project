export type Season = "spring" | "summer" | "autumn" | "winter"

export interface SeasonTheme {
  id: Season
  name: string
  nameKo: string
  icon: string
  title: string
  bgGradient: string
  windowBg: string
  accentColor: string
  titleColor: string
  particleColor: string
}

export const seasonThemes: Record<Season, SeasonTheme> = {
  spring: {
    id: "spring",
    name: "Spring",
    nameKo: "봄",
    icon: "🌸",
    title: "맛카의 음식 동화 이야기",
    bgGradient: "from-[#fce4ec] via-[#f8bbd9] to-[#f3e5f5]",
    windowBg: "bg-gradient-to-b from-[#87ceeb] to-[#add8e6]",
    accentColor: "#ff69b4",
    titleColor: "#8b008b",
    particleColor: "#ffb7c5",
  },
  summer: {
    id: "summer",
    name: "Summer",
    nameKo: "여름",
    icon: "🌊",
    title: "맛카의 음식 동화 이야기",
    bgGradient: "from-[#1e3a5f] via-[#2d5a87] to-[#1e3a5f]",
    windowBg: "bg-gradient-to-b from-[#00bfff] to-[#87ceeb]",
    accentColor: "#00bfff",
    titleColor: "#ffffff",
    particleColor: "#ffffff",
  },
  autumn: {
    id: "autumn",
    name: "Autumn",
    nameKo: "가을",
    icon: "🍂",
    title: "맛카의 음식 동화 이야기",
    bgGradient: "from-[#4a2810] via-[#6b3a1a] to-[#4a2810]",
    windowBg: "bg-gradient-to-b from-[#ff8c00] to-[#daa520]",
    accentColor: "#ff6347",
    titleColor: "#ffd700",
    particleColor: "#d2691e",
  },
  winter: {
    id: "winter",
    name: "Winter",
    nameKo: "겨울",
    icon: "❄️",
    title: "맛카의 음식 동화 이야기",
    bgGradient: "from-[#1a0f0a] via-[#2d1810] to-[#1a0f0a]",
    windowBg: "bg-gradient-to-b from-[#1a2f4a] to-[#0a1628]",
    accentColor: "#ffd700",
    titleColor: "#ffd700",
    particleColor: "#ffffff",
  },
}
