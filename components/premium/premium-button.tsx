/**
 * @file premium-button.tsx
 * @description 프리미엄 기능용 버튼 컴포넌트
 * 
 * 프리미엄이 활성화되지 않은 경우:
 * - 버튼이 회색으로 비활성화
 * - 클릭 시 프리미엄 결제 안내 메시지 표시
 */

'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { usePremium } from '@/hooks/use-premium';
import { Button } from '@/components/ui/button';
import { Sparkles, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumFeatureId, getPremiumFeature } from '@/lib/premium/features';
import type { VariantProps } from 'class-variance-authority';
import { buttonVariants } from '@/components/ui/button';

type ButtonProps = React.ComponentProps<typeof Button>;

interface PremiumButtonProps extends Omit<ButtonProps, 'onClick' | 'disabled'> {
  /** 프리미엄 기능 ID */
  featureId?: PremiumFeatureId;
  /** 프리미엄 기능 이름 (featureId가 없을 경우 사용) */
  featureName?: string;
  /** 클릭 핸들러 (프리미엄 사용자만 실행) */
  onClick?: () => void;
  /** 프리미엄이 아닐 때 표시할 메시지 */
  premiumMessage?: string;
  /** 프리미엄이 아닐 때도 버튼을 활성화할지 여부 (기본값: false) */
  allowNonPremium?: boolean;
  /** 자식 요소 */
  children: ReactNode;
}

/**
 * 프리미엄 기능용 버튼 컴포넌트
 * 
 * @example
 * <PremiumButton
 *   featureId="family_diet"
 *   onClick={handleClick}
 * >
 *   가족 식단 생성
 * </PremiumButton>
 */
export function PremiumButton({
  featureId,
  featureName,
  onClick,
  premiumMessage,
  allowNonPremium = false,
  children,
  className,
  variant,
  ...props
}: PremiumButtonProps) {
  const { isPremium, isLoading } = usePremium();
  const router = useRouter();

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

  // 프리미엄이 아니고 비프리미엄 허용이 아닌 경우
  if (!isPremium && !allowNonPremium) {
    const handleClick = () => {
      const message = premiumMessage || 
        `${displayName}은(는) 프리미엄 전용 기능입니다.\n프리미엄으로 업그레이드하시겠습니까?`;
      
      if (window.confirm(message)) {
        router.push('/pricing');
      }
    };

    return (
      <Button
        {...props}
        variant={variant || 'outline'}
        className={cn(
          'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed hover:bg-gray-100 hover:text-gray-500',
          'relative',
          className
        )}
        onClick={handleClick}
        title={`${displayName}은(는) 프리미엄 전용 기능입니다`}
      >
        <Lock className="w-4 h-4 mr-2" />
        {children}
      </Button>
    );
  }

  // 프리미엄 사용자 또는 비프리미엄 허용
  return (
    <Button
      {...props}
      variant={variant}
      className={className}
      onClick={onClick}
    >
      {isPremium && <Sparkles className="w-4 h-4 mr-2" />}
      {children}
    </Button>
  );
}
