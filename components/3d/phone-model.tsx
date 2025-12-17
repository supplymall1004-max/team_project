/**
 * @file phone-model.tsx
 * @description 고퀄리티 3D 핸드폰 모델 컴포넌트
 *
 * 이 컴포넌트는 Three.js를 사용하여 3D 핸드폰 모델을 렌더링합니다.
 * 홈페이지 화면을 핸드폰 액정 부분에 텍스처로 매핑합니다.
 *
 * 주요 기능:
 * 1. 3D 핸드폰 모델 렌더링 (기하체 기반)
 * 2. 홈페이지 화면을 텍스처로 매핑
 * 3. 마우스 상호작용 (회전, 확대/축소)
 * 4. 조명 및 그림자 효과
 *
 * @dependencies
 * - @react-three/fiber: React에서 Three.js 사용
 * - @react-three/drei: 3D 유틸리티 (카메라, 조명 등)
 * - three: 3D 그래픽 라이브러리
 */

"use client";

import { useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";
import * as THREE from "three";

/**
 * 핸드폰 본체 메시 컴포넌트
 */
function PhoneBody() {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      {/* 핸드폰 본체 (박스 형태) */}
      <boxGeometry args={[2.4, 5.2, 0.3]} />
      <meshStandardMaterial
        color="#1a1a1a"
        metalness={0.8}
        roughness={0.2}
        envMapIntensity={1}
      />
    </mesh>
  );
}

/**
 * 핸드폰 화면 컴포넌트 (홈페이지 텍스처가 표시되는 부분)
 */
function PhoneScreen({ screenTexture }: { screenTexture: THREE.Texture | null }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // 화면이 약간 앞으로 나오도록 위치 조정
  return (
    <mesh ref={meshRef} position={[0, 0, 0.16]}>
      {/* 화면 크기: 약간 작게 (베젤 고려) */}
      <planeGeometry args={[2.2, 4.8]} />
      <meshStandardMaterial
        map={screenTexture || undefined}
        emissive={screenTexture ? "#000000" : "#1a1a1a"}
        emissiveIntensity={screenTexture ? 1 : 0.1}
      />
    </mesh>
  );
}

/**
 * 3D 씬 컴포넌트
 */
function PhoneScene({ screenTexture }: { screenTexture: THREE.Texture | null }) {
  return (
    <>
      {/* 조명 설정 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />

      {/* 환경 조명 (더 자연스러운 반사) */}
      <Environment preset="sunset" />

      {/* 핸드폰 모델 */}
      <PhoneBody />
      <PhoneScreen screenTexture={screenTexture} />

      {/* 카메라 컨트롤 */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={8}
        maxDistance={15}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        autoRotate={false}
        autoRotateSpeed={0.5}
      />
    </>
  );
}


/**
 * 3D 핸드폰 모델 메인 컴포넌트
 */
interface PhoneModelProps {
  screenTexture: THREE.Texture | null;
  className?: string;
}

export function PhoneModel({ screenTexture, className = "" }: PhoneModelProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        shadows
        gl={{ antialias: true, alpha: true }}
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
          <PhoneScene screenTexture={screenTexture} />
        </Suspense>
      </Canvas>
    </div>
  );
}
