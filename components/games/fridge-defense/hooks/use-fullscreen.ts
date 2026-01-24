/**
 * @file components/games/fridge-defense/hooks/use-fullscreen.ts
 * @description 전체화면 관리 훅
 */

import { useState, useEffect, useCallback, RefObject } from 'react';

export interface UseFullscreenReturn {
  isFullscreen: boolean;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
}

export function useFullscreen(
  containerRef: RefObject<HTMLDivElement>
): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 전체화면 상태 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
      
      // 전체화면 모드일 때 가로 모드로 변경
      if (isCurrentlyFullscreen) {
        try {
          if ('orientation' in screen && 'lock' in (screen as any).orientation) {
            (screen as any).orientation.lock('landscape').catch((err: any) => {
              console.warn('가로 모드 잠금 실패:', err);
            });
          }
        } catch (error) {
          console.warn('가로 모드 설정 실패:', error);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // 전체화면 진입
  const enterFullscreen = useCallback(async () => {
    const element = containerRef.current;
    if (!element) return;

    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
    } catch (error) {
      console.error('전체화면 진입 실패:', error);
    }
  }, [containerRef]);

  // 전체화면 종료
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.error('전체화면 종료 실패:', error);
    }
  }, []);

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
  };
}

