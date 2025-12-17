"use client";

/**
 * @file Navbar.tsx
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
import { Menu, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LoginModal } from "@/components/auth/login-modal";

const navLinks = [
  { label: "레시피", href: "/archive/recipes" },
  { label: "식단", href: "/diet" },
  { label: "건강", href: "/health" },
  { label: "스토리", href: "/stories" },
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

    // “현재가 SignedOut”이면 항상 닫아버리면,
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
    if (!searchQuery.trim()) return;

    console.groupCollapsed("[Navbar] 검색 실행");
    console.log("query:", searchQuery);
    console.log("timestamp:", Date.now());
    console.groupEnd();

    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] border-b border-border/60 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-0 px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight"
        >
          <Image
            src="/icons/maca2.JPG"
            alt="맛카 로고"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            priority
            unoptimized
          />
          Flavor Archive
        </Link>
        <form
          onSubmit={handleSearch}
          className="flex-1 flex items-center gap-0 ml-4 mr-4"
        >
          <div className="relative flex-1">
            <Search
              className={cn(
                "absolute left-3 sm:left-4 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 transition-colors duration-200",
                isSearchFocused || searchQuery.trim().length > 0
                  ? "text-teal-600"
                  : "text-muted-foreground",
              )}
              aria-hidden="true"
            />
            <Input
              type="text"
              placeholder="레시피를 검색해보세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.currentTarget.blur();
                }
              }}
              className={cn(
                "pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base rounded-lg bg-white",
                "transition-all duration-200",
                "hover:shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
                isSearchFocused &&
                  "ring-2 ring-teal-500 ring-offset-2 border-teal-500 shadow-md",
              )}
              aria-label="검색어 입력"
              aria-describedby="search-description"
              role="searchbox"
            />
            <span id="search-description" className="sr-only">
              레시피를 검색할 수 있습니다. 검색어를 입력한 후 Enter 키를
              누르세요.
            </span>
          </div>
        </form>
        {/* 데스크톱 네비게이션 */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => handleNavClick(link.label)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground rounded-md transition-colors hover:text-foreground hover:bg-muted/50"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 사용자 액션 영역 */}
        <div className="flex items-center gap-2 ml-auto">
          <SignedOut>
            <div className="hidden md:block">
              <LoginModal />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              onClick={() => {
                // 성능 최적화: 프로덕션에서는 로그 최소화
                if (process.env.NODE_ENV === "development") {
                  console.groupCollapsed("[Navbar] 모바일 메뉴 토글");
                  console.log("open:", !menuOpen);
                  console.groupEnd();
                }
                setMenuOpen((prev) => !prev);
              }}
              aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </SignedOut>
          <SignedIn>
            <div className="hidden md:flex items-center gap-2">
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="text-sm">
                  설정
                </Button>
              </Link>
              <UserButton />
              <SignOutButton redirectUrl="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm"
                  onClickCapture={() => {
                    if (process.env.NODE_ENV === "development") {
                      console.groupCollapsed("[Navbar] 로그아웃 클릭(캡처)");
                      console.log("action:", "close mobile menu");
                      console.groupEnd();
                    }
                    setMenuOpen(false);
                  }}
                >
                  로그아웃
                </Button>
              </SignOutButton>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              onClick={() => {
                // 성능 최적화: 프로덕션에서는 로그 최소화
                if (process.env.NODE_ENV === "development") {
                  console.groupCollapsed("[Navbar] 모바일 메뉴 토글");
                  console.log("open:", !menuOpen);
                  console.groupEnd();
                }
                setMenuOpen((prev) => !prev);
              }}
              aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </SignedIn>
        </div>
      </div>
      {/* 모바일 메뉴 */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          menuOpen
            ? "max-h-[70vh] border-t border-border/60 bg-white/95 backdrop-blur-sm"
            : "max-h-0",
        )}
      >
        <div className="px-4 py-3 space-y-3 overflow-y-auto overscroll-contain">
          {/* 네비게이션 링크 섹션 */}
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => handleNavClick(link.label)}
                className="px-3 py-2 text-base font-medium text-foreground rounded-lg transition-colors hover:bg-muted/50 active:bg-muted"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* 구분선 */}
          <div className="border-t border-border/40" />

          {/* 사용자 액션 섹션 */}
          <SignedOut>
            <div className="pt-1">
              <LoginModal
                onOpen={() => {
                  if (process.env.NODE_ENV === "development") {
                    console.groupCollapsed(
                      "[Navbar] 로그인 클릭으로 모바일 메뉴 닫기",
                    );
                    console.log(
                      "action:",
                      "close mobile menu before open modal",
                    );
                    console.groupEnd();
                  }
                  setMenuOpen(false);
                }}
              />
            </div>
          </SignedOut>
          <SignedIn>
            <div className="space-y-3">
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="block"
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start px-3 py-2.5 h-auto text-base font-medium"
                >
                  설정
                </Button>
              </Link>
              <div className="flex items-center gap-3 px-3">
                <div className="flex-1">
                  <UserButton />
                </div>
                <SignOutButton redirectUrl="/">
                  <Button
                    variant="outline"
                    className="flex-1 justify-center py-2.5 h-auto text-base font-medium"
                    onClickCapture={() => {
                      if (process.env.NODE_ENV === "development") {
                        console.groupCollapsed(
                          "[Navbar] 모바일 로그아웃 클릭(캡처)",
                        );
                        console.log("action:", "close mobile menu");
                        console.groupEnd();
                      }
                      setMenuOpen(false);
                    }}
                  >
                    로그아웃
                  </Button>
                </SignOutButton>
              </div>
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
