/**
 * @file diet-section.tsx
 * @description 홈페이지 건강 맞춤 식단 섹션 (Section C)
 *
 * 주요 기능:
 * 1. 오늘의 추천 식단 미리보기
 * 2. 건강 정보 입력 안내
 * 3. 식단 페이지로 이동
 */

"use client";

import { Section } from "@/components/section";
import { DietSectionClient } from "./diet-section-client";
import { HealthVisualizationPreview } from "@/components/home/health-visualization-preview";

/**
 * 서버 컴포넌트 버전 (홈페이지 등에서 사용)
 * 서버 컴포넌트에서는 DietSectionWrapper를 직접 import
 */
export async function DietSection() {
  const { DietSectionWrapper } = await import("./diet-section-wrapper");
  return <DietSectionWrapper />;
}

/**
 * 클라이언트 컴포넌트 버전 (식단 페이지 등에서 사용)
 * 건강 맞춤 식단에 특화된 레이아웃
 */
export function DietSectionClientOnly() {
  const sectionTitle = "🍽️ 건강 맞춤 식단";
  const sectionDescription = "건강 정보를 기반으로 개인 맞춤 식단을 추천해드립니다";

  return (
    <Section id="ai" title={sectionTitle} description={sectionDescription}>
      <div className="space-y-4 sm:space-y-6">
        {/* 건강 맞춤 식단 생성 안내 */}
        <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50/50 to-orange-100/30 dark:from-orange-950/20 dark:to-orange-900/10 p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center">
                <span className="text-xl sm:text-2xl">🍽️</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold mb-2 dark:text-foreground">
                건강 맞춤 식단 생성
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
                나의 건강 정보(질병, 알레르기, 선호도)를 반영하여 매일 오후 6시에 자동으로 생성되는 개인 맞춤 식단입니다.
              </p>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-1 sm:space-y-1.5 mb-0">
                <li className="flex items-center gap-2">
                  <span className="text-orange-500 shrink-0">✓</span>
                  <span>질병별 제외 음식 자동 필터링</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-orange-500 shrink-0">✓</span>
                  <span>알레르기 유발 식품 제외</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-orange-500 shrink-0">✓</span>
                  <span>목표 칼로리 및 영양소 맞춤 계산</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-orange-500 shrink-0">✓</span>
                  <span>가족 구성원별 변형 식단 지원</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* 식단 섹션 */}
        <DietSectionClient />
      </div>
    </Section>
  );
}

