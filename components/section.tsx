/**
 * @file components/section.tsx
 * @description 반복되는 섹션 레이아웃을 위한 래퍼 컴포넌트
 *
 * 주요 기능:
 * 1. 최대 너비, 패딩 등 공통 레이아웃 속성 캡슐화
 * 2. 섹션 제목/설명을 옵션으로 받아 일관된 UI 유지
 * 3. actions 버튼 지원 (선택적)
 * 4. variant에 따른 스타일링 (default, card, bordered)
 *
 * @dependencies
 * - @/lib/utils: cn 함수
 * - @/components/layout/types: SectionProps 타입
 */

import { cn } from "@/lib/utils";
import type { SectionProps as LayoutSectionProps } from "@/components/layout/types";

interface SectionProps extends Omit<LayoutSectionProps, "title"> {
  id?: string;
  title?: string; // title을 optional로 변경 (기존 코드 호환성)
  variant?: "default" | "card" | "bordered";
}

/**
 * 섹션 컴포넌트
 *
 * @example
 * ```tsx
 * <Section title="레시피" description="다양한 레시피를 확인하세요" actions={<Button>더보기</Button>}>
 *   {/* 콘텐츠 *\/}
 * </Section>
 * ```
 */
export function Section({
  id,
  title,
  description,
  children,
  className,
  actions,
  variant = "default",
}: SectionProps) {
  const variantStyles = {
    default: "",
    card: "rounded-lg border bg-card p-6",
    bordered: "border-b border-border pb-8",
  };

  return (
    <section
      id={id}
      className={cn(
        "py-8 sm:py-12 md:py-16",
        variantStyles[variant],
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:gap-6 px-4 sm:px-6">
        {(title || description || actions) && (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {title && (
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1.5 sm:mt-2 text-sm sm:text-base text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}




















