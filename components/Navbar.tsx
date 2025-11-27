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
import { useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoginModal } from "@/components/auth/login-modal";

const navLinks = [
  { label: "레거시", href: "/legacy" },
  { label: "레시피북", href: "/recipes" },
  { label: "AI 식단", href: "/diet" },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = (label: string) => {
    // 성능 최적화: 프로덕션에서는 로그 최소화
    if (process.env.NODE_ENV === "development") {
      console.groupCollapsed("[Navbar] 내비게이션 클릭");
      console.log("target:", label);
      console.groupEnd();
    }
    setMenuOpen(false);
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
    <header className="sticky top-0 z-50 border-b border-border/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Flavor Archive
        </Link>
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
              <Link href="/health/manage">
                <Button variant="ghost" size="sm">
                  가족관리
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
              <Link href="/health/manage" onClick={() => setMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-center">
                  가족관리
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
