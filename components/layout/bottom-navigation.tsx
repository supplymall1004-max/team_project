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
import { usePathname, useRouter } from "next/navigation";
import { Home, BookOpen, Heart, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBadge } from "@/components/health/notification-badge";

const menuItems = [
  { icon: Home, label: "홈", href: "/" },
  { icon: BookOpen, label: "레시피", href: "/archive/recipes" },
  { icon: Calendar, label: "식단", href: "/diet" },
  { icon: Heart, label: "건강", href: "/health" },
  { icon: User, label: "마이", href: "/settings" },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

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

          // 건강 메뉴에 알림 배지 추가
          const isHealthMenu = item.href === "/health";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 flex-1 h-full",
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
              onClick={(e) => {
                console.groupCollapsed("[BottomNavigation] 메뉴 클릭");
                console.log("href:", item.href);
                console.log("label:", item.label);
                console.log("isActive:", isActive);
                console.log("pathname:", pathname);
                console.log("timestamp:", Date.now());
                console.groupEnd();
                
                // 홈 링크이고 현재 경로가 "/"인 경우 강제로 네비게이션하여 페이지를 완전히 다시 로드
                if (item.href === "/" && pathname === "/") {
                  e.preventDefault();
                  console.log("[BottomNavigation] 현재 홈 페이지에서 홈으로 이동 - 강제 네비게이션");
                  // router.push와 router.refresh를 함께 사용하여 확실하게 리로드
                  router.push("/");
                  setTimeout(() => {
                    router.refresh();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }, 50);
                } else {
                  console.log("[BottomNavigation] 다른 경로에서 홈으로 이동");
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  window.location.href = item.href;
                }
              }}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-6 h-6 transition-all duration-200",
                    isActive && "stroke-[2.5] scale-110"
                  )}
                  aria-hidden="true"
                />
                {isHealthMenu && <NotificationBadge />}
              </div>
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

