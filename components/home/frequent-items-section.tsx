/**
 * @file frequent-items-section.tsx
 * @description 자주 구매하는 식자재 섹션 컴포넌트
 * 
 * 배달의민족 앱의 자주 구매하는 식자재 섹션을 참고하여 구현했습니다.
 * 
 * 주요 기능:
 * 1. 사용자의 주간 식단 기반 재료 조회
 * 2. 구매 빈도순 정렬
 * 3. 최대 8개 항목 표시
 * 4. 상품 그리드 레이아웃 (모바일 2열, 태블릿 3열, 데스크톱 4열)
 * 5. "장바구니 추가" 버튼 (추후 구현)
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Plus, ChevronRight, LogIn } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FrequentItem {
  id: string;
  name: string;
  imageUrl?: string;
  price?: number;
  category: string;
  frequency: number;
}

export function FrequentItemsSection() {
  const { isLoaded, isSignedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FrequentItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 인증 상태가 로드되기 전까지는 기다림
    if (!isLoaded) return;

    // 로그인하지 않은 경우 로딩 중지
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    // 로그인한 경우에만 데이터 로드
    loadFrequentItems();
  }, [isLoaded, isSignedIn]);

  const loadFrequentItems = async () => {
    setLoading(true);
    setError(null);

    try {
      console.groupCollapsed("[FrequentItemsSection] 자주 구매하는 식자재 조회");
      console.log("API 호출: /api/shopping/frequent-items");

      // 캐싱을 위한 fetch 옵션 (5분 캐시)
      const response = await fetch("/api/shopping/frequent-items", {
        next: { revalidate: 300 }, // 5분마다 재검증
        cache: "force-cache", // 캐시 우선 사용
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ 조회 실패:", response.status, errorText);
        console.groupEnd();
        setError(`식자재를 불러오는 데 실패했습니다`);
        setItems([]);
        return;
      }

      const data = await response.json();
      console.log("✅ 응답 데이터:", data);

      if (data.items && data.items.length > 0) {
        setItems(data.items);
      } else {
        setItems([]);
      }

      console.groupEnd();
    } catch (err: any) {
      console.error("❌ 조회 실패:", err);
      console.groupEnd();
      setError(err.message || "식자재를 불러오는 데 실패했습니다");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // 인증 상태 로딩 중
  if (!isLoaded) {
    return (
      <section className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-orange-600" aria-hidden="true" />
              <h2 className="text-lg font-bold text-gray-900">자주 구매하는 식자재</h2>
            </div>
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500">로딩 중...</div>
          </div>
        </div>
      </section>
    );
  }

  // 로그인하지 않은 경우 로그인 안내 표시
  if (!isSignedIn) {
    return (
      <section className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-orange-600" aria-hidden="true" />
              <h2 className="text-lg font-bold text-gray-900">자주 구매하는 식자재</h2>
            </div>
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <LogIn className="w-8 h-8 text-gray-400 mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm text-gray-500 mb-4">
                로그인 후 자주 구매하는 식자재를 확인하세요
              </p>
              <Link href="/sign-in">
                <Button variant="outline" size="sm">
                  로그인하기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 데이터가 없으면 섹션 숨김
  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <section className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* 섹션 헤더 */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-600" aria-hidden="true" />
            <h2 className="text-lg font-bold text-gray-900">자주 구매하는 식자재</h2>
          </div>
          <Link
            href="/shopping"
            className="flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
            onClick={() => {
              console.groupCollapsed("[FrequentItemsSection] 전체보기 클릭");
              console.log("href: /shopping");
              console.log("timestamp:", Date.now());
              console.groupEnd();
            }}
          >
            전체보기
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {/* 상품 그리드 */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-lg h-48 animate-pulse"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-red-500">{error}</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* 상품 이미지 (최적화된 로딩) */}
                <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={`${item.name} 이미지`}
                      fill
                      className="object-cover rounded-lg"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      loading="lazy"
                    />
                  ) : (
                    <ShoppingCart className="w-8 h-8 text-gray-400" aria-hidden="true" />
                  )}
                </div>

                {/* 상품명 */}
                <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                  {item.name}
                </h3>

                {/* 카테고리 */}
                <p className="text-xs text-gray-500 mb-2">{item.category}</p>

                {/* 가격 (선택적) */}
                {item.price && (
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    {item.price.toLocaleString()}원
                  </p>
                )}

                {/* 장바구니 추가 버튼 */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  onClick={() => {
                    console.groupCollapsed("[FrequentItemsSection] 장바구니 추가");
                    console.log("item:", item.name);
                    console.log("timestamp:", Date.now());
                    console.groupEnd();
                    // TODO: 장바구니 추가 기능 구현
                  }}
                  aria-label={`${item.name} 장바구니에 추가`}
                >
                  <Plus className="w-4 h-4 mr-1" aria-hidden="true" />
                  장바구니 추가
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

