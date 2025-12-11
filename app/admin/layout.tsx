/**
 * @file app/admin/layout.tsx
 * @description 관리자 콘솔 경로의 최상위 레이아웃. Clerk 사용자 정보를 기반으로
 * 관리자 권한을 검증하고, 사이드바 네비게이션이 포함된 셸을 구성합니다.
 *
 * 주요 기능:
 * 1. Clerk `currentUser` 정보를 조회해 role이 `admin`인지 확인
 * 2. 비관리자 접근 시 로그를 남기고 홈 또는 로그인 화면으로 리다이렉트
 * 3. `SidebarLayout` 클라이언트 컴포넌트를 통해 반응형 사이드바/헤더 구성
 *
 * @dependencies
 * - @clerk/nextjs/server: 서버 컴포넌트에서 Clerk 사용자 정보를 조회
 * - next/navigation: 접근 제어 실패 시 리다이렉트 처리
 * - components/admin/sidebar-layout: 공통 관리자 레이아웃 UI
 * - lucide-react: 네비게이션 아이콘
 */

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { currentUser, type User } from "@clerk/nextjs/server";
import type { AdminNavItem } from "@/components/admin/sidebar-layout";
import { SidebarLayout } from "@/components/admin/sidebar-layout";

interface AdminLayoutProps {
  children: ReactNode;
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: "overview",
    label: "Overview",
    description: "운영 현황과 알림 요약",
    href: "/admin",
    icon: "overview",
  },
  {
    id: "copy",
    label: "페이지 문구",
    description: "카피 블록 및 버전 관리",
    href: "/admin/copy",
    icon: "copy",
  },
  {
    id: "popups",
    label: "팝업 공지",
    description: "공지 작성 · 배포 · 상태 모니터링",
    href: "/admin/popups",
    icon: "popup",
  },
  {
    id: "recipes",
    label: "레시피 작성",
    description: "궁중 레시피 블로그 글 작성",
    href: "/admin/recipes",
    icon: "recipes",
  },
  {
    id: "mealKits",
    label: "밀키트 제품",
    description: "밀키트 제품 등록 및 관리",
    href: "/admin/meal-kits",
    icon: "mealKits",
  },
  {
    id: "promoCodes",
    label: "프로모션 코드",
    description: "프로모션 코드 발급 및 관리",
    href: "/admin/promo-codes",
    icon: "promoCodes",
  },
  {
    id: "settlements",
    label: "정산 내역",
    description: "결제 내역 및 정산 통계",
    href: "/admin/settlements",
    icon: "settlements",
  },
  {
    id: "logs",
    label: "알림 로그",
    description: "KCDC/식단 로그 모니터링",
    href: "/admin/logs",
    icon: "logs",
  },
  {
    id: "security",
    label: "보안 설정",
    description: "암호/2FA/세션 관리",
    href: "/admin/security",
    icon: "security",
  },
  {
    id: "consent",
    label: "동의 내역",
    description: "개인정보 처리 동의 내역 조회 및 출력",
    href: "/admin/consent",
    icon: "logs",
  },
];

const SIGN_IN_REDIRECT = "/sign-in?redirect_url=%2Fadmin";

const extractMetadataRoles = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    return [value];
  }
  return [];
};

const resolveIsAdmin = (user: User | null): boolean => {
  if (!user) return false;

  const publicRoles = [
    ...extractMetadataRoles(user.publicMetadata?.["role"]),
    ...extractMetadataRoles(user.publicMetadata?.["roles"]),
  ];
  const privateRoles = [
    ...extractMetadataRoles(user.privateMetadata?.["role"]),
    ...extractMetadataRoles(user.privateMetadata?.["roles"]),
  ];
  // organizationMemberships는 Clerk의 최신 버전에서 User 타입에 직접 포함되지 않음
  // 필요한 경우 clerkClient.users.getOrganizationMembershipList()를 사용해야 함
  // const orgRoles =
  //   user.organizationMemberships?.map((membership) => membership.role) ?? [];

  const combinedRoles = [...publicRoles, ...privateRoles];
  return combinedRoles.includes("admin");
};

const formatName = (first?: string | null, last?: string | null) => {
  const safeParts = [first, last].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
  return safeParts.join(" ").trim();
};

const buildAdminDisplay = (user: User) => {
  const primaryEmail = user.primaryEmailAddress?.emailAddress ?? undefined;
  const displayName =
    (user.fullName ??
    (formatName(user.firstName, user.lastName) ||
    user.username)) ??
    "관리자";

  return {
    id: user.id,
    name: displayName,
    email: primaryEmail,
    avatarUrl: user.imageUrl,
  };
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    console.group("[AdminConsole][Guard]");
    console.warn("event", "unauthenticated");
    console.groupEnd();
    redirect(SIGN_IN_REDIRECT);
  }

  const isAdmin = resolveIsAdmin(clerkUser);

  console.group("[AdminConsole][Guard]");
  console.log("event", "access-check");
  console.log("userId", clerkUser.id);
  console.log("isAdmin", isAdmin);
  console.groupEnd();

  // 개발 중에는 관리자 체크를 임시로 비활성화
  // TODO: 프로덕션 배포 전에 다시 활성화 필요
  if (!isAdmin && process.env.NODE_ENV === "production") {
    redirect("/");
  }

  const adminUser = buildAdminDisplay(clerkUser);

  return (
    <SidebarLayout
      navItems={ADMIN_NAV_ITEMS}
      user={adminUser}
    >
      {children}
    </SidebarLayout>
  );
}


