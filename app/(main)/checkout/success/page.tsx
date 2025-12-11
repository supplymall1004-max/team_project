"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, Tag } from 'lucide-react';
import Link from 'next/link';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { getCurrentSubscription } from '@/actions/payments/get-subscription';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId');
  const promoCodeId = searchParams?.get('promoCodeId');
  const supabase = useClerkSupabaseClient();
  const [promoCodeInfo, setPromoCodeInfo] = useState<{
    code: string;
    discount_type: string;
    discount_value: number;
    description: string | null;
  } | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    expires_at: string;
    plan_type: string;
  } | null>(null);

  useEffect(() => {
    const fetchPromoCodeInfo = async () => {
      if (!promoCodeId) return;

      try {
        const { data, error } = await supabase
          .from('promo_codes')
          .select('code, discount_type, discount_value, description')
          .eq('id', promoCodeId)
          .single();

        if (!error && data) {
          setPromoCodeInfo(data);
        }
      } catch (error) {
        console.error('프로모션 코드 정보 조회 실패:', error);
      }
    };

    const fetchSubscriptionInfo = async () => {
      try {
        const result = await getCurrentSubscription();
        
        if (result.success && result.subscription) {
          setSubscriptionInfo({
            expires_at: result.subscription.currentPeriodEnd,
            plan_type: result.subscription.planType,
          });
        } else if (result.premiumExpiresAt) {
          // 프리미엄 만료일이 있으면 사용
          setSubscriptionInfo({
            expires_at: result.premiumExpiresAt,
            plan_type: 'monthly', // 기본값
          });
        }
      } catch (error) {
        console.error('구독 정보 조회 실패:', error);
      }
    };

    fetchPromoCodeInfo();
    fetchSubscriptionInfo();
  }, [promoCodeId, supabase]);

  const formatDiscount = () => {
    if (!promoCodeInfo) return '';
    if (promoCodeInfo.discount_type === 'percentage') {
      return `${promoCodeInfo.discount_value}% 할인`;
    } else if (promoCodeInfo.discount_type === 'fixed_amount') {
      return `${promoCodeInfo.discount_value.toLocaleString()}원 할인`;
    } else if (promoCodeInfo.discount_type === 'free_trial') {
      return `${promoCodeInfo.discount_value}일 무료 체험`;
    }
    return '할인 적용됨';
  };

  const formatExpiresAt = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-xl p-12">
          {/* 성공 아이콘 */}
          <div className="mb-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          </div>

          {/* 메시지 */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            결제가 완료되었습니다!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            맛의 아카이브 프리미엄에 오신 것을 환영합니다.
            <br />
            {subscriptionInfo && (
              <>
                {subscriptionInfo.plan_type === 'monthly' ? '월간' : '연간'} 프리미엄이 {formatExpiresAt(subscriptionInfo.expires_at)}일까지 활성화되었습니다.
              </>
            )}
            {!subscriptionInfo && '14일 무료 체험이 시작되었습니다.'}
          </p>

          {/* 프로모션 코드 정보 */}
          {promoCodeInfo && (
            <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-5 w-5 text-blue-600" />
                <h2 className="font-bold text-gray-900">적용된 프로모션 코드</h2>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">코드:</span>
                  <span className="font-semibold text-gray-900">{promoCodeInfo.code}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">할인 혜택:</span>
                  <span className="font-semibold text-blue-600">{formatDiscount()}</span>
                </div>
                {promoCodeInfo.description && (
                  <p className="text-gray-600 mt-2">{promoCodeInfo.description}</p>
                )}
              </div>
            </div>
          )}

          {/* 혜택 안내 */}
          <div className="bg-orange-50 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-bold text-gray-900 mb-4">프리미엄 혜택</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                광고 없는 HD 영상 시청
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                가족 맞춤 건강 식단 추천
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                무제한 레시피 북마크
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                전체 식단 히스토리
              </li>
            </ul>
          </div>

          {/* CTA 버튼 */}
          <div className="space-y-3">
            <Link
              href="/diet"
              className="block w-full py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              건강 맞춤 식단 보러가기 <ArrowRight className="inline w-4 h-4 ml-1" />
            </Link>
            <Link
              href="/account/subscription"
              className="block w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              구독 관리
            </Link>
          </div>

          {/* 알림 */}
          <p className="text-sm text-gray-500 mt-6">
            영수증이 이메일로 발송되었습니다.
            <br />
            14일 무료 체험 기간 동안 언제든 취소할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
























