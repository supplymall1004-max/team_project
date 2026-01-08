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
  textColor: string // 카드 및 텍스트 색상
  textMutedColor: string // 보조 텍스트 색상
  cardBg: string // 카드 배경 색상
}

export const seasonThemes: Record<Season, SeasonTheme> = {
  spring: {
    id: "spring",
    name: "Spring",
    nameKo: "봄",
    icon: "🌸",
    title: "장고의 음식 동화 이야기",
    // 밝은 하늘, 태양, 구름, 나비, 초록 언덕, 꽃들의 느낌
    bgGradient: "from-[#e8f5e9] via-[#c8e6c9] to-[#a5d6a7]",
    windowBg: "bg-gradient-to-b from-[#87CEEB] to-[#B0E0E6]",
    accentColor: "#4CAF50", // 초록색 (봄의 자연)
    titleColor: "#2E7D32", // 어두운 초록
    particleColor: "#FFD700", // 노란 꽃들
    textColor: "#1B5E20", // 어두운 초록 (밝은 배경에 대비)
    textMutedColor: "#4CAF50", // 밝은 초록
    cardBg: "bg-white/90 backdrop-blur-md", // 밝은 배경
  },
  summer: {
    id: "summer",
    name: "Summer",
    nameKo: "여름",
    icon: "☀️",
    title: "장고의 음식 동화 이야기",
    // 밝은 파란 하늘, 태양, 열기구, 자전거, 초록 언덕의 느낌
    bgGradient: "from-[#87CEEB] via-[#B0E0E6] to-[#E0F6FF]",
    windowBg: "bg-gradient-to-b from-[#4FC3F7] to-[#81D4FA]",
    accentColor: "#FFA726", // 오렌지 (열기구, 태양)
    titleColor: "#1976D2", // 진한 파란색
    particleColor: "#FFEB3B", // 노란 태양
    textColor: "#0D47A1", // 진한 파란색 (밝은 배경에 대비)
    textMutedColor: "#1976D2", // 밝은 파란색
    cardBg: "bg-white/90 backdrop-blur-md", // 밝은 배경
  },
  autumn: {
    id: "autumn",
    name: "Autumn",
    nameKo: "가을",
    icon: "🍂",
    title: "장고의 음식 동화 이야기",
    // 따뜻한 오렌지/황금색 하늘, 태양, 낙엽의 느낌
    bgGradient: "from-[#FF8C42] via-[#FFA07A] to-[#FFB347]",
    windowBg: "bg-gradient-to-b from-[#FFA500] to-[#FFD700]",
    accentColor: "#FF6B35", // 따뜻한 오렌지
    titleColor: "#D2691E", // 초콜릿 브라운
    particleColor: "#FF8C00", // 오렌지 낙엽
    textColor: "#8B4513", // 갈색 (밝은 배경에 대비)
    textMutedColor: "#CD853F", // 페루 브라운
    cardBg: "bg-white/90 backdrop-blur-md", // 밝은 배경
  },
  winter: {
    id: "winter",
    name: "Winter",
    nameKo: "겨울",
    icon: "❄️",
    title: "장고의 음식 동화 이야기",
    // 어두운 밤 하늘, 달, 별, 눈의 느낌
    bgGradient: "from-[#1a1a2e] via-[#16213e] to-[#0f3460]",
    windowBg: "bg-gradient-to-b from-[#1e3a5f] to-[#2d4a6e]",
    accentColor: "#FFD700", // 황금색 (별, 달)
    titleColor: "#E3F2FD", // 밝은 파란색 (달빛)
    particleColor: "#FFFFFF", // 흰 눈
    textColor: "#E3F2FD", // 밝은 파란색 (어두운 배경에 대비)
    textMutedColor: "#BBDEFB", // 약간 어두운 파란색
    cardBg: "bg-white/10 backdrop-blur-md", // 반투명 배경
  },
}



