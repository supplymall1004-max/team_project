/**
 * @file components/game/threejs/physics-world.tsx
 * @description 물리 엔진 월드 설정
 *
 * Phase 3: 물리 엔진 통합
 * - Rapier Physics World 초기화
 * - 중력 및 물리 설정
 * - 바닥 및 벽 콜라이더 설정
 *
 * @dependencies
 * - @react-three/rapier: Physics, RigidBody
 * - rapier: 물리 엔진
 */

"use client";

import { ReactNode } from "react";
import { Physics } from "@react-three/rapier";

interface PhysicsWorldProps {
  children: ReactNode;
  gravity?: [number, number, number];
  debug?: boolean;
}

/**
 * 물리 엔진 월드 컴포넌트
 * Rapier Physics를 초기화하고 중력을 설정합니다.
 */
export function PhysicsWorld({
  children,
  gravity = [0, -9.81, 0], // 기본 중력 (지구 중력)
  debug = false,
}: PhysicsWorldProps) {
  return (
    <Physics
      gravity={gravity}
      debug={debug}
      timeStep="vary" // 성능에 따라 시간 스텝 조정
      paused={false}
    >
      {children}
    </Physics>
  );
}

