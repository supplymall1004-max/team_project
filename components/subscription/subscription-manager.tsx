'use client';

/**
 * @file subscription-manager.tsx
 * @description 구독 정보 관리 컴포넌트
 */

import { useEffect, useState } from 'react';
import { getCurrentSubscription, type GetSubscriptionResponse } from '@/actions/payments/get-subscription';
import { cancelSubscription, reactivateSubscription } from '@/actions/payments/cancel-subscription';
import { CreditCard, Calendar, AlertCircle, Check, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { TestModeBanner } from '@/components/pricing/test-mode-banner';

export function SubscriptionManager() {
  const [data, setData] = useState<GetSubscriptionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    console.group('[SubscriptionManager] 구독 정보 로드');
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

  const handleCancel = async (immediate: boolean) => {
    if (!data?.subscription) return;

    console.group('[SubscriptionManager] 구독 취소');
    console.log('즉시 해지:', immediate);
    setIsCancelling(true);

    try {
      const result = await cancelSubscription({
        subscriptionId: data.subscription.id,
        immediate,
      });

      if (result.success) {
        alert(result.message);
        setShowCancelModal(false);
        await loadSubscription();
      } else {
        alert(result.error || '구독 취소에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 구독 취소 오류:', error);
      alert('구독 취소 중 오류가 발생했습니다.');
    } finally {
      setIsCancelling(false);
      console.groupEnd();
    }
  };

  const handleReactivate = async () => {
    if (!data?.subscription) return;

    console.group('[SubscriptionManager] 구독 재활성화');
    setIsLoading(true);

    try {
      const result = await reactivateSubscription(data.subscription.id);

      if (result.success) {
        alert(result.message);
        await loadSubscription();
      } else {
        alert(result.error || '구독 재활성화에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 구독 재활성화 오류:', error);
      alert('구독 재활성화 중 오류가 발생했습니다.');
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
        <p className="text-gray-600 mb-4">구독 정보를 불러올 수 없습니다.</p>
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
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 text-center">
          <Sparkles className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            프리미엄으로 업그레이드하세요
          </h2>
          <p className="text-gray-700 mb-6">
            광고 없는 영상, 가족 맞춤 건강 식단, 무제한 북마크와 더 많은 혜택을 누리세요.
          </p>
          <Link
            href="/pricing"
            className="inline-block px-8 py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors"
          >
            14일 무료 체험 시작하기
          </Link>
        </div>
      </>
    );
  }

  // Premium 사용자 화면
  const subscription = data.subscription!;
  const isPendingCancel = subscription.cancelledAt && subscription.status === 'active';
  const isCancelled = subscription.status === 'cancelled';

  const formatDate = (dateString: string) => {
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">현재 플랜</h2>
            {subscription.isTestMode && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                테스트 모드
              </span>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
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
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-900">구독 취소 예정</p>
                <p className="text-sm text-orange-700">
                  {formatDate(subscription.cancelledAt!)}에 구독이 종료됩니다.
                  <br />
                  그 전까지는 프리미엄 혜택을 계속 이용하실 수 있습니다.
                </p>
                <button
                  onClick={handleReactivate}
                  className="mt-2 text-sm text-orange-600 font-semibold hover:underline"
                >
                  구독 재활성화하기 →
                </button>
              </div>
            </div>
          )}

          {/* 만료됨 알림 */}
          {isCancelled && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">구독이 만료되었습니다</p>
                <p className="text-sm text-red-700">
                  프리미엄 혜택이 비활성화되었습니다.
                </p>
                <Link
                  href="/pricing"
                  className="mt-2 inline-block text-sm text-red-600 font-semibold hover:underline"
                >
                  다시 구독하기 →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 구독 기간 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">구독 기간</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">시작일</span>
              </div>
              <span className="font-semibold text-gray-900">
                {formatDate(subscription.currentPeriodStart)}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">종료일</span>
              </div>
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
        </div>

        {/* 프리미엄 혜택 */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">프리미엄 혜택</h2>
          <ul className="grid md:grid-cols-2 gap-3">
            {[
              '광고 없는 HD 영상',
              '가족 맞춤 건강 식단',
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
        </div>

        {/* 구독 취소 */}
        {!isCancelled && !isPendingCancel && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">구독 취소</h2>
            <p className="text-gray-600 mb-4">
              프리미엄 구독을 취소하시겠습니까? 언제든 다시 구독하실 수 있습니다.
            </p>
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              구독 취소
            </button>
          </div>
        )}

        {/* 취소 모달 */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                구독을 취소하시겠습니까?
              </h3>
              <p className="text-gray-600 mb-6">
                취소 방식을 선택해주세요.
              </p>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleCancel(false)}
                  disabled={isCancelling}
                  className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-left disabled:opacity-50"
                >
                  <p className="font-semibold text-gray-900 mb-1">기간 종료 시 취소</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(subscription.currentPeriodEnd)}까지 프리미엄 혜택 유지
                  </p>
                </button>

                <button
                  onClick={() => handleCancel(true)}
                  disabled={isCancelling}
                  className="w-full p-4 border-2 border-red-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors text-left disabled:opacity-50"
                >
                  <p className="font-semibold text-red-600 mb-1">즉시 취소</p>
                  <p className="text-sm text-gray-600">
                    프리미엄 혜택이 즉시 종료됩니다
                  </p>
                </button>
              </div>

              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                돌아가기
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}










