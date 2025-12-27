/**
 * @file components/game/threejs/character-physics.tsx
 * @description 캐릭터 물리 컴포넌트
 *
 * Phase 3: 물리 엔진 통합
 * - 캐릭터에 RigidBody 적용
 * - 캡슐 콜라이더 설정
 * - 중력 및 충돌 감지
 *
 * @dependencies
 * - @react-three/rapier: RigidBody, useRapier
 * - @react-three/fiber: useFrame
 * - three: Vector3
 */

"use client";

import { useRef, useEffect } from "react";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { Vector3 } from "three";

interface CharacterPhysicsProps {
  children: React.ReactNode;
  position?: [number, number, number];
  rigidBodyRef?: React.RefObject<RapierRigidBody>;
}

/**
 * 캐릭터 물리 컴포넌트
 * 캐릭터에 물리 속성을 적용하고 중력을 처리합니다.
 */
export function CharacterPhysics({
  children,
  position = [0, 2, 0], // 초기 위치 (바닥 위)
  rigidBodyRef: externalRef,
}: CharacterPhysicsProps) {
  const internalRef = useRef<RapierRigidBody>(null);
  const rigidBodyRef = externalRef || internalRef;

  // 초기 위치 설정
  useEffect(() => {
    if (rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation(
        new Vector3(...position),
        true
      );
    }
  }, [position, rigidBodyRef]);

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic" // 동적 물체 (중력 영향 받음)
      position={position}
      colliders="hull" // 자동 콜라이더 생성 (캡슐 형태)
      enabledRotations={[false, true, false]} // Y축 회전만 허용
      linearDamping={0.5} // 공기 저항
      angularDamping={0.5} // 각속도 저항
      restitution={0} // 반발력 없음
      friction={1} // 마찰력 있음
      lockRotations={false} // 회전 잠금 해제 (Y축만)
    >
      {children}
    </RigidBody>
  );
}

