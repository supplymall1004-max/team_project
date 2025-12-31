/**
 * @file home-customization.ts
 * @description 홈페이지 커스텀 설정 타입 정의
 *
 * 주요 기능:
 * 1. 테마 모드 (light, dark, auto)
 * 2. 배경 타입 (gradient, image, color)
 * 3. 섹션 순서 관리
 * 4. 카드 스타일 커스터마이징
 */

export type ThemeMode = 'light' | 'dark' | 'auto';
export type BackgroundType = 'gradient' | 'image' | 'color';

export interface ThemeSettings {
  /** 테마 모드 */
  mode: ThemeMode;
  /** 배경 타입 */
  backgroundType: BackgroundType;
  /** 배경 이미지 URL (Supabase Storage 경로 또는 외부 URL) */
  backgroundImageUrl?: string;
  /** 배경 색상 (hex 색상) */
  backgroundColor?: string;
  /** 커스텀 그라데이션 (CSS gradient 문자열) */
  customGradient?: string;
}

export interface CardStyleSettings {
  /** 카드 모서리 둥글기 */
  borderRadius?: string;
  /** 카드 그림자 */
  shadow?: string;
}

export interface HomeCustomization {
  /** 테마 설정 */
  theme: ThemeSettings;
  
  /** 섹션 순서 (섹션 ID 배열) */
  sectionOrder: string[];
  
  /** 카드 스타일 설정 */
  cardStyle?: CardStyleSettings;
  
  /** 메타데이터 */
  lastUpdated?: string;
  /** 스키마 버전 (마이그레이션 관리용) */
  version?: string;
}

/** 기본 커스텀 설정 */
export const DEFAULT_HOME_CUSTOMIZATION: HomeCustomization = {
  theme: {
    mode: 'light',
    backgroundType: 'gradient',
  },
  sectionOrder: [
    'emergency-quick-access',
    'weather-widget',
    'hero-section',
    'character-game',
    'community-preview',
  ],
  version: '1.0.0',
};

/** 섹션 ID 상수 */
export const SECTION_IDS = {
  emergency: 'emergency-quick-access',
  weather: 'weather-widget',
  hero: 'hero-section',
  characterGame: 'character-game',
  community: 'community-preview',
} as const;

