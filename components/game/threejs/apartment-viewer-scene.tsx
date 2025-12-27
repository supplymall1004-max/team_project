/**
 * @file components/game/threejs/apartment-viewer-scene.tsx
 * @description 아파트 뷰어 전용 씬 컴포넌트
 *
 * 게임 요소 없이 아파트 모델만 표시하는 최적화된 씬입니다.
 * - 빠른 로딩
 * - 최적화된 조명
 * - Sketchfab과 같은 부드러운 탐색 경험
 *
 * @dependencies
 * - @react-three/drei: Environment, Suspense
 * - @react-three/fiber: Suspense
 */

"use client";

import { Suspense } from "react";
import { Environment, Html } from "@react-three/drei";
import { ApartmentViewer } from "./apartment-viewer";
import { FamilyMembers } from "./family-members";
import { EventNotificationSystem } from "./event-notification-system";

/**
 * 로딩 오버레이
 */
function LoadingOverlay() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-white bg-black/50 px-4 py-2 rounded text-sm">
          아파트 모델 로딩 중...
        </div>
      </div>
    </Html>
  );
}

/**
 * 아파트 뷰어 전용 씬
 */
export function ApartmentViewerScene() {
  return (
    <>
      {/* 환경 조명 (HDRI) - 원거리 하얀색 문제 해결을 위해 더 낮춤 */}
      <Suspense fallback={null}>
        <Environment preset="city" environmentIntensity={0.2} background={false} />
      </Suspense>

      {/* 기본 조명 설정 - 사물이 잘 보이도록 조명 강도 증가 */}
      {/* Ambient Light: 전체적인 밝기 */}
      <ambientLight intensity={0.8} color="#ffffff" />

      {/* Directional Light: 태양광 효과 */}
      <directionalLight
        position={[10, 10, 10]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* 추가 Directional Light: 부드러운 그림자 */}
      <directionalLight
        position={[-5, 8, -5]}
        intensity={0.6}
        color="#ffffff"
        castShadow={false}
      />
      
      {/* 추가 Point Light: 내부 조명 강화 */}
      <pointLight
        position={[0, 2, 0]}
        intensity={0.5}
        color="#ffffff"
        distance={50}
        decay={2}
      />

          {/* 아파트 모델 뷰어 */}
          <Suspense fallback={<LoadingOverlay />}>
            <ApartmentViewer />
          </Suspense>

          {/* 가족 구성원 (아빠, 엄마, 나, 강아지) */}
          <Suspense fallback={null}>
            <FamilyMembers />
          </Suspense>

          {/* 이벤트 알림 시스템 */}
          <EventNotificationSystem />
        </>
      );
    }

