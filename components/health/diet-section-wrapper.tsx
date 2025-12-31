/**
 * @file diet-section-wrapper.tsx
 * @description DietSection 래퍼 컴포넌트
 *
 * 서버/클라이언트 모두에서 사용 가능하도록 콘텐츠 조회 방식 분리
 */

import { Section } from "@/components/section";
import { DietSectionClient } from "./diet-section-client";
import { HealthVisualizationPreview } from "@/components/home/health-visualization-preview";
import { getMultipleCopyContent } from "@/lib/admin/copy-reader";

interface DietSectionWrapperProps {
  clientOnly?: boolean;
}

/**
 * 서버 컴포넌트 버전
 */
export async function DietSectionWrapper({ clientOnly = false }: DietSectionWrapperProps = {}) {
  // 클라이언트 전용이면 기본값만 사용
  if (clientOnly) {
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

  // 서버 컴포넌트에서는 데이터베이스에서 조회
  const sectionContent = await getMultipleCopyContent([
    "diet-section-title",
    "diet-section-description",
  ]);

  const sectionTitle =
    sectionContent["diet-section-title"]?.content.title || "🧠 건강 맞춤 식단 큐레이션";
  const sectionDescription =
    sectionContent["diet-section-description"]?.content.description ||
    "건강 정보를 기반으로 개인 맞춤 식단을 추천해드립니다";

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


