/**
 * @file components/game/character-game-view.tsx
 * @description 3D 모델링 기반 게임 뷰 컴포넌트
 *
 * 3D 모델링을 활용한 게임 인터페이스를 표시합니다.
 * Phase 1: 기본 3D 씬 구성 완료
 *
 * @dependencies
 * - @react-three/fiber: Canvas
 * - @/components/game/threejs/game-scene: 게임 씬
 * - @/components/game/threejs/camera-controller: 카메라 컨트롤러
 */

"use client";

import { Canvas } from "@react-three/fiber";
import { ApartmentViewerScene } from "@/components/game/threejs/apartment-viewer-scene";
import { ErrorBoundary } from "@/components/error-boundary";

interface CharacterGameViewProps {
  userId?: string;
  familyMemberId?: string;
  characterName?: string;
  characterData?: any;
  showHUD?: boolean;
  onGameStateUpdate?: (state: {
    points: number;
    level: number;
    experience: number;
    experienceToNextLevel: number;
    energy: number;
  }) => void;
}

/**
 * 로딩 오버레이
 */
function LoadingFallback() {
  return (
    <div className="relative w-full h-full min-h-[600px] flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg">
      <div className="text-center p-8">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">3D 게임 씬 로딩 중...</p>
      </div>
    </div>
  );
}

/**
 * 캐릭터 게임 뷰 컴포넌트
 * 3D 모델링 게임을 렌더링합니다.
 */
export function CharacterGameView({
  userId,
  familyMemberId,
  characterName,
  characterData,
  showHUD = true,
  onGameStateUpdate,
}: CharacterGameViewProps) {
  // 게임 상태에서 체력/에너지 추출 (향후 실제 게임 상태와 연동)
  const health = characterData?.health ?? 100;
  const energy = characterData?.energy ?? 100;

  return (
    <ErrorBoundary fallback={<LoadingFallback />}>
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: true, // 투명 배경 활성화
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        camera={{ position: [0, 0, 0], fov: 60, near: 0.01, far: 5000 }}
        dpr={[1, 2]}
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'block', 
          minHeight: '800px', 
          position: 'relative', 
          zIndex: 0 
        }}
        onCreated={(state) => {
          // 그림자 맵 활성화
          state.gl.shadowMap.enabled = true;
          state.gl.shadowMap.type = 1; // PCFSoftShadowMap
          
          // Canvas 크기 강제 업데이트 - 컨테이너 너비 사용
          const container = state.gl.domElement.parentElement;
          if (container) {
            const rect = container.getBoundingClientRect();
            const width = rect.width; // 컨테이너 너비
            const height = Math.max(rect.height, 800); // 최소 800px 높이
            state.gl.setSize(width, height);
          }
          
          console.log("🎮 게임 Canvas 생성 완료", {
            gl: state.gl,
            scene: state.scene,
            camera: state.camera,
            size: state.size,
            containerSize: container ? container.getBoundingClientRect() : null,
          });
        }}
        onError={(error) => {
          console.error("❌ Canvas 에러:", error);
        }}
      >
        {/* 아파트 뷰어 씬 (게임 요소 없이 모델만 표시) */}
        <ApartmentViewerScene />
      </Canvas>
    </ErrorBoundary>
  );
}

