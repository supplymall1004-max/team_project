/**
 * @file components/game/threejs/performance-optimizer.tsx
 * @description 성능 최적화 컴포넌트
 *
 * Phase 7: 성능 최적화
 * - 프러스텀 컬링 최적화
 * - 그림자 품질 조정
 * - 렌더링 최적화
 *
 * @dependencies
 * - @react-three/fiber: useThree, useFrame
 * - three: PerspectiveCamera, Frustum
 */

"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "three";

interface PerformanceOptimizerProps {
  enableFrustumCulling?: boolean;
  shadowMapSize?: number;
  maxRenderDistance?: number;
}

/**
 * 성능 최적화 컴포넌트
 * 렌더링 성능을 최적화합니다.
 */
export function PerformanceOptimizer({
  enableFrustumCulling = true,
  shadowMapSize = 1024, // 기본값을 1024로 낮춰서 성능 향상
  maxRenderDistance = 100,
}: PerformanceOptimizerProps) {
  const { camera, gl, scene } = useThree();

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;

    console.group("⚡ 성능 최적화 설정");

    // 프러스텀 컬링 활성화
    if (enableFrustumCulling) {
      camera.far = maxRenderDistance;
      camera.updateProjectionMatrix();
      console.log(`✅ 프러스텀 컬링 활성화: maxRenderDistance=${maxRenderDistance}`);
    }

    // 그림자 맵 크기 조정
    scene.traverse((child) => {
      if (child.type === "DirectionalLight" && "shadow" in child) {
        const light = child as any;
        if (light.shadow) {
          light.shadow.mapSize.width = shadowMapSize;
          light.shadow.mapSize.height = shadowMapSize;
        }
      }
    });

    console.log(`✅ 그림자 맵 크기 조정: ${shadowMapSize}x${shadowMapSize}`);

    // 렌더러 최적화
    const currentPixelRatio = window.devicePixelRatio;
    const newPixelRatio = Math.min(currentPixelRatio, 2); // 최대 2배까지만
    gl.setPixelRatio(newPixelRatio);
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = 1; // PCFSoftShadowMap

    console.log(`✅ 렌더러 최적화 완료: pixelRatio=${newPixelRatio} (원래: ${currentPixelRatio})`);

    console.groupEnd();
  }, [camera, gl, scene, enableFrustumCulling, shadowMapSize, maxRenderDistance]);

  return null;
}
