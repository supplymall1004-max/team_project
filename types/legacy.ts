/**
 * @file legacy.ts
 * @description 레거시 아카이브(Section A) 도메인 타입 정의.
 *
 * 이 파일은 명인 인터뷰 영상, 문서화된 기록, 전통/현대 재료 정보 등
 * Section A 전반에서 공유되는 타입과 상수를 제공합니다.
 *
 * 주요 타입:
 * 1. LegacyVideo: 명인 인터뷰 및 시연 영상 메타데이터
 * 2. LegacyDocument: 문서화된 레시피/기록 콘텐츠
 * 3. LegacyMaterial & ReplacementGuide: 전통 재료와 현대 대체재료 매핑
 *
 * @dependencies 없음 (순수 타입 선언)
 */

export interface LegacyPerson {
  name: string;
  region: string;
  title: string;
}

export interface LegacyVideo {
  id: string;
  slug: string;
  title: string;
  description: string;
  durationMinutes: number;
  region: string;
  era: string;
  ingredients: string[];
  thumbnail: string;
  videoUrl: string;
  premiumOnly: boolean;
  master: LegacyPerson;
  tags: string[];
}

export interface LegacyDocument {
  id: string;
  title: string;
  summary: string;
  region: string;
  era: string;
  ingredients: LegacyIngredient[];
  tools: LegacyTool[];
  source: {
    author: string;
    publishedAt: string;
    reference: string;
  };
  steps: Array<{
    order: number;
    content: string;
    media?: string;
  }>;
}

export interface LegacyIngredient {
  name: string;
  description: string;
  authenticityNotes: string;
}

export interface LegacyTool {
  name: string;
  usage: string;
  modernAlternatives?: string[];
}

export interface ReplacementGuide {
  traditional: {
    name: string;
    description: string;
  };
  modern: {
    name: string;
    availability: string;
  };
  tips: string[];
}

export interface LegacyFilterState {
  region: string[];
  era: string[];
  ingredients: string[];
  searchTerm: string;
}

export const LEGACY_REGIONS = [
  "경북 안동",
  "전남 담양",
  "제주",
  "서울",
] as const;

export const LEGACY_ERAS = ["조선 후기", "근현대", "1960s", "1980s"] as const;

