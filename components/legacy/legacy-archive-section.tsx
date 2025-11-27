/**
 * @file legacy-archive-section.tsx
 * @description 서버 컴포넌트. Supabase에서 레거시 아카이브 데이터를 불러와
 *              클라이언트 UI에 전달합니다.
 */

import { Section } from "@/components/section";
import { getLegacyShowcaseData } from "@/lib/legacy/showcase";
import { LegacyArchiveClient } from "@/components/legacy/legacy-archive-client";

interface LegacyArchiveSectionProps {
  id?: string;
  title?: string;
  description?: string;
}

export async function LegacyArchiveSection({
  id = "legacy",
  title = "레거시 아카이브",
  description = "명인의 인터뷰, 전문 기록, 대체재료 가이드를 한 번에 살펴보세요.",
}: LegacyArchiveSectionProps) {
  let data;
  
  try {
    data = await getLegacyShowcaseData();
  } catch (error) {
    console.error("[LegacyArchiveSection] 데이터 조회 실패:", error);
    // 에러 발생 시 빈 데이터로 처리하여 페이지가 계속 로드되도록 함
    data = {
      videos: [],
      documents: [],
      replacements: [],
    };
  }

  return (
    <Section id={id} title={title} description={description}>
      <LegacyArchiveClient {...data} />
    </Section>
  );
}

