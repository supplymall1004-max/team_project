/**
 * @file settings/billing-card.tsx
 * @description 설정 메인 페이지용 결제 관리 카드 컴포넌트
 *
 * 주요 기능:
 * 1. 현재 구독 상태 요약 표시
 * 2. 빠른 액션 링크 제공
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentSubscription, type GetSubscriptionResponse } from "@/actions/payments/get-subscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Sparkles, 
  AlertCircle,
  ArrowRight,
  CheckCircle
} from "lucide-react";

export function BillingCard() {
  const [data, setData] = useState<GetSubscriptionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    console.group('[BillingCard] 구독 정보 로드');
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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-gray-400" />
            <CardTitle>결제 및 구독</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-gray-600">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  // 데이터가 없거나 Free 사용자
  if (!data || !data.isPremium) {
    return (
      <Link href="/settings/billing">
        <Card className="transition-all hover:shadow-md cursor-pointer">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="mb-1">결제 및 구독</CardTitle>
                  <CardDescription>
                    구독 관리, 결제 내역, 프로모션 코드 등록
                  </CardDescription>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">무료 플랜</p>
                <p className="text-sm text-gray-600">프리미엄으로 업그레이드하세요</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Premium 사용자
  const subscription = data.subscription;
  const isPendingCancel = subscription?.cancelledAt && subscription?.status === 'active';
  const isCancelled = subscription?.status === 'cancelled';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Link href="/settings/billing">
      <Card className="transition-all hover:shadow-md cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <CardTitle className="mb-1">결제 및 구독</CardTitle>
                <CardDescription>
                  구독 관리, 결제 내역, 프로모션 코드 등록
                </CardDescription>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 구독 상태 */}
          {subscription ? (
            <>
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                <Sparkles className="h-5 w-5 text-orange-500" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {subscription.planType === 'monthly' ? '월간' : '연간'} 프리미엄
                  </p>
                  <p className="text-sm text-gray-600">
                    월 {subscription.pricePerMonth.toLocaleString()}원
                  </p>
                </div>
                {isPendingCancel ? (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                ) : isCancelled ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>

              {/* 구독 정보 */}
              <div className="space-y-2 text-sm">
                {isPendingCancel ? (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      {formatDate(subscription.cancelledAt!)}에 구독이 종료됩니다
                    </span>
                  </div>
                ) : isCancelled ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>구독이 만료되었습니다</span>
                  </div>
                ) : subscription.nextBillingDate ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>다음 결제일: {formatDate(subscription.nextBillingDate)}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>종료일: {formatDate(subscription.currentPeriodEnd)}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">무료 플랜</p>
                <p className="text-sm text-gray-600">프리미엄으로 업그레이드하세요</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

