/**
 * @file quick-access-menu.tsx
 * @description 바로가기 메뉴 컴포넌트
 * 
 * 배달의민족 앱의 바로가기 메뉴를 참고하여 구현했습니다.
 * 
 * 주요 기능:
 * 1. 8개 주요 기능을 아이콘 그리드로 빠른 접근
 * 2. 반응형 그리드 레이아웃 (모바일 4열, 태블릿 5열, 데스크톱 6-8열)
 * 3. 각 아이템별 고유 색상 및 호버/터치 효과
 * 4. 섹션 제목: "빠른 시작"
 */

"use client";

import Link from "next/link";
import {
  Archive,
  BookOpen,
  Brain,
  Calendar,
  ShoppingCart,
  Star,
  ChefHat,
  UtensilsCrossed,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAccessItem {
  icon: typeof Archive;
  label: string;
  href: string;
  bgColor: string; // Tailwind 배경색 클래스
  textColor: string; // Tailwind 텍스트 색상 클래스
}

const quickAccessItems: QuickAccessItem[] = [
  {
    icon: Archive,
    label: "레거시",
    href: "/legacy",
    bgColor: "bg-orange-100",
    textColor: "text-orange-700",
  },
  {
    icon: BookOpen,
    label: "레시피",
    href: "/recipes",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
  },
  {
    icon: Brain,
    label: "AI 식단",
    href: "/diet",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
  },
  {
    icon: Calendar,
    label: "주간 식단",
    href: "/diet/weekly",
    bgColor: "bg-purple-100",
    textColor: "text-purple-700",
  },
  {
    icon: ShoppingCart,
    label: "장보기",
    href: "/shopping",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-700",
  },
  {
    icon: Star,
    label: "즐겨찾기",
    href: "/diet/favorites",
    bgColor: "bg-pink-100",
    textColor: "text-pink-700",
  },
  {
    icon: ChefHat,
    label: "명인",
    href: "/legacy?filter=interview",
    bgColor: "bg-red-100",
    textColor: "text-red-700",
  },
  {
    icon: UtensilsCrossed,
    label: "전통",
    href: "/legacy?filter=recipe",
    bgColor: "bg-indigo-100",
    textColor: "text-indigo-700",
  },
  {
    icon: Crown,
    label: "궁중 레시피",
    href: "/royal-recipes",
    bgColor: "bg-amber-100",
    textColor: "text-amber-700",
  },
];

export function QuickAccessMenu() {
  return (
    <section className="px-4 py-6 sm:px-6 sm:py-8" aria-labelledby="quick-access-title">
      {/* 섹션 제목 */}
      <h2 id="quick-access-title" className="text-lg font-bold text-gray-900 mb-4 sm:mb-6">
        빠른 시작
      </h2>

      {/* 아이콘 그리드 */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {quickAccessItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex flex-col items-center justify-center gap-2 p-3 rounded-xl",
                "transition-all duration-300 ease-in-out",
                "hover:scale-105 hover:shadow-lg hover:-translate-y-1",
                "active:scale-95 active:translate-y-0",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
                "min-h-[88px] min-w-[88px]", // 터치 영역 최소 44x44px 확보 (2배)
                "bg-white hover:bg-gray-50", // 배경색 추가로 호버 효과 강화
                "touch-manipulation" // 터치 최적화
              )}
              style={{
                willChange: 'transform',
                touchAction: 'manipulation',
              }}
              onClick={() => {
                console.groupCollapsed("[QuickAccessMenu] 바로가기 클릭");
                console.log("label:", item.label);
                console.log("href:", item.href);
                console.log("timestamp:", Date.now());
                console.groupEnd();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  window.location.href = item.href;
                }
              }}
              aria-label={`${item.label} 페이지로 이동`}
              role="button"
            >
              {/* 아이콘 원형 배경 */}
              <div
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center",
                  "group-hover:scale-110 transition-transform duration-200",
                  item.bgColor,
                  "transition-all duration-200"
                )}
              >
                <Icon
                  className={cn(
                    "w-7 h-7 transition-transform duration-200",
                    "group-hover:scale-110",
                    item.textColor
                  )}
                  aria-hidden="true"
                />
              </div>

              {/* 라벨 텍스트 */}
              <span
                className={cn(
                  "text-xs font-medium text-center",
                  "text-gray-700"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

