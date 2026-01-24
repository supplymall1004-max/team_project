'use client';

/**
 * @file beta-test-mode-banner.tsx
 * @description 베타테스트 모드 알림 배너
 */

import { AlertCircle } from 'lucide-react';

export function BetaTestModeBanner() {
  return (
    <div className="bg-blue-100 border-b-2 border-blue-300 py-3 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 text-blue-900">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium">
          <strong>베타테스트 모드</strong>: 베타 테스터를 위한 서비스입니다. 실제 결제는 진행되지 않으며, 모든 기능을 체험하실 수 있습니다.
        </p>
      </div>
    </div>
  );
}

