/**
 * @file page.tsx
 * @description 의료기관 위치 서비스 메인 페이지
 *
 * 네이버 지도로 검색하는 4가지 카드 섹션과
 * 건강보험심사평가원(HIRA) 링크 카드 섹션을 제공합니다.
 */

"use client";

import { NaverMoreLinksSection } from "@/components/health/medical-facilities/naver-more-links-section";
import { HiraLinksSection } from "@/components/health/medical-facilities/hira-links-section";

export default function MedicalFacilitiesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 네이버 지도 더보기 카드 섹션 (4가지: 약국, 병원, 동물병원, 동물약국) */}
      <NaverMoreLinksSection currentLocation={null} />

      {/* 건강보험심사평가원(HIRA) 링크 카드 섹션 */}
      <HiraLinksSection />
    </div>
  );
}
