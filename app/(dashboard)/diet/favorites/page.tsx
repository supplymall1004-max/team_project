/**
 * @file app/(dashboard)/diet/favorites/page.tsx
 * @description 즐겨찾기한 식단 목록 페이지
 *
 * 주요 기능:
 * 1. 사용자가 저장한 즐겨찾기 식단 목록 표시
 * 2. 즐겨찾기 삭제 기능
 * 3. 프리미엄 전용 기능
 */

import { Suspense } from "react";
import { Section } from "@/components/section";
import { LoadingSpinner } from "@/components/loading-spinner";
import { FavoritesList } from "./favorites-list";
import { getCurrentSubscription } from "@/actions/payments/get-subscription";
import { PremiumGate } from "@/components/premium/premium-gate";

export const metadata = {
  title: "즐겨찾기 식단 | 맛의 아카이브",
  description: "저장한 즐겨찾기 식단을 확인하고 관리하세요.",
};

export default async function FavoritesPage() {
  const subscription = await getCurrentSubscription();

  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">즐겨찾기 식단</h1>
          <p className="text-muted-foreground">
            저장한 즐겨찾기 식단을 확인하고 관리하세요. 프리미엄 회원은 무제한으로 즐겨찾기를 저장할 수 있습니다.
          </p>
        </div>

        <PremiumGate
          isPremium={subscription.isPremium}
          variant="card"
          message="즐겨찾기는 프리미엄 전용 기능입니다. 무제한으로 즐겨찾기를 저장하고 관리하세요!"
        >
          <Suspense fallback={<LoadingSpinner label="즐겨찾기 목록을 불러오는 중..." />}>
            <FavoritesList />
          </Suspense>
        </PremiumGate>
      </Section>
    </div>
  );
}













