'use client';

/**
 * @file premium-status-banner.tsx
 * @description 홈페이지 프리미엄 상태 표시 배너
 * 
 * 프리미엄 사용자에게는 프리미엄 혜택 안내를,
 * Free 사용자에게는 업그레이드 유도 메시지를 표시합니다.
 */

import { useEffect, useState } from 'react';
import { Crown, Clock, Settings, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { getCurrentSubscription, type GetSubscriptionResponse } from '@/actions/payments/get-subscription';

interface PremiumStatusBannerProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export function PremiumStatusBanner({ onMenuToggle, isMenuOpen = false }: PremiumStatusBannerProps = {}) {
  const [data, setData] = useState<GetSubscriptionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
    
    // 프리미엄 활성화 이벤트 리스너 추가
    const handlePremiumActivated = () => {
      setTimeout(() => {
        loadSubscription();
      }, 500);
    };
    
    window.addEventListener('premium-activated', handlePremiumActivated);
    
    return () => {
      window.removeEventListener('premium-activated', handlePremiumActivated);
    };
  }, []);

  const loadSubscription = async () => {
    try {
      const result = await getCurrentSubscription();
      setData(result);
    } catch (error) {
      console.error('❌ 구독 정보 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null; // 로딩 중에는 표시하지 않음
  }

  // 프리미엄 사용자인 경우
  if (data?.isPremium) {
    const subscription = data.subscription;
    const expiresAt = subscription?.currentPeriodEnd 
      ? new Date(subscription.currentPeriodEnd)
      : data.premiumExpiresAt
      ? new Date(data.premiumExpiresAt)
      : null;
    
    const daysRemaining = expiresAt 
      ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    // 만료 임박 여부 확인 (7일 이하)
    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;

    return (
      <div className="relative bg-orange-500 text-white shadow-md">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5">
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            {/* 1. 프리미엄 시그널 마크 (불이 들어오는 효과) + 텍스트 */}
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center">
                <div className="relative">
                  {/* 외부 빛나는 효과 (더 작게) */}
                  <div className="absolute inset-0 bg-yellow-300/30 rounded-full blur-lg animate-pulse" />
                  
                  {/* 프리미엄 마크 (더 컴팩트) */}
                  <div className="relative bg-white/25 backdrop-blur-sm p-1.5 rounded-full border border-yellow-300/50 shadow-md">
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 drop-shadow-md" />
                  </div>
                  
                  {/* 불이 들어오는 애니메이션 효과 (더 작게) */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-60" />
                  </div>
                </div>
              </div>
              <span className="text-white font-medium text-xs sm:text-sm whitespace-nowrap tracking-tight">프리미엄</span>
            </div>

            {/* 구분선 */}
            <div className="h-4 w-px bg-white/30" />

            {/* 2. 남은 기간 마크 + 텍스트 */}
            {daysRemaining !== null && daysRemaining > 0 && (
              <div className={`flex items-center gap-2 ${
                isExpiringSoon ? 'animate-pulse' : ''
              }`}>
                <div className={`relative bg-white/25 backdrop-blur-sm p-1.5 rounded-full border ${
                  isExpiringSoon 
                    ? 'border-red-200/50 shadow-md shadow-red-500/20' 
                    : 'border-white/30 shadow-sm'
                }`}>
                  <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    isExpiringSoon ? 'text-red-100' : 'text-white'
                  } drop-shadow-md`} />
                </div>
                <span className={`text-white font-medium text-xs sm:text-sm whitespace-nowrap tracking-tight ${
                  isExpiringSoon ? 'text-red-100' : ''
                }`}>
                  {daysRemaining}일 남음
                </span>
              </div>
            )}

            {/* 구분선 */}
            <div className="h-4 w-px bg-white/30" />

            {/* 3. 구독 관리 (톱니바퀴 아이콘) */}
            <Link 
              href="/settings/billing"
              className="relative flex items-center justify-center group transition-all hover:scale-105 active:scale-95"
              title="구독 관리"
            >
              <div className="relative bg-white/25 backdrop-blur-sm p-1.5 rounded-full border border-white/30 shadow-sm group-hover:border-white/50 group-hover:bg-white/30 transition-all duration-200">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-md group-hover:rotate-90 transition-transform duration-300" />
              </div>
            </Link>

            {/* 4. 햄버거 메뉴 버튼 (게임 섹션용) */}
            {onMenuToggle && (
              <>
                <div className="h-4 w-px bg-white/30" />
                <button
                  onClick={onMenuToggle}
                  className="relative flex items-center justify-center group transition-all hover:scale-105 active:scale-95"
                  title="메뉴"
                  aria-label="메뉴"
                >
                  <div className="relative bg-white/25 backdrop-blur-sm p-1.5 rounded-full border border-white/30 shadow-sm group-hover:border-white/50 group-hover:bg-white/30 transition-all duration-200">
                    {isMenuOpen ? (
                      <X className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-md transition-transform duration-300" />
                    ) : (
                      <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-md transition-transform duration-300" />
                    )}
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 애니메이션 스타일 추가 */}
        <style jsx global>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          .animate-shimmer {
            animation: shimmer 3s infinite;
          }
          
          @keyframes glow {
            0%, 100% {
              opacity: 0.5;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.1);
            }
          }
        `}</style>
      </div>
    );
  }

  // Free 사용자인 경우 (기존 PremiumBanner와 동일하게 표시)
  return null; // FixedHeader의 PremiumBanner가 이미 표시됨
}

