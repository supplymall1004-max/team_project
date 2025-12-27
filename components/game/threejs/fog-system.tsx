/**
 * @file components/game/threejs/fog-system.tsx
 * @description 안개 효과 시스템
 *
 * 깊이감을 주는 안개 효과를 제공합니다.
 * 
 * 주요 기능:
 * 1. Linear Fog (선형 안개)
 * 2. Exponential Fog (지수 안개)
 * 3. 시간대별 안개 색상 변화
 *
 * @dependencies
 * - @react-three/fiber: React Three Fiber
 * - three: Three.js 핵심 라이브러리
 */

"use client";

import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { Fog, FogExp2 } from "three";

interface FogSystemProps {
  type?: "linear" | "exponential";
  color?: string;
  near?: number;
  far?: number;
  density?: number;
  timeOfDay?: "morning" | "afternoon" | "evening" | "night";
}

/**
 * 시간대별 안개 색상
 */
const getFogColor = (timeOfDay: string): string => {
  switch (timeOfDay) {
    case "morning":
      return "#E6F3FF"; // 연한 파란색 (아침 안개)
    case "afternoon":
      return "#F0F8FF"; // 매우 연한 파란색 (맑은 하늘)
    case "evening":
      return "#FFE4B5"; // 따뜻한 노란색 (노을)
    case "night":
      return "#1C1C2E"; // 어두운 보라색 (밤)
    default:
      return "#F0F8FF";
  }
};

/**
 * 안개 시스템 컴포넌트
 */
export function FogSystem({
  type = "linear",
  color,
  near = 5,
  far = 20,
  density = 0.1,
  timeOfDay = "afternoon",
}: FogSystemProps) {
  const { scene } = useThree();
  const fogColor = color || getFogColor(timeOfDay);

  useEffect(() => {
    // 기존 안개 제거
    if (scene.fog) {
      scene.fog = null;
    }

    // 새 안개 추가
    if (type === "linear") {
      scene.fog = new Fog(fogColor, near, far);
    } else {
      scene.fog = new FogExp2(fogColor, density);
    }

    // 배경색도 안개 색상과 맞춤
    scene.background = new (require("three").Color)(fogColor);

    // 클린업
    return () => {
      if (scene.fog) {
        scene.fog = null;
      }
    };
  }, [scene, type, fogColor, near, far, density]);

  return null; // 이 컴포넌트는 시각적 요소가 없음
}

/**
 * 자동 시간대별 안개 시스템
 */
export function AutoTimeFog() {
  const [timeOfDay, setTimeOfDay] = useState<"morning" | "afternoon" | "evening" | "night">("afternoon");

  useEffect(() => {
    // 현재 시간에 따라 안개 색상 변경
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

  return <FogSystem timeOfDay={timeOfDay} type="linear" near={5} far={20} />;
}

