/**
 * @file home-landing.tsx
 * @description 홈 빠른 시작 섹션 서버 컴포넌트.
 * 히어로 섹션은 별도 컴포넌트로 분리됨.
 */

import { HeroSection } from "./hero-section";

const quickStart = [
  {
    title: "🎬 레거시 아카이브",
    description: "명인 인터뷰와 전통 조리법을 고화질로 감상하세요.",
    href: "#legacy",
  },
  {
    title: "📚 현대 레시피 북",
    description: "별점과 난이도로 정리된 최신 레시피를 확인해요.",
    href: "#recipes",
  },
  {
    title: "🤖 AI 맞춤 식단",
    description: "건강 정보를 기반으로 개인 맞춤 식단을 추천받아요.",
    href: "#ai",
  },
];

export async function HomeLanding() {
  // 배경 이미지는 추후 다른 소스로 구현 예정
  const backgroundImageUrl: string | null = null;

  return (
    <div className="space-y-4">
      {/* 히어로 섹션 (배경 이미지 전달) */}
      <HeroSection backgroundImageUrl={backgroundImageUrl} />
    </div>
  );
}

