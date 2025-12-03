'use client';

/**
 * @file test-mode-banner.tsx
 * @description 테스트 모드 알림 배너
 */

import { AlertCircle } from 'lucide-react';

export function TestModeBanner() {
  return (
    <div className="bg-yellow-100 border-b-2 border-yellow-300 py-3 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 text-yellow-900">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium">
          <strong>테스트 모드</strong>: 실제 결제가 진행되지 않습니다. 결제 플로우 시뮬레이션만 가능합니다.
        </p>
      </div>
    </div>
  );
}
























