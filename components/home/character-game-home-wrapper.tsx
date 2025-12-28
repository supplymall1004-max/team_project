/**
 * @file character-game-home-wrapper.tsx
 * @description CharacterGameHome 래퍼 컴포넌트
 * 
 * 로그인 상태를 확인하여 로그인한 사용자만 3D 게임 뷰어를 표시합니다.
 * 로그아웃 상태에서는 렌더링하지 않아 React Three Fiber 오류를 방지합니다.
 */

'use client';

import { useUser } from '@clerk/nextjs';
import { CharacterGameHomeClient } from './character-game-home-client';
import { Section } from '@/components/section';

export function CharacterGameHomeWrapper() {
  const { user, isLoaded } = useUser();

  // 로딩 중이거나 로그인하지 않은 경우 렌더링하지 않음
  if (!isLoaded || !user) {
    return null;
  }

  return (
    <section
      id="3d-viewer"
      className="w-full min-h-[800px] bg-gradient-to-b from-gray-900 to-black"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <CharacterGameHomeClient />
      </div>
    </section>
  );
}

