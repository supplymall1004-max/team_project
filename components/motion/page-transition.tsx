/**
 * @file page-transition.tsx
 * @description 페이지 전환 애니메이션 컴포넌트
 * 
 * 페이지가 변경될 때 부드러운 전환 효과를 제공합니다.
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  // pathname을 직접 key로 사용하되, 매번 새로운 타임스탬프를 추가하여 강제 리렌더링
  const [key, setKey] = useState(`${pathname}-${Date.now()}`);

  useEffect(() => {
    console.log('[PageTransition] pathname 변경 감지:', pathname);
    // pathname이 변경될 때마다 key를 업데이트하여 애니메이션 트리거
    setKey(`${pathname}-${Date.now()}`);
  }, [pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={{
          type: "spring",
          stiffness: 150,
          damping: 25,
          mass: 1.2,
          duration: 0.6,
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
