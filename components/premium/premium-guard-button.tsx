/**
 * @file premium-guard-button.tsx
 * @description 프리미엄 가드 버튼 컴포넌트
 * 
 * 프리미엄이 활성화되지 않은 경우 버튼을 비활성화하고
 * 클릭 시 프리미엄 결제 안내를 표시합니다.
 */

'use client';

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePremium } from '@/hooks/use-premium';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PremiumFeatureId, getPremiumFeature } from '@/lib/premium/features';

type ButtonProps = React.ComponentProps<typeof Button>;

interface PremiumGuardButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** 프리미엄 기능 ID */
  featureId?: PremiumFeatureId;
  /** 프리미엄 기능 이름 (featureId가 없을 경우 사용) */
  featureName?: string;
  /** 클릭 핸들러 (프리미엄 사용자만 실행) */
  onClick?: () => void;
  /** 프리미엄이 아닐 때 표시할 메시지 */
  premiumMessage?: string;
  /** 자식 요소 */
  children: ReactNode;
}

/**
 * 프리미엄 가드 버튼 컴포넌트
 * 
 * 프리미엄이 아닌 경우:
 * - 버튼이 회색으로 비활성화
 * - 클릭 시 프리미엄 결제 안내 다이얼로그 표시
 * 
 * @example
 * <PremiumGuardButton
 *   featureId="family_diet"
 *   onClick={handleClick}
 * >
 *   가족 식단 생성
 * </PremiumGuardButton>
 */
export function PremiumGuardButton({
  featureId,
  featureName,
  onClick,
  premiumMessage,
  children,
  className,
  variant,
  disabled,
  ...props
}: PremiumGuardButtonProps) {
  const { isPremium, isLoading } = usePremium();
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);

  // 프리미엄 기능 정보 가져오기
  const feature = featureId ? getPremiumFeature(featureId) : null;
  const displayName = feature?.name || featureName || '이 기능';

  // 로딩 중
  if (isLoading) {
    return (
      <Button
        {...props}
        variant={variant}
        className={cn('opacity-50 cursor-not-allowed', className)}
        disabled
      >
        {children}
      </Button>
    );
  }

  // 프리미엄이 아닌 경우
  if (!isPremium) {
    const handleClick = () => {
      setShowDialog(true);
    };

    const handleGoToPricing = () => {
      setShowDialog(false);
      router.push('/pricing');
    };

    return (
      <>
        <Button
          {...props}
          variant={variant || 'outline'}
          className={cn(
            'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed hover:bg-gray-100 hover:text-gray-500',
            'relative',
            className
          )}
          onClick={handleClick}
          disabled={disabled}
          title={`${displayName}은(는) 프리미엄 전용 기능입니다`}
        >
          <Lock className="w-4 h-4 mr-2" />
          {children}
        </Button>

        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                프리미엄 전용 기능
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  {premiumMessage || 
                    `${displayName}은(는) 프리미엄 회원만 이용할 수 있는 기능입니다.`}
                </p>
                {feature && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm font-semibold text-orange-900 mb-1">
                      {feature.icon} {feature.name}
                    </p>
                    <p className="text-xs text-orange-700">{feature.description}</p>
                  </div>
                )}
                <div className="mt-4 space-y-1 text-sm">
                  <p className="font-semibold text-gray-900">프리미엄 혜택:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>가족 맞춤 식단 계획</li>
                    <li>무제한 즐겨찾기</li>
                    <li>광고 없는 영상</li>
                    <li>상세 영양 리포트</li>
                    <li>고급 건강 대시보드</li>
                  </ul>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleGoToPricing}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                프리미엄 시작하기
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // 프리미엄 사용자
  return (
    <Button
      {...props}
      variant={variant}
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      <Sparkles className="w-4 h-4 mr-2" />
      {children}
    </Button>
  );
}

