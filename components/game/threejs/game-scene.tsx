/**
 * @file components/game/threejs/game-scene.tsx
 * @description 3D 모델링 게임 메인 씬 컴포넌트
 *
 * 아파트 내부 3D 모델을 로드하고 기본 조명을 설정합니다.
 * Phase 1: 기본 3D 씬 구성
 *
 * @dependencies
 * - @react-three/fiber: React Three Fiber
 * - @react-three/drei: useGLTF, Environment 등
 * - three: Three.js 핵심 라이브러리
 */

"use client";

import { Suspense } from "react";
import { Environment, Html } from "@react-three/drei";
import { CharacterController } from "./character-controller";
import { CharacterProvider } from "./character-context";
import { CameraController } from "./camera-controller";
import { PhysicsWorld } from "./physics-world";
import { FloorCollider } from "./floor-collider";
import { NPC } from "./npc-system";
import { GameItem } from "./item-system";
import { QuestGiver } from "./quest-system";
import { HouseInterior } from "./house-interior";
import { PerformanceOptimizer } from "./performance-optimizer";

/**
 * 게임 씬 로딩 오버레이
 */
function LoadingOverlay() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-white bg-black/50 px-4 py-2 rounded text-sm">
          3D 게임 씬 로딩 중...
        </div>
      </div>
    </Html>
  );
}

/**
 * 게임 씬 메인 컴포넌트
 */
export function GameScene() {
  return (
    <CharacterProvider>
      {/* 물리 엔진 월드 (Phase 3) */}
      <PhysicsWorld>
        {/* 성능 최적화 (Phase 7) */}
        <PerformanceOptimizer
          enableFrustumCulling={true}
          shadowMapSize={1024}
          maxRenderDistance={100}
        />

        {/* 카메라 컨트롤러 (Phase 4: Third-person) */}
        <CameraController />
        
        {/* 환경 조명 (HDRI) */}
        <Suspense fallback={null}>
          <Environment
            preset="city"
            environmentIntensity={1.0}
            background={false}
          />
        </Suspense>

        {/* 기본 조명 설정 - 따뜻하고 부드러운 조명 */}
        {/* Ambient Light: 전체적인 밝기 (따뜻한 톤) */}
        <ambientLight intensity={0.7} color="#fff8f0" />
        
        {/* Directional Light: 메인 조명 (따뜻한 태양광 효과) */}
        <directionalLight
          position={[5, 10, 5]}
          intensity={0.7}
          color="#fff8e1"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        
        {/* 추가 Directional Light: 그림자 완화 및 따뜻함 추가 */}
        <directionalLight
          position={[-5, 8, -5]}
          intensity={0.4}
          color="#fff8e1"
          castShadow={false}
        />
        
        {/* Point Light: 벽난로 효과 (따뜻한 빛) - 위치는 모델에 맞게 조정 */}
        <pointLight
          position={[0, 1.5, 0]}
          intensity={0.5}
          color="#ff6b35"
          distance={15}
          decay={2}
        />
        
        {/* Hemisphere Light: 자연스러운 조명 */}
        <hemisphereLight
          args={["#fff8f0", "#8b7355", 0.3]}
        />

        {/* 바닥 충돌 감지 (Phase 3) - 가정집 크기에 맞게 조정 */}
        <FloorCollider position={[0, -0.1, 0]} size={[20, 0.2, 20]} visible={false} />

        {/* 가정집 내부 모델 */}
        <Suspense fallback={<LoadingOverlay />}>
          <HouseInterior />
        </Suspense>

        {/* 캐릭터 컨트롤러 (Phase 2 + Phase 3: 물리 기반) */}
        <CharacterController position={[0, 2, 0]} speed={3} />

        {/* 게임 요소 (Phase 6) */}
        {/* NPC 예시 */}
        <NPC
          id="npc-1"
          name="집주인"
          position={[5, 0, 5]}
          dialogue={[
            "안녕하세요! 우리 집에 오신 것을 환영합니다.",
            "여기서 다양한 활동을 할 수 있습니다.",
            "E키를 눌러 상호작용하세요!",
          ]}
        />

        {/* 퀘스트 제공자 예시 */}
        <QuestGiver
          quest={{
            id: "quest-1",
            title: "집 탐험하기",
            description: "가정집 내부를 탐험해보세요.",
            objectives: [
              {
                id: "obj-1",
                description: "집 내부를 탐험하기",
                completed: false,
              },
            ],
            rewards: [
              { type: "experience", amount: 100 },
            ],
            status: "available",
          }}
          position={[-5, 0, 5]}
        />

        {/* 아이템 예시 */}
        <GameItem
          item={{
            id: "item-1",
            name: "건강 물약",
            description: "체력을 회복시켜주는 물약입니다.",
            type: "consumable",
            stackable: true,
            maxStack: 10,
            effect: { type: "health", amount: 20 },
          }}
          position={[0, 0.5, 3]}
        />
      </PhysicsWorld>
    </CharacterProvider>
  );
}

