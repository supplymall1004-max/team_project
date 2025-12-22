/**
 * @file page-transition-wrapper.tsx
 * @description 페이지 전환 래퍼 컴포넌트 (클라이언트 컴포넌트)
 */

'use client';

import { PageTransition } from './page-transition';

export function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
