/**
 * @file components/layout/types.ts
 * @description 레이아웃 관련 타입 정의
 *
 * 레이아웃 컴포넌트에서 사용하는 공통 타입들을 정의합니다.
 */

/**
 * 네비게이션 링크 타입
 */
export interface NavLink {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

/**
 * 페이지 레이아웃 Props
 */
export interface PageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  headerClassName?: string;
  contentClassName?: string;
}

/**
 * 카드 그리드 Props
 */
export interface CardGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: "sm" | "md" | "lg";
}

/**
 * 섹션 Props
 */
export interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  variant?: "default" | "card" | "bordered";
}
