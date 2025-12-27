/**
 * @file components/game/threejs/family-members.tsx
 * @description 반려동물 3D 모델 컴포넌트
 *
 * 아파트 내부에 강아지(dog.glb)를 배치합니다.
 *
 * @dependencies
 * - @react-three/drei: useGLTF
 * - three: Group, Mesh, Box3, Vector3
 */

"use client";

import { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { Group, Mesh, Box3, Vector3 } from "three";

/**
 * 강아지 모델 컴포넌트
 */
function DogModel() {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF("/models/dog.glb");

  // 모델 로드 및 위치 조정
  useEffect(() => {
    if (!scene || !groupRef.current) return;

    // 모델 바운딩 박스 계산
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());

    console.log("🐕 강아지 모델 정보:", {
      size: { x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2) },
      center: { x: center.x.toFixed(2), y: center.y.toFixed(2), z: center.z.toFixed(2) },
    });

    // 그림자 설정
    scene.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // 강아지를 가족 옆에 배치 (약간 오른쪽 앞)
    const floorY = box.min.y;
    groupRef.current.position.set(1.5 - center.x, -floorY, 0.5 - center.z);

    console.log("✅ 강아지 모델 배치 완료");
  }, [scene]);

  // 모델 프리로드
  useEffect(() => {
    useGLTF.preload("/models/dog.glb");
  }, []);

  if (!scene) return null;

  return (
    <group ref={groupRef}>
      <primitive object={scene.clone()} />
    </group>
  );
}

/**
 * 반려동물 메인 컴포넌트
 */
export function FamilyMembers() {
  return (
    <group>
      {/* 강아지 모델 */}
      <DogModel />
    </group>
  );
}
