/**
 * @file app/test/book-detail-test/page.tsx
 * @description 옛날 서책 스타일 상세페이지 테스트
 *
 * 이 페이지는 BookDetailPage 컴포넌트를 테스트하기 위한 페이지입니다.
 * 실제 disease.md 파일의 내용을 옛날 서책처럼 렌더링하는 예시를 보여줍니다.
 */

import React from 'react';
import RecipeArchivePage from '@/components/recipe-archive-page';

export default function RecipeArchiveTestPage() {
  console.log('레시피 아카이브 테스트 페이지 로드');

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-jalnan text-amber-800 mb-2">
            🍳 레시피 아카이브 테스트
          </h1>
          <p className="text-amber-600">
            옛날 서책 스타일의 레시피 아카이브 디자인 예시입니다.
          </p>
        </div>

        <RecipeArchivePage />
      </div>
    </div>
  );
}
