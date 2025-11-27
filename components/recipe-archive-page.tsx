/**
 * @file recipe-archive-page.tsx
 * @description 옛날 서책 느낌의 레시피 아카이브 컴포넌트
 *
 * 이 컴포넌트는 레시피를 옛날 서책처럼 보여주는 아카이브 페이지입니다.
 * 고풍스러운 디자인으로 사용자가 친근하게 레시피를 탐색할 수 있도록 합니다.
 *
 * 주요 기능:
 * 1. 옛날 서책 스타일 디자인 (종이 질감, 고풍스러운 폰트, 책 페이지 레이아웃)
 * 2. 레시피 검색 및 필터링 기능
 * 3. 레시피 카드 그리드 표시
 * 4. 반응형 디자인으로 모바일에서도 읽기 쉽게
 *
 * @dependencies
 * - React 19
 * - Tailwind CSS v4
 * - lucide-react (아이콘용)
 */

import React from 'react';
import { Clock, Users } from 'lucide-react';

export default function RecipeArchivePage() {
  console.log('레시피 아카이브 페이지 렌더링 시작');

  // 샘플 레시피 데이터
  const recipes = [
    {
      id: 1,
      title: "김치찌개",
      category: "찌개",
      cookingTime: 30,
      servings: 4,
      difficulty: "쉬움",
      rating: 4.5,
      image: "/api/placeholder/300/200",
      description: "얼큰하고 맛있는 전통 한식 김치찌개 레시피입니다.",
      ingredients: ["돼지고기", "김치", "두부", "양파", "대파"]
    },
    {
      id: 2,
      title: "비빔밥",
      category: "밥",
      cookingTime: 25,
      servings: 2,
      difficulty: "보통",
      rating: 4.8,
      image: "/api/placeholder/300/200",
      description: "영양 가득한 한국의 대표 건강 밥상입니다.",
      ingredients: ["밥", "시금치", "고사리", "콩나물", "당근", "계란"]
    },
    {
      id: 3,
      title: "불고기",
      category: "구이",
      cookingTime: 45,
      servings: 3,
      difficulty: "쉬움",
      rating: 4.7,
      image: "/api/placeholder/300/200",
      description: "달콤 짭짤한 양념이 일품인 불고기 요리입니다.",
      ingredients: ["소고기", "양파", "대파", "마늘", "간장", "설탕"]
    },
    {
      id: 4,
      title: "된장찌개",
      category: "찌개",
      cookingTime: 35,
      servings: 4,
      difficulty: "쉬움",
      rating: 4.3,
      image: "/api/placeholder/300/200",
      description: "시원하고 깊은 맛이 나는 된장찌개입니다.",
      ingredients: ["된장", "두부", "감자", "호박", "양파"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 p-2 md:p-8 flex justify-center items-start">
      {/* 고문서 스타일 책 페이지 컨테이너 */}
      <div className="max-w-7xl w-full relative">
        {/* 책갈피 - 데스크톱만 표시 */}
        <div className="hidden md:block absolute top-0 right-0 z-20 w-12 h-20 bg-gradient-to-b from-amber-800 to-amber-900 rounded-b-lg shadow-lg flex items-center justify-center">
          <div className="text-white text-xs font-bold" style={{ transform: 'rotate(90deg)' }}>레시피</div>
        </div>

        {/* 왼쪽 페이지 (부분적으로 보임) - 데스크톱만 표시 */}
        <div className="hidden md:block absolute left-0 top-0 w-1/2 h-full bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-50 rounded-l-2xl shadow-2xl border-r-2 border-amber-300 opacity-90">
          <div className="p-6 h-full flex flex-col">
            <div className="text-right mb-4">
              <span className="text-amber-700 text-sm font-serif">1099</span>
            </div>
            <div className="flex-1 text-amber-900 font-serif text-xs leading-loose opacity-60">
              <p className="mb-4">전통 요리법을</p>
              <p>기록한 고서</p>
            </div>
          </div>
        </div>

        {/* 오른쪽 페이지 (메인 컨텐츠) */}
        <div className="relative md:ml-auto w-full md:w-1/2 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 rounded-2xl md:rounded-r-2xl shadow-2xl border border-amber-200 p-6 md:p-12">
          {/* 페이지 번호 */}
          <div className="absolute top-4 right-4 text-amber-700 text-xs md:text-sm font-serif">1100</div>

          {/* 고문서 스타일 제목 */}
          <header className="mb-6 md:mb-8 text-center">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-amber-900 mb-2" style={{ fontFamily: 'serif' }}>
              朝鮮無雙新式料理製法
            </h1>
            <p className="text-amber-800 text-xs md:text-sm font-serif">조선무쌍신식요리제법</p>
          </header>

          {/* 본문 내용 - 고문서 스타일 */}
          <main className="font-serif leading-loose text-amber-900">
            {/* 고문서 스타일 레시피 목록 */}
            <section className="mb-8">
              {recipes.map((recipe, index) => (
                <div key={recipe.id} className="mb-8 pb-6 border-b border-amber-300/50 last:border-b-0">
                  {/* 삼각형 불릿과 제목 */}
                  <h2 className="text-xl md:text-2xl font-bold text-amber-900 mb-4 flex items-start gap-2">
                    <span className="text-amber-700 text-lg">▲</span>
                    <span>{recipe.title}</span>
                  </h2>

                  {/* 설명 */}
                  <p className="text-sm md:text-base text-amber-800 mb-4 leading-relaxed">
                    {recipe.description}
                  </p>

                  {/* 재료 목록 */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-amber-800 mb-2">재료:</h3>
                    <div className="flex flex-wrap gap-2">
                      {recipe.ingredients.map((ingredient, idx) => (
                        <span key={idx} className="text-xs md:text-sm text-amber-700 bg-amber-100/50 px-2 py-1 rounded border border-amber-200">
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 조리 정보 */}
                  <div className="flex items-center gap-4 text-xs md:text-sm text-amber-700">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {recipe.cookingTime}분
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {recipe.servings}인분
                    </span>
                    <span className={`px-2 py-1 rounded ${
                      recipe.difficulty === '쉬움' ? 'bg-green-100 text-green-700' :
                      recipe.difficulty === '보통' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {recipe.difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </section>

            {/* 고문서 스타일 요리 팁 */}
            <section className="mb-8 pt-6 border-t border-amber-300/50">
              <h2 className="text-xl md:text-2xl font-bold text-amber-900 mb-4 flex items-start gap-2">
                <span className="text-amber-700 text-lg">▲</span>
                <span>조리법 요약</span>
              </h2>
              <div className="text-sm md:text-base text-amber-800 leading-relaxed space-y-2">
                <p>• 모든 재료를 미리 준비하여 조리에 임하라</p>
                <p>• 불 조절이 요리의 핵심이니 신중히 하라</p>
                <p>• 재료의 신선함이 맛의 근본이니 주의하라</p>
                <p>• 천천히 끓이는 것이 깊은 맛을 만든다</p>
              </div>
            </section>
          </main>

          {/* 고문서 스타일 바닥글 */}
          <footer className="mt-8 pt-6 border-t border-amber-300/50 text-center">
            <p className="text-amber-700 text-xs font-serif">이상</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
