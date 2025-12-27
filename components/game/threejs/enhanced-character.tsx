/**
 * @file components/game/threejs/enhanced-character.tsx
 * @description 향상된 3D 캐릭터 컴포넌트
 *
 * 애니메이션, 표정 변화, 인터랙션을 지원하는 캐릭터입니다.
 */

"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Group } from "three";
import { playSound } from "./sound-system";

interface EnhancedCharacterProps {
  position?: [number, number, number];
  onClick?: () => void;
  animation?: "idle" | "walk" | "sit" | "happy" | "sad";
  expression?: "normal" | "happy" | "sad" | "surprised";
}

/**
 * 향상된 3D 캐릭터 컴포넌트
 */
export function EnhancedCharacter({
  position = [0, 0, 0],
  onClick,
  animation = "idle",
  expression = "normal",
}: EnhancedCharacterProps) {
  const groupRef = useRef<Group>(null);
  const headRef = useRef<Mesh>(null);
  const bodyRef = useRef<Mesh>(null);
  const leftArmRef = useRef<Mesh>(null);
  const rightArmRef = useRef<Mesh>(null);
  const leftLegRef = useRef<Mesh>(null);
  const rightLegRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const animationTime = useRef(0);

  // 애니메이션
  useFrame((state, delta) => {
    animationTime.current += delta;

    if (!groupRef.current) return;

    const time = animationTime.current;

    // 기본 회전 (idle)
    if (animation === "idle") {
      groupRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
      groupRef.current.position.y = position[1] + Math.sin(time * 2) * 0.05;
    }

    // 걷기 애니메이션
    if (animation === "walk" || isWalking) {
      groupRef.current.position.x = position[0] + Math.sin(time * 3) * 0.5;
      groupRef.current.position.z = position[2] + Math.cos(time * 3) * 0.5;
      
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = Math.sin(time * 6) * 0.5;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -Math.sin(time * 6) * 0.5;
      }
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = -Math.sin(time * 6) * 0.5;
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = Math.sin(time * 6) * 0.5;
      }
    }

    // 앉기 애니메이션
    if (animation === "sit") {
      groupRef.current.position.y = position[1] - 0.3;
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = Math.PI / 3;
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = Math.PI / 3;
      }
    }

    // 행복 애니메이션 (뛰기)
    if (animation === "happy") {
      groupRef.current.position.y = position[1] + Math.abs(Math.sin(time * 4)) * 0.3;
      groupRef.current.rotation.y += delta * 2;
    }

    // 슬픔 애니메이션 (고개 숙임)
    if (animation === "sad") {
      if (headRef.current) {
        headRef.current.rotation.x = Math.PI / 6;
      }
      groupRef.current.position.y = position[1] - 0.1;
    }

    // 호버 효과
    if (hovered) {
      groupRef.current.scale.setScalar(1.1);
    } else {
      groupRef.current.scale.setScalar(1);
    }

    // 표정 변화
    if (headRef.current) {
      if (expression === "happy") {
        headRef.current.rotation.z = Math.sin(time * 2) * 0.1;
      } else if (expression === "sad") {
        headRef.current.rotation.x = Math.PI / 6;
      } else if (expression === "surprised") {
        headRef.current.scale.set(1, 1.1, 1);
      } else {
        headRef.current.rotation.x = 0;
        headRef.current.rotation.z = 0;
        headRef.current.scale.set(1, 1, 1);
      }
    }
  });

  // 클릭 핸들러
  const handleClick = () => {
    playSound("click");
    onClick?.();
  };

  // 걷기 시작/중지
  useEffect(() => {
    if (animation === "walk") {
      setIsWalking(true);
    } else {
      setIsWalking(false);
    }
  }, [animation]);

  // 표정별 눈/입 색상
  const getExpressionColor = () => {
    switch (expression) {
      case "happy":
        return { eye: "#000000", mouth: "#FF6B9D" };
      case "sad":
        return { eye: "#4A90E2", mouth: "#2C3E50" };
      case "surprised":
        return { eye: "#FFD700", mouth: "#FF6B6B" };
      default:
        return { eye: "#000000", mouth: "#000000" };
    }
  };

  const colors = getExpressionColor();

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* 머리 */}
      <mesh ref={headRef} position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#FFDBAC" />
      </mesh>

      {/* 몸통 */}
      <mesh ref={bodyRef} position={[0, 0.6, 0]}>
        <boxGeometry args={[0.4, 0.8, 0.3]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>

      {/* 팔 (왼쪽) */}
      <mesh ref={leftArmRef} position={[-0.3, 0.6, 0]}>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color="#FFDBAC" />
      </mesh>

      {/* 팔 (오른쪽) */}
      <mesh ref={rightArmRef} position={[0.3, 0.6, 0]}>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color="#FFDBAC" />
      </mesh>

      {/* 다리 (왼쪽) */}
      <mesh ref={leftLegRef} position={[-0.1, 0, 0]}>
        <boxGeometry args={[0.15, 0.6, 0.15]} />
        <meshStandardMaterial color="#2C3E50" />
      </mesh>

      {/* 다리 (오른쪽) */}
      <mesh ref={rightLegRef} position={[0.1, 0, 0]}>
        <boxGeometry args={[0.15, 0.6, 0.15]} />
        <meshStandardMaterial color="#2C3E50" />
      </mesh>

      {/* 눈 (왼쪽) */}
      <mesh position={[-0.1, 1.3, 0.25]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color={colors.eye} />
      </mesh>

      {/* 눈 (오른쪽) */}
      <mesh position={[0.1, 1.3, 0.25]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color={colors.eye} />
      </mesh>

      {/* 입 (표정에 따라 변화) */}
      {expression === "happy" ? (
        // 미소 (호박 모양)
        <mesh position={[0, 1.15, 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.1, 0.02, 8, 16, Math.PI]} />
          <meshStandardMaterial color={colors.mouth} />
        </mesh>
      ) : expression === "sad" ? (
        // 슬픈 입
        <mesh position={[0, 1.1, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.08, 0.02, 8, 16, Math.PI]} />
          <meshStandardMaterial color={colors.mouth} />
        </mesh>
      ) : expression === "surprised" ? (
        // 놀란 입 (원형)
        <mesh position={[0, 1.1, 0.25]}>
          <ringGeometry args={[0.05, 0.08, 16]} />
          <meshStandardMaterial color={colors.mouth} />
        </mesh>
      ) : (
        // 일반 입
        <mesh position={[0, 1.15, 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.08, 0.02, 8, 16, Math.PI]} />
          <meshStandardMaterial color={colors.mouth} />
        </mesh>
      )}

      {/* 머리카락 (선택적) */}
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.15, 16]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
    </group>
  );
}

