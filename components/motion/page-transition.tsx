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
  const [displayPathname, setDisplayPathname] = useState(pathname);
  const [key, setKey] = useState(pathname);

  useEffect(() => {
    // pathname이 변경되면 key를 업데이트하여 애니메이션 트리거
    if (pathname !== displayPathname) {
      setKey(`${pathname}-${Date.now()}`);
      setDisplayPathname(pathname);
    }
  }, [pathname, displayPathname]);

  return (
    <AnimatePresence mode="wait">
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
