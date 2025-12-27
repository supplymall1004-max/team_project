/**
 * @file components/game/threejs/room-objects.tsx
 * @description 방 내부 오브젝트들
 *
 * 장난감, 책, 식물 등 다양한 3D 오브젝트를 추가합니다.
 */

"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh } from "three";
import { playSound } from "./sound-system";

/**
 * 장난감 블록
 */
export function ToyBlock({ position = [0, 0, 0], color = "#FF6B6B" }: { position?: [number, number, number]; color?: string }) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current && hovered) {
      meshRef.current.rotation.y += 0.02;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => playSound("click")}
    >
      <boxGeometry args={[0.3, 0.3, 0.3]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

/**
 * 책
 */
export function Book({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current && hovered) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => playSound("click")}
      >
        <boxGeometry args={[0.4, 0.05, 0.3]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      {/* 책 페이지 */}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[0.38, 0.02, 0.28]} />
        <meshStandardMaterial color="#FFF8DC" />
      </mesh>
    </group>
  );
}

/**
 * 식물
 */
export function Plant({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const potRef = useRef<Mesh>(null);
  const leavesRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (leavesRef.current) {
      leavesRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* 화분 */}
      <mesh ref={potRef} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.15, 0.12, 0.2, 16]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
      
      {/* 식물 잎 */}
      <mesh ref={leavesRef} position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#2ECC71" />
      </mesh>
      
      {/* 작은 잎들 */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i * Math.PI * 2) / 3) * 0.15,
            0.4,
            Math.sin((i * Math.PI * 2) / 3) * 0.15,
          ]}
        >
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#27AE60" />
        </mesh>
      ))}
    </group>
  );
}

/**
 * 공
 */
export function Ball({ position = [0, 0, 0], color = "#FFD700" }: { position?: [number, number, number]; color?: string }) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
      
      if (hovered) {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => playSound("click")}
    >
      <sphereGeometry args={[0.15, 32, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

/**
 * 인형
 */
export function Doll({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const groupRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* 머리 */}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#FFDBAC" />
      </mesh>
      
      {/* 몸통 */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.1, 0.15, 0.08]} />
        <meshStandardMaterial color="#FF6B9D" />
      </mesh>
      
      {/* 팔 */}
      <mesh position={[-0.08, 0.1, 0]}>
        <boxGeometry args={[0.04, 0.1, 0.04]} />
        <meshStandardMaterial color="#FFDBAC" />
      </mesh>
      <mesh position={[0.08, 0.1, 0]}>
        <boxGeometry args={[0.04, 0.1, 0.04]} />
        <meshStandardMaterial color="#FFDBAC" />
      </mesh>
      
      {/* 다리 */}
      <mesh position={[-0.03, 0, 0]}>
        <boxGeometry args={[0.04, 0.1, 0.04]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>
      <mesh position={[0.03, 0, 0]}>
        <boxGeometry args={[0.04, 0.1, 0.04]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>
    </group>
  );
}

/**
 * 모든 방 오브젝트를 배치하는 컴포넌트
 */
export function RoomObjects() {
  return (
    <>
      {/* 테이블 위 장난감들 */}
      <ToyBlock position={[-2.2, 0.5, -2]} color="#FF6B6B" />
      <ToyBlock position={[-1.8, 0.5, -2]} color="#4ECDC4" />
      <ToyBlock position={[-2, 0.7, -2]} color="#FFE66D" />
      
      {/* 책 */}
      <Book position={[-2, 0.3, -1.5]} />
      
      {/* 공 */}
      <Ball position={[1, 0.2, -1]} color="#FFD700" />
      
      {/* 인형 */}
      <Doll position={[2, 0.2, -2]} />
      
      {/* 식물 */}
      <Plant position={[4, 0, -3]} />
      <Plant position={[-4, 0, -3]} />
    </>
  );
}

