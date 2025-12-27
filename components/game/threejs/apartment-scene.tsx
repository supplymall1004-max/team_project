/**
 * @file components/game/threejs/apartment-scene.tsx
 * @description 아파트 내부 씬 컴포넌트
 *
 * 아파트 내부 모델과 가족 구성원, 반려동물을 표시합니다.
 */

"use client";

import { Suspense } from "react";
import { Html } from "@react-three/drei";
import { GLTFModelLoader } from "./gltf-loader";

interface ApartmentSceneProps {
  familyMembers?: Array<{
    id: string;
    member_type?: string | null;
    pet_type?: string | null;
  }>;
  communityGroupId?: string;
}

/**
 * 아파트 내부 씬 컴포넌트
 * 아파트 내부 모델과 가족 구성원, 반려동물을 표시합니다.
 * Sketchfab처럼 모델을 잘 볼 수 있도록 최적화되었습니다.
 */
export function ApartmentScene({ 
  familyMembers = [],
  communityGroupId,
}: ApartmentSceneProps) {
  // 가족 구성원이 있는지 확인
  const hasFamily = familyMembers.some(
    (member) => member.member_type === "adult" || member.member_type === "child"
  );
  const hasDog = familyMembers.some((member) => member.pet_type === "dog");
  const hasCat = familyMembers.some((member) => member.pet_type === "cat");

  return (
    <Suspense
      fallback={
        <Html center>
          <div className="text-white bg-black/50 px-4 py-2 rounded">
            아파트 로딩 중...
          </div>
        </Html>
      }
    >
      {/* 아파트 내부 모델 */}
      <GLTFModelLoader
        path="/models/apartment-interior.glb"
        position={[0, 0, 0]}
        scale={1}
        castShadow={true}
        receiveShadow={true}
      />

      {/* 세가족 모델 배치 (소파 위치) */}
      {hasFamily && (
        <GLTFModelLoader
          path="/models/세가족.glb"
          position={[2, 0, -1]}
          scale={1}
          rotation={[0, Math.PI / 4, 0]} // 소파를 향하도록 회전
          castShadow={true}
          receiveShadow={true}
        />
      )}

      {/* 강아지 모델 배치 (거실 중앙) */}
      {hasDog && (
        <GLTFModelLoader
          path="/models/강아지.glb"
          position={[1.5, 0, 0]}
          scale={1}
          rotation={[0, 0, 0]}
          castShadow={true}
          receiveShadow={true}
        />
      )}

      {/* 고양이 모델 배치 (거실 중앙) */}
      {hasCat && (
        <GLTFModelLoader
          path="/models/고양이.glb"
          position={[1.5, 0, 0.5]}
          scale={1}
          rotation={[0, 0, 0]}
          castShadow={true}
          receiveShadow={true}
        />
      )}
    </Suspense>
  );
}

