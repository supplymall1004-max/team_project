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

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    if (!code.trim()) {
      setError("프로모션 코드를 입력해주세요.");
      return;
    }

    console.group('[PromoCodeForm] 프로모션 코드 검증');
    setIsValidating(true);
    setError(null);
    setValidationResult(null);

    try {
      // 클라이언트에서 사용자 ID 가져오기 (임시로 서버 액션 사용)
      // 실제로는 서버 액션을 통해 검증해야 함
      const response = await fetch('/api/payments/validate-promo-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
        }),
      });

      const result = await response.json();

      if (result.success && result.valid) {
        setValidationResult(result);
        console.log('✅ 코드 검증 성공:', result);
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
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>유효한 프로모션 코드입니다!</AlertTitle>
              <AlertDescription className="space-y-2">
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

      {/* 안내 정보 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            <CardTitle>프로모션 코드 사용 안내</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
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
          </ul>
        </CardContent>
      </Card>

      {/* 결제 페이지로 이동 */}
      {validationResult && validationResult.valid && (
        <div className="flex justify-end">
          <Button
            onClick={() => router.push('/pricing')}
            size="lg"
            className="bg-orange-500 hover:bg-orange-600"
          >
            결제 페이지로 이동하여 코드 적용하기
          </Button>
        </div>
      )}
    </div>
  );
}

