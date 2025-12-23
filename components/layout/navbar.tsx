"use client";

/**
 * @file components/layout/navbar.tsx
 * @description Flavor Archive 전역 내비게이션 컴포넌트.
 *
 * 주요 기능:
 * - Sticky Header + 모바일 햄버거 메뉴
 * - Clerk 로그인/로그아웃 상태에 따른 액션 제공
 * - 핵심 버튼 클릭 시 콘솔 로그로 사용자 행동 추적
 */

import {
  SignedOut,
  SignedIn,
  UserButton,
  SignOutButton,
  useAuth,
} from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Search,
  Settings,
  BookOpen,
  UtensilsCrossed,
  Heart,
  FileText,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LoginModal } from "@/components/auth/login-modal";

const navLinks = [
  { label: "레시피", href: "/archive/recipes", icon: BookOpen },
  { label: "식단", href: "/diet", icon: UtensilsCrossed },
  { label: "건강", href: "/health", icon: Heart },
  { label: "스토리", href: "/stories", icon: FileText },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const prevSignedInRef = useRef<boolean | undefined>(undefined);
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    // 라우트가 바뀌면(로그인/홈 이동 포함) 모바일 메뉴를 닫아
    // "로그인 화면/메뉴가 겹쳐 보이는" 상황을 예방합니다.
    const prevPathname = prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    // menuOpen이 true로 바뀌는 건 "사용자가 햄버거를 눌렀다"는 의미일 수 있어
    // 이 effect가 menuOpen 자체 변화에 반응해서 바로 닫아버리면 햄버거가 작동하지 않게 됩니다.
    // 따라서 "pathname이 실제로 변경된 경우"에만 닫습니다.
    if (prevPathname !== null && prevPathname !== pathname && menuOpen) {
      if (process.env.NODE_ENV === "development") {
        console.groupCollapsed("[Navbar] 라우트 변경으로 모바일 메뉴 닫기");
        console.log("prevPathname:", prevPathname);
        console.log("pathname:", pathname);
        console.groupEnd();
      }
      setMenuOpen(false);
    }
  }, [pathname, menuOpen]);

  useEffect(() => {
    // 로그아웃(=SignedOut)으로 상태가 바뀌었는데 메뉴가 열려 있으면
    // 메뉴 레이어가 남아서 조작이 어려운 문제를 막습니다.
    if (!isLoaded) return;

    const prevSignedIn = prevSignedInRef.current;
    prevSignedInRef.current = isSignedIn;

    // "현재가 SignedOut"이면 항상 닫아버리면,
    // 로그인하려고 햄버거를 여는 동작도 막히므로
    // "SignedIn → SignedOut 전환(로그아웃)" 순간에만 닫습니다.
    if (prevSignedIn === true && !isSignedIn && menuOpen) {
      if (process.env.NODE_ENV === "development") {
        console.groupCollapsed(
          "[Navbar] 로그아웃 전환 감지로 모바일 메뉴 닫기",
        );
        console.log("prevSignedIn:", prevSignedIn);
        console.log("isSignedIn:", isSignedIn);
        console.groupEnd();
      }
      setMenuOpen(false);
    }
  }, [isLoaded, isSignedIn, menuOpen]);

  const handleNavClick = (label: string) => {
    // 성능 최적화: 프로덕션에서는 로그 최소화
    if (process.env.NODE_ENV === "development") {
      console.groupCollapsed("[Navbar] 내비게이션 클릭");
      console.log("target:", label);
      console.groupEnd();
    }
    setMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (process.env.NODE_ENV === "development") {
        console.groupCollapsed("[Navbar] 검색 실행");
        console.log("query:", searchQuery);
        console.groupEnd();
      }
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSearchFocused(false);
      setMenuOpen(false);
    }
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm"
      style={{ height: "64px" }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 gap-4">
        {/* 왼쪽: 로고 + 앱제목 (클릭 시 메인으로 이동) */}
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
          onClick={(e) => {
            handleNavClick("홈");
            console.log("[Navbar] 홈 링크 클릭", { pathname, timestamp: Date.now() });
            
            // 현재 경로가 "/"인 경우 강제로 네비게이션하여 페이지를 완전히 다시 로드
            if (pathname === "/") {
              e.preventDefault();
              console.log("[Navbar] 현재 홈 페이지에서 홈으로 이동 - 강제 네비게이션");
              // router.push와 router.refresh를 함께 사용하여 확실하게 리로드
              router.push("/");
              // 약간의 딜레이 후 refresh와 스크롤 (렌더링 완료 대기)
              setTimeout(() => {
                router.refresh();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }, 50);
            } else {
              // 다른 경로에서 홈으로 이동하는 경우는 Link 컴포넌트가 자동으로 처리
              console.log("[Navbar] 다른 경로에서 홈으로 이동");
            }
          }}
          aria-label="Flavor Archive 홈으로 이동"
        >
          <div className="relative w-[50px] h-[60px] flex-shrink-0">
            <Image
              src="/icons/maca2.JPG"
              alt="Flavor Archive 로고"
              width={50}
              height={60}
              className="rounded-lg object-contain"
              priority
              unoptimized
              onError={(e) => {
                if (process.env.NODE_ENV === "development") {
                  console.error('[Navbar] 로고 이미지 로드 실패:', e);
                }
                // 이미지 로드 실패 시 부모 div 숨김
                const target = e.currentTarget;
                if (target && target.parentElement) {
                  target.parentElement.style.display = 'none';
                }
              }}
              onLoad={() => {
                if (process.env.NODE_ENV === "development") {
                  console.log('[Navbar] 로고 이미지 로드 완료');
                }
              }}
            />
          </div>
          <span className="text-lg sm:text-2xl font-bold text-orange-600 whitespace-nowrap">
            Flavor Archive
          </span>
        </Link>

        {/* 중앙: 검색바 (항상 표시) */}
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-2xl mx-4"
        >
          <div className="relative">
            <Input
              type="text"
              placeholder="레시피 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={cn(
                "w-full pr-10 transition-all",
                "hidden sm:block", // 모바일에서는 숨김
              )}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hidden sm:block" />
          </div>
        </form>

        {/* 오른쪽: 검색 아이콘 + 로그인 + 햄버거 */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 검색 아이콘 (모바일) */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => router.push("/search")}
            aria-label="검색"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* 데스크톱 네비게이션 */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  pathname === link.href || pathname?.startsWith(link.href + "/")
                    ? "text-orange-600"
                    : "text-gray-700 hover:text-orange-600",
                )}
                onClick={() => handleNavClick(link.label)}
              >
                {link.label}
              </Link>
            ))}
            {/* 설정 메뉴 (로그인한 사용자만 표시) */}
            <SignedIn>
              <Link
                href="/settings"
                className={cn(
                  "text-sm font-medium transition-colors",
                  pathname === "/settings" || pathname?.startsWith("/settings/")
                    ? "text-orange-600"
                    : "text-gray-700 hover:text-orange-600",
                )}
                onClick={() => handleNavClick("설정")}
              >
                설정
              </Link>
            </SignedIn>
          </div>

          {/* 사용자 메뉴 (로그인/사진) */}
          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          </SignedIn>

          <SignedOut>
            <LoginModal />
          </SignedOut>

          {/* 햄버거 메뉴 (모바일/태블릿) */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="메뉴 열기/닫기"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 text-base font-medium rounded-md transition-colors",
                    pathname === link.href || pathname?.startsWith(link.href + "/")
                      ? "bg-orange-50 text-orange-600"
                      : "text-gray-700 hover:bg-gray-50",
                  )}
                  onClick={() => handleNavClick(link.label)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <SignedIn>
              <Link
                href="/settings"
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-base font-medium rounded-md transition-colors",
                  pathname === "/settings" || pathname?.startsWith("/settings/")
                    ? "bg-orange-50 text-orange-600"
                    : "text-gray-700 hover:bg-gray-50",
                )}
                onClick={() => handleNavClick("설정")}
              >
                <Settings className="h-5 w-5" />
                <span>설정</span>
              </Link>
            </SignedIn>
            <SignedOut>
              <div className="pt-4 border-t border-gray-200">
                <LoginModal />
              </div>
            </SignedOut>
            <SignedIn>
              <div className="pt-4 border-t border-gray-200">
                <SignOutButton>
                  <Button variant="outline" className="w-full flex items-center gap-2">
                    <LogOut className="h-5 w-5" />
                    <span>로그아웃</span>
                  </Button>
                </SignOutButton>
              </div>
            </SignedIn>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
