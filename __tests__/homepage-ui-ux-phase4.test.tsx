/**
 * @file __tests__/homepage-ui-ux-phase4.test.tsx
 * @description 홈페이지 UI/UX Phase 4 (세부 개선) 검증 테스트
 *
 * - 프리미엄 배너 애니메이션/효과
 * - 바로가기 메뉴 터치 영역 및 호버 효과
 * - 하단 네비게이션 활성 상태 및 전환 애니메이션
 *
 * 다른 기술 스택(Supabase, Clerk 등)에 영향 없이
 * 순수 UI 레벨 요구사항만 검증합니다.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { PremiumBanner } from "@/components/home/premium-banner";
import { QuickAccessMenu } from "@/components/home/quick-access-menu";
import { BottomNavigation } from "@/components/layout/bottom-navigation";

// next/link, next/navigation 등은 테스트 환경에서 간단히 mock 처리
vi.mock("next/link", () => {
  return {
    __esModule: true,
    default: ({ href, children, ...props }: any) => (
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});

vi.mock("next/navigation", async () => {
  return {
    // 홈 경로를 기본값으로 사용하여 하단 네비게이션 활성 상태를 검증
    usePathname: () => "/",
  };
});

describe("홈페이지 UI/UX Phase 4 - 세부 개선", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("프리미엄 배너는 주황색 배경과 페이드인/슬라이드 애니메이션, 전환 효과 클래스를 가진다", () => {
    render(<PremiumBanner />);

    const link = screen.getByRole("link", {
      name: "프리미엄 결제 혜택을 받아보세요",
    });

    const className = (link as HTMLAnchorElement).className;

    expect(className).toContain("bg-orange-500");
    expect(className).toContain("hover:bg-orange-600");
    expect(className).toContain("transition-all");
    expect(className).toContain("duration-300");
    expect(className).toContain("animate-in");
    expect(className).toContain("fade-in");
    expect(className).toContain("slide-in-from-top-2");
  });

  it("바로가기 메뉴 아이템은 충분한 터치 영역과 호버/터치 애니메이션 클래스를 가진다", () => {
    render(<QuickAccessMenu />);

    // 레이블이 있는 첫 번째 바로가기 아이템을 기준으로 검사
    const legacyLink = screen.getByRole("link", {
      name: "레거시 페이지로 이동",
    });

    const className = (legacyLink as HTMLAnchorElement).className;

    expect(className).toContain("hover:scale-105");
    expect(className).toContain("active:scale-95");
    expect(className).toContain("transition-all");
    expect(className).toContain("duration-200");
    expect(className).toContain("min-h-[88px]");
    expect(className).toContain("min-w-[88px]");
  });

  it("하단 네비게이션은 홈 경로에서 홈 메뉴를 활성 상태로 표시하고 청록색 포커스/전환 애니메이션을 가진다", () => {
    render(<BottomNavigation />);

    const homeLink = screen.getByRole("link", { name: "홈" });

    expect(homeLink).toHaveAttribute("aria-current", "page");

    const className = (homeLink as HTMLAnchorElement).className;

    expect(className).toContain("text-teal-600");
    expect(className).toContain("scale-105");
    expect(className).toContain("transition-all");
    expect(className).toContain("duration-200");

    const nav = screen.getByRole("navigation", { name: "하단 네비게이션" });
    const navClassName = (nav as HTMLElement).className;

    expect(navClassName).toContain("h-16");
  });
}
);


