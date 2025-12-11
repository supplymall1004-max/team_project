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
} from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

  const renderedLinks = useMemo(
    () =>
      navLinks.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          onClick={() => handleNavClick(link.label)}
          className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          {link.label}
        </Link>
      )),
    [],
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] border-b border-border/60 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-0 px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
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
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-0 ml-4 mr-4">
          <div className="relative flex-1">
            <Search
              className={cn(
                "absolute left-3 sm:left-4 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 transition-colors duration-200",
                isSearchFocused || searchQuery.trim().length > 0
                  ? "text-teal-600"
                  : "text-muted-foreground"
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
                if (e.key === 'Escape') {
                  e.currentTarget.blur();
                }
              }}
              className={cn(
                "pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base rounded-lg bg-white",
                "transition-all duration-200",
                "hover:shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
                isSearchFocused &&
                  "ring-2 ring-teal-500 ring-offset-2 border-teal-500 shadow-md"
              )}
              aria-label="검색어 입력"
              aria-describedby="search-description"
              role="searchbox"
            />
            <span id="search-description" className="sr-only">
              레시피를 검색할 수 있습니다. 검색어를 입력한 후 Enter 키를 누르세요.
            </span>
          </div>
        </form>
        <nav className="hidden items-center gap-6 md:flex">{renderedLinks}</nav>
        <div className="flex items-center gap-3">
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
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </SignedOut>
          <SignedIn>
            <div className="hidden md:flex items-center gap-3">
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  설정
                </Button>
              </Link>
              <UserButton />
              <SignOutButton>
                <Button variant="ghost" size="sm">
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
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </SignedIn>
        </div>
      </div>
      <div
        className={cn(
          "md:hidden",
          menuOpen ? "block border-t border-border/60 bg-white/95" : "hidden",
        )}
      >
        <div className="flex flex-col gap-4 px-6 py-4">
          {renderedLinks}
          <SignedOut>
            <LoginModal />
          </SignedOut>
          <SignedIn>
            <div className="flex flex-col gap-3">
              <Link href="/settings" onClick={() => setMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-center">
                  설정
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <UserButton />
                <SignOutButton>
                  <Button variant="outline" className="w-full justify-center">
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
