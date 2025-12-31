import { Metadata } from 'next';
import { Suspense } from 'react';
import { PricingSection } from '@/components/pricing/pricing-section';
import { PricingFAQ } from '@/components/pricing/pricing-faq';
import { TestModeBanner } from '@/components/pricing/test-mode-banner';

export const metadata: Metadata = {
  title: '프리미엄 플랜 | 맛의 아카이브',
  description: '광고 없는 HD 영상, 가족 맞춤 건강 식단, 예방접종 안내, 무제한 북마크를 만나보세요.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* 테스트 모드 배너 */}
      <TestModeBanner />

      {/* 히어로 섹션 */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            프리미엄으로 업그레이드하고
            <br />
            <span className="text-orange-600">특별한 혜택</span>을 만나보세요
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            광고 없는 HD 영상, 가족 맞춤 건강 식단, 예방접종 안내, 무제한 북마크까지
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>✓ 14일 무료 체험</span>
            <span>✓ 언제든 취소 가능</span>
            <span>✓ 카드/간편결제 지원</span>
          </div>
        </div>
      </section>

      {/* 플랜 선택 섹션 */}
      <Suspense fallback={<div className="py-16 px-4 text-center">로딩 중...</div>}>
        <PricingSection />
      </Suspense>

      {/* FAQ 섹션 */}
      <PricingFAQ />

      {/* CTA 섹션 */}
      <section className="py-16 px-4 bg-orange-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-gray-700 mb-6">
            14일 동안 모든 프리미엄 기능을 무료로 체험해보세요.
            <br />
            마음에 들지 않으면 언제든 취소할 수 있습니다.
          </p>
        </div>
      </section>
    </div>
  );
}
























