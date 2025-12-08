/**
 * @file settings-navigation.tsx
 * @description 설정 네비게이션 컴포넌트
 *
 * 주요 기능:
 * 1. 설정 항목 목록 표시
 * 2. 각 설정 페이지로 이동하는 카드 링크
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Bell, Heart, Users, ChevronRight, CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SettingsItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SETTINGS_ITEMS: SettingsItem[] = [
  {
    id: "profile",
    title: "프로필 설정",
    description: "이름, 이메일, 프로필 사진 등 개인 정보를 수정하세요",
    href: "/settings/profile",
    icon: User,
  },
  {
    id: "health",
    title: "건강 정보 관리",
    description: "건강 상태, 식이 제한사항 등을 수정하세요",
    href: "/settings/health",
    icon: Heart,
  },
  {
    id: "family",
    title: "가족 구성원 관리",
    description: "가족 구성원을 추가하고 관리하세요",
    href: "/settings/family",
    icon: Users,
  },
  {
    id: "notifications",
    title: "알림 설정",
    description: "질병청 알림, 일반 알림 등 알림 수신 여부를 설정하세요",
    href: "/settings/notifications",
    icon: Bell,
  },
  {
    id: "billing",
    title: "결제 관리",
    description: "결제 정보 확인, 쿠폰 등록, 구독 취소 등을 관리하세요",
    href: "/settings/billing",
    icon: CreditCard,
  },
];

export function SettingsNavigation() {
  const pathname = usePathname();

  // 아이콘 색상 및 배경색 매핑
  const iconStyles: Record<string, { color: string; bg: string }> = {
    health: { color: "text-red-500", bg: "bg-red-50" },
    notifications: { color: "text-orange-500", bg: "bg-orange-50" },
    family: { color: "text-blue-500", bg: "bg-blue-50" },
    billing: { color: "text-green-500", bg: "bg-green-50" },
    profile: { color: "text-gray-500", bg: "bg-gray-50" },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {SETTINGS_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        const iconStyle = iconStyles[item.id] || { color: "text-gray-500", bg: "bg-gray-50" };

        return (
          <Card
            key={item.id}
            className={cn(
              "transition-all hover:shadow-md p-6",
              isActive && "ring-2 ring-primary"
            )}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className={cn("p-3 rounded-lg", iconStyle.bg)}>
                  <Icon className={cn("h-6 w-6", iconStyle.color)} strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <CardTitle className="mb-2 text-lg font-semibold">{item.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {item.description}
                  </CardDescription>
                </div>
              </div>
              <div className="mt-auto">
                <Button asChild variant="outline" className="w-full">
                  <Link href={item.href}>
                    설정하기
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

