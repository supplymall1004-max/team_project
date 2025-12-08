/**
 * @file settings/billing/promo-code-form.tsx
 * @description 프로모션 코드 등록 폼 컴포넌트
 *
 * 주요 기능:
 * 1. 프로모션 코드 입력
 * 2. 코드 검증 (유효성, 할인 정보 확인)
 * 3. 코드 저장 및 적용 안내
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Tag, 
  CheckCircle, 
  AlertCircle,
  Info,
  Sparkles
} from "lucide-react";

export function PromoCodeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // URL 파라미터에서 프로모션 코드 읽어오기
  useEffect(() => {
    const codeFromUrl = searchParams?.get('code');
    if (codeFromUrl) {
      console.log('[PromoCodeForm] URL에서 프로모션 코드 발견:', codeFromUrl);
      const decodedCode = decodeURIComponent(codeFromUrl).toUpperCase().trim();
      setCode(decodedCode);
      // 약간의 지연 후 자동 검증 (컴포넌트 마운트 후)
      const timer = setTimeout(() => {
        handleValidateWithCode(decodedCode);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // 코드를 인자로 받는 검증 함수 (URL 파라미터에서 자동 호출용)
  const handleValidateWithCode = async (codeToValidate: string) => {
    if (!codeToValidate.trim()) {
      setError("프로모션 코드를 입력해주세요.");
      return;
    }

    console.group('[PromoCodeForm] 프로모션 코드 검증 (자동)');
    setIsValidating(true);
    setError(null);
    setValidationResult(null);

    try {
      const response = await fetch('/api/payments/validate-promo-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: codeToValidate.toUpperCase().trim(),
        }),
      });

      const result = await response.json();

      if (result.success && result.valid) {
        setValidationResult(result);
        console.log('✅ 코드 검증 성공:', result);
        
        // 무료 체험 쿠폰인 경우 자동으로 프리미엄 활성화
        if (result.discountType === 'free_trial' && result.promoCodeId && result.freeTrialDays) {
          console.log('🎁 무료 체험 쿠폰 감지, 프리미엄 자동 활성화 시도');
          try {
            const activateResponse = await fetch('/api/payments/activate-premium-from-promo', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                promoCodeId: result.promoCodeId,
                freeTrialDays: result.freeTrialDays,
              }),
            });

            const activateResult = await activateResponse.json();
            
            if (activateResult.success) {
              console.log('✅ 프리미엄 활성화 성공:', activateResult);
              
              // 만료일 포맷팅
              let expiresMessage = '';
              if (activateResult.expiresAt) {
                const expiresDate = new Date(activateResult.expiresAt);
                const formattedDate = `${expiresDate.getFullYear()}-${String(expiresDate.getMonth() + 1).padStart(2, '0')}-${String(expiresDate.getDate()).padStart(2, '0')}`;
                
                // 1일권인지 확인
                if (result.freeTrialDays === 1) {
                  expiresMessage = `1일권이 등록되었습니다 ~ ${formattedDate}일까지`;
                } else {
                  expiresMessage = `${result.freeTrialDays}일 무료 체험이 등록되었습니다 ~ ${formattedDate}일까지`;
                }
              }
              
              // 성공 메시지 표시
              setValidationResult({
                ...result,
                successMessage: expiresMessage || activateResult.message || '프리미엄이 활성화되었습니다.',
              });
              
              window.dispatchEvent(new CustomEvent('premium-activated'));
              setTimeout(() => {
                window.location.reload();
              }, 3000); // 메시지를 볼 수 있도록 시간 연장
            } else {
              console.error('❌ 프리미엄 활성화 실패:', activateResult.error);
              setError(activateResult.error || '프리미엄 활성화에 실패했습니다.');
            }
          } catch (activateError) {
            console.error('❌ 프리미엄 활성화 오류:', activateError);
            setError('프리미엄 활성화 중 오류가 발생했습니다.');
          }
        }
      } else {
        setError(result.error || '유효하지 않은 프로모션 코드입니다.');
        console.log('❌ 코드 검증 실패:', result.error);
      }
    } catch (error) {
      console.error('❌ 코드 검증 오류:', error);
      setError('프로모션 코드 검증 중 오류가 발생했습니다.');
    } finally {
      setIsValidating(false);
      console.groupEnd();
    }
  };

  const handleValidate = async () => {
    if (!code.trim()) {
      setError("프로모션 코드를 입력해주세요.");
      return;
    }

    await handleValidateWithCode(code);
  };

  const formatDiscount = (result: any) => {
    if (result.discountType === 'percentage') {
      return `${result.discountValue}% 할인`;
    } else if (result.discountType === 'fixed_amount') {
      return `${result.discountValue.toLocaleString()}원 할인`;
    } else if (result.discountType === 'free_trial') {
      return `${result.freeTrialDays}일 무료 체험`;
    }
    return '할인';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-orange-500" />
            <CardTitle>프로모션 코드 입력</CardTitle>
          </div>
          <CardDescription>
            프로모션 코드를 입력하고 검증하여 할인 혜택을 확인하세요.
            코드는 결제 페이지에서 적용할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="promo-code">프로모션 코드</Label>
            <div className="flex gap-2">
              <Input
                id="promo-code"
                type="text"
                placeholder="예: LAUNCH2025"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                  setValidationResult(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleValidate();
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={handleValidate}
                disabled={isValidating || !code.trim()}
              >
                {isValidating ? '검증 중...' : '검증하기'}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>오류</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {validationResult && validationResult.valid && (
            <Alert className={validationResult.discountType === 'free_trial' ? 'bg-green-50 border-green-200' : ''}>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>유효한 프로모션 코드입니다!</AlertTitle>
              <AlertDescription className="space-y-2">
                {validationResult.successMessage && (
                  <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-3">
                    <p className="font-semibold text-green-800 text-lg">
                      {validationResult.successMessage}
                    </p>
                  </div>
                )}
                <div>
                  <p className="font-semibold mb-1">할인 혜택:</p>
                  <p className="text-lg text-orange-600">
                    {formatDiscount(validationResult)}
                  </p>
                </div>
                {validationResult.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    {validationResult.description}
                  </p>
                )}
                {validationResult.applicablePlans && validationResult.applicablePlans.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    적용 가능 플랜: {validationResult.applicablePlans.map((p: string) => 
                      p === 'monthly' ? '월간' : '연간'
                    ).join(', ')}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 쿠폰 사용 규칙 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            <CardTitle>쿠폰 사용 규칙</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">⚠️ 중요 안내</h3>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li className="flex items-start gap-2">
                  <span className="font-semibold">•</span>
                  <span>사용 횟수가 마감된 쿠폰은 삭제 후 다시 사용할 수 없습니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">•</span>
                  <span>결제 또는 쿠폰의 사용 기간이 끝난 후에 코드를 등록할 수 있습니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">•</span>
                  <span>이미 사용한 쿠폰은 재사용할 수 없습니다.</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">일반 사용 규칙</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>프로모션 코드는 결제 페이지에서 적용할 수 있습니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>각 코드는 사용 기간과 사용 횟수 제한이 있을 수 있습니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>일부 코드는 특정 플랜(월간/연간)에만 적용될 수 있습니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>신규 사용자 전용 코드는 기존 구독자에게 적용되지 않을 수 있습니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>쿠폰은 중복 사용이 불가능하며, 한 계정당 하나의 쿠폰만 사용할 수 있습니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>쿠폰 사용 후 취소하거나 환불해도 쿠폰은 복구되지 않습니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>무료 체험 쿠폰은 등록 즉시 활성화되며, 기간 내 취소 시 자동으로 만료됩니다.</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 결제 페이지로 이동 (무료 체험 쿠폰이 아닌 경우에만) */}
      {validationResult && validationResult.valid && validationResult.discountType !== 'free_trial' && (
        <div className="flex justify-end">
          <Button
            onClick={() => {
              // 프로모션 코드를 URL 파라미터로 전달하여 결제 페이지로 이동
              const promoCodeParam = encodeURIComponent(code.toUpperCase().trim());
              router.push(`/pricing?promoCode=${promoCodeParam}`);
            }}
            size="lg"
            className="bg-orange-500 hover:bg-orange-600"
          >
            결제 페이지로 이동하여 코드 적용하기
          </Button>
        </div>
      )}
      
      {/* 무료 체험 쿠폰인 경우 홈으로 이동 */}
      {validationResult && validationResult.valid && validationResult.discountType === 'free_trial' && (
        <div className="flex justify-end">
          <Button
            onClick={() => {
              router.push('/');
              router.refresh(); // 프리미엄 상태 새로고침
            }}
            size="lg"
            className="bg-green-500 hover:bg-green-600"
          >
            홈으로 이동하여 프리미엄 기능 확인하기
          </Button>
        </div>
      )}
    </div>
  );
}

