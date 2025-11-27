/**
 * @file diet-section.tsx
 * @description 홈페이지 AI 맞춤 식단 섹션 (Section C)
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

export function DietSection() {
  return (
    <Section
      id="ai"
      title="🧠 AI 맞춤 식단 큐레이션"
      description="건강 정보를 기반으로 개인 맞춤 식단을 추천해드립니다"
    >
      <DietSectionClient />
    </Section>
  );
}

