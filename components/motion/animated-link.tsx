/**
 * @file animated-link.tsx
 * @description 모션 효과가 적용된 Link 컴포넌트
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'button';
}

export function AnimatedLink({ 
  href, 
  children, 
  className,
  variant = 'default'
}: AnimatedLinkProps) {
  const baseClasses = variant === 'button' 
    ? 'inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all'
    : '';

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
    >
      <Link
        href={href}
        className={cn(baseClasses, className)}
      >
        {children}
      </Link>
    </motion.div>
  );
}
