/**
 * @file bottom-navigation.tsx
 * @description 하단 네비게이션 컴포넌트
 * 
 * 배달의민족 앱의 하단 네비게이션을 참고하여 구현했습니다.
 * 
 * 주요 기능:
 * 1. 5개 메뉴: 홈, 레시피, 찜, 식단, 마이
 * 2. 현재 페이지 하이라이트
 * 3. 모바일에서만 표시 (데스크톱에서는 숨김)
 * 4. position: fixed로 항상 하단에 고정
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Heart, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: Home, label: "홈", href: "/" },
  { icon: BookOpen, label: "레시피", href: "/archive/recipes" },
  { icon: Calendar, label: "식단", href: "/diet" },
  { icon: Heart, label: "건강", href: "/health" },
  { icon: User, label: "마이", href: "/settings" },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden h-16"
      aria-label="하단 네비게이션"
      style={{ 
        willChange: 'transform',
        backfaceVisibility: 'hidden',
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto safe-area-inset-bottom">
        {menuItems.map((item) => {
          const Icon = item.icon;
          // 현재 페이지 확인: 정확히 일치하거나 하위 경로인 경우
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full",
                "transition-all duration-200 ease-in-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
                isActive
                  ? "text-teal-600 scale-105"
                  : "text-gray-500 hover:text-gray-700 hover:scale-105"
              )}
              aria-label={`${item.label}${isActive ? ' (현재 페이지)' : ''}`}
              aria-current={isActive ? "page" : undefined}
              role="button"
              tabIndex={0}
              onClick={() => {
                console.groupCollapsed("[BottomNavigation] 메뉴 클릭");
                console.log("href:", item.href);
                console.log("label:", item.label);
                console.log("isActive:", isActive);
                console.log("timestamp:", Date.now());
                console.groupEnd();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  window.location.href = item.href;
                }
              }}
            >
              <Icon
                className={cn(
                  "w-6 h-6 transition-all duration-200",
                  isActive && "stroke-[2.5] scale-110"
                )}
                aria-hidden="true"
              />
              <span className={cn(
                "text-sm font-medium transition-all duration-200",
                isActive && "font-semibold"
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

