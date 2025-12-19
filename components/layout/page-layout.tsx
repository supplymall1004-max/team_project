/**
 * @file components/layout/page-layout.tsx
 * @description 공통 페이지 레이아웃 래퍼 컴포넌트
 *
 * 페이지별 공통 레이아웃을 제공하는 래퍼 컴포넌트입니다.
 * 제목, 설명, 액션 버튼 등을 props로 받아 일관된 레이아웃을 제공합니다.
 *
 * @dependencies
 * - @/components/ui/card: 카드 컴포넌트
 * - @/components/ui/button: 버튼 컴포넌트
 * - @/components/layout/types: 레이아웃 타입 정의
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PageLayoutProps } from "./types";
import { cn } from "@/lib/utils";

/**
 * 공통 페이지 레이아웃 컴포넌트
 *
 * @example
 * ```tsx
 * <PageLayout
 *   title="건강 관리"
 *   description="가족 구성원의 건강 정보를 관리하세요"
 *   actions={<Button>새 기록 추가</Button>}
 * >
 *   {/* 페이지 콘텐츠 *\/}
 * </PageLayout>
 * ```
 */
export function PageLayout({
  title,
  description,
  children,
  className,
  actions,
  headerClassName,
  contentClassName,
}: PageLayoutProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* 헤더 영역 */}
      <div className={cn("space-y-2", headerClassName)}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-2">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className={cn(contentClassName)}>{children}</div>
    </div>
  );
}
