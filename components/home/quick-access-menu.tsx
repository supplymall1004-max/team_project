/**
 * @file quick-access-menu.tsx
 * @description 바로가기 메뉴 컴포넌트
 * 
 * 배달의민족 앱의 바로가기 메뉴를 참고하여 구현했습니다.
 * 
 * 주요 기능:
 * 1. 9개 주요 기능을 아이콘 그리드로 빠른 접근 (반려동물 건강 추가)
 * 2. 반응형 그리드 레이아웃 (모바일 4열, 태블릿 5열, 데스크톱 6-8열)
 * 3. 각 아이템별 고유 색상 및 호버/터치 효과
 * 4. 섹션 제목: "빠른 시작"
 * 5. 반려동물 건강 아이콘: 주황색 계통 + 네온 사인 효과
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
  {
    iconSrc: "/icons/19.png",
    label: "반려동물 건강",
    href: "/health/pets",
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
          // 반려동물 건강 아이콘: 주황색 계통 + 네온 사인 효과
          const isPetHealth = item.label === "반려동물 건강";
          
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
                // 반려동물 건강 아이콘: 주황색 배경 + 네온 효과
                isPetHealth 
                  ? "bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 hover:from-orange-500 hover:via-amber-600 hover:to-orange-700"
                  : "bg-white hover:bg-gray-50", // 배경색 추가로 호버 효과 강화
                "touch-manipulation" // 터치 최적화
              )}
              style={{
                willChange: 'transform',
                touchAction: 'manipulation',
                // 네온 사인 효과 (반려동물 건강 아이콘만)
                ...(isPetHealth && {
                  boxShadow: '0 0 10px rgba(255, 107, 53, 0.5), 0 0 20px rgba(255, 107, 53, 0.3), 0 0 30px rgba(255, 107, 53, 0.2)',
                  animation: 'neon-flicker 2s ease-in-out infinite',
                }),
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
              <div className={cn(
                "w-14 h-14 rounded-2xl overflow-hidden shadow-sm group-hover:scale-110 transition-transform duration-200 relative",
                // 반려동물 건강 아이콘: 네온 효과 강화
                isPetHealth && "ring-2 ring-orange-400 ring-opacity-50"
              )}>
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
                  "text-sm font-medium text-center",
                  isPetHealth 
                    ? "text-white font-bold drop-shadow-lg" // 반려동물 건강: 흰색 텍스트 + 그림자
                    : "text-gray-700"
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

