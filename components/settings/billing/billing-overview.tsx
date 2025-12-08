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

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentSubscription, type GetSubscriptionResponse } from "@/actions/payments/get-subscription";
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
  Tag
} from "lucide-react";
import { TestModeBanner } from "@/components/pricing/test-mode-banner";

export function BillingOverview() {
  const [data, setData] = useState<GetSubscriptionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
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
  };

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
      <>
        <TestModeBanner />
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 text-center">
            <Sparkles className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              프리미엄으로 업그레이드하세요
            </h2>
            <p className="text-gray-700 mb-6">
              광고 없는 영상, 가족 맞춤 AI 식단, 무제한 북마크와 더 많은 혜택을 누리세요.
            </p>
            <Link href="/pricing">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
                14일 무료 체험 시작하기
              </Button>
            </Link>
          </div>

          {/* 프로모션 코드 등록 카드 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-orange-500" />
                <CardTitle>프로모션 코드</CardTitle>
              </div>
              <CardDescription>
                프로모션 코드를 등록하여 할인 혜택을 받으세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings/billing/promo">
                <Button variant="outline" className="w-full">
                  프로모션 코드 등록하기
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Premium 사용자 화면
  const subscription = data.subscription;
  
  // subscription이 없는 경우 (개발 모드 등)
  if (!subscription) {
    return (
      <>
        <TestModeBanner />
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 text-center">
            <Sparkles className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              프리미엄으로 업그레이드하세요
            </h2>
            <p className="text-gray-700 mb-6">
              광고 없는 영상, 가족 맞춤 AI 식단, 무제한 북마크와 더 많은 혜택을 누리세요.
            </p>
            <Link href="/pricing">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
                14일 무료 체험 시작하기
              </Button>
            </Link>
          </div>

          {/* 프로모션 코드 등록 카드 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-orange-500" />
                <CardTitle>프로모션 코드</CardTitle>
              </div>
              <CardDescription>
                프로모션 코드를 등록하여 할인 혜택을 받으세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings/billing/promo">
                <Button variant="outline" className="w-full">
                  프로모션 코드 등록하기
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const isPendingCancel = subscription.cancelledAt && subscription.status === 'active';
  const isCancelled = subscription.status === 'cancelled';
  
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
      <TestModeBanner />

      <div className="space-y-6">
        {/* 현재 플랜 정보 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-500" />
                <CardTitle>현재 플랜</CardTitle>
              </div>
              {subscription.isTestMode && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                  테스트 모드
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  <span className="text-2xl font-bold text-gray-900">
                    {subscription.planType === 'monthly' ? '월간' : '연간'} 프리미엄
                  </span>
                </div>
                <p className="text-gray-600">
                  월 {subscription.pricePerMonth.toLocaleString()}원
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <span className="font-semibold text-gray-900">결제 수단</span>
                </div>
                <p className="text-gray-600">{subscription.paymentMethod}</p>
              </div>
            </div>

            {/* 취소 예정 알림 */}
            {isPendingCancel && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-orange-900">구독 취소 예정</p>
                  <p className="text-sm text-orange-700">
                    {formatDate(subscription.cancelledAt!)}에 구독이 종료됩니다.
                    <br />
                    그 전까지는 프리미엄 혜택을 계속 이용하실 수 있습니다.
                  </p>
                </div>
              </div>
            )}

            {/* 만료됨 알림 */}
            {isCancelled && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">구독이 만료되었습니다</p>
                  <p className="text-sm text-red-700 mb-2">
                    프리미엄 혜택이 비활성화되었습니다.
                  </p>
                  <Link href="/pricing">
                    <Button variant="outline" size="sm">
                      다시 구독하기
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 구독 기간 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <CardTitle>구독 기간</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-700">시작일</span>
                <span className="font-semibold text-gray-900">
                  {formatDate(subscription.currentPeriodStart)}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-700">종료일</span>
                <span className="font-semibold text-gray-900">
                  {formatDate(subscription.currentPeriodEnd)}
                </span>
              </div>

              {subscription.nextBillingDate && !isPendingCancel && (
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">다음 결제일</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    {formatDate(subscription.nextBillingDate)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 프리미엄 혜택 */}
        <Card>
          <CardHeader>
            <CardTitle>프리미엄 혜택</CardTitle>
            <CardDescription>현재 이용 중인 프리미엄 기능들</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid md:grid-cols-2 gap-3">
              {[
                '광고 없는 HD 영상',
                '가족 맞춤 AI 식단',
                '무제한 북마크',
                '전체 식단 히스토리',
                '주간 식단 다운로드',
                '월간 영양 리포트',
              ].map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-700">
                  <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 액션 카드들 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* 결제 내역 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-gray-400" />
                <CardTitle>결제 내역</CardTitle>
              </div>
              <CardDescription>
                과거 결제 내역을 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings/billing/history">
                <Button variant="outline" className="w-full">
                  결제 내역 보기
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 프로모션 코드 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-orange-500" />
                <CardTitle>프로모션 코드</CardTitle>
              </div>
              <CardDescription>
                프로모션 코드를 등록하여 할인 혜택을 받으세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings/billing/promo">
                <Button variant="outline" className="w-full">
                  프로모션 코드 등록하기
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* 구독 취소 */}
        {!isCancelled && !isPendingCancel && (
          <Card>
            <CardHeader>
              <CardTitle>구독 취소</CardTitle>
              <CardDescription>
                프리미엄 구독을 취소하시겠습니까? 언제든 다시 구독하실 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings/billing/cancel">
                <Button variant="destructive" className="w-full">
                  구독 취소하기
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

