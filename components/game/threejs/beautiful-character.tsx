/**
 * @file components/game/threejs/beautiful-character.tsx
 * @description 더 예쁜 3D 캐릭터 컴포넌트
 *
 * 얼굴, 옷, 액세서리를 포함한 상세한 캐릭터 모델입니다.
 */

"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Group } from "three";
import { playSound } from "./sound-system";

interface BeautifulCharacterProps {
  position?: [number, number, number];
  onClick?: () => void;
  animation?: "idle" | "walk" | "sit" | "happy" | "sad";
  expression?: "normal" | "happy" | "sad" | "surprised";
  gender?: "male" | "female";
  age?: "baby" | "child" | "adult";
  name?: string;
}

/**
 * 예쁜 3D 캐릭터 컴포넌트
 */
export function BeautifulCharacter({
  position = [0, 0, 0],
  onClick,
  animation = "idle",
  expression = "normal",
  gender = "male",
  age = "child",
  name = "캐릭터",
}: BeautifulCharacterProps) {
  const groupRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const leftArmRef = useRef<Mesh>(null);
  const rightArmRef = useRef<Mesh>(null);
  const leftLegRef = useRef<Mesh>(null);
  const rightLegRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const animationTime = useRef(0);

  // 크기 조정 (나이에 따라)
  const scale = age === "baby" ? 0.7 : age === "child" ? 0.9 : 1.0;

  // 애니메이션
  useFrame((state, delta) => {
    animationTime.current += delta;
    const time = animationTime.current;

    if (!groupRef.current) return;

    // 기본 애니메이션
    if (animation === "idle") {
      groupRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
      groupRef.current.position.y = position[1] + Math.sin(time * 2) * 0.03;
    }

    // 걷기 애니메이션
    if (animation === "walk") {
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

    // 행복 애니메이션
    if (animation === "happy") {
      groupRef.current.position.y = position[1] + Math.abs(Math.sin(time * 4)) * 0.3;
      groupRef.current.rotation.y += delta * 2;
    }

    // 호버 효과
    if (hovered) {
      groupRef.current.scale.setScalar(scale * 1.1);
    } else {
      groupRef.current.scale.setScalar(scale);
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

  const handleClick = () => {
    playSound("click");
    onClick?.();
  };

  // 표정별 색상
  const getExpressionColor = () => {
    switch (expression) {
      case "happy":
        return { eye: "#000000", mouth: "#FF6B9D", cheek: "#FFB6C1" };
      case "sad":
        return { eye: "#4A90E2", mouth: "#2C3E50", cheek: "#E0E0E0" };
      case "surprised":
        return { eye: "#FFD700", mouth: "#FF6B6B", cheek: "#FFE4E1" };
      default:
        return { eye: "#000000", mouth: "#000000", cheek: "#FFB6C1" };
    }
  };

  const colors = getExpressionColor();
  const hairColor = gender === "female" ? "#8B4513" : "#2C3E50";
  const clothesColor = gender === "female" ? "#FF69B4" : "#4A90E2";

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* 머리 그룹 */}
      <group ref={headRef} position={[0, 1.2 * scale, 0]}>
        {/* 머리 본체 */}
        <mesh>
          <sphereGeometry args={[0.3 * scale, 32, 32]} />
          <meshStandardMaterial color="#FFDBAC" />
        </mesh>
        
        {/* 머리카락 */}
        <mesh position={[0, 0.15 * scale, 0]}>
          <cylinderGeometry args={[0.32 * scale, 0.32 * scale, 0.2 * scale, 16]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>
        
        {/* 머리카락 앞부분 (뱅) */}
        {gender === "female" && (
          <mesh position={[0, 0.25 * scale, 0.15 * scale]} rotation={[Math.PI / 6, 0, 0]}>
            <boxGeometry args={[0.5 * scale, 0.1 * scale, 0.05 * scale]} />
            <meshStandardMaterial color={hairColor} />
          </mesh>
        )}
        
        {/* 눈 (왼쪽) */}
        <mesh position={[-0.1 * scale, 0.05 * scale, 0.25 * scale]}>
          <sphereGeometry args={[0.05 * scale, 16, 16]} />
          <meshStandardMaterial color={colors.eye} />
        </mesh>
        
        {/* 눈 (오른쪽) */}
        <mesh position={[0.1 * scale, 0.05 * scale, 0.25 * scale]}>
          <sphereGeometry args={[0.05 * scale, 16, 16]} />
          <meshStandardMaterial color={colors.eye} />
        </mesh>
        
        {/* 눈썹 (왼쪽) */}
        <mesh position={[-0.1 * scale, 0.12 * scale, 0.24 * scale]}>
          <boxGeometry args={[0.08 * scale, 0.02 * scale, 0.01 * scale]} />
          <meshStandardMaterial color="#2C3E50" />
        </mesh>
        
        {/* 눈썹 (오른쪽) */}
        <mesh position={[0.1 * scale, 0.12 * scale, 0.24 * scale]}>
          <boxGeometry args={[0.08 * scale, 0.02 * scale, 0.01 * scale]} />
          <meshStandardMaterial color="#2C3E50" />
        </mesh>
        
        {/* 볼 (왼쪽) */}
        <mesh position={[-0.15 * scale, -0.05 * scale, 0.2 * scale]}>
          <sphereGeometry args={[0.06 * scale, 16, 16]} />
          <meshStandardMaterial color={colors.cheek} transparent opacity={0.6} />
        </mesh>
        
        {/* 볼 (오른쪽) */}
        <mesh position={[0.15 * scale, -0.05 * scale, 0.2 * scale]}>
          <sphereGeometry args={[0.06 * scale, 16, 16]} />
          <meshStandardMaterial color={colors.cheek} transparent opacity={0.6} />
        </mesh>
        
        {/* 입 */}
        {expression === "happy" ? (
          <mesh position={[0, -0.1 * scale, 0.25 * scale]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.1 * scale, 0.02 * scale, 8, 16, Math.PI]} />
            <meshStandardMaterial color={colors.mouth} />
          </mesh>
        ) : expression === "sad" ? (
          <mesh position={[0, -0.15 * scale, 0.25 * scale]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.08 * scale, 0.02 * scale, 8, 16, Math.PI]} />
            <meshStandardMaterial color={colors.mouth} />
          </mesh>
        ) : expression === "surprised" ? (
          <mesh position={[0, -0.1 * scale, 0.25 * scale]}>
            <ringGeometry args={[0.05 * scale, 0.08 * scale, 16]} />
            <meshStandardMaterial color={colors.mouth} />
          </mesh>
        ) : (
          <mesh position={[0, -0.1 * scale, 0.25 * scale]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.08 * scale, 0.02 * scale, 8, 16, Math.PI]} />
            <meshStandardMaterial color={colors.mouth} />
          </mesh>
        )}
      </group>

      {/* 몸통 그룹 */}
      <group ref={bodyRef} position={[0, 0.6 * scale, 0]}>
        {/* 몸통 */}
        <mesh>
          <boxGeometry args={[0.4 * scale, 0.8 * scale, 0.3 * scale]} />
          <meshStandardMaterial color={clothesColor} />
        </mesh>
        
        {/* 옷 장식 (단추) */}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.2 * scale - i * 0.2 * scale, 0.16 * scale]}>
            <sphereGeometry args={[0.02 * scale, 16, 16]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
        ))}
        
        {/* 옷깃 */}
        <mesh position={[0, 0.3 * scale, 0.15 * scale]}>
          <boxGeometry args={[0.35 * scale, 0.1 * scale, 0.05 * scale]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
      </group>

      {/* 팔 (왼쪽) */}
      <mesh ref={leftArmRef} position={[-0.3 * scale, 0.6 * scale, 0]}>
        <boxGeometry args={[0.15 * scale, 0.5 * scale, 0.15 * scale]} />
        <meshStandardMaterial color="#FFDBAC" />
      </mesh>

      {/* 팔 (오른쪽) */}
      <mesh ref={rightArmRef} position={[0.3 * scale, 0.6 * scale, 0]}>
        <boxGeometry args={[0.15 * scale, 0.5 * scale, 0.15 * scale]} />
        <meshStandardMaterial color="#FFDBAC" />
      </mesh>

      {/* 다리 (왼쪽) */}
      <mesh ref={leftLegRef} position={[-0.1 * scale, 0, 0]}>
        <boxGeometry args={[0.15 * scale, 0.6 * scale, 0.15 * scale]} />
        <meshStandardMaterial color="#2C3E50" />
      </mesh>

      {/* 다리 (오른쪽) */}
      <mesh ref={rightLegRef} position={[0.1 * scale, 0, 0]}>
        <boxGeometry args={[0.15 * scale, 0.6 * scale, 0.15 * scale]} />
        <meshStandardMaterial color="#2C3E50" />
      </mesh>

      {/* 신발 (왼쪽) */}
      <mesh position={[-0.1 * scale, -0.35 * scale, 0.05 * scale]}>
        <boxGeometry args={[0.18 * scale, 0.1 * scale, 0.25 * scale]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* 신발 (오른쪽) */}
      <mesh position={[0.1 * scale, -0.35 * scale, 0.05 * scale]}>
        <boxGeometry args={[0.18 * scale, 0.1 * scale, 0.25 * scale]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* 액세서리 (선택적) */}
      {gender === "female" && (
        <>
          {/* 리본 (머리) */}
          <mesh position={[0, 1.5 * scale, 0.1 * scale]}>
            <boxGeometry args={[0.15 * scale, 0.05 * scale, 0.1 * scale]} />
            <meshStandardMaterial color="#FF69B4" />
          </mesh>
        </>
      )}
    </group>
  );
}

