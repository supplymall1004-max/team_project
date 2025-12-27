/**
 * @file components/game/threejs/post-processing.tsx
 * @description 후처리 효과 시스템
 *
 * Bloom, SSAO 등 후처리 효과를 제공하여 화면 퀄리티를 향상시킵니다.
 * 
 * 주요 기능:
 * 1. Bloom 효과 (빛나는 효과)
 * 2. SSAO (Screen Space Ambient Occlusion) - 그림자 깊이감
 * 3. Color Correction (색상 보정)
 * 4. Vignette (주변 어둡게)
 *
 * @dependencies
 * - @react-three/postprocessing: 후처리 효과
 * - @react-three/fiber: React Three Fiber
 * - three: Three.js 핵심 라이브러리
 */

"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, SSAO, Vignette, ToneMapping } from "@react-three/postprocessing";

interface PostProcessingProps {
  enableBloom?: boolean;
  enableSSAO?: boolean;
  enableVignette?: boolean;
  bloomIntensity?: number;
  ssaoIntensity?: number;
}

/**
 * 후처리 효과 컴포넌트
 */
export function PostProcessing({
  enableBloom = true,
  enableSSAO = true,
  enableVignette = true,
  bloomIntensity = 0.5,
  ssaoIntensity = 1.0,
}: PostProcessingProps) {
  const { gl } = useThree();
  
  // 렌더러의 autoUpdate 속성이 boolean이 아닌지 확인
  useEffect(() => {
    if (gl && typeof gl.setAnimationLoop === "function") {
      // EffectComposer가 내부적으로 관리하므로 별도 설정 불필요
    }
  }, [gl]);

  return (
    <EffectComposer>
      {/* SSAO (Screen Space Ambient Occlusion) - 그림자 깊이감 */}
      {enableSSAO && (
        <SSAO
          intensity={ssaoIntensity}
          radius={0.4}
          bias={0.025}
          luminanceInfluence={0.9}
        />
      )}

      {/* Bloom 효과 - 빛나는 효과 */}
      {enableBloom && (
        <Bloom
          intensity={bloomIntensity}
          luminanceThreshold={0.9}
          luminanceSmoothing={0.9}
          mipmapBlur={true}
        />
      )}

      {/* Vignette - 주변 어둡게 */}
      {enableVignette && (
        <Vignette
          eskil={false}
          offset={0.1}
          darkness={0.5}
        />
      )}

      {/* Tone Mapping - 색상 보정 */}
      <ToneMapping
        adaptive={true}
        resolution={256}
        middleGrey={0.6}
        maxLuminance={16.0}
        averageLuminance={1.0}
        adaptationRate={1.0}
      />
    </EffectComposer>
  );
}

/**
 * 경량 후처리 효과 (성능 최적화)
 */
export function LightweightPostProcessing() {
  const { gl } = useThree();
  
  // 렌더러 확인
  useEffect(() => {
    if (gl && typeof gl.setAnimationLoop === "function") {
      // EffectComposer가 내부적으로 관리
    }
  }, [gl]);

  return (
    <EffectComposer>
      <Bloom
        intensity={0.3}
        luminanceThreshold={1.0}
        luminanceSmoothing={0.9}
      />
      <Vignette
        eskil={false}
        offset={0.1}
        darkness={0.3}
      />
    </EffectComposer>
  );
}

