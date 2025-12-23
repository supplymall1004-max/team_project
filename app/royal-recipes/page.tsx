/**
 * @file app/royal-recipes/page.tsx
 * @description 궁중 레시피 메인 페이지 (시대별 선택 + 탭 네비게이션)
 */

import { Section } from '@/components/section';
import { RecipeTabsClient } from '@/app/archive/recipes/recipe-tabs-client';
import { RecipeSectionServer } from '@/app/archive/recipes/recipe-section-server';
import { RoyalRecipesQuickAccess } from '@/components/royal-recipes/royal-recipes-quick-access';
import { MfdsRecipeSection } from '@/components/home/mfds-recipe-section';
import { BabyRecipeNotice } from '@/components/baby-recipes/baby-recipe-notice';
import { BabyRecipeList } from '@/components/baby-recipes/baby-recipe-list';
import { GruelRecipeList } from '@/components/gruel-recipes/gruel-recipe-list';
import { SpecialRecipeList } from '@/components/special-recipes/special-recipe-list';
import { VeganRecipeList } from '@/components/vegan-recipes/vegan-recipe-list';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { LoadingSpinner } from '@/components/loading-spinner';
import Link from "next/link";
import Image from "next/image";

function SectionSkeleton() {
  return (
    <div className="py-12 text-center">
      <LoadingSpinner />
    </div>
  );
}

// Server Component로 각 탭 콘텐츠를 직접 렌더링
function AllTabContent() {
  return (
    <div className="space-y-8">
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton />}>
          <RecipeSectionServer />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton />}>
          <RoyalRecipesQuickAccess id="royal-recipes" />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton />}>
          <MfdsRecipeSection />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <div className="space-y-6">
          <BabyRecipeNotice />
          <BabyRecipeList />
        </div>
      </ErrorBoundary>
      <ErrorBoundary>
        <div className="space-y-6">
          <GruelRecipeList />
        </div>
      </ErrorBoundary>
      <ErrorBoundary>
        <div className="space-y-6">
          <SpecialRecipeList />
        </div>
      </ErrorBoundary>
      <ErrorBoundary>
        <div className="space-y-6">
          <VeganRecipeList />
        </div>
      </ErrorBoundary>
    </div>
  );
}

function ModernTabContent() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SectionSkeleton />}>
        <RecipeSectionServer />
      </Suspense>
    </ErrorBoundary>
  );
}

function RoyalTabContent() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SectionSkeleton />}>
        <RoyalRecipesQuickAccess id="royal-recipes" />
      </Suspense>
    </ErrorBoundary>
  );
}

function MfdsTabContent() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SectionSkeleton />}>
        <MfdsRecipeSection />
      </Suspense>
    </ErrorBoundary>
  );
}

function BabyTabContent() {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <BabyRecipeNotice />
        <BabyRecipeList />
      </div>
    </ErrorBoundary>
  );
}

function GruelTabContent() {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <GruelRecipeList />
      </div>
    </ErrorBoundary>
  );
}

function SpecialTabContent() {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SpecialRecipeList />
      </div>
    </ErrorBoundary>
  );
}

function VeganTabContent() {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <VeganRecipeList />
      </div>
    </ErrorBoundary>
  );
}

const eras = [
  {
    id: "sanguk",
    name: "삼국시대",
    description: "삼국시대 및 통일신라 궁중 레시피",
    iconImage: "/images/royalrecipe/삼국시대 아이콘.jpg",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    count: 14,
  },
  {
    id: "goryeo",
    name: "고려시대",
    description: "불교와 원나라 교류의 영향이 담긴 궁중 레시피",
    iconImage: "/images/royalrecipe/고려시대 아이콘.jpg",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
    count: 16,
  },
  {
    id: "joseon",
    name: "조선시대",
    description: "체계적으로 발달한 궁중 음식 레시피",
    iconImage: "/images/royalrecipe/조선시대 아이콘.jpg",
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
    count: 20,
  },
];

export const metadata = {
  title: "궁중 레시피 | 맛의 아카이브",
  description: "잊혀져 가는 시대별 궁중 레시피를 만나보세요",
};

export default function RoyalRecipesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">궁중 레시피 아카이브</h1>
          <p className="text-muted-foreground">
            잊혀져 가는 시대별 궁중 음식 레시피를 디지털로 보존합니다.
          </p>
        </div>

        <RecipeTabsClient
          allContent={<AllTabContent />}
          modernContent={<ModernTabContent />}
          royalContent={<RoyalTabContent />}
          mfdsContent={<MfdsTabContent />}
          babyContent={<BabyTabContent />}
          gruelContent={<GruelTabContent />}
          specialContent={<SpecialTabContent />}
          veganContent={<VeganTabContent />}
        />
      </Section>
    </div>
  );
}

