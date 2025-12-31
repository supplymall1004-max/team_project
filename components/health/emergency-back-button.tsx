/**
 * @file emergency-back-button.tsx
 * @description 응급조치 페이지 뒤로가기 버튼 컴포넌트
 * 
 * 뒤로가기 시 홈 페이지가 제대로 렌더링되도록 처리합니다.
 */

'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function EmergencyBackButton() {
  const router = useRouter();

  const handleBack = () => {
    // 홈 페이지로 이동하면서 강제로 리프레시
    router.push('/');
    // 약간의 딜레이 후 리프레시하여 페이지가 완전히 로드되도록 함
    setTimeout(() => {
      router.refresh();
      // 스크롤을 맨 위로 이동
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div>
      <Button
        variant="ghost"
        className="hover:bg-red-50 transition-colors"
        onClick={handleBack}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        홈으로 돌아가기
      </Button>
    </div>
  );
}

