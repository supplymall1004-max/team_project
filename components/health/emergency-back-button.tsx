/**
 * @file emergency-back-button.tsx
 * @description 응급조치 페이지 뒤로가기 버튼 컴포넌트
 * 
 * 뒤로가기 시 홈 페이지가 제대로 렌더링되도록 처리합니다.
 */

'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function EmergencyBackButton() {
  return (
    <div>
      <Link href="/">
        <Button
          variant="ghost"
          className="hover:bg-red-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          홈으로 돌아가기
        </Button>
      </Link>
    </div>
  );
}

