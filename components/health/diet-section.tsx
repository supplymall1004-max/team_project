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
 * 기본값만 사용하여 서버 컴포넌트 호출 없이 렌더링
 */
export function DietSectionClientOnly() {
  const sectionTitle = "🧠 건강 맞춤 식단 큐레이션";
  const sectionDescription = "건강 정보를 기반으로 개인 맞춤 식단을 추천해드립니다";

  return (
    <Section id="ai" title={sectionTitle} description={sectionDescription}>
      <div className="space-y-6">
        {/* 건강 시각화 미리보기 */}
        <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-950/20 p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-foreground">
            💚 건강 시각화 미리보기
          </h3>
          <HealthVisualizationPreview compact={true} />
        </div>
        
        {/* 식단 섹션 */}
        <DietSectionClient />
      </div>
    </Section>
  );
}

