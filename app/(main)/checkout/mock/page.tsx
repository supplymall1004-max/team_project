'use client';

/**
 * @file app/(main)/checkout/mock/page.tsx
 * @description Mock 결제 위젯 페이지 (토스페이먼츠 시뮬레이션)
 */

import { useEffect, useState, Suspense, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, Smartphone, Check, Tag } from 'lucide-react';
import { confirmPayment } from '@/actions/payments/confirm-payment';

function MockCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'kakaopay' | 'naverpay'>('card');
  
  // 프로모션 코드 관련 상태
  const [promoCode, setPromoCode] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    id: string;
    discountType: string;
    discountValue: number;
    description?: string;
  } | null>(null);
  
  // 자동 검증을 위한 debounce 타이머 (ref로 관리하여 무한 루프 방지)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // URL 파라미터에서 주문 정보 추출
  const orderId = searchParams?.get('orderId') || '';
  const baseAmount = parseInt(searchParams?.get('amount') || '0');
  const planType = (searchParams?.get('planType') || 'monthly') as 'monthly' | 'yearly';
  const userId = searchParams?.get('userId') || '';
  const initialPromoCodeId = searchParams?.get('promoCodeId') || undefined;
  const initialPromoCode = searchParams?.get('promoCode') || undefined; // URL 파라미터에서 프로모션 코드 가져오기
  
  // 최종 결제 금액 계산
  const [finalAmount, setFinalAmount] = useState(baseAmount);

  // baseAmount가 변경되면 finalAmount도 업데이트
  useEffect(() => {
    if (!appliedPromo) {
      setFinalAmount(baseAmount);
    }
  }, [baseAmount, appliedPromo]);

  // URL 파라미터에서 프로모션 코드가 있으면 입력란에 채우고 자동으로 적용
  useEffect(() => {
    if (initialPromoCode && !promoCode) {
      console.log('[MockCheckout] URL 파라미터에서 프로모션 코드 발견:', initialPromoCode);
      setPromoCode(initialPromoCode.toUpperCase().trim());
      // 약간의 지연 후 검증 (컴포넌트 마운트 후)
      const timer = setTimeout(() => {
        validatePromoCode(initialPromoCode.toUpperCase().trim());
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialPromoCode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    console.group('[MockCheckout] 페이지 로드');
    console.log('주문 ID:', orderId);
    console.log('기본 금액:', baseAmount);
    console.log('최종 금액:', finalAmount);
    console.log('플랜:', planType);
    console.log('사용자 ID:', userId);
    console.log('프로모션 코드 ID:', initialPromoCodeId);
    console.log('프로모션 코드:', initialPromoCode);
    console.groupEnd();
  }, [orderId, baseAmount, finalAmount, planType, userId, initialPromoCodeId, initialPromoCode]);

  // 프로모션 코드 검증 함수 (useCallback으로 감싸서 의존성 관리)
  const validatePromoCode = useCallback(async (code: string) => {
    if (!code.trim()) {
      setPromoError(null);
      setAppliedPromo(null);
      setFinalAmount(baseAmount);
      return;
    }

    console.group('[MockCheckout] 프로모션 코드 검증');
    setIsValidatingPromo(true);
    setPromoError(null);

    try {
      // 타임아웃 설정 (30초)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('/api/payments/validate-promo-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: '서버 오류가 발생했습니다.' };
        }
        setPromoError(errorData.error || `서버 오류 (${response.status})`);
        console.log('❌ API 응답 오류:', response.status, errorData);
        setAppliedPromo(null);
        setFinalAmount(baseAmount);
        return;
      }

      const result = await response.json();
      console.log('API 응답:', result);

      if (result.success && result.valid) {
        // 플랜 타입 체크
        if (result.applicablePlans && result.applicablePlans.length > 0) {
          if (!result.applicablePlans.includes(planType)) {
            setPromoError('이 플랜에는 적용할 수 없는 프로모션 코드입니다.');
            console.log('❌ 플랜 타입 불일치');
            setAppliedPromo(null);
            setFinalAmount(baseAmount);
            return;
          }
        }

        // 할인 금액 계산
        let discountAmount = 0;
        let newFinalAmount = baseAmount;

        if (result.discountType === 'percentage') {
          discountAmount = Math.floor(baseAmount * (result.discountValue / 100));
          newFinalAmount = baseAmount - discountAmount;
        } else if (result.discountType === 'fixed_amount') {
          discountAmount = result.discountValue;
          newFinalAmount = Math.max(0, baseAmount - discountAmount);
        } else if (result.discountType === 'free_trial') {
          newFinalAmount = 0; // 무료 체험
        }

        // 프로모션 코드 정보 저장
        setAppliedPromo({
          code: code.toUpperCase().trim(),
          id: result.promoCodeId || '',
          discountType: result.discountType,
          discountValue: result.discountValue,
          description: result.description || '',
        });

        setFinalAmount(newFinalAmount);
        console.log('✅ 프로모션 코드 적용 성공');
        console.log('할인 금액:', discountAmount);
        console.log('최종 금액:', newFinalAmount);
      } else {
        setPromoError(result.error || '유효하지 않은 프로모션 코드입니다.');
        console.log('❌ 프로모션 코드 검증 실패:', result.error);
        setAppliedPromo(null);
        setFinalAmount(baseAmount);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('❌ 요청 타임아웃');
        setPromoError('요청 시간이 초과되었습니다. 다시 시도해주세요.');
      } else {
        console.error('❌ 프로모션 코드 검증 오류:', error);
        setPromoError(error.message || '프로모션 코드 검증 중 오류가 발생했습니다.');
      }
      setAppliedPromo(null);
      setFinalAmount(baseAmount);
    } finally {
      setIsValidatingPromo(false);
      console.groupEnd();
    }
  }, [baseAmount, planType]);

  // 프로모션 코드 적용 핸들러 (수동 적용 버튼용)
  const handleApplyPromoCode = () => {
    validatePromoCode(promoCode);
  };

  // 입력 시 자동 검증 (debounce)
  useEffect(() => {
    // 이전 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 빈 입력이면 즉시 초기화
    if (!promoCode.trim()) {
      setPromoError(null);
      setAppliedPromo(null);
      setFinalAmount(baseAmount);
      return;
    }

    // 1초 후 자동 검증 (사용자가 입력을 멈춘 후)
    const timer = setTimeout(() => {
      validatePromoCode(promoCode);
    }, 1000);

    debounceTimerRef.current = timer;

    // cleanup
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      debounceTimerRef.current = null;
    };
  }, [promoCode, baseAmount, planType, validatePromoCode]);

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
        amount: finalAmount,
        promoCodeId: appliedPromo?.id || initialPromoCodeId,
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

      // 성공 페이지로 이동 (프로모션 코드 ID 포함)
      const successUrl = appliedPromo?.id 
        ? `/checkout/success?orderId=${orderId}&promoCodeId=${appliedPromo.id}`
        : `/checkout/success?orderId=${orderId}`;
      router.push(successUrl);
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
            
            {/* 프로모션 코드 입력 */}
            <div className="mb-4 mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                프로모션 코드
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="쿠폰 코드 입력 (자동 검증)"
                  value={promoCode}
                  onChange={(e) => {
                    const newValue = e.target.value.toUpperCase();
                    setPromoCode(newValue);
                    // 입력 중에는 에러 메시지 숨김 (자동 검증 대기)
                    if (!newValue.trim()) {
                      setPromoError(null);
                      setAppliedPromo(null);
                      setFinalAmount(baseAmount);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      // Enter 키를 누르면 즉시 검증
                      if (debounceTimerRef.current) {
                        clearTimeout(debounceTimerRef.current);
                        debounceTimerRef.current = null;
                      }
                      handleApplyPromoCode();
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={isValidatingPromo || isProcessing}
                />
                <button
                  onClick={handleApplyPromoCode}
                  disabled={isValidatingPromo || isProcessing || !promoCode.trim()}
                  className="px-4 py-2 bg-orange-100 text-orange-600 rounded-lg font-medium hover:bg-orange-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Tag className="w-4 h-4" />
                  {isValidatingPromo ? '적용 중...' : '적용'}
                </button>
              </div>
              {promoError && (
                <p className="text-sm text-red-600 mt-1">{promoError}</p>
              )}
              {appliedPromo && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ 프로모션 코드가 적용되었습니다. {appliedPromo.description && `(${appliedPromo.description})`}
                </p>
              )}
            </div>

            {/* 결제 금액 표시 */}
            <div className="flex justify-between items-center text-lg font-bold mt-4">
              <span className="text-gray-900">최종 결제 금액</span>
              <span className="text-orange-600">
                {finalAmount.toLocaleString()}원
                {appliedPromo && baseAmount !== finalAmount && (
                  <span className="text-sm text-gray-500 line-through ml-2 font-normal">
                    {baseAmount.toLocaleString()}원
                  </span>
                )}
              </span>
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
            {isProcessing ? '결제 처리 중...' : `${finalAmount.toLocaleString()}원 결제하기`}
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
























