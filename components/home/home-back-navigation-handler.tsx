/**
 * @file home-back-navigation-handler.tsx
 * @description 홈 페이지 뒤로가기 네비게이션 핸들러
 * 
 * 브라우저 뒤로가기 버튼이나 다른 페이지에서 홈으로 돌아올 때 홈 페이지가 제대로 렌더링되도록 처리합니다.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function HomeBackNavigationHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // 초기 마운트 시 이전 경로 저장 (첫 방문이면 null)
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      previousPathnameRef.current = pathname;
      return;
    }

    // 홈 페이지로 돌아온 경우 (이전 경로가 '/'가 아니고 현재가 '/')
    if (previousPathnameRef.current !== '/' && pathname === '/') {
      console.log('[HomeBackNavigationHandler] 홈 페이지로 돌아옴 - 리프레시 실행');
      console.log('  이전 경로:', previousPathnameRef.current);
      console.log('  현재 경로:', pathname);
      
      // router.refresh()로 서버 컴포넌트 재렌더링
      router.refresh();
      
      // 페이지가 완전히 로드되도록 약간의 딜레이 후 스크롤 상단으로 이동
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }

    // 현재 경로를 이전 경로로 저장
    previousPathnameRef.current = pathname;
  }, [pathname, router]);

  useEffect(() => {
    // 홈 페이지에서만 작동
    if (pathname !== '/') return;

    // 세션 스토리지에서 새로고침 플래그 확인
    const shouldRefresh = sessionStorage.getItem('shouldRefreshHome') === 'true';
    
    if (shouldRefresh) {
      sessionStorage.removeItem('shouldRefreshHome');
      console.log('[HomeBackNavigationHandler] 새로고침 플래그 감지 - 홈 페이지 리프레시');
      // router.refresh()로 서버 컴포넌트 재렌더링
      router.refresh();
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      return;
    }

    // popstate 이벤트 리스너 (뒤로가기/앞으로가기)
    const handlePopState = (event: PopStateEvent) => {
      // 홈 페이지로 돌아왔을 때 강제로 리프레시
      if (window.location.pathname === '/') {
        console.log('[HomeBackNavigationHandler] 뒤로가기 감지 - 홈 페이지 리프레시');
        // router.refresh()로 서버 컴포넌트 재렌더링
        setTimeout(() => {
          router.refresh();
          window.scrollTo({ top: 0, behavior: 'smooth' });
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
          router.refresh();
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
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

