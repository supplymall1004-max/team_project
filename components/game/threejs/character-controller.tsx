/**
 * @file components/game/threejs/character-controller.tsx
 * @description 캐릭터 컨트롤러 컴포넌트
 *
 * Phase 2: 캐릭터 시스템
 * - WASD 키보드 입력 처리
 * - 캐릭터 이동 로직
 * - 애니메이션 상태 관리
 *
 * @dependencies
 * - @react-three/fiber: useFrame, useThree
 * - three: Vector3, Group
 */

"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, Group, Euler } from "three";
import { RapierRigidBody, useRapier } from "@react-three/rapier";
import { CharacterModel } from "./character-model";
import { useCharacterContext } from "./character-context";
import { CharacterPhysics } from "./character-physics";

interface CharacterControllerProps {
  position?: [number, number, number];
  speed?: number;
}

/**
 * 키보드 입력 상태 관리 Hook
 */
function useKeyboardInput() {
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    run: false,
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case "w":
        case "arrowup":
          setKeys((prev) => ({ ...prev, forward: true }));
          break;
        case "s":
        case "arrowdown":
          setKeys((prev) => ({ ...prev, backward: true }));
          break;
        case "a":
        case "arrowleft":
          setKeys((prev) => ({ ...prev, left: true }));
          break;
        case "d":
        case "arrowright":
          setKeys((prev) => ({ ...prev, right: true }));
          break;
        case "shift":
          setKeys((prev) => ({ ...prev, run: true }));
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case "w":
        case "arrowup":
          setKeys((prev) => ({ ...prev, forward: false }));
          break;
        case "s":
        case "arrowdown":
          setKeys((prev) => ({ ...prev, backward: false }));
          break;
        case "a":
        case "arrowleft":
          setKeys((prev) => ({ ...prev, left: false }));
          break;
        case "d":
        case "arrowright":
          setKeys((prev) => ({ ...prev, right: false }));
          break;
        case "shift":
          setKeys((prev) => ({ ...prev, run: false }));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return keys;
}

/**
 * 캐릭터 컨트롤러 컴포넌트 (물리 기반)
 * WASD 키로 캐릭터를 이동시킵니다.
 * Phase 3: 물리 엔진 통합으로 RigidBody 기반 이동으로 변경
 */
export function CharacterController({
  position = [0, 2, 0], // 초기 위치 (바닥 위)
  speed = 3,
}: CharacterControllerProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<Group>(null);
  const keys = useKeyboardInput();
  const [isMoving, setIsMoving] = useState(false);
  const [animation, setAnimation] = useState<"idle" | "walk" | "run">("idle");
  
  // 캐릭터 위치를 Context에 공유 (카메라가 추적할 수 있도록)
  const characterContext = useCharacterContext();

  useFrame((state, delta) => {
    if (!rigidBodyRef.current || !groupRef.current) return;

    const moveSpeed = keys.run ? speed * 1.5 : speed;
    const direction = new Vector3();
    let isMovingThisFrame = false;

    // 이동 방향 계산
    if (keys.forward) {
      direction.z -= 1;
      isMovingThisFrame = true;
    }
    if (keys.backward) {
      direction.z += 1;
      isMovingThisFrame = true;
    }
    if (keys.left) {
      direction.x -= 1;
      isMovingThisFrame = true;
    }
    if (keys.right) {
      direction.x += 1;
      isMovingThisFrame = true;
    }

    // 물리 기반 이동 처리
    if (isMovingThisFrame && direction.length() > 0) {
      direction.normalize();
      
      // 현재 속도 가져오기
      const currentVelocity = rigidBodyRef.current.linvel();
      
      // 이동 방향으로 힘 적용 (X, Z축만)
      const impulse = new Vector3(
        direction.x * moveSpeed - currentVelocity.x * 0.5,
        0, // Y축은 중력에 맡김
        direction.z * moveSpeed - currentVelocity.z * 0.5
      );
      
      rigidBodyRef.current.setLinvel(
        new Vector3(impulse.x, currentVelocity.y, impulse.z),
        true
      );
      
      // 캐릭터가 이동 방향을 바라보도록 회전
      if (direction.length() > 0.01) {
        const angle = Math.atan2(direction.x, direction.z);
        groupRef.current.rotation.y = angle;
        characterContext.characterRotationRef.current = angle;
      }

      // 애니메이션 상태 업데이트
      if (!isMoving) {
        setIsMoving(true);
      }
      setAnimation(keys.run ? "run" : "walk");
    } else {
      // 정지 상태: 속도를 점진적으로 감소
      const currentVelocity = rigidBodyRef.current.linvel();
      rigidBodyRef.current.setLinvel(
        new Vector3(
          currentVelocity.x * 0.8, // X축 속도 감소
          currentVelocity.y, // Y축은 중력 유지
          currentVelocity.z * 0.8  // Z축 속도 감소
        ),
        true
      );

      // 정지 상태
      if (isMoving) {
        setIsMoving(false);
      }
      setAnimation("idle");
    }

    // Context에 캐릭터 위치 업데이트 (카메라 추적용)
    const translation = rigidBodyRef.current.translation();
    characterContext.characterPositionRef.current.set(
      translation.x,
      translation.y,
      translation.z
    );
  });

  return (
    <CharacterPhysics position={position} rigidBodyRef={rigidBodyRef}>
      <group ref={groupRef}>
        <CharacterModel animation={animation} />
      </group>
    </CharacterPhysics>
  );
}

