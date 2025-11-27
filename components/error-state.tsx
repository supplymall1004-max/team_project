/**
 * @file error-state.tsx
 * @description 사용자에게 에러 메시지를 일관되게 보여주는 컴포넌트.
 *
 * 주요 기능:
 * 1. 에러 제목/설명을 시각적으로 구분
 * 2. 재시도 버튼 등 액션 슬롯 지원
 *
 * @dependencies
 * - tailwindcss: 색상, 레이아웃 유틸리티
 */

import { ReactNode } from "react";
import { LuTriangleAlert } from "react-icons/lu";

interface ErrorStateProps {
  title?: string;
  message: string;
  action?: ReactNode;
}

export function ErrorState({
  title = "문제가 발생했어요",
  message,
  action,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <div className="flex items-start gap-3">
        <LuTriangleAlert className="h-6 w-6 text-destructive" />
        <div>
          <h3 className="text-lg font-semibold text-destructive">{title}</h3>
          <p className="text-sm text-destructive/80">{message}</p>
        </div>
      </div>
      {action && <div className="flex justify-end">{action}</div>}
    </div>
  );
}




















