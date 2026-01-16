/**
 * @file app/fridge/page.tsx
 * @description 냉장고 관리 페이지
 */

import { Section } from "@/components/section";
import { FridgeManager } from "@/components/fridge/fridge-manager";
import { ExpiryAlertBanner } from "@/components/fridge/expiry-alert-banner";
import { DirectionalEntrance } from "@/components/motion/directional-entrance";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";

export const metadata = {
  title: "냉장고 관리 | Django Care",
  description: "식재료를 관리하고 유통기한을 추적하세요",
};

export default function FridgePage() {
  return (
    <DirectionalEntrance direction="up" delay={0.3}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Section className="pt-8 pb-12">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* 페이지 헤더 */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">🧊 우리집 냉장고</h1>
              <p className="text-muted-foreground">
                식재료를 등록하고 유통기한을 관리하세요
              </p>
            </div>

            {/* 유통기한 알림 배너 */}
            <Suspense fallback={null}>
              <ExpiryAlertBanner />
            </Suspense>

            {/* 냉장고 관리 */}
            <Suspense fallback={<LoadingSpinner label="냉장고를 불러오는 중..." />}>
              <FridgeManager />
            </Suspense>
          </div>
        </Section>
      </div>
    </DirectionalEntrance>
  );
}

