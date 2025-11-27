/**
 * @file app/legacy/page.tsx
 * @description 레거시 아카이브 전체 페이지. 홈 섹션보다 확장된 소개와 CTA를 제공.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/section";
import { LegacyArchiveSection } from "@/components/legacy/legacy-archive-section";
import { FoodStoriesSection } from "@/components/food-stories/food-stories-section";

export default function LegacyPage() {
  return (
    <div className="space-y-4">
      <Section
        title="명인 레거시 아카이브"
        description="잊히기 전에 기록해야 할 전통 조리법을 영상, 문서, 대체재료 정보로 아카이브했습니다."
      >
        <div className="grid gap-8 rounded-3xl border border-border/70 bg-white/90 p-6 shadow-lg lg:grid-cols-2">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-orange-600">
              프리미엄 구독자 혜택
            </p>
            <h1 className="text-4xl font-bold text-gray-900">
              고화질 인터뷰 & 전문 문서까지 한 번에
            </h1>
            <p className="text-lg text-muted-foreground">
              명인의 손끝에서 배운 기술을 영상으로 보고, 문서화된 레시피와 현대
              대체재료 제안까지 이어 보세요.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/#legacy">프리미엄 구독 알아보기</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
              >
                <Link href="#legacy-archive">아카이브 살펴보기</Link>
              </Button>
            </div>
          </div>
          <div className="space-y-4 rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-6 shadow-inner">
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
              <p className="text-sm font-semibold text-orange-600">
                오늘의 추천 영상
              </p>
              <h3 className="text-xl font-bold">김치 담그기</h3>
              <p className="text-sm text-muted-foreground">
                전통 조리법 · 계절별 레시피 · 프리미엄
              </p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
              <p className="text-sm font-semibold text-emerald-600">
                대체재료 가이드
              </p>
              <p className="text-sm text-muted-foreground">
                전통 젓갈 → 현대 젓갈 (맛 보정 레시피 포함)
              </p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
              <p className="text-sm font-semibold text-amber-600">
                문서화 기록
              </p>
              <p className="text-sm text-muted-foreground">
                배추 절이기, 양념 만들기, 발효 관리 가이드
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* 음식 동화 동영상 섹션 */}
      <FoodStoriesSection />

      <LegacyArchiveSection
        id="legacy-archive"
        title="레거시 콘텐츠 탐색"
        description="필터를 조합해 원하는 지역·시대·재료를 빠르게 찾을 수 있어요."
      />
    </div>
  );
}

