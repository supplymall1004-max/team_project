/**
 * @file components/game/threejs/city-scene.tsx
 * @description 도시뷰 씬 컴포넌트
 *
 * 도시 외부 뷰를 표시합니다.
 */

"use client";

import { Suspense } from "react";
import { Html } from "@react-three/drei";
import { GLTFModelLoader } from "./gltf-loader";

/**
 * 도시뷰 씬 컴포넌트
 */
export function CityScene() {
  return (
    <Suspense
      fallback={
        <Html center>
          <div className="text-white bg-black/50 px-4 py-2 rounded">
            도시 로딩 중...
          </div>
        </Html>
      }
    >
      {/* 도시뷰 모델 */}
      <GLTFModelLoader
        path="/models/도시뷰.glb"
        position={[0, 0, 0]}
        scale={1}
        castShadow={true}
        receiveShadow={true}
      />
    </Suspense>
  );
}

