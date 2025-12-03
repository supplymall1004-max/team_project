/**
 * @file search-bar.tsx
 * @description 검색바 컴포넌트
 * 
 * 배달의민족 앱의 검색바를 참고하여 구현했습니다.
 * 
 * 주요 기능:
 * 1. 검색어 입력 및 검색 실행
 * 2. 엔터 키 또는 검색 버튼으로 검색
 * 3. /search?q={query} 페이지로 이동
 * 4. 기존 검색 API와 연동
 * 
 * 디자인 개선:
 * - 둥근 모서리 (rounded-lg)
 * - 흰색 배경
 * - 포커스 시 테두리 색상 변경 애니메이션
 * - 호버 시 그림자 효과
 * - 입력 중일 때 아이콘 색상 변경
 * - 검색 버튼 호버 효과 개선
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  buttonText?: string;
  className?: string;
}

export function SearchBar({
  placeholder = "레시피, 명인, 재료를 검색해보세요",
  buttonText = "검색",
  className = "",
}: SearchBarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    console.groupCollapsed("[SearchBar] 검색 실행");
    console.log("query:", searchQuery);
    console.log("timestamp:", Date.now());
    console.groupEnd();

    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const hasQuery = searchQuery.trim().length > 0;

  return (
    <form onSubmit={handleSearch} className={className}>
      <div className="flex flex-col gap-2 sm:flex-row px-4 sm:px-6">
        <div className="relative flex-1">
          <Search
            className={cn(
              "absolute left-3 sm:left-4 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 transition-colors duration-200",
              isFocused || hasQuery
                ? "text-teal-600"
                : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              console.groupCollapsed("[SearchBar] 검색창 포커스");
              console.log("timestamp:", Date.now());
              console.groupEnd();
            }}
            onBlur={() => {
              setIsFocused(false);
            }}
            onKeyDown={(e) => {
              // Enter 키는 form submit으로 처리되므로 여기서는 처리하지 않음
              // Escape 키로 포커스 해제
              if (e.key === 'Escape') {
                e.currentTarget.blur();
              }
            }}
            className={cn(
              "pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base rounded-lg",
              "transition-all duration-200",
              "hover:shadow-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
              isFocused &&
                "ring-2 ring-teal-500 ring-offset-2 border-teal-500 shadow-md"
            )}
            aria-label="검색어 입력"
            aria-describedby="search-description"
            role="searchbox"
          />
          <span id="search-description" className="sr-only">
            레시피, 명인, 재료를 검색할 수 있습니다. 검색어를 입력한 후 Enter 키를 누르거나 검색 버튼을 클릭하세요.
          </span>
        </div>
        <Button
          type="submit"
          size="default"
          className={cn(
            "h-10 sm:h-12 sm:px-8 rounded-lg",
            "transition-all duration-200",
            "hover:shadow-md hover:scale-105",
            "active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
            hasQuery && "bg-teal-600 hover:bg-teal-700"
          )}
          aria-label={hasQuery ? `"${searchQuery}" 검색 실행` : "검색어를 입력하세요"}
          aria-disabled={!hasQuery}
          disabled={!hasQuery}
        >
          {buttonText}
        </Button>
      </div>
    </form>
  );
}


