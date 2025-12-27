/**
 * @file components/game/threejs-game-canvas.tsx
 * @description Three.js 기반 3D 게임 캔버스 컴포넌트
 *
 * Unity 대신 Three.js를 사용하여 3D 게임을 구현합니다.
 * React Three Fiber를 사용하여 React 컴포넌트처럼 사용할 수 있습니다.
 *
 * 주요 기능:
 * 1. 3D 씬 렌더링
 * 2. 3D 캐릭터 표시
 * 3. 인터랙티브 환경
 * 4. 이벤트 시스템 통합
 *
 * @dependencies
 * - @react-three/fiber: React Three Fiber
 * - @react-three/drei: 유틸리티 컴포넌트
 * - three: Three.js 핵심 라이브러리
 */

"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Html,
} from "@react-three/drei";
import { Vector3 } from "three";
import type { CharacterData } from "@/types/character";
import { AutoTimeLighting } from "./threejs/enhanced-lighting";
import { ApartmentScene } from "./threejs/apartment-scene";
import { ModelCredits } from "./threejs/model-credits";
import { ApartmentUIOverlay } from "./threejs/apartment-ui-overlay";

interface ThreeJSGameCanvasProps {
  characterData: CharacterData;
  onCharacterClick?: () => void;
  onEventTrigger?: (eventType: string) => void;
  familyMembers?: Array<{
    id: string;
    member_type?: string | null;
    pet_type?: string | null;
  }>;
}

/**
 * Three.js 게임 씬
 */
function GameScene({
  characterData,
  familyMembers,
  currentScene,
}: ThreeJSGameCanvasProps & {
  currentScene: "apartment" | "city";
}) {
  const { camera } = useThree();

  // 카메라 초기 위치 설정 (씬에 따라 다르게)
  useEffect(() => {
    // 약간의 지연을 두고 카메라 위치 설정 (모델 로드 후)
    const timer = setTimeout(() => {
      if (currentScene === "apartment") {
        // 아파트 내부: 카메라를 아파트 내부 중앙에 배치
        // 내부 공간을 보기 위해 카메라를 내부로 이동
        camera.position.set(0, 1.5, 0);
        camera.lookAt(2, 1.5, 2); // 내부 공간을 향하도록 타겟 설정
        console.log("📷 아파트 내부 카메라 위치 설정 (내부 중앙):", camera.position);
      } else {
        camera.position.set(0, 5, 10);
        camera.lookAt(0, 0, 0);
        console.log("📷 도시뷰 카메라 위치 설정:", camera.position);
      }
    }, 500); // 모델 로드를 위해 더 긴 지연
    
    return () => clearTimeout(timer);
  }, [camera, currentScene]);


  return (
    <>
      {/* 향상된 조명 시스템 (Soft Shadows 포함) */}
      <AutoTimeLighting enableShadows={true} />
      
      {/* 아파트 내부 씬 (GLB 모델만) */}
      <ApartmentScene 
        familyMembers={familyMembers || []}
        communityGroupId={undefined}
      />
      
      {/* 매우 밝은 조명 (Sketchfab처럼 실내를 잘 볼 수 있도록) */}
      <ambientLight intensity={3.0} />
      <directionalLight position={[5, 10, 5]} intensity={3.0} castShadow />
      <directionalLight position={[-5, 8, -5]} intensity={2.0} />
      <directionalLight position={[0, 5, 5]} intensity={1.5} />
      <pointLight position={[0, 2, 0]} intensity={2.0} distance={30} />
      <pointLight position={[3, 2, 3]} intensity={1.5} distance={20} />
      <pointLight position={[-3, 2, -3]} intensity={1.5} distance={20} />
      <pointLight position={[0, 3, 0]} intensity={1.5} distance={25} />
    </>
  );
}

/**
 * Three.js 게임 캔버스 메인 컴포넌트
 */
export function ThreeJSGameCanvas({
  characterData,
  onCharacterClick,
  onEventTrigger,
  familyMembers = [],
}: ThreeJSGameCanvasProps) {
  const [activeEvent, setActiveEvent] = useState<{
    message: string;
    eventType: string;
  } | null>(null);
  // 아파트 내부만 표시 (씬 전환 기능 제거)
  const currentScene: "apartment" = "apartment";
  const controlsRef = useRef<any>(null);

  // 카메라 리셋 함수
  const handleCameraReset = useCallback(() => {
    if (!controlsRef.current) return;

    const camera = controlsRef.current.object;
    const target = controlsRef.current.target;

    // 부드러운 애니메이션으로 초기 위치로 이동
    const startPosition = camera.position.clone();
    const startTarget = target.clone();
    const endPosition = new Vector3(0, 1.5, 0);
    const endTarget = new Vector3(2, 1.5, 2);

    const duration = 1000; // 1초
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing 함수 (ease-in-out)
      const eased =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      camera.position.lerpVectors(startPosition, endPosition, eased);
      target.lerpVectors(startTarget, endTarget, eased);
      controlsRef.current?.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, []);

  // 알림 클릭 핸들러
  const handleNotificationClick = useCallback((notificationId: string) => {
    console.log("알림 클릭:", notificationId);
    // TODO: 알림 상세 정보 표시 또는 알림 완료 처리
  }, []);

  // 이벤트 감지 (기존 시스템과 통합)
  useEffect(() => {
    const eventMessages: Record<string, string> = {
      medication: "약 먹을 시간이에요! 약을 주세요! 💊",
      baby_feeding: "우유가 필요해요! 🍼",
      health_checkup: "건강검진 예약이 필요해요! 🏥",
      vaccination: "예방접종을 맞아야 해요! 💉",
      lifecycle_event: "중요한 알림이 있어요! 📢",
      kcdc_alert: "질병청 알림이 있어요! ⚠️",
    };

    // 이벤트 브릿지에서 이벤트 수신
    const handleGameEvent = (data: any) => {
      console.log("🎮 3D 게임 이벤트 발생:", data);
      const message = eventMessages[data.eventType] || "알림이 있어요!";
      setActiveEvent({ message, eventType: data.eventType || "unknown" });
      
      // 10초 후 자동으로 닫기
      setTimeout(() => {
        setActiveEvent(null);
      }, 10000);
    };

    // 브릿지 이벤트 리스너 등록
    const { getCharacterGameBridge } = require("@/lib/game/character-game-bridge");
    const bridge = getCharacterGameBridge();
    bridge.on("GameEventTriggered", handleGameEvent);

    return () => {
      bridge.off("GameEventTriggered", handleGameEvent);
    };
  }, []);

  return (
    <div className="w-full">
      <div className="w-full h-[600px] bg-gradient-to-b from-blue-100 to-blue-50 rounded-lg overflow-hidden shadow-2xl relative">
        {/* 로딩 오버레이 */}
        <Canvas
          shadows
          gl={{ 
            antialias: true, 
            alpha: false,
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
          }}
          camera={{ position: [0, 1.5, 0], fov: 60 }}
          dpr={[1, 2]} // 디바이스 픽셀 비율 최적화
        >
          <color attach="background" args={["#e8e8e8"]} />
          <Suspense fallback={
            <Html center>
              <div className="text-white">로딩 중...</div>
            </Html>
          }>
            <GameScene
              characterData={characterData}
              familyMembers={familyMembers}
              currentScene={currentScene}
            />
            <OrbitControls
              ref={controlsRef}
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={0.3}
              maxDistance={8}
              minPolarAngle={0}
              maxPolarAngle={Math.PI}
              target={[2, 1.5, 2]}
              autoRotate={false}
            />
          </Suspense>
        </Canvas>
      </div>
      
      {/* UI 오버레이 */}
      <ApartmentUIOverlay
        characterData={characterData}
        familyMembers={familyMembers.map((m) => ({
          id: m.id,
          name: characterData.member.name, // TODO: 실제 가족 구성원 이름 가져오기
        }))}
        onCameraReset={handleCameraReset}
        onNotificationClick={handleNotificationClick}
      />

      {/* 모델 출처 표시 - 게임창 맨 아래 */}
      <ModelCredits />
    </div>
  );
}

