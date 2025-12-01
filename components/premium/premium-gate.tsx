'use client';

/**
 * @file premium-gate.tsx
 * @description 프리미엄 전용 콘텐츠 접근 제어 컴포넌트
 */

import { ReactNode } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface PremiumGateProps {
  /** 프리미엄 여부 */
  isPremium: boolean;
  /** 자물쇠 걸린 콘텐츠 (Free 사용자에게 표시) */
  children: ReactNode;
  /** 게이트 스타일 */
  variant?: 'overlay' | 'banner' | 'card';
  /** 게이트 메시지 */
  message?: string;
}

/**
 * 프리미엄 게이트 - overlay 스타일
 */
function OverlayGate({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
      <div className="text-center p-6 max-w-md">
        <Lock className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">프리미엄 전용</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <Link
          href="/pricing"
          className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
        >
          프리미엄 시작하기 →
        </Link>
      </div>
    </div>
  );
}

/**
 * 프리미엄 게이트 - banner 스타일
 */
function BannerGate({ message }: { message: string }) {
  return (
    <div className="bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-300 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <Lock className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-2">🔒 프리미엄 전용 기능</h3>
          <p className="text-gray-700 mb-4">{message}</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            14일 무료 체험 시작하기
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * 프리미엄 게이트 - card 스타일
 */
function CardGate({ message }: { message: string }) {
  return (
    <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
        <Lock className="w-8 h-8 text-orange-500" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">프리미엄 전용</h3>
      <p className="text-gray-600 mb-6">{message}</p>
      <Link
        href="/pricing"
        className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
      >
        프리미엄 시작하기
      </Link>
    </div>
  );
}

/**
 * 프리미엄 게이트 컴포넌트
 * 
 * @example
 * // Overlay 스타일 (콘텐츠 위에 덮기)
 * <div className="relative">
 *   <PremiumGate isPremium={isPremium} variant="overlay" message="가족 식단은 프리미엄 전용입니다">
 *     <FamilyDietContent />
 *   </PremiumGate>
 * </div>
 * 
 * @example
 * // Banner 스타일 (콘텐츠 대신 배너 표시)
 * <PremiumGate isPremium={isPremium} variant="banner" message="광고 없는 영상은 프리미엄 전용입니다">
 *   <VideoPlayer />
 * </PremiumGate>
 * 
 * @example
 * // Card 스타일 (독립 카드)
 * <PremiumGate isPremium={isPremium} variant="card" message="무제한 북마크를 이용하세요">
 *   <BookmarkList />
 * </PremiumGate>
 */
export function PremiumGate({
  isPremium,
  children,
  variant = 'overlay',
  message = '이 기능은 프리미엄 전용입니다. 지금 업그레이드하고 모든 혜택을 누리세요!',
}: PremiumGateProps) {
  console.group('[PremiumGate]');
  console.log('프리미엄 여부:', isPremium);
  console.log('게이트 스타일:', variant);
  console.groupEnd();

  // 프리미엄 사용자는 그대로 표시
  if (isPremium) {
    return <>{children}</>;
  }

  // Free 사용자에게는 게이트 표시
  if (variant === 'overlay') {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none">{children}</div>
        <OverlayGate message={message} />
      </div>
    );
  }

  if (variant === 'banner') {
    return <BannerGate message={message} />;
  }

  if (variant === 'card') {
    return <CardGate message={message} />;
  }

  return <>{children}</>;
}

/**
 * 간단한 프리미엄 배지 컴포넌트
 */
export function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full">
      <Sparkles className="w-3 h-3" />
      Premium
    </span>
  );
}

/**
 * 프리미엄 업그레이드 배너 (페이지 상단용)
 */
export function UpgradeBanner() {
  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5" />
          <p className="font-semibold">
            프리미엄으로 업그레이드하고 광고 없는 영상, 가족 맞춤 식단을 만나보세요!
          </p>
        </div>
        <Link
          href="/pricing"
          className="px-4 py-2 bg-white text-orange-600 rounded-lg font-bold hover:bg-orange-50 transition-colors whitespace-nowrap"
        >
          14일 무료 체험 →
        </Link>
      </div>
    </div>
  );
}




















