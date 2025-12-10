/**
 * @file components/royal-recipes/royal-recipe-title.tsx
 * @description 궁중 레시피 제목 표시 컴포넌트 (한자 표기 포함)
 */

import { parseTitleWithHanja } from "@/lib/royal-recipes/parser";

interface RoyalRecipeTitleProps {
  title: string | null | undefined;
  className?: string;
}

export function RoyalRecipeTitle({ title, className = "" }: RoyalRecipeTitleProps) {
  // title이 빈 문자열인 경우 빈 문자열로 처리
  const safeTitle = title?.trim() || "";
  
  if (!safeTitle) {
    return <div className={className} />;
  }

  const { korean, hanja } = parseTitleWithHanja(safeTitle);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 한글 제목 */}
      <h1 className="text-4xl sm:text-5xl font-bold text-amber-900 tracking-wide" style={{
        fontFamily: 'serif',
        textShadow: '2px 2px 4px rgba(139, 69, 19, 0.2)',
      }}>
        {korean}
      </h1>

      {/* 한자 표기 */}
      {hanja && (
        <p className="text-xl sm:text-2xl text-amber-700 font-medium tracking-wide" style={{
          fontFamily: 'serif',
        }}>
          {hanja}
        </p>
      )}
    </div>
  );
}
