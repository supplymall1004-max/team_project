/**
 * @file components/game/threejs/character-model.tsx
 * @description 캐릭터 모델 컴포넌트
 *
 * Phase 2: 캐릭터 모델 및 애니메이션
 * - 간단한 캐릭터 모델 (프리미티브 기하체 사용)
 * - 애니메이션 상태에 따른 시각적 표현
 *
 * 향후 GLB 모델로 교체 예정
 *
 * @dependencies
 * - @react-three/fiber: useFrame
 * - three: Group, Mesh, BoxGeometry, MeshStandardMaterial
 */

"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Mesh } from "three";
import * as THREE from "three";

interface CharacterModelProps {
  animation?: "idle" | "walk" | "run";
}

/**
 * 캐릭터 모델 컴포넌트
 * 현재는 프리미티브 기하체로 구현 (향후 GLB 모델로 교체 예정)
 */
export function CharacterModel({ animation = "idle" }: CharacterModelProps) {
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Mesh>(null);
  const headRef = useRef<Mesh>(null);
  const leftArmRef = useRef<Mesh>(null);
  const rightArmRef = useRef<Mesh>(null);
  const leftLegRef = useRef<Mesh>(null);
  const rightLegRef = useRef<Mesh>(null);
  const animationTime = useRef(0);

  useFrame((state, delta) => {
    animationTime.current += delta;
    const time = animationTime.current;

    if (!groupRef.current) return;

    // 애니메이션에 따른 움직임
    if (animation === "walk" || animation === "run") {
      const speed = animation === "run" ? 8 : 5;
      
      // 팔 흔들기
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = Math.sin(time * speed) * 0.5;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -Math.sin(time * speed) * 0.5;
      }
      
      // 다리 움직임
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = -Math.sin(time * speed) * 0.3;
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = Math.sin(time * speed) * 0.3;
      }
      
      // 몸통 약간의 상하 움직임
      if (bodyRef.current) {
        bodyRef.current.position.y = Math.sin(time * speed * 2) * 0.05;
      }
    } else {
      // Idle 애니메이션: 약간의 호흡 효과
      if (bodyRef.current) {
        bodyRef.current.position.y = Math.sin(time * 2) * 0.02;
      }
      
      // 팔과 다리 원위치
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 머리 */}
      <mesh ref={headRef} position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#ffdbac" />
      </mesh>

      {/* 몸통 */}
      <mesh ref={bodyRef} position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.8, 0.3]} />
        <meshStandardMaterial color="#4a90e2" />
      </mesh>

      {/* 왼쪽 팔 */}
      <mesh
        ref={leftArmRef}
        position={[-0.4, 0.8, 0]}
        rotation={[0, 0, 0.2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.2, 0.6, 0.2]} />
        <meshStandardMaterial color="#ffdbac" />
      </mesh>

      {/* 오른쪽 팔 */}
      <mesh
        ref={rightArmRef}
        position={[0.4, 0.8, 0]}
        rotation={[0, 0, -0.2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.2, 0.6, 0.2]} />
        <meshStandardMaterial color="#ffdbac" />
      </mesh>

      {/* 왼쪽 다리 */}
      <mesh
        ref={leftLegRef}
        position={[-0.15, 0.1, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.2, 0.6, 0.2]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>

      {/* 오른쪽 다리 */}
      <mesh
        ref={rightLegRef}
        position={[0.15, 0.1, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.2, 0.6, 0.2]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
    </group>
  );
}

