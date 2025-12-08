/**
 * @file diet-section.tsx
 * @description 홈페이지 건강 맞춤 식단 섹션 (Section C)
 *
 * 주요 기능:
 * 1. 오늘의 추천 식단 미리보기
 * 2. 건강 정보 입력 안내
 * 3. 식단 페이지로 이동
 */

import Link from "next/link";
import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { DietSectionClient } from "./diet-section-client";
import { getMultipleCopyContent } from "@/lib/admin/copy-reader";

export async function DietSection() {
  // 섹션 콘텐츠 조회
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
      <DietSectionClient />
    </Section>
  );
}

