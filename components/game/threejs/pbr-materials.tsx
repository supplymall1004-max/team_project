/**
 * @file components/game/threejs/pbr-materials.tsx
 * @description PBR (Physically Based Rendering) 재질 시스템
 *
 * 현실적인 재질 표현을 위한 PBR 재질을 제공합니다.
 * 
 * 주요 기능:
 * 1. MeshStandardMaterial (PBR 기본 재질)
 * 2. 텍스처 맵핑 (Diffuse, Normal, Roughness, Metalness)
 * 3. 재질 프리셋 (나무, 금속, 플라스틱 등)
 *
 * @dependencies
 * - @react-three/fiber: React Three Fiber
 * - three: Three.js 핵심 라이브러리
 */

"use client";

import { useMemo } from "react";
import { MeshStandardMaterial, TextureLoader, RepeatWrapping } from "three";

/**
 * PBR 재질 프리셋 타입
 */
export type MaterialPreset = 
  | "wood" 
  | "metal" 
  | "plastic" 
  | "fabric" 
  | "ceramic" 
  | "glass"
  | "rubber";

/**
 * PBR 재질 설정 인터페이스
 */
interface PBRMaterialConfig {
  color?: string;
  roughness?: number; // 0 (매끄러움) ~ 1 (거침)
  metalness?: number; // 0 (비금속) ~ 1 (금속)
  emissive?: string;
  emissiveIntensity?: number;
  normalScale?: number;
  aoMapIntensity?: number;
}

/**
 * 재질 프리셋 설정
 */
const materialPresets: Record<MaterialPreset, PBRMaterialConfig> = {
  wood: {
    color: "#8B4513",
    roughness: 0.8,
    metalness: 0.0,
  },
  metal: {
    color: "#C0C0C0",
    roughness: 0.2,
    metalness: 0.9,
  },
  plastic: {
    color: "#FFFFFF",
    roughness: 0.4,
    metalness: 0.0,
  },
  fabric: {
    color: "#F5F5DC",
    roughness: 0.9,
    metalness: 0.0,
  },
  ceramic: {
    color: "#FFFFFF",
    roughness: 0.1,
    metalness: 0.0,
  },
  glass: {
    color: "#E0F7FA",
    roughness: 0.0,
    metalness: 0.0,
  },
  rubber: {
    color: "#2C2C2C",
    roughness: 0.9,
    metalness: 0.0,
  },
};

/**
 * PBR 재질 생성 함수
 */
export function createPBRMaterial(
  preset: MaterialPreset,
  config?: Partial<PBRMaterialConfig>
): MeshStandardMaterial {
  const presetConfig = materialPresets[preset];
  const finalConfig = { ...presetConfig, ...config };

  const material = new MeshStandardMaterial({
    color: finalConfig.color,
    roughness: finalConfig.roughness,
    metalness: finalConfig.metalness,
    emissive: finalConfig.emissive,
    emissiveIntensity: finalConfig.emissiveIntensity || 0,
  });

  return material;
}

/**
 * 텍스처를 사용한 PBR 재질 생성
 */
export function createTexturedPBRMaterial(
  preset: MaterialPreset,
  texturePaths?: {
    diffuse?: string;
    normal?: string;
    roughness?: string;
    metalness?: string;
    ao?: string;
  },
  config?: Partial<PBRMaterialConfig>
): MeshStandardMaterial {
  const presetConfig = materialPresets[preset];
  const finalConfig = { ...presetConfig, ...config };
  const loader = new TextureLoader();

  const material = new MeshStandardMaterial({
    color: finalConfig.color,
    roughness: finalConfig.roughness,
    metalness: finalConfig.metalness,
    emissive: finalConfig.emissive,
    emissiveIntensity: finalConfig.emissiveIntensity || 0,
  });

  // Diffuse 텍스처
  if (texturePaths?.diffuse) {
    const texture = loader.load(texturePaths.diffuse);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    material.map = texture;
  }

  // Normal 텍스처
  if (texturePaths?.normal) {
    const texture = loader.load(texturePaths.normal);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    material.normalMap = texture;
    material.normalScale = new (require("three").Vector2)(finalConfig.normalScale || 1, finalConfig.normalScale || 1);
  }

  // Roughness 텍스처
  if (texturePaths?.roughness) {
    const texture = loader.load(texturePaths.roughness);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    material.roughnessMap = texture;
  }

  // Metalness 텍스처
  if (texturePaths?.metalness) {
    const texture = loader.load(texturePaths.metalness);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    material.metalnessMap = texture;
  }

  // AO (Ambient Occlusion) 텍스처
  if (texturePaths?.ao) {
    const texture = loader.load(texturePaths.ao);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    material.aoMap = texture;
    material.aoMapIntensity = finalConfig.aoMapIntensity || 1;
  }

  return material;
}

/**
 * 재질 프리셋 훅
 */
export function usePBRMaterial(
  preset: MaterialPreset,
  config?: Partial<PBRMaterialConfig>
) {
  return useMemo(() => createPBRMaterial(preset, config), [preset, config]);
}

