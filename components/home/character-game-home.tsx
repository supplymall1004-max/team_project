/**
 * @file components/home/character-game-home.tsx
 * @description 홈화면 게임 스타일 캐릭터창 컴포넌트
 *
 * 홈화면에 게임 스타일의 캐릭터창을 표시합니다.
 * Unity 게임과 캐릭터창의 모든 요소를 통합하여 게임 인터페이스처럼 보이도록 구현합니다.
 *
 * 주요 기능:
 * 1. 게임 화면 (Unity 또는 플레이스홀더)
 * 2. 게임 HUD (포인트, 레벨, 경험치)
 * 3. 캐릭터 정보 사이드바
 * 4. 퀘스트, 컬렉션 등 게임 요소 통합
 *
 * @dependencies
 * - @/components/game/character-game-view: 게임 뷰
 * - @/components/game/character-game-hud: 게임 HUD
 * - @/actions/health/character: 캐릭터 데이터 조회
 */

import { Suspense } from "react";
import { CharacterGameHomeClient } from "./character-game-home-client";
import { Section } from "@/components/section";
import { Loader2 } from "lucide-react";

/**
 * 로딩 스켈레톤
 */
function CharacterGameHomeSkeleton() {
  return (
    <div className="min-h-[600px] bg-gradient-to-br from-gray-900 to-black rounded-lg flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-green-400 mx-auto" />
        <p className="text-gray-400">게임을 불러오는 중...</p>
      </div>
    </div>
  );
}

/**
 * 3D 모델링 뷰어 컴포넌트
 */
export async function CharacterGameHome({ className }: { className?: string }) {
  return (
    <section
      id="3d-viewer"
      className="w-screen min-h-[800px] bg-gradient-to-b from-gray-900 to-black"
      style={{ 
        padding: 0,
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
        width: '100vw'
      }}
    >
      <Suspense fallback={<CharacterGameHomeSkeleton />}>
        <CharacterGameHomeClient />
      </Suspense>
    </section>
  );
}

