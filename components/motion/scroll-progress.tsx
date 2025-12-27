/**
 * @file scroll-progress.tsx
 * @description 페이지 스크롤 진행도를 표시하는 컴포넌트
 * 
 * 페이지 상단에 고정되어 스크롤 진행도를 시각적으로 표시합니다.
 */

'use client';

import { motion, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';

export function ScrollProgress() {
  const [isMounted, setIsMounted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // 클라이언트 사이드에서만 마운트 확인
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 직접 스크롤 진행도 계산 (window 스크롤 사용)
  useEffect(() => {
    if (!isMounted) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const totalScrollableHeight = scrollHeight - clientHeight;
      if (totalScrollableHeight > 0) {
        setScrollProgress(scrollTop / totalScrollableHeight);
      } else {
        setScrollProgress(0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMounted]);
  
  const scaleX = useSpring(scrollProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // 서버 사이드에서는 렌더링하지 않음
  if (!isMounted) {
    return null;
  }

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-1 bg-orange-500 origin-left z-50"
      aria-hidden="true"
    />
  );
}
