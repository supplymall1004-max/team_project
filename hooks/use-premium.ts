/**
 * @file use-premium.ts
 * @description 프리미엄 상태 확인 훅
 * 
 * 클라이언트 사이드에서 프리미엄 상태를 확인하고 관리합니다.
 */

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { getCurrentSubscription } from '@/actions/payments/get-subscription';

export interface PremiumStatus {
  isPremium: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * 프리미엄 상태 확인 훅
 * 
 * @returns 프리미엄 상태 정보
 */
export function usePremium(): PremiumStatus {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPremium = async () => {
      if (!isUserLoaded) {
        return;
      }

      if (!user) {
        setIsPremium(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const subscription = await getCurrentSubscription();
        setIsPremium(subscription.isPremium || false);
      } catch (err) {
        console.error('[usePremium] 프리미엄 체크 실패:', err);
        setError(err instanceof Error ? err.message : '프리미엄 상태 확인에 실패했습니다.');
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPremium();
  }, [user, isUserLoaded]);

  return { isPremium, isLoading, error };
}

