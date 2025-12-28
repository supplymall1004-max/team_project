/**
 * @file components/game/threejs/house-interior.tsx
 * @description 아파트 내부 3D 모델 컴포넌트
 *
 * apartment-interior.glb 모델을 로드하고 재질을 수정합니다.
 * - 천장을 투명하게 설정
 * - 벽은 외부에서만 보이도록 설정 (one-way transparency)
 * - 구조물이 잘 보이도록 조명 조정
 *
 * @dependencies
 * - @react-three/drei: useGLTF
 * - @react-three/fiber: useFrame, useThree
 * - three: Mesh, MeshStandardMaterial, Vector3
 */

"use client";

import { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, Mesh, MeshStandardMaterial, Vector3, Box3 } from "three";

/**
 * 아파트 내부 컴포넌트
 * apartment-interior.glb 모델을 로드하고 재질을 수정합니다.
 * 
 * 주의: 모델 파일이 없을 경우 ErrorBoundary에서 처리됩니다.
 * 이 컴포넌트는 ErrorBoundary로 감싸서 사용해야 합니다.
 */
export function HouseInterior() {
  const groupRef = useRef<Group>(null);
  // useGLTF는 훅이므로 항상 호출되어야 함
  // 에러는 ErrorBoundary에서 처리됨
  const { scene } = useGLTF("/models/apartment-interior.glb");
  const { camera } = useThree();

  // 모델 재질 수정
  useEffect(() => {
    if (!scene) return;

    console.log("🏠 아파트 내부 모델 로드 완료, 재질 수정 시작");

    // 모든 메시와 재질 정보를 로깅하여 구조 파악
    const meshInfo: Array<{ name: string; materialName: string; position: Vector3 }> = [];
    
    scene.traverse((child) => {
      if (child instanceof Mesh && child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach((mat) => {
          const material = mat as MeshStandardMaterial;
          if (!material) return;

          const meshName = child.name.toLowerCase();
          const materialName = material.name?.toLowerCase() || "";
          const position = new Vector3();
          child.getWorldPosition(position);

          meshInfo.push({
            name: child.name || "unnamed",
            materialName: material.name || "unnamed",
            position: position,
          });
        });
      }
    });

    console.log("📋 모델 구조 정보:", meshInfo);

    // 모델의 모든 메시를 순회하며 재질 수정
    scene.traverse((child) => {
      if (child instanceof Mesh && child.material) {
        // 재질이 배열인 경우 처리
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach((mat) => {
          const material = mat as MeshStandardMaterial;
          if (!material) return;

          // 기본적으로 재질을 보이도록 설정 (투명하지 않음)
          if (!material.transparent) {
            material.transparent = false;
            material.opacity = 1.0;
          }

          // 재질 이름이나 메시 이름으로 천장과 벽 구분
          const meshName = child.name.toLowerCase();
          const materialName = material.name?.toLowerCase() || "";
          const position = new Vector3();
          child.getWorldPosition(position);

          // 천장 찾기 (Y축 위치가 높은 메시 또는 이름에 ceiling, roof 등 포함)
          const isHighPosition = position.y > 2.5; // 높은 위치의 메시
          if (
            isHighPosition ||
            meshName.includes("ceiling") ||
            meshName.includes("roof") ||
            meshName.includes("top") ||
            meshName.includes("천장") ||
            materialName.includes("ceiling") ||
            materialName.includes("roof") ||
            materialName.includes("top")
          ) {
            // 천장을 투명하게
            material.transparent = true;
            material.opacity = 0.1; // 약간 보이도록
            material.depthWrite = false;
            material.side = 2; // DoubleSide
            console.log("✅ 천장 재질 수정:", meshName, materialName, `Y: ${position.y.toFixed(2)}`);
          }
          // 벽 찾기 (수직 방향의 메시 또는 이름에 wall 등 포함)
          else if (
            meshName.includes("wall") ||
            meshName.includes("exterior") ||
            meshName.includes("외벽") ||
            materialName.includes("wall") ||
            materialName.includes("exterior")
          ) {
            // 벽은 외부에서만 보이도록 (기본값 설정)
            material.transparent = true;
            material.opacity = 0.5; // 외부에서 보이도록
            material.side = 2; // DoubleSide로 양면 렌더링
            material.depthWrite = false;
            console.log("✅ 벽 재질 수정:", meshName, materialName);
          }
        });

        // 모든 메시에 그림자 설정
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    console.log("✅ 재질 수정 완료");
  }, [scene]);

  // 카메라 위치에 따라 벽 투명도 조정 (one-way transparency 효과)
  useFrame(() => {
    if (!scene || !camera) return;

    const cameraPosition = new Vector3();
    camera.getWorldPosition(cameraPosition);

    // 모델의 중심점 계산
    const modelCenter = new Vector3();
    if (groupRef.current) {
      groupRef.current.getWorldPosition(modelCenter);
    }

    // 카메라가 모델 내부에 있는지 외부에 있는지 판단
    // 모델 바운딩 박스를 사용하여 더 정확하게 판단
    const isInside = cameraPosition.y < modelCenter.y + 3; // 모델 내부 기준 (Y축 높이)

    scene.traverse((child) => {
      if (child instanceof Mesh && child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach((mat) => {
          const material = mat as MeshStandardMaterial;
          if (!material) return;

          const meshName = child.name.toLowerCase();
          const materialName = material.name?.toLowerCase() || "";

          // 벽 재질인 경우
          if (
            meshName.includes("wall") ||
            meshName.includes("exterior") ||
            materialName.includes("wall") ||
            materialName.includes("exterior")
          ) {
            // 카메라가 내부에 있으면 벽을 더 투명하게 (밖이 안보임)
            if (isInside) {
              material.opacity = 0.05; // 내부에서 밖이 거의 안보임
            } else {
              material.opacity = 0.6; // 외부에서 안이 잘 보임
            }
          }
        });
      }
    });
  });

  // 모델 스케일 및 위치 조정
  useEffect(() => {
    if (scene && groupRef.current) {
      // 모델 바운딩 박스 계산
      const box = new Box3().setFromObject(scene);
      const size = box.getSize(new Vector3());
      const center = box.getCenter(new Vector3());

      console.log("📦 모델 바운딩 박스:", {
        size: { x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2) },
        center: { x: center.x.toFixed(2), y: center.y.toFixed(2), z: center.z.toFixed(2) },
        maxSize: Math.max(size.x, size.y, size.z).toFixed(2),
      });

      // 모델이 너무 크거나 작으면 스케일 조정
      const maxSize = Math.max(size.x, size.y, size.z);
      if (maxSize > 20) {
        const scale = 5 / maxSize; // 목표 크기: 5
        groupRef.current.scale.set(scale, scale, scale);
        console.log(`🔧 모델 스케일 조정: ${scale.toFixed(4)} (원본 크기: ${maxSize.toFixed(2)})`);
      } else if (maxSize < 0.1) {
        const scale = 5 / maxSize; // 목표 크기: 5
        groupRef.current.scale.set(scale, scale, scale);
        console.log(`🔧 모델 스케일 조정: ${scale.toFixed(4)} (원본 크기: ${maxSize.toFixed(2)})`);
      } else {
        groupRef.current.scale.set(1, 1, 1);
      }

      // 모델을 원점으로 이동 (중심점 기준)
      groupRef.current.position.set(-center.x, -center.y, -center.z);

      console.log("✅ 아파트 내부 모델 위치 및 스케일 설정 완료");
    }
  }, [scene]);

  // 모델 프리로드
  useEffect(() => {
    try {
      useGLTF.preload("/models/apartment-interior.glb");
    } catch (error) {
      // 프리로드 실패는 무시 (실제 로드 시 ErrorBoundary에서 처리)
      console.warn("⚠️ [HouseInterior] 모델 프리로드 실패 (무시됨):", error);
    }
  }, []);

  // 모델이 없으면 null 반환
  if (!scene) {
    return null;
  }

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

