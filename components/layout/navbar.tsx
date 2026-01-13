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
  UserButton,
  SignOutButton,
  useAuth,
} from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, useMemo } from "react";
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
  Crown,
  Calendar,
  PawPrint,
  Shield,
  Gamepad2,
  Users,
  ChefHat,
  BookMarked,
  Baby,
  Soup,
  Sparkles,
  Brain,
  MemoryStick,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LoginModal } from "@/components/auth/login-modal";
import { NotificationBadge } from "@/components/health/notification-badge";
import { SeasonalEffectToggle } from "@/components/home/seasonal-effect-toggle";
import { motion, AnimatePresence } from "framer-motion";

// 카테고리별 메뉴 그룹 정의
interface MenuCategory {
  id: string;
  label: string;
  neonColor: string; // 네온 효과 색상 클래스
  bgColor: string; // 배경색 (예: bg-blue-50)
  borderColor: string; // 테두리색 (예: border-blue-200)
  hoverBgColor: string; // 호버 배경색 (예: hover:bg-blue-100)
  hoverBorderColor: string; // 호버 테두리색 (예: hover:border-blue-300)
  textColor: string; // 텍스트 색상 (예: text-blue-900)
  textSecondaryColor: string; // 보조 텍스트 색상 (예: text-blue-700)
  iconBgColor: string; // 아이콘 배경색 (예: bg-blue-100)
  iconHoverBgColor: string; // 아이콘 호버 배경색 (예: group-hover:bg-blue-200)
  iconColor: string; // 아이콘 색상 (예: text-blue-600)
  iconHoverColor: string; // 아이콘 호버 색상 (예: group-hover:text-blue-600)
  neonAnimation: string; // 네온 애니메이션 이름
  items: Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

const menuCategories: MenuCategory[] = [
  {
    id: "recipes",
    label: "레시피",
    neonColor: "from-blue-400 via-cyan-400 to-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    hoverBgColor: "hover:bg-blue-100",
    hoverBorderColor: "hover:border-blue-300",
    textColor: "text-blue-900",
    textSecondaryColor: "text-blue-700",
    iconBgColor: "bg-blue-100",
    iconHoverBgColor: "group-hover:bg-blue-200",
    iconColor: "text-blue-600",
    iconHoverColor: "group-hover:text-blue-600",
    neonAnimation: "neon-glow-blue",
    items: [
      { label: "레시피", href: "/recipes", icon: BookOpen },
      { label: "궁중요리", href: "/royal-recipes", icon: Crown },
      { label: "식약처 레시피", href: "/recipes/mfds", icon: ChefHat },
      { label: "이유식 레시피", href: "/archive/recipes?tab=baby", icon: Baby },
      { label: "죽 레시피", href: "/archive/recipes?tab=gruel", icon: Soup },
      { label: "특수 레시피", href: "/archive/recipes?tab=special", icon: Sparkles },
      { label: "비건 레시피", href: "/archive/recipes?tab=vegan", icon: BookOpen },
    ],
  },
  {
    id: "diet",
    label: "식단",
    neonColor: "from-green-400 via-emerald-400 to-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    hoverBgColor: "hover:bg-green-100",
    hoverBorderColor: "hover:border-green-300",
    textColor: "text-green-900",
    textSecondaryColor: "text-green-700",
    iconBgColor: "bg-green-100",
    iconHoverBgColor: "group-hover:bg-green-200",
    iconColor: "text-green-600",
    iconHoverColor: "group-hover:text-green-600",
    neonAnimation: "neon-glow-green",
    items: [
      { label: "식단관리", href: "/diet", icon: UtensilsCrossed },
      { label: "주간식단", href: "/diet/weekly", icon: Calendar },
    ],
  },
  {
    id: "health",
    label: "건강",
    neonColor: "from-pink-400 via-rose-400 to-red-500",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    hoverBgColor: "hover:bg-pink-100",
    hoverBorderColor: "hover:border-pink-300",
    textColor: "text-pink-900",
    textSecondaryColor: "text-pink-700",
    iconBgColor: "bg-pink-100",
    iconHoverBgColor: "group-hover:bg-pink-200",
    iconColor: "text-pink-600",
    iconHoverColor: "group-hover:text-pink-600",
    neonAnimation: "neon-glow-pink",
    items: [
      { label: "건강관리", href: "/health", icon: Heart },
      { label: "반려동물", href: "/health/pets", icon: PawPrint },
    ],
  },
  {
    id: "games",
    label: "게임",
    neonColor: "from-purple-400 via-violet-400 to-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    hoverBgColor: "hover:bg-purple-100",
    hoverBorderColor: "hover:border-purple-300",
    textColor: "text-purple-900",
    textSecondaryColor: "text-purple-700",
    iconBgColor: "bg-purple-100",
    iconHoverBgColor: "group-hover:bg-purple-200",
    iconColor: "text-purple-600",
    iconHoverColor: "group-hover:text-purple-600",
    neonAnimation: "neon-glow-purple",
    items: [
      { label: "냉장고 파수꾼", href: "/game/fridge-guardian", icon: Shield },
      { label: "Django Defender", href: "/game/fridge-defense", icon: Gamepad2 },
      { label: "냉장고 짝맞추기", href: "/game/fridge-memory", icon: MemoryStick },
      { label: "뇌 훈련 숫자맞추기", href: "/game/codebreaker", icon: Brain },
    ],
  },
  {
    id: "community",
    label: "스토리/커뮤니티",
    neonColor: "from-orange-400 via-amber-400 to-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    hoverBgColor: "hover:bg-orange-100",
    hoverBorderColor: "hover:border-orange-300",
    textColor: "text-orange-900",
    textSecondaryColor: "text-orange-700",
    iconBgColor: "bg-orange-100",
    iconHoverBgColor: "group-hover:bg-orange-200",
    iconColor: "text-orange-600",
    iconHoverColor: "group-hover:text-orange-600",
    neonAnimation: "neon-glow-orange",
    items: [
      { label: "스토리", href: "/stories", icon: FileText },
      { label: "음식 이야기", href: "/food-stories", icon: BookMarked },
      { label: "커뮤니티", href: "/community", icon: Users },
    ],
  },
];

// 기본 네비게이션 링크 (데스크톱용)
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
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const prevSignedInRef = useRef<boolean | undefined>(undefined);
  const prevPathnameRef = useRef<string | null>(null);

  // 전체 메뉴 아이템 수를 미리 계산 (성능 최적화)
  const totalMenuItems = useMemo(() => {
    return menuCategories.reduce((acc, cat) => acc + cat.items.length, 0);
  }, []);

  // 클라이언트 사이드에서만 마운트 상태 설정 (Hydration 오류 방지)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 모바일 메뉴가 열릴 때 body 스크롤 막기
  useEffect(() => {
    if (menuOpen) {
      // 모달이 열릴 때 body 스크롤 막기
      document.body.style.overflow = 'hidden';
    } else {
      // 모달이 닫힐 때 body 스크롤 복원
      document.body.style.overflow = '';
    }

    // cleanup: 컴포넌트 언마운트 시 스크롤 복원
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

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
      suppressHydrationWarning
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 gap-4" suppressHydrationWarning>
        {/* 왼쪽: 로고 + 앱제목 (클릭 시 메인으로 이동) */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            className="relative w-[50px] h-[60px] flex-shrink-0 flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
            suppressHydrationWarning
            onClick={(e) => {
              handleNavClick("홈");
              console.log("[Navbar] 냉장고 로고 클릭", { pathname, timestamp: Date.now() });
              
              // 홈 링크 클릭 시 (현재 경로가 홈이 아니거나 홈인 경우 모두)
              if (pathname !== "/") {
                // 다른 페이지에서 홈으로 이동하는 경우 세션 스토리지 플래그 설정
                console.log("[Navbar] 다른 경로에서 홈으로 이동 - 플래그 설정");
                sessionStorage.setItem('shouldRefreshHome', 'true');
              } else {
                // 현재 홈 페이지에서 홈으로 다시 클릭한 경우
                e.preventDefault();
                console.log("[Navbar] 현재 홈 페이지에서 홈으로 이동 - 강제 네비게이션");
                router.push("/");
                // 약간의 딜레이 후 refresh와 스크롤 (렌더링 완료 대기)
                setTimeout(() => {
                  router.refresh();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }, 50);
              }
            }}
            aria-label="Django Care 홈으로 이동"
          >
            <Image
              src="/icons/refrigerator-logo.png"
              alt="Django Care 로고"
              width={50}
              height={60}
              className="rounded-lg object-contain object-center"
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
          </Link>
          <div className="flex items-center whitespace-nowrap">
            <Link
              href="/"
              className="relative w-[116px] h-[60px] flex-shrink-0 flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
              onClick={(e) => {
                handleNavClick("홈");
                console.log("[Navbar] Django Care 로고 클릭", { pathname, timestamp: Date.now() });
                
                // 홈 링크 클릭 시 (현재 경로가 홈이 아니거나 홈인 경우 모두)
                if (pathname !== "/") {
                  // 다른 페이지에서 홈으로 이동하는 경우 세션 스토리지 플래그 설정
                  console.log("[Navbar] 다른 경로에서 홈으로 이동 - 플래그 설정");
                  sessionStorage.setItem('shouldRefreshHome', 'true');
                } else {
                  // 현재 홈 페이지에서 홈으로 다시 클릭한 경우
                  e.preventDefault();
                  console.log("[Navbar] 현재 홈 페이지에서 홈으로 이동 - 강제 네비게이션");
                  router.push("/");
                  // 약간의 딜레이 후 refresh와 스크롤 (렌더링 완료 대기)
                  setTimeout(() => {
                    router.refresh();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }, 50);
                }
              }}
              aria-label="Django Care 홈으로 이동"
            >
              <Image
                src="/icons/10045.webp"
                alt="Django Care 로고"
                width={116}
                height={28}
                className="object-contain object-center -translate-x-2"
                priority
                unoptimized
                onError={(e) => {
                  if (process.env.NODE_ENV === "development") {
                    console.error('[Navbar] 로고 이미지 로드 실패:', e);
                  }
                }}
                onLoad={() => {
                  if (process.env.NODE_ENV === "development") {
                    console.log('[Navbar] 로고 이미지 로드 완료');
                  }
                }}
              />
            </Link>
          </div>
        </div>

        {/* 중앙: 검색바 (데스크톱만 표시) */}
        <form
          onSubmit={handleSearch}
          className="hidden sm:flex flex-1 max-w-2xl mx-4"
          suppressHydrationWarning
        >
          <div className="relative w-full" suppressHydrationWarning>
            <Input
              type="text"
              placeholder="레시피 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={cn(
                "w-full pr-10 transition-all",
              )}
              suppressHydrationWarning
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </form>

        {/* 오른쪽: 작은 검색창 (모바일) + 로그인 + 햄버거 */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 작은 검색창 (모바일) - 돋보기 아이콘을 검색창 안에 배치 */}
          <div className="sm:hidden flex items-center min-w-0 max-w-[100px]">
            <form
              onSubmit={handleSearch}
              className="flex-1 min-w-0"
              suppressHydrationWarning
            >
              <div className="relative" suppressHydrationWarning>
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className={cn(
                    "w-full h-9 pl-8 pr-2 text-xs transition-all",
                  )}
                  suppressHydrationWarning
                />
              </div>
            </form>
          </div>

          {/* 데스크톱 네비게이션 */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => {
              const isHealthLink = link.href === "/health";
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative text-sm font-medium transition-colors",
                    pathname === link.href || pathname?.startsWith(link.href + "/")
                      ? "text-orange-600"
                      : "text-gray-700 hover:text-orange-600",
                  )}
                  onClick={() => handleNavClick(link.label)}
                >
                  {link.label}
                  {isHealthLink && <NotificationBadge className="absolute -top-1 -right-3" />}
                </Link>
              );
            })}
            {/* 설정 메뉴 (로그인한 사용자만 표시) */}
            {isMounted && isLoaded && isSignedIn && (
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
            )}
          </div>

          {/* 사용자 메뉴 (로그인/사진) */}
          {isMounted && isLoaded && isSignedIn && (
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          )}

          {isMounted && isLoaded && !isSignedIn && <LoginModal />}

          {/* 햄버거 메뉴 (모바일/태블릿) - GDWEB 스타일 */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden relative overflow-hidden group"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="메뉴 열기/닫기"
            style={{
              background: menuOpen 
                ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)'
                : 'transparent',
              zIndex: menuOpen ? 100000 : 'auto',
              position: menuOpen ? 'relative' : 'static',
            }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ zIndex: 0 }}
            />
            <motion.div
              className="relative z-10"
              animate={menuOpen ? { rotate: 180 } : { rotate: 0 }}
              transition={{ duration: 0.3 }}
            >
              {menuOpen ? (
                <X className="h-5 w-5 text-white" />
              ) : (
                <Menu className="h-5 w-5 text-gray-700 group-hover:text-white transition-colors" />
              )}
            </motion.div>
          </Button>
        </div>
      </div>

      {/* 모바일 메뉴 - GDWEB 스타일 */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="md:hidden fixed bg-black/80 backdrop-blur-md"
              style={{ 
                top: '64px', 
                left: 0, 
                right: 0, 
                bottom: 0,
                zIndex: 9998
              }}
              onClick={() => setMenuOpen(false)}
            />
            {/* 모바일 메뉴 */}
            <motion.div
              data-slot="mobile-menu"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="md:hidden fixed top-[64px] left-0 right-0 bg-white border-b border-orange-200/50 shadow-2xl max-h-[calc(100vh-64px)] overflow-y-auto"
              style={{
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                paddingBottom: "80px", // 하단 네비게이션 바 높이(64px) + 여유 공간(16px)
                zIndex: 9999, // 모바일 메뉴는 높은 z-index, 하지만 모달보다는 낮음
              }}
            >
            <div className="px-2 py-3 pb-20 space-y-3">
              {menuCategories.map((category, categoryIndex) => {
                let itemIndex = 0;
                // 이전 카테고리의 아이템 수를 계산하여 delay 계산
                for (let i = 0; i < categoryIndex; i++) {
                  itemIndex += menuCategories[i].items.length;
                }
                
                return (
                  <div key={category.id} className="space-y-1.5">
                    {/* 카테고리별 아이템들 */}
                    {category.items.map((item, itemIdx) => {
                      const Icon = item.icon;
                      const isHealthLink = item.href === "/health";
                      const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                      const globalIndex = itemIndex + itemIdx;
                      
                      return (
                        <motion.div
                          key={item.href}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: globalIndex * 0.02, duration: 0.15 }}
                        >
                          <Link
                            href={item.href}
                            className={cn(
                              "group relative flex items-center justify-between gap-3 py-2.5 px-4 rounded-xl transition-all duration-300 overflow-hidden",
                              "border-2",
                              isActive
                                ? `bg-gradient-to-br ${category.neonColor} text-white border-transparent`
                                : cn(
                                    category.bgColor,
                                    category.borderColor,
                                    category.hoverBgColor,
                                    category.hoverBorderColor,
                                    category.textColor
                                  ),
                            )}
                            onClick={() => handleNavClick(item.label)}
                            style={{
                              // 활성 상태일 때는 강한 네온 효과, 비활성 상태일 때는 애니메이션 적용
                              animation: !isActive ? `${category.neonAnimation} 2s ease-in-out infinite` : undefined,
                            }}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {/* 아이콘 */}
                              <div className={cn(
                                "relative flex items-center justify-center w-8 h-8 rounded-full transition-colors",
                                isActive
                                  ? "bg-white/20"
                                  : cn(
                                      category.iconBgColor,
                                      category.iconHoverBgColor
                                    )
                              )}>
                                <Icon className={cn(
                                  "h-5 w-5 transition-colors",
                                  isActive
                                    ? "text-white"
                                    : cn(
                                        category.iconColor,
                                        category.iconHoverColor
                                      )
                                )} />
                                {isHealthLink && (
                                  <NotificationBadge className="absolute -top-0.5 -right-1 scale-75" />
                                )}
                              </div>
                              {/* 텍스트 */}
                              <div className="flex-1">
                                <span className={cn(
                                  "font-bold text-sm block",
                                  isActive ? "text-white" : category.textColor
                                )}>
                                  {item.label}
                                </span>
                              </div>
                            </div>
                            {/* 화살표 아이콘 */}
                            <ChevronRight className={cn(
                              "w-4 h-4 transition-colors flex-shrink-0",
                              isActive
                                ? "text-white/80"
                                : cn(
                                    category.iconColor,
                                    category.iconHoverColor
                                  )
                            )} />
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })}
              {/* 설정 및 로그아웃 구분선 */}
              <div className="pt-2 border-t border-gray-200" />
              
              {isMounted && isLoaded && isSignedIn && (
                <>
                  {/* 설정 버튼 */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: totalMenuItems * 0.02 + 0.05, duration: 0.15 }}
                    className="space-y-1.5"
                  >
                    <Link
                      href="/settings"
                      className={cn(
                        "group relative flex items-center justify-between gap-3 py-2.5 px-4 rounded-xl transition-all duration-300 overflow-hidden",
                        "border-2 bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 text-gray-900"
                      )}
                      onClick={() => handleNavClick("설정")}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors">
                          <Settings className="h-5 w-5 text-gray-600 group-hover:text-gray-700 transition-colors" />
                        </div>
                        <div className="flex-1">
                          <span className="font-bold text-sm block text-gray-900">설정</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                    </Link>
                    
                    {/* 계절 효과 토글 버튼 */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: totalMenuItems * 0.02 + 0.06, duration: 0.15 }}
                      className="space-y-1.5"
                    >
                      <SeasonalEffectToggle inMenu={true} />
                    </motion.div>
                  </motion.div>
                  
                  {/* 로그아웃 버튼 */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: totalMenuItems * 0.02 + 0.08, duration: 0.15 }}
                  >
                    <SignOutButton>
                      <button
                        className="group relative flex items-center justify-between gap-3 py-2.5 px-4 rounded-xl transition-all duration-300 overflow-hidden w-full border-2 bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300 text-red-900"
                        style={{
                          animation: 'neon-glow-red 2s ease-in-out infinite',
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 group-hover:bg-red-200 transition-colors">
                            <LogOut className="h-5 w-5 text-red-600 group-hover:text-red-700 transition-colors" />
                          </div>
                          <div className="flex-1">
                            <span className="font-bold text-sm block text-red-900">로그아웃</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors flex-shrink-0" />
                      </button>
                    </SignOutButton>
                  </motion.div>
                </>
              )}
              {isMounted && isLoaded && !isSignedIn && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: menuCategories.reduce((acc, cat) => acc + cat.items.length, 0) * 0.02 + 0.05, duration: 0.15 }}
                >
                  <LoginModal />
                </motion.div>
              )}
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
