/**
 * @file health/page.tsx
 * @description 건강 관리 메인 페이지
 *
 * 주요 기능:
 * 1. 건강 정보 요약 대시보드 표시
 * 2. 건강 관리 기능별 빠른 링크 제공
 * 3. 가족 건강 관리 접근
 * 4. 건강 데이터 동기화 상태 표시
 */

import { Suspense } from "react";
import { Section } from "@/components/section";
import { HealthSummaryDashboard } from "@/components/health/health-summary-dashboard";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Stethoscope,
  Pill,
  Syringe,
  Calendar,
  User,
  Settings,
  TrendingUp,
  Shield,
  FileText,
  Activity
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "건강 관리 | 맛의 아카이브",
  description: "개인 맞춤 건강 관리 서비스로 건강 정보를 체계적으로 관리하세요",
};

const healthFeatures = [
  {
    title: "건강 프로필",
    description: "기본 건강 정보와 식이 제한사항을 설정하세요",
    icon: Heart,
    href: "/health/profile",
    color: "text-red-500",
    bgColor: "bg-red-50"
  },
  {
    title: "병원 기록",
    description: "진료 기록과 건강 검진 결과를 관리하세요",
    icon: Stethoscope,
    href: "/health/hospital-records",
    color: "text-blue-500",
    bgColor: "bg-blue-50"
  },
  {
    title: "약물 복용",
    description: "처방약과 복용 일정을 체계적으로 관리하세요",
    icon: Pill,
    href: "/health/medication-records",
    color: "text-purple-500",
    bgColor: "bg-purple-50"
  },
  {
    title: "예방접종",
    description: "예방접종 일정과 접종 기록을 확인하세요",
    icon: Syringe,
    href: "/health/vaccinations",
    color: "text-green-500",
    bgColor: "bg-green-50"
  },
  {
    title: "질병 관리",
    description: "진단받은 질병과 치료 경과를 기록하세요",
    icon: FileText,
    href: "/health/disease-records",
    color: "text-orange-500",
    bgColor: "bg-orange-50"
  },
  {
    title: "데이터 연동",
    description: "건강정보고속도로 등 외부 서비스와 연동하세요",
    icon: Activity,
    href: "/health/data-sources",
    color: "text-indigo-500",
    bgColor: "bg-indigo-50"
  }
];

const familyFeatures = [
  {
    title: "가족 건강",
    description: "가족 구성원의 건강 정보를 통합 관리하세요",
    icon: User,
    href: "/health/manage",
    color: "text-pink-500",
    bgColor: "bg-pink-50"
  },
  {
    title: "건강 검진",
    description: "가족 건강검진 일정과 결과를 관리하세요",
    icon: Activity,
    href: "/health/manage",
    color: "text-cyan-500",
    bgColor: "bg-cyan-50"
  },
  {
    title: "알림 설정",
    description: "건강 관련 알림과 리마인더를 설정하세요",
    icon: Settings,
    href: "/settings/notifications",
    color: "text-gray-500",
    bgColor: "bg-gray-50"
  }
];

export default function HealthPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">건강 관리</h1>
          <p className="text-muted-foreground">
            건강 정보를 체계적으로 관리하고, 개인 맞춤 건강 서비스를 이용하세요.
            가족 건강도 함께 관리할 수 있습니다.
          </p>
        </div>

        {/* 건강 요약 대시보드 */}
        <div className="mb-12">
          <Suspense fallback={<LoadingSpinner label="건강 정보를 불러오는 중..." />}>
            <HealthSummaryDashboard />
          </Suspense>
        </div>

        {/* 건강 관리 기능들 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">건강 관리 기능</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {healthFeatures.map((feature) => {
              const IconComponent = feature.icon;
              const RenderIcon = IconComponent ?? Activity;
              return (
                <Card key={feature.href} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                      <RenderIcon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {feature.description}
                    </p>
                    <Button size="sm" variant="outline" asChild className="w-full">
                      <Link href={feature.href}>바로가기</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 가족 건강 관리 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">가족 건강 관리</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {familyFeatures.map((feature) => {
              const IconComponent = feature.icon;
              const RenderIcon = IconComponent ?? Activity;
              return (
                <Card key={feature.href} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className={`w-10 h-10 rounded-lg ${feature.bgColor} flex items-center justify-center mb-3`}>
                      <RenderIcon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {feature.description}
                    </p>
                    <Button size="sm" variant="outline" asChild className="w-full">
                      <Link href={feature.href}>관리하기</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 프리미엄 기능 안내 */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Shield className="w-5 h-5" />
              프리미엄 건강 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-blue-800">
                프리미엄 회원이라면 더 자세한 건강 관리를 이용하실 수 있습니다:
              </p>
              <ul className="space-y-2 text-sm text-blue-700 ml-4">
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  건강 위험도 평가 및 예측
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  자동 건강검진 및 예방접종 알림
                </li>
                <li className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  가족 건강 데이터 통합 분석
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  맞춤 건강 리포트 및 권장사항
                </li>
              </ul>
              <div className="pt-2">
                <Button size="sm" asChild>
                  <Link href="/settings/billing">프리미엄 업그레이드</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}

