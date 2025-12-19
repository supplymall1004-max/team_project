/**
 * @file search/page.tsx
 * @description 통합 검색 결과 페이지
 *
 * 주요 기능:
 * 1. 검색어 입력 및 검색 실행
 * 2. 통합 검색 결과 표시 (타입별 태그)
 * 3. 관련도순 정렬
 * 4. 결과 없음 처리
 */

import { Suspense } from "react";
import { Section } from "@/components/section";
import { SearchResultsClient } from "@/components/search/search-results-client";
import { LoadingSpinner } from "@/components/loading-spinner";

export const metadata = {
  title: "검색 결과 | 맛의 아카이브",
  description: "레시피와 레거시 아카이브를 통합 검색합니다",
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const { q } = resolvedSearchParams;
  const query = q || "";

  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">검색 결과</h1>
          {query && (
            <p className="text-muted-foreground">
              &quot;{query}&quot;에 대한 검색 결과
            </p>
          )}
        </div>

        <Suspense fallback={<LoadingSpinner label="검색 중..." />}>
          <SearchResultsClient initialQuery={query} />
        </Suspense>
      </Section>
    </div>
  );
}

