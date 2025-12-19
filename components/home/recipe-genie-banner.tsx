/**
 * @file recipe-genie-banner.tsx
 * @description Recipe Genie 배너 컴포넌트
 * 
 * Google Gemini Lab의 Recipe Genie 기능을 홈페이지에 소개하는 배너입니다.
 * 
 * 주요 기능:
 * 1. 노란색 계통 그라데이션 배경으로 눈에 띄는 디자인
 * 2. 클릭 시 Google Gemini Lab Recipe Genie 페이지로 이동 (새 탭)
 * 3. 호버 효과로 상호작용 피드백 제공
 * 4. 접근성 고려 (aria-label, keyboard navigation)
 * 
 * 디자인 가이드라인:
 * - 배경: 노란색/오렌지 그라데이션 (bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400)
 * - 텍스트: 어두운 색상 (text-gray-900) 또는 흰색 (대비 고려)
 * - 패딩: px-4 py-3 (16px 12px)
 * - 폰트: font-medium (중간 굵기)
 */

"use client";

import { Sparkles, ExternalLink } from "lucide-react";

const RECIPE_GENIE_URL = "https://gemini.google.com/gem-labs/1wffdEjbZ3E9wChM3O5VcoziuDnKihjDk";

export function RecipeGenieBanner() {
  const handleClick = () => {
    console.groupCollapsed("[RecipeGenieBanner] 배너 클릭");
    console.log("url:", RECIPE_GENIE_URL);
    console.log("timestamp:", Date.now());
    console.groupEnd();
    
    // 새 탭에서 열기
    window.open(RECIPE_GENIE_URL, "_blank", "noopener,noreferrer");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="px-4">
      <button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="block w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 hover:from-yellow-500 hover:via-amber-500 hover:to-orange-500 text-gray-900 py-3 px-4 text-center font-medium transition-all duration-300 animate-in fade-in slide-in-from-top-2 min-h-[44px] flex items-center justify-center gap-2 rounded-lg shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-600 focus-visible:ring-offset-2 focus-visible:ring-offset-yellow-200"
        aria-label="Recipe Genie로 AI 레시피 생성하기 (새 탭에서 열림)"
        role="button"
        tabIndex={0}
        style={{
          touchAction: 'manipulation',
          width: '100%',
        }}
      >
        <div className="flex items-center justify-center gap-2 group">
          <Sparkles 
            className="w-5 h-5 text-gray-900 transition-transform group-hover:scale-110" 
            aria-hidden="true"
          />
          <span className="font-semibold">✨ Recipe Genie로 AI 레시피 생성하기</span>
          <ExternalLink
            className="w-4 h-4 text-gray-700 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </div>
      </button>
    </div>
  );
}
