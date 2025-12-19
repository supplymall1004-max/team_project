/**
 * @file components/layout/card-grid.tsx
 * @description 반응형 카드 그리드 시스템
 *
 * 반응형 그리드 레이아웃을 제공하는 컴포넌트입니다.
 * 모바일, 태블릿, 데스크톱에 따라 다른 열 수를 지원합니다.
 *
 * @dependencies
 * - @/components/layout/types: 레이아웃 타입 정의
 * - @/lib/utils: cn 유틸리티
 */

import type { CardGridProps } from "./types";
import { cn } from "@/lib/utils";

/**
 * 반응형 카드 그리드 컴포넌트
 *
 * @example
 * ```tsx
 * <CardGrid
 *   columns={{ mobile: 1, tablet: 2, desktop: 3 }}
 *   gap="md"
 * >
 *   <Card>...</Card>
 *   <Card>...</Card>
 *   <Card>...</Card>
 * </CardGrid>
 * ```
 */
const gridColsMap = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
} as const;

const gridColsTabletMap = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
} as const;

const gridColsDesktopMap = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
} as const;

export function CardGrid({
  children,
  className,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = "md",
}: CardGridProps) {
  const gapClasses = {
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
  };

  const mobileCols = columns.mobile || 1;
  const tabletCols = columns.tablet || 2;
  const desktopCols = columns.desktop || 3;

  return (
    <div
      className={cn(
        "grid",
        gridColsMap[Math.min(Math.max(mobileCols, 1), 6) as keyof typeof gridColsMap] || "grid-cols-1",
        gridColsTabletMap[Math.min(Math.max(tabletCols, 1), 6) as keyof typeof gridColsTabletMap] || "md:grid-cols-2",
        gridColsDesktopMap[Math.min(Math.max(desktopCols, 1), 6) as keyof typeof gridColsDesktopMap] || "lg:grid-cols-3",
        gapClasses[gap],
        className,
      )}
    >
      {children}
    </div>
  );
}
