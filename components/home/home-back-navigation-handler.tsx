/**
 * @file home-back-navigation-handler.tsx
 * @description 홈 페이지 뒤로가기 네비게이션 핸들러
 * 
 * 브라우저 뒤로가기 버튼을 눌렀을 때 홈 페이지가 제대로 렌더링되도록 처리합니다.
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function HomeBackNavigationHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 홈 페이지에서만 작동
    if (pathname !== '/') return;

    // popstate 이벤트 리스너 (뒤로가기/앞으로가기)
    const handlePopState = () => {
      // 홈 페이지로 돌아왔을 때 강제로 리프레시
      if (pathname === '/') {
        console.log('[HomeBackNavigationHandler] 뒤로가기 감지 - 홈 페이지 리프레시');
        // 약간의 딜레이 후 리프레시하여 페이지가 완전히 로드되도록 함
        setTimeout(() => {
          router.refresh();
          // 스크롤을 맨 위로 이동
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
      }
    };

    // 페이지가 표시될 때 (뒤로가기로 돌아왔을 때 포함)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pathname === '/') {
        console.log('[HomeBackNavigationHandler] 페이지 가시성 변경 - 홈 페이지 리프레시');
        setTimeout(() => {
          router.refresh();
        }, 50);
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 클린업
    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router, pathname]);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
}

