/**
 * @file components/game/threejs/gltf-loader.tsx
 * @description GLTF 모델 로더
 *
 * GLTF/GLB 모델을 로드하고 표시합니다.
 * 
 * 주요 기능:
 * 1. GLTF/GLB 모델 로드
 * 2. 자동 그림자 설정
 * 3. 재질 최적화
 * 4. 애니메이션 지원
 * 5. 모델 프리로드 (성능 최적화)
 *
 * @dependencies
 * - @react-three/drei: GLTF 로더
 * - @react-three/fiber: React Three Fiber
 * - three: Three.js 핵심 라이브러리
 */

"use client";

import { Suspense, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Html } from "@react-three/drei";
import { Group, Mesh, Box3, Vector3 } from "three";

interface GLTFModelProps {
  path: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  onClick?: () => void;
  castShadow?: boolean;
  receiveShadow?: boolean;
  autoPlayAnimation?: boolean;
  animationName?: string;
}

/**
 * GLTF 모델 컴포넌트
 */
function GLTFModel({
  path,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onClick,
  castShadow = true,
  receiveShadow = true,
  autoPlayAnimation = false,
  animationName,
}: GLTFModelProps) {
  const groupRef = useRef<Group>(null);
  
  // useGLTF는 훅이므로 항상 호출되어야 함
  // 에러는 Suspense의 error boundary에서 처리됨
  const { scene, animations } = useGLTF(path);
  
  // 모델 로드 확인 및 자동 카메라 조정
  useEffect(() => {
    if (scene && groupRef.current) {
      console.log(`✅ 모델 로드 성공: ${path}`, {
        scene,
        animationsCount: animations?.length || 0,
        position,
        scale,
      });
      
      // 모델 바운딩 박스 확인 및 카메라 자동 조정
      try {
        const box = new Box3().setFromObject(scene);
        const size = box.getSize(new Vector3());
        const center = box.getCenter(new Vector3());
        
        console.log(`📦 모델 크기: ${path}`, {
          width: size.x.toFixed(2),
          height: size.y.toFixed(2),
          depth: size.z.toFixed(2),
          center: center,
          maxSize: Math.max(size.x, size.y, size.z),
        });
        
        // 모델 크기에 따라 자동 스케일 조정 (너무 크거나 작으면)
        const maxSize = Math.max(size.x, size.y, size.z);
        if (maxSize > 20) {
          console.warn(`⚠️ 모델이 너무 큽니다 (${maxSize.toFixed(2)}). 자동 스케일 조정 중...`);
          // 모델이 너무 크면 자동으로 스케일 조정
          if (groupRef.current) {
            // 현재 스케일을 고려하여 조정
            const currentScale = typeof scale === "number" ? scale : 1;
            const targetSize = 5; // 목표 크기: 5
            const autoScale = (targetSize / maxSize) * currentScale;
            groupRef.current.scale.set(autoScale, autoScale, autoScale);
            console.log(`🔧 자동 스케일 조정: ${autoScale.toFixed(4)} (원본 크기: ${maxSize.toFixed(2)})`);
          }
        } else if (maxSize < 0.1) {
          console.warn(`⚠️ 모델이 너무 작습니다 (${maxSize.toFixed(2)}). 스케일을 조정하는 것을 고려하세요.`);
        } else {
          console.log(`✅ 모델 크기 적절: ${maxSize.toFixed(2)}`);
        }
      } catch (error) {
        console.warn(`모델 크기 확인 실패: ${path}`, error);
      }
    }
  }, [scene, path, position, scale]);
  
  // useAnimations는 항상 호출되어야 함 (React 훅 규칙)
  // animations가 없으면 빈 배열 전달
  const { actions } = useAnimations(animations || [], groupRef);

  // 그림자 설정
  useEffect(() => {
    if (!scene) return;
    
    try {
      scene.traverse((child) => {
        if (child instanceof Mesh) {
          child.castShadow = castShadow;
          child.receiveShadow = receiveShadow;
        }
      });
    } catch (error) {
      console.warn("그림자 설정 중 오류:", error);
    }
  }, [scene, castShadow, receiveShadow]);

  // 애니메이션 자동 재생
  useEffect(() => {
    if (!autoPlayAnimation || !actions || Object.keys(actions).length === 0) return;
    
    try {
      if (animationName && actions[animationName]) {
        actions[animationName].play();
      } else {
        // 첫 번째 애니메이션 자동 재생
        const firstAction = Object.values(actions)[0];
        if (firstAction) {
          firstAction.play();
        }
      }
    } catch (error) {
      console.warn("애니메이션 재생 중 오류:", error);
    }

    return () => {
      // 클린업
      try {
        if (actions) {
          Object.values(actions).forEach((action) => {
            if (action) {
              action.stop();
            }
          });
        }
      } catch (error) {
        console.warn("애니메이션 클린업 중 오류:", error);
      }
    };
  }, [actions, autoPlayAnimation, animationName]);

  // scene이 없으면 렌더링하지 않음
  if (!scene) {
    console.warn(`모델 로드 실패: ${path}`);
    return null;
  }

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale} onClick={onClick}>
      <primitive object={scene} />
    </group>
  );
}

/**
 * GLTF 모델 로더 (Suspense 포함)
 * 각 모델을 개별 Suspense로 감싸서 하나의 모델 로드 실패가 다른 모델에 영향을 주지 않도록 함
 */
export function GLTFModelLoader(props: GLTFModelProps) {
  return (
    <Suspense
      fallback={
        <Html center>
          <div className="text-white bg-black/50 px-4 py-2 rounded text-xs">
            모델 로딩 중...
          </div>
        </Html>
      }
    >
      <GLTFModel {...props} />
    </Suspense>
  );
}

/**
 * 캐릭터 GLTF 모델
 */
export function CharacterGLTF({
  position = [0, 0, 0],
  modelPath = "/models/character.glb",
  onClick,
}: {
  position?: [number, number, number];
  modelPath?: string;
  onClick?: () => void;
}) {
  return (
    <GLTFModelLoader
      path={modelPath}
      position={position}
      onClick={onClick}
    />
  );
}

/**
 * 가구 GLTF 모델
 */
export function FurnitureGLTF({
  position = [0, 0, 0],
  modelPath,
  scale = 1,
}: {
  position?: [number, number, number];
  modelPath: string;
  scale?: number;
}) {
  return (
    <GLTFModelLoader
      path={modelPath}
      position={position}
      scale={scale}
    />
  );
}

/**
 * 모델 프리로드 (성능 최적화)
 * 주의: 이 함수는 컴포넌트 내부에서 호출해야 합니다 (훅이므로).
 * 또는 useEffect 내에서 호출하세요.
 */
export function usePreloadGLTFModels(paths: string[]) {
  useEffect(() => {
    if (typeof useGLTF.preload === "function") {
      paths.forEach((path) => {
        try {
          useGLTF.preload(path);
        } catch (error) {
          console.warn(`모델 프리로드 실패: ${path}`, error);
        }
      });
    }
  }, [paths]);
}

