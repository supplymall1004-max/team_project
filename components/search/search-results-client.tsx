/**
 * @file search-results-client.tsx
 * @description 검색 결과 클라이언트 컴포넌트
 *
 * 주요 기능:
 * 1. 검색어 입력 및 검색 실행
 * 2. 검색 결과 표시 (통합 리스트, 타입별 태그)
 * 3. 결과 없음 처리
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, ChefHat, Film, BookOpen, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner";

interface SearchResult {
  id: string;
  type: "recipe" | "legacy_video" | "legacy_document";
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  slug: string;
  relevance_score: number;
  metadata?: Record<string, any>;
}

interface SearchResultsClientProps {
  initialQuery: string;
}

export function SearchResultsClient({
  initialQuery,
}: SearchResultsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(!!initialQuery);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.groupCollapsed("[SearchResults] 검색 실행");
      console.log("query", searchQuery);

      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "검색에 실패했습니다");
      }

      setResults(data.results || []);
      console.log("results count", data.results?.length || 0);
      console.groupEnd();
    } catch (err) {
      console.error("search error", err);
      setError(err instanceof Error ? err.message : "검색 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    performSearch(query.trim());
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "recipe":
        return "레시피";
      case "legacy_video":
        return "명인 인터뷰";
      case "legacy_document":
        return "전문 문서";
      default:
        return "기타";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "recipe":
        return ChefHat;
      case "legacy_video":
        return Film;
      case "legacy_document":
        return BookOpen;
      default:
        return ChefHat;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "recipe":
        return "bg-orange-100 text-orange-700";
      case "legacy_video":
        return "bg-slate-100 text-slate-700";
      case "legacy_document":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getResultUrl = (result: SearchResult) => {
    switch (result.type) {
      case "recipe":
        return `/recipes/${result.slug}`;
      case "legacy_video":
        return `/legacy/${result.slug}`;
      case "legacy_document":
        return `/legacy/${result.slug}`;
      default:
        return "#";
    }
  };

  return (
    <div className="space-y-6">
      {/* 검색창 */}
      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="레시피, 명인, 재료를 검색해보세요"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12"
          />
        </div>
        <Button type="submit" size="lg" className="sm:px-10">
          검색
        </Button>
      </form>

      {/* 검색 결과 */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner label="검색 중..." />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-700">{error}</p>
        </div>
      ) : results.length === 0 && query ? (
        <div className="rounded-2xl border border-border/60 bg-white p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">
            &quot;{query}&quot;에 대한 검색 결과가 없습니다
          </p>
          <p className="text-sm text-muted-foreground">
            다른 검색어를 시도해보세요
          </p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            총 {results.length}개의 결과를 찾았습니다
          </p>
          <div className="space-y-4">
            {results.map((result) => {
              const Icon = getTypeIcon(result.type);
              return (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={getResultUrl(result)}
                  className="group block rounded-2xl border border-border/60 bg-white overflow-hidden shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex gap-4 p-6">
                    {/* 썸네일 */}
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {result.thumbnail_url ? (
                        <Image
                          src={result.thumbnail_url}
                          alt={result.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Icon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getTypeColor(
                                result.type
                              )}`}
                            >
                              <Icon className="h-3 w-3" />
                              {getTypeLabel(result.type)}
                            </span>
                          </div>
                          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-orange-600 transition-colors">
                            {result.title}
                          </h3>
                        </div>
                      </div>

                      {result.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {result.description}
                        </p>
                      )}

                      {/* 메타데이터 */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {result.metadata?.rating && (
                          <span>⭐ {result.metadata.rating.toFixed(1)}</span>
                        )}
                        {result.metadata?.rating_count && (
                          <span>({result.metadata.rating_count}개 평가)</span>
                        )}
                        {result.metadata?.master && (
                          <span>명인: {result.metadata.master}</span>
                        )}
                        {result.metadata?.region && (
                          <span>지역: {result.metadata.region}</span>
                        )}
                        {result.metadata?.era && (
                          <span>시대: {result.metadata.era}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-white p-8 text-center">
          <p className="text-muted-foreground">
            검색어를 입력하고 검색해보세요
          </p>
        </div>
      )}
    </div>
  );
}

