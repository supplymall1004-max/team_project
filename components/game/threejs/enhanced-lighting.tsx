/**
 * @file components/game/threejs/enhanced-lighting.tsx
 * @description 향상된 조명 시스템
 *
 * Soft Shadows, PBR 조명, 시간대별 조명 변화를 제공합니다.
 * 
 * 주요 기능:
 * 1. Soft Shadows (부드러운 그림자)
 * 2. DirectionalLight 최적화
 * 3. AmbientLight 조정
 * 4. 시간대별 조명 색상 변화
 * 5. 포인트 라이트 추가
 *
 * @dependencies
 * - @react-three/fiber: React Three Fiber
 * - @react-three/drei: 유틸리티 컴포넌트
 * - three: Three.js 핵심 라이브러리
 */

"use client";

import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";

interface EnhancedLightingProps {
  timeOfDay?: "morning" | "afternoon" | "evening" | "night";
  enableShadows?: boolean;
  shadowQuality?: "low" | "medium" | "high";
}

/**
 * 시간대별 조명 색상 및 강도 설정
 */
const getTimeOfDayLighting = (timeOfDay: string) => {
  switch (timeOfDay) {
    case "morning":
      return {
        ambientColor: "#FFF8DC", // 따뜻한 아침 빛
        ambientIntensity: 0.5,
        directionalColor: "#FFE4B5", // 부드러운 햇빛
        directionalIntensity: 1.2,
        directionalPosition: [5, 10, 5] as [number, number, number],
      };
    case "afternoon":
      return {
        ambientColor: "#FFFFFF", // 밝은 낮 빛
        ambientIntensity: 0.6,
        directionalColor: "#FFFFFF", // 강한 햇빛
        directionalIntensity: 1.5,
        directionalPosition: [5, 12, 5] as [number, number, number],
      };
    case "evening":
      return {
        ambientColor: "#FFA07A", // 따뜻한 저녁 빛
        ambientIntensity: 0.4,
        directionalColor: "#FF8C00", // 노을빛
        directionalIntensity: 1.0,
        directionalPosition: [3, 8, -3] as [number, number, number],
      };
    case "night":
      return {
        ambientColor: "#4169E1", // 차가운 밤 빛
        ambientIntensity: 0.2,
        directionalColor: "#87CEEB", // 달빛
        directionalIntensity: 0.5,
        directionalPosition: [-3, 6, 3] as [number, number, number],
      };
    default:
      return {
        ambientColor: "#FFFFFF",
        ambientIntensity: 0.5,
        directionalColor: "#FFFFFF",
        directionalIntensity: 1.0,
        directionalPosition: [5, 10, 5] as [number, number, number],
      };
  }
};

/**
 * 그림자 품질 설정
 */
const getShadowSettings = (quality: "low" | "medium" | "high") => {
  switch (quality) {
    case "low":
      return {
        mapSize: 1024,
        cameraNear: 0.5,
        cameraFar: 50,
        cameraLeft: -10,
        cameraRight: 10,
        cameraTop: 10,
        cameraBottom: -10,
        bias: -0.0001,
        radius: 2,
      };
    case "medium":
      return {
        mapSize: 2048,
        cameraNear: 0.5,
        cameraFar: 50,
        cameraLeft: -10,
        cameraRight: 10,
        cameraTop: 10,
        cameraBottom: -10,
        bias: -0.0001,
        radius: 4,
      };
    case "high":
      return {
        mapSize: 4096,
        cameraNear: 0.5,
        cameraFar: 50,
        cameraLeft: -10,
        cameraRight: 10,
        cameraTop: 10,
        cameraBottom: -10,
        bias: -0.0001,
        radius: 8,
      };
    default:
      return {
        mapSize: 2048,
        cameraNear: 0.5,
        cameraFar: 50,
        cameraLeft: -10,
        cameraRight: 10,
        cameraTop: 10,
        cameraBottom: -10,
        bias: -0.0001,
        radius: 4,
      };
  }
};

/**
 * 향상된 조명 시스템 컴포넌트
 */
export function EnhancedLighting({
  timeOfDay = "afternoon",
  enableShadows = true,
  shadowQuality = "medium",
}: EnhancedLightingProps) {
  const { gl, scene } = useThree();
  const lighting = getTimeOfDayLighting(timeOfDay);
  const shadowSettings = getShadowSettings(shadowQuality);

  // 렌더러 그림자 설정은 Canvas의 shadows prop으로 처리됨
  // 여기서는 별도 설정 불필요 (Canvas에서 이미 shadows prop으로 설정됨)

  return (
    <>
      {/* 주 조명 (DirectionalLight - 햇빛 효과) */}
      <directionalLight
        position={lighting.directionalPosition}
        intensity={lighting.directionalIntensity}
        color={lighting.directionalColor}
        castShadow={enableShadows}
        shadow-mapSize-width={shadowSettings.mapSize}
        shadow-mapSize-height={shadowSettings.mapSize}
        shadow-camera-near={shadowSettings.cameraNear}
        shadow-camera-far={shadowSettings.cameraFar}
        shadow-camera-left={shadowSettings.cameraLeft}
        shadow-camera-right={shadowSettings.cameraRight}
        shadow-camera-top={shadowSettings.cameraTop}
        shadow-camera-bottom={shadowSettings.cameraBottom}
        shadow-bias={shadowSettings.bias}
        shadow-radius={shadowSettings.radius}
      />

      {/* 환경광 (AmbientLight - 전체적인 밝기) */}
      <ambientLight
        intensity={lighting.ambientIntensity}
        color={lighting.ambientColor}
      />

      {/* 포인트 라이트 (창문에서 들어오는 빛) */}
      <pointLight
        position={[2, 3, -4]}
        intensity={timeOfDay === "night" ? 0.3 : 0.6}
        color={timeOfDay === "evening" ? "#FFA07A" : "#FFF8DC"}
        distance={10}
        decay={2}
      />

      {/* 스포트 라이트 (벽난로 불꽃 효과) */}
      {timeOfDay === "night" && (
        <spotLight
          position={[2, 1.5, -4.5]}
          angle={0.3}
          penumbra={0.5}
          intensity={0.8}
          color="#FF4500"
          castShadow={false}
          distance={8}
          decay={2}
        />
      )}

      {/* 보조 조명 (반대편에서 약한 빛) */}
      <directionalLight
        position={[-3, 5, -3]}
        intensity={0.3}
        color="#E0E0E0"
        castShadow={false}
      />
    </>
  );
}

/**
 * 시간대별 자동 조명 시스템
 */
export function AutoTimeLighting({ enableShadows = true }: { enableShadows?: boolean }) {
  const [timeOfDay, setTimeOfDay] = useState<"morning" | "afternoon" | "evening" | "night">("afternoon");

  useEffect(() => {
    // 현재 시간에 따라 조명 변경
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      setTimeOfDay("morning");
    } else if (hour >= 12 && hour < 18) {
      setTimeOfDay("afternoon");
    } else if (hour >= 18 && hour < 22) {
      setTimeOfDay("evening");
    } else {
      setTimeOfDay("night");
    }
  }, []);

  return <EnhancedLighting timeOfDay={timeOfDay} enableShadows={enableShadows} />;
}

