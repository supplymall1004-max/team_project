/**
 * @file section.tsx
 * @description 반복되는 섹션 레이아웃을 위한 래퍼 컴포넌트.
 *
 * 주요 기능:
 * 1. 최대 너비, 패딩 등 공통 레이아웃 속성 캡슐화
 * 2. 섹션 제목/설명을 옵션으로 받아 일관된 UI 유지
 */

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  id?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Section({
  id,
  title,
  description,
  children,
  className,
}: SectionProps) {
  return (
    <section id={id} className={cn("py-12 md:py-16", className)}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6">
        {(title || description) && (
          <div>
            {title && (
              <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
            )}
            {description && (
              <p className="mt-2 text-base text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}




















