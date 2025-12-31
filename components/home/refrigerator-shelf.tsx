/**
 * @file refrigerator-shelf.tsx
 * @description 냉장고 선반 컴포넌트
 *
 * 냉장고 내부의 선반을 시각적으로 표현하는 재사용 가능한 컴포넌트입니다.
 */

"use client";

import { cn } from "@/lib/utils";

interface RefrigeratorShelfProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

export function RefrigeratorShelf({
  label,
  children,
  className,
}: RefrigeratorShelfProps) {
  return (
    <div className={cn("relative", className)}>
      {/* 선반 상단 테두리 */}
      <div className="h-[2px] bg-gray-300 mb-4" />
      
      {/* 선반 배경 */}
      <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
        {/* 선반 라벨 */}
        {label && (
          <div className="text-xs text-gray-500 mb-3 font-medium">
            {label}
          </div>
        )}
        
        {/* 선반 내용 */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}

