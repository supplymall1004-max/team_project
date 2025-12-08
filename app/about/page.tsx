/**
 * @file app/about/page.tsx
 * @description 회사소개 페이지
 *
 * 주요 기능:
 * 1. Flavor Archive 서비스 소개
 * 2. 주요 기능 설명 (레거시 아카이브, 현대 레시피 북, AI 맞춤 식단)
 * 3. 연락처 정보
 *
 * @note 나중에 수정 가능하도록 구조화된 컴포넌트로 작성됨
 */

import Link from "next/link";
import { Section } from "@/components/section";
import { Film, ChefHat, Brain, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "회사소개 | 맛의 아카이브",
  description: "Flavor Archive 서비스 소개 및 주요 기능 안내",
};

const features = [
  {
    title: "궁중 레시피 아카이브",
    icon: Film,
    description:
      "잊혀져 가는 시대별 궁중 음식 레시피를 아카이브합니다. 삼국시대부터 조선시대까지의 전통 궁중 요리를 만나보세요.",
    href: "/#royal-recipes",
    color: "orange",
  },
  {
    title: "현대 레시피 북",
    icon: ChefHat,
    description:
      "사용자가 직접 공유하는 다양한 레시피를 별점과 난이도로 정리했습니다. 단계별 가이드와 타이머 기능으로 초보자도 쉽게 따라할 수 있습니다.",
    href: "/recipes",
    color: "emerald",
  },
  {
    title: "AI 맞춤 식단",
    icon: Brain,
    description:
      "건강 정보를 기반으로 개인 맞춤 식단을 추천합니다. 알레르기, 질병 정보, 선호도를 반영하여 하루 식단과 영양 정보를 제공합니다.",
    href: "/diet",
    color: "amber",
  },
];

const getColorClasses = (color: string) => {
  switch (color) {
    case "orange":
      return {
        bg: "bg-orange-100",
        text: "text-orange-600",
        hover: "hover:bg-orange-200",
      };
    case "emerald":
      return {
        bg: "bg-emerald-100",
        text: "text-emerald-600",
        hover: "hover:bg-emerald-200",
      };
    case "amber":
      return {
        bg: "bg-amber-100",
        text: "text-amber-600",
        hover: "hover:bg-amber-200",
      };
    default:
      return {
        bg: "bg-gray-100",
        text: "text-gray-600",
        hover: "hover:bg-gray-200",
      };
  }
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-orange-50/40">
      {/* 히어로 섹션 */}
      <Section className="pt-16 pb-8">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
            맛의 아카이브
            <br />
            <span className="text-orange-600">Flavor Archive</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            잊혀진 손맛을 연결하는 디지털 식탁
          </p>
          <p className="text-base text-muted-foreground leading-relaxed">
            궁중 레시피부터 AI 맞춤 식단까지, 세대와 세대를 넘나드는
            요리 지식을 한 곳에서 경험하세요. Flavor Archive는 전통과 현대를
            잇는 레시피 아카이브 플랫폼입니다.
          </p>
        </div>
      </Section>

      {/* 주요 기능 소개 */}
      <Section title="주요 기능" description="Flavor Archive의 핵심 서비스를 소개합니다.">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            const colors = getColorClasses(feature.color);
            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm transition-all hover:shadow-lg"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`rounded-lg ${colors.bg} p-3 ${colors.hover} transition-colors`}
                  >
                    <Icon className={`h-6 w-6 ${colors.text}`} />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {feature.description}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href={feature.href}>자세히 보기</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 비전 섹션 */}
      <Section>
        <div className="rounded-3xl border border-border/70 bg-white/90 p-8 md:p-12 shadow-lg">
          <h2 className="text-3xl font-bold mb-6 text-center">우리의 비전</h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-orange-600">
                전통의 보존
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                시대별 궁중 레시피를 체계적으로 아카이브하여 다음 세대에 전달합니다.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-emerald-600">
                현대의 연결
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                사용자들이 직접 공유하는 레시피와 AI 기반 맞춤 식단으로 현대적
                요리 경험을 제공합니다.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* 연락처 섹션 */}
      <Section>
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">문의하기</h2>
          <p className="text-muted-foreground">
            서비스에 대한 문의사항이 있으시면 언제든지 연락주세요.
          </p>
          <Button asChild>
            <Link href="mailto:hello@flavor-archive.com">
              <Mail className="mr-2 h-4 w-4" />
              hello@flavor-archive.com
            </Link>
          </Button>
        </div>
      </Section>
    </div>
  );
}

