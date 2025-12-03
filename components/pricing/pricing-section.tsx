'use client';

/**
 * @file pricing-section.tsx
 * @description 플랜 선택 및 비교 섹션
 */

import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createCheckout } from '@/actions/payments/create-checkout';
import { useUser } from '@clerk/nextjs';

type PlanType = 'monthly' | 'yearly';

export function PricingSection() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');
  const [promoCode, setPromoCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const plans = {
    monthly: {
      name: '월간 프리미엄',
      price: 9900,
      period: '월',
      description: '부담 없이 시작하기',
      badge: null,
    },
    yearly: {
      name: '연간 프리미엄',
      price: 7900,
      originalPrice: 9900,
      totalPrice: 94800,
      period: '월',
      description: '1년치 한 번에 결제',
      badge: '20% 할인',
    },
  };

  const currentPlan = plans[selectedPlan];

  const handleStartTrial = async () => {
    console.group('[PricingSection] 결제 시작');
    console.log('선택한 플랜:', selectedPlan);
    console.log('프로모션 코드:', promoCode);

    if (!isSignedIn) {
      alert('로그인이 필요합니다.');
      router.push('/sign-in?redirect_url=/pricing');
      console.groupEnd();
      return;
    }

    setIsLoading(true);

    try {
      const result = await createCheckout({
        planType: selectedPlan,
        promoCode: promoCode || undefined,
      });

      if (!result.success) {
        alert(result.error || '결제 세션 생성에 실패했습니다.');
        console.error('❌ 결제 세션 생성 실패:', result.error);
        console.groupEnd();
        setIsLoading(false);
        return;
      }

      console.log('✅ 결제 세션 생성 성공');
      console.log('결제 URL:', result.checkoutUrl);
      console.groupEnd();

      // Mock 결제 페이지로 이동
      if (result.checkoutUrl) {
        router.push(result.checkoutUrl);
      }
    } catch (error) {
      console.error('❌ 결제 시작 오류:', error);
      alert('결제 시작 중 오류가 발생했습니다.');
      console.groupEnd();
      setIsLoading(false);
    }
  };

  return (
    <section className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* 플랜 토글 */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`px-6 py-2 rounded-md transition-colors ${
                selectedPlan === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              월간
            </button>
            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`px-6 py-2 rounded-md transition-colors relative ${
                selectedPlan === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              연간
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free 플랜 */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
            <p className="text-gray-600 mb-6">기본 기능 이용</p>

            <div className="mb-8">
              <span className="text-4xl font-bold text-gray-900">무료</span>
            </div>

            <button
              disabled
              className="w-full py-3 bg-gray-100 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
            >
              현재 플랜
            </button>

            <ul className="mt-8 space-y-4">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">레시피 검색 무제한</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">레시피 업로드 무제한</span>
              </li>
              <li className="flex items-start gap-3 opacity-50">
                <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-500">영상 시청 (광고 포함)</span>
              </li>
              <li className="flex items-start gap-3 opacity-50">
                <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-500">기본 AI 식단 추천</span>
              </li>
              <li className="flex items-start gap-3 opacity-50">
                <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-500">북마크 최대 10개</span>
              </li>
            </ul>
          </div>

          {/* Premium 플랜 */}
          <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl p-8 relative shadow-xl">
            {currentPlan.badge && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-yellow-400 text-orange-900 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  {currentPlan.badge}
                </div>
              </div>
            )}

            <h3 className="text-2xl font-bold mb-2">{currentPlan.name}</h3>
            <p className="text-orange-100 mb-6">{currentPlan.description}</p>

            <div className="mb-2">
              <span className="text-5xl font-bold">{currentPlan.price.toLocaleString()}원</span>
              <span className="text-xl text-orange-100">/{currentPlan.period}</span>
            </div>

            {selectedPlan === 'yearly' && (
              <div className="mb-6">
                <p className="text-orange-100 line-through text-sm">
                  월 {plans.yearly.originalPrice?.toLocaleString()}원
                </p>
                <p className="text-sm text-orange-100">
                  연간 {plans.yearly.totalPrice?.toLocaleString()}원 일시불
                </p>
              </div>
            )}

            {/* 프로모션 코드 입력 */}
            <div className="mb-4">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="프로모션 코드 (선택)"
                className="w-full px-4 py-2 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <p className="text-xs text-orange-100 mt-1">
                LAUNCH2025 입력 시 30% 할인 적용
              </p>
            </div>

            <button
              onClick={handleStartTrial}
              disabled={isLoading}
              className="w-full py-3 bg-white text-orange-600 rounded-lg font-bold hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '처리 중...' : '14일 무료 체험 시작'}
            </button>

            <p className="text-xs text-orange-100 text-center mt-3">
              체험 기간 동안 언제든 취소 가능
            </p>

            <ul className="mt-8 space-y-4">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="font-semibold">Free 플랜의 모든 기능</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>광고 없는 HD 영상 시청</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>가족 맞춤 AI 식단 추천</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>북마크 무제한</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>전체 식단 히스토리</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>주간 식단 PDF 다운로드</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>월간 영양 리포트</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>우선 고객 지원</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
























