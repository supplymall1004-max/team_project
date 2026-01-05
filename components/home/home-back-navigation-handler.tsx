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

    // 세션 스토리지에서 새로고침 플래그 확인
    const shouldRefresh = sessionStorage.getItem('shouldRefreshHome') === 'true';
    
    if (shouldRefresh) {
      sessionStorage.removeItem('shouldRefreshHome');
      console.log('[HomeBackNavigationHandler] 새로고침 플래그 감지 - 홈 페이지 리프레시');
      // 완전한 페이지 리로드
      window.location.reload();
      return;
    }

    // popstate 이벤트 리스너 (뒤로가기/앞으로가기)
    const handlePopState = (event: PopStateEvent) => {
      // 홈 페이지로 돌아왔을 때 강제로 리프레시
      if (window.location.pathname === '/') {
        console.log('[HomeBackNavigationHandler] 뒤로가기 감지 - 홈 페이지 리프레시');
        // 완전한 페이지 리로드 (router.refresh()보다 확실함)
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    };

    // 페이지가 표시될 때 (뒤로가기로 돌아왔을 때 포함)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pathname === '/') {
        // 세션 스토리지 플래그 확인
        const shouldRefresh = sessionStorage.getItem('shouldRefreshHome') === 'true';
        if (shouldRefresh) {
          sessionStorage.removeItem('shouldRefreshHome');
          console.log('[HomeBackNavigationHandler] 페이지 가시성 변경 - 홈 페이지 리프레시');
          window.location.reload();
        }
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

