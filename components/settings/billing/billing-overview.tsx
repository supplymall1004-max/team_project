/**
 * @file settings/billing/billing-overview.tsx
 * @description 결제 및 구독 개요 컴포넌트
 *
 * 주요 기능:
 * 1. 현재 구독 정보 표시
 * 2. 결제 내역 링크
 * 3. 구독 취소 및 프로모션 코드 등록 링크
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getCurrentSubscription, type GetSubscriptionResponse } from "@/actions/payments/get-subscription";
import type { SubscriptionInfo } from "@/actions/payments/get-subscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Calendar, 
  Sparkles, 
  AlertCircle, 
  Check, 
  ArrowRight,
  Receipt,
  Tag,
  Diamond
} from "lucide-react";
import { Input } from "@/components/ui/input";

export function BillingOverview() {
  const [data, setData] = useState<GetSubscriptionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [promoCodeInput, setPromoCodeInput] = useState('');

  const loadSubscription = useCallback(async () => {
    console.group('[BillingOverview] 구독 정보 로드');
    setIsLoading(true);

    try {
      const result = await getCurrentSubscription();
      console.log('구독 정보:', result);
      setData(result);
    } catch (error) {
      console.error('❌ 구독 정보 로드 실패:', error);
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  }, []);

  useEffect(() => {
    loadSubscription();
    
    // 프리미엄 활성화 이벤트 리스너 추가
    const handlePremiumActivated = () => {
      console.log('[BillingOverview] 프리미엄 활성화 이벤트 수신, 구독 정보 다시 로드');
      setTimeout(() => {
        loadSubscription();
      }, 500); // 약간의 지연 후 로드 (DB 업데이트 반영 시간 확보)
    };
    
    window.addEventListener('premium-activated', handlePremiumActivated);
    
    return () => {
      window.removeEventListener('premium-activated', handlePremiumActivated);
    };
  }, [loadSubscription]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600 mb-4">결제 정보를 불러올 수 없습니다.</p>
        <button
          onClick={loadSubscription}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // Free 사용자 화면
  if (!data.isPremium) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 text-center">
          <Sparkles className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            프리미엄으로 업그레이드하세요
          </h2>
          <p className="text-gray-700 mb-6">
            광고 없는 영상, 가족 맞춤 건강 식단, 무제한 북마크와 더 많은 혜택을 누리세요.
          </p>
          <Link href="/pricing">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
              14일 무료 체험 시작하기
            </Button>
          </Link>
        </div>

        {/* 쿠폰 등록 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Diamond className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-xl">쿠폰 등록</CardTitle>
            </div>
            <CardDescription>
              프로모션 코드를 입력하여 할인을 받으세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="쿠폰 코드를 입력하세요"
                className="flex-1"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && promoCodeInput.trim()) {
                    const code = encodeURIComponent(promoCodeInput.trim());
                    window.location.href = `/settings/billing/promo?code=${code}`;
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (promoCodeInput.trim()) {
                    const code = encodeURIComponent(promoCodeInput.trim());
                    window.location.href = `/settings/billing/promo?code=${code}`;
                  } else {
                    window.location.href = '/settings/billing/promo';
                  }
                }}
                className="bg-orange-500 hover:bg-orange-600"
              >
                확인
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Premium 사용자 화면
  const subscription = data.subscription;
  
  // subscription이 없는 경우 프리미엄 사용자용 기본 구독 정보 생성
  const defaultSubscription: SubscriptionInfo | null = subscription || (data.isPremium && data.premiumExpiresAt ? {
    id: 'promo-premium',
    status: 'active' as const,
    planType: 'monthly' as const,
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: data.premiumExpiresAt,
    pricePerMonth: 0,
    totalPaid: 0,
    nextBillingDate: null,
    paymentMethod: '프로모션 코드',
    lastFourDigits: '',
    cancelledAt: null,
    isTestMode: true,
  } : null);
  
  // subscription이 없고 프리미엄도 아닌 경우에만 업그레이드 화면 표시
  if (!subscription && !data.isPremium) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 text-center">
          <Sparkles className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            프리미엄으로 업그레이드하세요
          </h2>
          <p className="text-gray-700 mb-6">
            광고 없는 영상, 가족 맞춤 건강 식단, 무제한 북마크와 더 많은 혜택을 누리세요.
          </p>
          <Link href="/pricing">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
              14일 무료 체험 시작하기
            </Button>
          </Link>
        </div>

        {/* 쿠폰 등록 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Diamond className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-xl">쿠폰 등록</CardTitle>
            </div>
            <CardDescription>
              프로모션 코드를 입력하여 할인을 받으세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="쿠폰 코드를 입력하세요"
                className="flex-1"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && promoCodeInput.trim()) {
                    const code = encodeURIComponent(promoCodeInput.trim());
                    window.location.href = `/settings/billing/promo?code=${code}`;
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (promoCodeInput.trim()) {
                    const code = encodeURIComponent(promoCodeInput.trim());
                    window.location.href = `/settings/billing/promo?code=${code}`;
                  } else {
                    window.location.href = '/settings/billing/promo';
                  }
                }}
                className="bg-orange-500 hover:bg-orange-600"
              >
                확인
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // 프리미엄이지만 subscription이 없는 경우 (프로모션 코드로 활성화된 경우)
  if (!defaultSubscription) {
    return (
      <div className="space-y-6">
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-xl">프리미엄 구독 정보를 불러올 수 없습니다</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              구독 정보를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.
            </p>
            <Button onClick={() => window.location.reload()}>
              새로고침
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPendingCancel = defaultSubscription.cancelledAt && defaultSubscription.status === 'active';
  const isCancelled = defaultSubscription.status === 'cancelled';
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      <div className="space-y-6">
        {/* 현재 플랜 정보 */}
        <Card className="relative bg-gray-50">
          {defaultSubscription.isTestMode && (
            <span className="absolute top-4 right-4 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
              테스트 모드
            </span>
          )}
          <CardHeader>
            <CardTitle className="text-xl">현재 플랜</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  <span className="text-xl font-bold text-gray-900">
                    {defaultSubscription.planType === 'monthly' ? '월간' : '연간'} 프리미엄
                  </span>
                </div>
                <p className="text-gray-600">
                  월 {defaultSubscription.pricePerMonth === 0 ? '0원' : `${defaultSubscription.pricePerMonth.toLocaleString()}원`}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <span className="font-semibold text-gray-900">결제 수단</span>
                </div>
                <p className="text-gray-600">
                  {defaultSubscription.paymentMethod || '등록되지 않음'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 구독 기간 */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-xl">구독 기간</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">시작일</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {formatDate(defaultSubscription.currentPeriodStart)}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">종료일</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {formatDate(defaultSubscription.currentPeriodEnd)}
                </span>
              </div>

              {defaultSubscription.nextBillingDate && !isPendingCancel && (
                <div className="flex items-center justify-between py-3 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">다음 결제일</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    {formatDate(defaultSubscription.nextBillingDate)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 쿠폰 등록 */}
        <Card className="bg-gray-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Diamond className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-xl">쿠폰 등록</CardTitle>
            </div>
            <CardDescription>
              프로모션 코드를 입력하여 할인을 받으세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="쿠폰 코드를 입력하세요"
                className="flex-1"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && promoCodeInput.trim()) {
                    const code = encodeURIComponent(promoCodeInput.trim());
                    window.location.href = `/settings/billing/promo?code=${code}`;
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (promoCodeInput.trim()) {
                    const code = encodeURIComponent(promoCodeInput.trim());
                    window.location.href = `/settings/billing/promo?code=${code}`;
                  } else {
                    window.location.href = '/settings/billing/promo';
                  }
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                확인
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 구독 취소 */}
        {!isCancelled && !isPendingCancel && (
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-xl">구독 취소</CardTitle>
              <CardDescription>
                프리미엄 구독을 취소하시겠습니까? 언제든 다시 구독하실 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings/billing/cancel">
                <Button variant="destructive" className="w-full">
                  구독 취소
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

