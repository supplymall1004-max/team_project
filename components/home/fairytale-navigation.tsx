/**
 * @file fairytale-navigation.tsx
 * @description 동화 스타일 네비게이션 컴포넌트
 *
 * 이 컴포넌트는 동화 같은 그림 이미지를 배경으로 하고,
 * 앱 아이콘들을 분류별로 그룹화하여 가로로 배치합니다.
 *
 * 주요 기능:
 * 1. 동화 스타일 배경 이미지
 * 2. 분류별로 아이콘 그룹화 (레시피, 식단, 생활, 콘텐츠)
 * 3. 각 분류별 제목과 설명 표시
 * 4. 반응형 처리 (데스크톱만 표시, 모바일에서는 숨김)
 * 5. 호버 및 클릭 효과
 *
 * @dependencies
 * - lucide-react: 아이콘
 * - next/link: 라우팅
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AppIcon {
  iconSrc: string;
  label: string;
  description: string; // 각 아이콘별 설명 추가
  href: string;
}

interface Category {
  title: string;
  description: string;
  icons: AppIcon[];
}

// 분류별 앱 아이콘 정의
const categories: Category[] = [
  {
    title: "📚 레시피 아카이브",
    description: "현대부터 전통까지, 모든 요리 지식을 한 곳에서",
    icons: [
      {
        iconSrc: "/icons/궁중요리.png",
        label: "궁중 레시피",
        description: "삼국시대부터 조선시대까지 전통 궁중 요리 레시피",
        href: "/#royal-recipes",
      },
      {
        iconSrc: "/icons/레시피.png",
        label: "레시피",
        description: "별점과 난이도로 정리된 현대 요리 레시피 모음",
        href: "/recipes",
      },
      {
        iconSrc: "/icons/이유식 레시피.png",
        label: "이유식 레시피",
        description: "아기 성장 단계별 맞춤 이유식 레시피 가이드",
        href: "/archive/recipes?tab=baby",
      },
    ],
  },
  {
    title: "🍽️ 식단 관리",
    description: "AI 기반 개인 맞춤 식단으로 건강한 식생활을 시작하세요",
    icons: [
      {
        iconSrc: "/icons/식단관리.png",
        label: "건강 맞춤 식단",
        description: "건강 정보 기반 AI 맞춤 식단 추천 및 관리",
        href: "/diet",
      },
      {
        iconSrc: "/icons/주간식단.png",
        label: "주간 식단",
        description: "7일 식단 계획 및 영양 정보 시각화",
        href: "/diet/weekly",
      },
    ],
  },
  {
    title: "💚 생활 관리",
    description: "일상 속 편리한 기능들로 더 스마트한 식생활",
    icons: [
      {
        iconSrc: "/icons/유틸리티.png",
        label: "장보기",
        description: "자주 구매하는 식자재 관리 및 장보기 리스트",
        href: "/shopping",
      },
      {
        iconSrc: "/icons/유틸리티.png",
        label: "즐겨찾기",
        description: "마음에 드는 레시피와 식단을 저장하고 관리",
        href: "/diet/favorites",
      },
      {
        iconSrc: "/icons/건강관리.png",
        label: "건강 관리",
        description: "가족 건강 프로필 및 건강 기록 관리",
        href: "/health",
      },
    ],
  },
  {
    title: "📖 콘텐츠 & 학습",
    description: "음식과 요리에 대한 이야기와 지식을 만나보세요",
    icons: [
      {
        iconSrc: "/icons/요리 이야기.png",
        label: "음식 동화",
        description: "전통 음식 스토리와 요리 문화를 배우는 인터랙티브 콘텐츠",
        href: "/storybook",
      },
    ],
  },
];

interface FairytaleNavigationProps {
  /**
   * 배경 이미지 경로
   */
  backgroundImage?: string;
  /**
   * 추가 클래스명
   */
  className?: string;
  /**
   * 제외할 카테고리 제목 배열
   * 예: ["📚 레시피 아카이브"] - 메인 페이지에서만 레시피 아카이브 섹션 제외
   */
  excludeCategories?: string[];
}

/**
 * 동화 스타일 네비게이션 컴포넌트
 */
export function FairytaleNavigation({
  backgroundImage,
  className = "",
  excludeCategories = [],
}: FairytaleNavigationProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  // 화면 크기 감지 (데스크톱만 표시)
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  // 모바일에서는 null 반환
  if (!isDesktop) {
    return null;
  }

  // 제외할 카테고리 필터링
  const filteredCategories = categories.filter(
    (category) => !excludeCategories.includes(category.title)
  );

  // 배경 이미지 결정 (backgroundImage가 없으면 배경 이미지 사용 안 함)
  const bgImage = backgroundImage;

  return (
    <div
      className={cn(
        "relative w-full rounded-lg overflow-hidden",
        "shadow-2xl",
        className
      )}
    >
      {/* 배경 이미지 */}
      {bgImage && (
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${bgImage})`,
        }}
      >
        {/* 그라데이션 오버레이 (가독성 향상) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
      </div>
      )}

      {/* 카드 섹션 배경 레이어 (배경과 카드 구분) */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/20" />

      {/* 분류별 섹션 */}
      <div className="relative z-10 w-full px-6 py-10 lg:px-12 lg:py-16">
        {filteredCategories.map((category, categoryIndex) => (
          <div
            key={categoryIndex}
            className="mb-12 last:mb-0"
          >
            {/* 카테고리 제목 및 설명 */}
            <div className="mb-6">
              <div className="inline-block bg-white/95 backdrop-blur-lg rounded-lg px-4 py-2 mb-2 shadow-lg border border-white/30">
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {category.title}
                </h3>
              </div>
              <div className="inline-block bg-white/90 backdrop-blur-md rounded-lg px-3 py-1 shadow-md border border-white/20">
                <p className="text-sm lg:text-base text-gray-700">
                  {category.description}
                </p>
              </div>
            </div>

            {/* 아이콘 카드 그리드 (가로 및 세로 배치) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {category.icons.map((app) => {
                return (
                  <Link
                    key={app.href}
                    href={app.href}
                    className={cn(
                      "group relative",
                      "flex flex-row items-center gap-4",
                      "bg-white/95 backdrop-blur-lg",
                      "rounded-xl p-4 lg:p-6",
                      "border-2 border-white/30",
                      "shadow-xl",
                      "transition-all duration-300 ease-in-out",
                      "hover:bg-white hover:scale-[1.02] hover:shadow-2xl",
                      "hover:border-white/60",
                      "active:scale-[0.98]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2",
                      "touch-manipulation"
                    )}
                    onClick={() => {
                      console.groupCollapsed("[FairytaleNavigation] 앱 카드 클릭");
                      console.log("category:", category.title);
                      console.log("label:", app.label);
                      console.log("href:", app.href);
                      console.log("timestamp:", Date.now());
                      console.groupEnd();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        window.location.href = app.href;
                      }
                    }}
                    aria-label={`${app.label} 페이지로 이동`}
                    role="button"
                    tabIndex={0}
                  >
                    {/* 아이콘 (public/icons 이미지) */}
                    <div className="flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-200 relative">
                      <Image
                        src={app.iconSrc}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="80px"
                        priority={false}
                      />
                    </div>

                    {/* 텍스트 영역 */}
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      {/* 라벨 */}
                      <h4
                        className={cn(
                          "text-base lg:text-lg font-bold text-gray-900",
                          "group-hover:text-teal-600",
                          "transition-colors duration-200"
                        )}
                      >
                        {app.label}
                      </h4>
                      {/* 설명 */}
                      <p
                        className={cn(
                          "text-xs lg:text-sm text-gray-600",
                          "line-clamp-2",
                          "group-hover:text-gray-700",
                          "transition-colors duration-200"
                        )}
                      >
                        {app.description}
                      </p>
                    </div>

                    {/* 화살표 아이콘 (호버 시 표시) */}
                    <div
                      className={cn(
                        "flex-shrink-0",
                        "w-6 h-6",
                        "opacity-0 group-hover:opacity-100",
                        "transform translate-x-0 group-hover:translate-x-1",
                        "transition-all duration-200"
                      )}
                    >
                      <svg
                        className="w-full h-full text-teal-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 하단 장식 요소 */}
      <div className="relative z-10 pb-6 text-center">
        <p className="text-white/90 text-sm lg:text-base font-medium drop-shadow-lg">
          동화 속에서 만나는 맛의 여정
        </p>
      </div>
    </div>
  );
}
