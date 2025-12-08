/**
 * @file components/admin/sidebar-layout.tsx
 * @description 관리자 콘솔의 공통 레이아웃을 담당하는 클라이언트 컴포넌트.
 * 반응형 사이드바 네비게이션, 헤더, 사용자 정보 표시, 모바일 토글을 포함합니다.
 *
 * 주요 기능:
 * 1. 현재 경로 기준으로 네비게이션 항목 활성화 상태를 표시
 * 2. 모바일에서 햄버거 버튼으로 사이드바 토글 및 이벤트 로깅
 * 3. Clerk 사용자 정보를 표시하고 콘솔 상태 관련 헤더 슬롯을 노출
 *
 * @dependencies
 * - next/navigation: 현재 경로 파악
 * - lucide-react: 네비게이션 아이콘
 * - components/ui/button, avatar: shadcn/ui 기반 버튼/아바타
 * - lib/utils: Tailwind 클래스 조합 유틸
 */

"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  FileText,
  LayoutDashboard,
  Menu,
  Megaphone,
  Package,
  ShieldCheck,
  X,
  Ticket,
  DollarSign,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

const ICON_MAP = {
  overview: LayoutDashboard,
  copy: FileText,
  recipes: FileText,
  popup: Megaphone,
  mealKits: Package,
  promoCodes: Ticket,
  logs: Activity,
  security: ShieldCheck,
  settlements: DollarSign,
} as const satisfies Record<string, LucideIcon>;

export type AdminNavIcon = keyof typeof ICON_MAP;

export interface AdminNavItem {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: AdminNavIcon;
  badgeLabel?: string;
}

interface AdminUserMeta {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

interface SidebarLayoutProps {
  navItems: AdminNavItem[];
  user: AdminUserMeta;
  headerContent?: ReactNode;
  children: ReactNode;
}

const resolveInitials = (name?: string) => {
  if (!name) return "AD";
  const [first = "", second = ""] = name.split(" ");
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
};

export function SidebarLayout({
  navItems,
  user,
  headerContent,
  children,
}: SidebarLayoutProps) {
  const pathname = usePathname();
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);

  const activeNavId = useMemo(() => {
    const matched = navItems.find((item) => {
      if (item.href === "/admin") {
        return pathname === item.href;
      }
      return pathname.startsWith(item.href);
    });
    return matched?.id ?? navItems[0]?.id ?? null;
  }, [navItems, pathname]);

  const handleMobileToggle = useCallback(() => {
    setMobileNavOpen((prev) => {
      const next = !prev;
      console.group("[AdminConsole][Sidebar]");
      console.log("event", "mobile-toggle");
      console.log("nextState", next ? "open" : "closed");
      console.groupEnd();
      return next;
    });
  }, []);

  const handleNavClick = useCallback((itemId: string) => {
    console.group("[AdminConsole][Sidebar]");
    console.log("event", "nav-click");
    console.log("target", itemId);
    console.groupEnd();
    setMobileNavOpen(false);
  }, []);

  useEffect(() => {
    if (!isMobileNavOpen) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        console.group("[AdminConsole][Sidebar]");
        console.log("event", "mobile-close");
        console.log("reason", "escape");
        console.groupEnd();
        setMobileNavOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMobileNavOpen]);

  useEffect(() => {
    console.group("[AdminConsole][Sidebar]");
    console.log("event", "mount");
    console.log(
      "navItems",
      navItems.map((item) => item.id),
    );
    console.groupEnd();
  }, [navItems]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 transform border-r border-slate-200 bg-white shadow-lg transition-transform duration-200 ease-out",
          "lg:relative lg:translate-x-0 lg:shadow-none",
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="관리자 내비게이션"
      >
        <div className="flex h-16 items-center border-b border-slate-100 px-6">
          <p className="text-lg font-semibold text-slate-900">
            Flavor Archive · Admin
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;
            const isActive = item.id === activeNavId;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "group flex flex-col rounded-xl border px-4 py-3 transition-colors",
                  isActive
                    ? "border-orange-200 bg-orange-50 text-orange-900"
                    : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white",
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "rounded-full p-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-orange-100 text-orange-700"
                        : "bg-slate-100 text-slate-600 group-hover:bg-slate-200",
                    )}
                    aria-hidden
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{item.label}</span>
                    {item.description ? (
                      <span className="text-xs text-slate-500">
                        {item.description}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {isMobileNavOpen ? (
        <button
          type="button"
          aria-label="모바일 내비게이션 닫기"
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={handleMobileToggle}
        />
      ) : null}

      <div className="flex flex-1 flex-col lg:ml-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="네비게이션 토글"
              onClick={handleMobileToggle}
            >
              {isMobileNavOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <div>
              <p className="text-xs uppercase text-slate-500">Admin Console</p>
              <h1 className="text-lg font-semibold text-slate-900">
                운영 대시보드
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {headerContent}
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">
                {user.name}
              </p>
              {user.email ? (
                <p className="text-xs text-slate-500">{user.email}</p>
              ) : null}
            </div>
            <Avatar className="h-10 w-10 border border-slate-200">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.name} />
              ) : null}
              <AvatarFallback className="bg-orange-100 text-sm font-semibold text-orange-700">
                {resolveInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}


