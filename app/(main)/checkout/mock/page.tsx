'use client';

/**
 * @file app/(main)/checkout/mock/page.tsx
 * @description Mock 결제 위젯 페이지 (토스페이먼츠 시뮬레이션)
 */

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, Smartphone, Check } from 'lucide-react';
import { confirmPayment } from '@/actions/payments/confirm-payment';

function MockCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'kakaopay' | 'naverpay'>('card');
  
  // URL 파라미터에서 주문 정보 추출
  const orderId = searchParams?.get('orderId') || '';
  const amount = parseInt(searchParams?.get('amount') || '0');
  const planType = (searchParams?.get('planType') || 'monthly') as 'monthly' | 'yearly';
  const userId = searchParams?.get('userId') || '';
  const promoCodeId = searchParams?.get('promoCodeId') || undefined;

  useEffect(() => {
    console.group('[MockCheckout] 페이지 로드');
    console.log('주문 ID:', orderId);
    console.log('금액:', amount);
    console.log('플랜:', planType);
    console.log('사용자 ID:', userId);
    console.log('프로모션 코드 ID:', promoCodeId);
    console.groupEnd();
  }, [orderId, amount, planType, userId, promoCodeId]);

  const handlePayment = async () => {
    console.group('[MockCheckout] 결제 승인 처리');
    setIsProcessing(true);

    try {
      // 시뮬레이션: 2초 지연
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const result = await confirmPayment({
        orderId,
        userId,
        planType,
        amount,
        promoCodeId,
      });

      if (!result.success) {
        console.error('❌ 결제 실패:', result.error);
        alert(result.error || '결제에 실패했습니다.');
        console.groupEnd();
        setIsProcessing(false);
        return;
      }

      console.log('✅ 결제 성공');
      console.log('구독 ID:', result.subscriptionId);
      console.groupEnd();

      // 성공 페이지로 이동
      router.push(`/checkout/success?orderId=${orderId}`);
    } catch (error) {
      console.error('❌ 결제 처리 오류:', error);
      alert('결제 처리 중 오류가 발생했습니다.');
      console.groupEnd();
      setIsProcessing(false);
    }
  };

  const planName = planType === 'monthly' ? '월간 프리미엄' : '연간 프리미엄';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 테스트 모드 배너 */}
        <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 mb-6">
          <p className="text-yellow-900 text-sm font-medium text-center">
            ⚠️ <strong>테스트 모드</strong>: 실제 카드 정보를 입력하지 마세요. 아래 버튼을 눌러 시뮬레이션을 진행합니다.
          </p>
        </div>

        {/* 결제 정보 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">결제하기</h1>

          <div className="border-b pb-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">상품명</span>
              <span className="font-semibold text-gray-900">맛의 아카이브 {planName}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">주문번호</span>
              <span className="text-sm text-gray-500 font-mono">{orderId}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold">
              <span className="text-gray-900">결제 금액</span>
              <span className="text-orange-600">{amount.toLocaleString()}원</span>
            </div>
          </div>

          {/* 결제 수단 선택 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">결제 수단</h2>
            
            <div className="space-y-3">
              <button
                onClick={() => setSelectedMethod('card')}
                className={`w-full p-4 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                  selectedMethod === 'card'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-6 h-6 text-gray-700" />
                <span className="font-medium text-gray-900">신용/체크카드</span>
                {selectedMethod === 'card' && (
                  <Check className="w-5 h-5 text-orange-500 ml-auto" />
                )}
              </button>

              <button
                onClick={() => setSelectedMethod('kakaopay')}
                className={`w-full p-4 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                  selectedMethod === 'kakaopay'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Smartphone className="w-6 h-6 text-gray-700" />
                <span className="font-medium text-gray-900">카카오페이</span>
                {selectedMethod === 'kakaopay' && (
                  <Check className="w-5 h-5 text-orange-500 ml-auto" />
                )}
              </button>

              <button
                onClick={() => setSelectedMethod('naverpay')}
                className={`w-full p-4 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                  selectedMethod === 'naverpay'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Smartphone className="w-6 h-6 text-gray-700" />
                <span className="font-medium text-gray-900">네이버페이</span>
                {selectedMethod === 'naverpay' && (
                  <Check className="w-5 h-5 text-orange-500 ml-auto" />
                )}
              </button>
            </div>
          </div>

          {/* Mock 카드 정보 입력 (시각적 요소만) */}
          {selectedMethod === 'card' && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카드 번호
                  </label>
                  <input
                    type="text"
                    placeholder="0000-0000-0000-0000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    disabled
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      유효기간
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVC
                    </label>
                    <input
                      type="text"
                      placeholder="000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      disabled
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                * 실제 카드 정보는 입력되지 않습니다 (시뮬레이션)
              </p>
            </div>
          )}

          {/* 약관 동의 */}
          <div className="mb-6 space-y-2">
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" defaultChecked disabled />
              <span className="text-sm text-gray-700">
                결제 대행 서비스 이용약관 동의 (필수)
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" defaultChecked disabled />
              <span className="text-sm text-gray-700">
                개인정보 제3자 제공 동의 (필수)
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" defaultChecked disabled />
              <span className="text-sm text-gray-700">
                자동 결제(정기결제) 동의 (필수)
              </span>
            </label>
          </div>

          {/* 결제 버튼 */}
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full py-4 bg-orange-500 text-white rounded-lg font-bold text-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? '결제 처리 중...' : `${amount.toLocaleString()}원 결제하기`}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            결제 완료 시 14일 무료 체험이 시작됩니다. 체험 기간 동안 언제든 취소 가능합니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MockCheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <MockCheckoutContent />
    </Suspense>
  );
}




















