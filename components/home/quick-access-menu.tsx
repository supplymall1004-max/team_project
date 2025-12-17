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
import Image from "next/image";
import { cn } from "@/lib/utils";

interface QuickAccessItem {
  iconSrc: string;
  label: string;
  href: string;
}

const quickAccessItems: QuickAccessItem[] = [
  {
    iconSrc: "/icons/21.png",
    label: "궁중 레시피",
    href: "/#royal-recipes",
  },
  {
    iconSrc: "/icons/26.png",
    label: "레시피",
    href: "/recipes",
  },
  {
    iconSrc: "/icons/22.png",
    label: "건강 맞춤 식단",
    href: "/diet",
  },
  {
    iconSrc: "/icons/3.png",
    label: "주간 식단",
    href: "/diet/weekly",
  },
  {
    iconSrc: "/icons/12.png",
    label: "장보기",
    href: "/shopping",
  },
  {
    iconSrc: "/icons/24.png",
    label: "즐겨찾기",
    href: "/diet/favorites",
  },
  {
    iconSrc: "/icons/14.png",
    label: "음식 동화",
    href: "/storybook",
  },
  {
    iconSrc: "/icons/18.png",
    label: "이유식 레시피",
    href: "/archive/recipes?tab=baby",
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
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex flex-col items-center justify-center gap-2 p-3 rounded-xl",
                "transition-all duration-200 ease-in-out",
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
              {/* 아이콘 (public/icons 이미지) */}
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm group-hover:scale-110 transition-transform duration-200 relative">
                <Image
                  src={item.iconSrc}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                  priority={false}
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

