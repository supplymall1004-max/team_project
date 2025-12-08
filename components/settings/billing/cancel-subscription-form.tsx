/**
 * @file settings/billing/cancel-subscription-form.tsx
 * @description 구독 취소 폼 컴포넌트
 *
 * 주요 기능:
 * 1. 현재 구독 정보 표시
 * 2. 취소 옵션 선택 (즉시 취소 vs 기간 종료 시 취소)
 * 3. 취소 처리 및 결과 표시
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentSubscription } from "@/actions/payments/get-subscription";
import { cancelSubscription, reactivateSubscription } from "@/actions/payments/cancel-subscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Calendar, 
  XCircle,
  CheckCircle,
  Sparkles
} from "lucide-react";

export function CancelSubscriptionForm() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<'end' | 'immediate' | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    console.group('[CancelSubscriptionForm] 구독 정보 로드');
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

  const handleCancel = async () => {
    if (!data?.subscription || !selectedOption) return;

    console.group('[CancelSubscriptionForm] 구독 취소');
    console.log('선택된 옵션:', selectedOption);
    setIsCancelling(true);
    setResult(null);

    try {
      const cancelResult = await cancelSubscription({
        subscriptionId: data.subscription.id,
        immediate: selectedOption === 'immediate',
      });

      if (cancelResult.success) {
        setResult({
          success: true,
          message: cancelResult.message,
        });
        // 3초 후 결제 관리 페이지로 이동
        setTimeout(() => {
          router.push('/settings/billing');
        }, 3000);
      } else {
        setResult({
          success: false,
          error: cancelResult.error || '구독 취소에 실패했습니다.',
        });
      }
    } catch (error) {
      console.error('❌ 구독 취소 오류:', error);
      setResult({
        success: false,
        error: '구독 취소 중 오류가 발생했습니다.',
      });
    } finally {
      setIsCancelling(false);
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
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>오류</AlertTitle>
        <AlertDescription>
          구독 정보를 불러올 수 없습니다.
        </AlertDescription>
      </Alert>
    );
  }

  if (!data.isPremium || !data.subscription) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>활성 구독이 없습니다</AlertTitle>
        <AlertDescription>
          현재 활성화된 구독이 없습니다.
        </AlertDescription>
      </Alert>
    );
  }

  const subscription = data.subscription;
  const isPendingCancel = subscription.cancelledAt && subscription.status === 'active';

  // 이미 취소 예정인 경우
  if (isPendingCancel) {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>구독 취소 예정</CardTitle>
          <CardDescription>
            이미 구독 취소가 예정되어 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>취소 예정일</AlertTitle>
            <AlertDescription>
              {formatDate(subscription.cancelledAt!)}에 구독이 종료됩니다.
              <br />
              그 전까지는 프리미엄 혜택을 계속 이용하실 수 있습니다.
            </AlertDescription>
          </Alert>

          <Button
            onClick={async () => {
              setIsLoading(true);
              try {
                const reactivateResult = await reactivateSubscription(subscription.id);
                if (reactivateResult.success) {
                  router.push('/settings/billing');
                } else {
                  alert(reactivateResult.error || '구독 재활성화에 실패했습니다.');
                }
              } catch (error) {
                console.error('❌ 구독 재활성화 오류:', error);
                alert('구독 재활성화 중 오류가 발생했습니다.');
              } finally {
                setIsLoading(false);
              }
            }}
            className="w-full"
          >
            구독 재활성화하기
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* 현재 구독 정보 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-500" />
            <CardTitle>현재 구독 정보</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">플랜</span>
              <span className="font-semibold">
                {subscription.planType === 'monthly' ? '월간' : '연간'} 프리미엄
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">월 요금</span>
              <span className="font-semibold">
                {subscription.pricePerMonth.toLocaleString()}원
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">다음 결제일</span>
              <span className="font-semibold">
                {formatDate(subscription.currentPeriodEnd)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 취소 옵션 선택 */}
      {!result && (
        <Card>
          <CardHeader>
            <CardTitle>취소 옵션 선택</CardTitle>
            <CardDescription>
              구독 취소 방식을 선택해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              onClick={() => setSelectedOption('end')}
              disabled={isCancelling}
              className={`w-full p-4 border-2 rounded-lg text-left transition-colors disabled:opacity-50 ${
                selectedOption === 'end'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-300 hover:border-orange-300 hover:bg-orange-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-1">기간 종료 시 취소</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(subscription.currentPeriodEnd)}까지 프리미엄 혜택을 유지하고,
                    그 이후에 구독이 종료됩니다.
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedOption('immediate')}
              disabled={isCancelling}
              className={`w-full p-4 border-2 rounded-lg text-left transition-colors disabled:opacity-50 ${
                selectedOption === 'immediate'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 hover:border-red-300 hover:bg-red-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-600 mb-1">즉시 취소</p>
                  <p className="text-sm text-gray-600">
                    프리미엄 혜택이 즉시 종료됩니다. 환불은 정책에 따라 처리됩니다.
                  </p>
                </div>
              </div>
            </button>

            <Button
              onClick={handleCancel}
              disabled={!selectedOption || isCancelling}
              variant="destructive"
              className="w-full"
            >
              {isCancelling ? '처리 중...' : '구독 취소하기'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 결과 표시 */}
      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          {result.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {result.success ? '구독 취소 완료' : '구독 취소 실패'}
          </AlertTitle>
          <AlertDescription>
            {result.message || result.error}
            {result.success && (
              <span className="block mt-2 text-sm">
                3초 후 결제 관리 페이지로 이동합니다...
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

