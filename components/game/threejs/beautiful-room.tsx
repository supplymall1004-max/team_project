/**
 * @file components/game/threejs/beautiful-room.tsx
 * @description 예쁜 방 내부 장식
 *
 * 벽난로, 식탁, 가족 구성원, 다양한 장식품을 포함합니다.
 */

"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Group } from "three";
import { playSound } from "./sound-system";
import { BeautifulCharacter } from "./beautiful-character";

/**
 * 벽난로 컴포넌트
 */
export function Fireplace({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const fireRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (fireRef.current) {
      // 불꽃 애니메이션
      fireRef.current.children.forEach((child, i) => {
        if (child instanceof Mesh) {
          child.position.y = Math.sin(state.clock.elapsedTime * 3 + i) * 0.05;
          child.scale.y = 1 + Math.sin(state.clock.elapsedTime * 4 + i) * 0.2;
        }
      });
    }
  });

  return (
    <group position={position}>
      {/* 벽난로 본체 */}
      <mesh
        position={[0, 0.8, -4.8]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => playSound("click")}
      >
        <boxGeometry args={[2, 1.5, 0.3]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
      
      {/* 벽난로 상단 (장식) */}
      <mesh position={[0, 1.6, -4.8]}>
        <boxGeometry args={[2.2, 0.1, 0.4]} />
        <meshStandardMaterial color="#6B5B4A" />
      </mesh>
      
      {/* 벽난로 내부 */}
      <mesh position={[0, 0.5, -4.7]}>
        <boxGeometry args={[1.5, 1, 0.1]} />
        <meshStandardMaterial color="#2C2C2C" />
      </mesh>
      
      {/* 불꽃 그룹 */}
      <group ref={fireRef} position={[0, 0.3, -4.65]}>
        {/* 불꽃 1 */}
        <mesh>
          <coneGeometry args={[0.2, 0.4, 8]} />
          <meshStandardMaterial color="#FF4500" emissive="#FF4500" emissiveIntensity={0.8} />
        </mesh>
        
        {/* 불꽃 2 */}
        <mesh position={[-0.15, 0, 0]}>
          <coneGeometry args={[0.15, 0.35, 8]} />
          <meshStandardMaterial color="#FF6347" emissive="#FF6347" emissiveIntensity={0.8} />
        </mesh>
        
        {/* 불꽃 3 */}
        <mesh position={[0.15, 0, 0]}>
          <coneGeometry args={[0.15, 0.35, 8]} />
          <meshStandardMaterial color="#FF6347" emissive="#FF6347" emissiveIntensity={0.8} />
        </mesh>
        
        {/* 불꽃 중심 (밝은 부분) */}
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1} />
        </mesh>
      </group>
      
      {/* 장작 */}
      <mesh position={[0, 0.1, -4.65]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.3, 0.1, 0.1]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* 벽난로 양쪽 기둥 */}
      <mesh position={[-1.1, 0.8, -4.8]}>
        <boxGeometry args={[0.1, 1.5, 0.3]} />
        <meshStandardMaterial color="#6B5B4A" />
      </mesh>
      <mesh position={[1.1, 0.8, -4.8]}>
        <boxGeometry args={[0.1, 1.5, 0.3]} />
        <meshStandardMaterial color="#6B5B4A" />
      </mesh>
    </group>
  );
}

/**
 * 식탁 세트 컴포넌트
 */
export function DiningTable({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      {/* 식탁 상판 */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.1, 1.2]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* 식탁 다리들 */}
      {[
        [-0.9, 0.2, -0.5],
        [0.9, 0.2, -0.5],
        [-0.9, 0.2, 0.5],
        [0.9, 0.2, 0.5],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
      ))}
      
      {/* 의자들 */}
      {[
        { pos: [-1.5, 0.3, 0], rot: 0 },
        { pos: [1.5, 0.3, 0], rot: Math.PI },
        { pos: [0, 0.3, -0.8], rot: Math.PI / 2 },
        { pos: [0, 0.3, 0.8], rot: -Math.PI / 2 },
      ].map((chair, i) => (
        <group key={i} position={chair.pos as [number, number, number]} rotation={[0, chair.rot, 0]}>
          {/* 의자 등받이 */}
          <mesh position={[0, 0.4, -0.2]} castShadow>
            <boxGeometry args={[0.4, 0.4, 0.05]} />
            <meshStandardMaterial color="#A0826D" />
          </mesh>
          
          {/* 의자 좌석 */}
          <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.4, 0.05, 0.4]} />
            <meshStandardMaterial color="#A0826D" />
          </mesh>
          
          {/* 의자 다리들 */}
          {[
            [-0.15, 0.1, -0.15],
            [0.15, 0.1, -0.15],
            [-0.15, 0.1, 0.15],
            [0.15, 0.1, 0.15],
          ].map((legPos, j) => (
            <mesh key={j} position={legPos as [number, number, number]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.2, 8]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
          ))}
        </group>
      ))}
      
      {/* 식탁 위 장식 (꽃병) */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.15, 16]} />
        <meshStandardMaterial color="#C0C0C0" />
      </mesh>
      
      {/* 꽃 */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i * Math.PI * 2) / 3) * 0.1,
            0.6,
            Math.sin((i * Math.PI * 2) / 3) * 0.1,
          ]}
        >
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#FF69B4" />
        </mesh>
      ))}
    </group>
  );
}

/**
 * 커튼 컴포넌트
 */
export function Curtain({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const curtainRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (curtainRef.current) {
      // 바람에 흔들리는 효과
      curtainRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group position={position}>
      {/* 커튼 막대 */}
      <mesh position={[0, 2.5, -4.99]}>
        <cylinderGeometry args={[0.02, 0.02, 3, 16]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
      
      {/* 커튼 (왼쪽) */}
      <mesh ref={curtainRef} position={[-0.5, 1.5, -4.98]}>
        <boxGeometry args={[0.8, 2, 0.02]} />
        <meshStandardMaterial color="#F5F5DC" />
      </mesh>
      
      {/* 커튼 (오른쪽) */}
      <mesh position={[0.5, 1.5, -4.98]}>
        <boxGeometry args={[0.8, 2, 0.02]} />
        <meshStandardMaterial color="#F5F5DC" />
      </mesh>
      
      {/* 커튼 주름 */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-0.5 + i * 0.5, 1.5, -4.97]}>
          <boxGeometry args={[0.1, 2, 0.01]} />
          <meshStandardMaterial color="#E6E6FA" />
        </mesh>
      ))}
    </group>
  );
}

/**
 * 그림 컴포넌트
 */
export function Picture({ position = [0, 0, 0], image = "family" }: { position?: [number, number, number]; image?: string }) {
  return (
    <group position={position}>
      {/* 그림 프레임 */}
      <mesh>
        <boxGeometry args={[0.8, 0.6, 0.05]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* 그림 */}
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[0.75, 0.55, 0.01]} />
        <meshStandardMaterial color="#FFE4B5" />
      </mesh>
      
      {/* 그림 장식 (하트) */}
      <mesh position={[0, 0, 0.04]}>
        <torusGeometry args={[0.1, 0.02, 8, 16]} />
        <meshStandardMaterial color="#FF69B4" />
      </mesh>
    </group>
  );
}

/**
 * 조명 (램프) 컴포넌트
 */
export function Lamp({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const lightRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (lightRef.current) {
      // 빛이 살짝 깜빡이는 효과
      const intensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      if (lightRef.current.material) {
        (lightRef.current.material as any).emissiveIntensity = intensity;
      }
    }
  });

  return (
    <group position={position}>
      {/* 램프 기둥 */}
      <mesh>
        <cylinderGeometry args={[0.05, 0.05, 0.8, 16]} />
        <meshStandardMaterial color="#C0C0C0" />
      </mesh>
      
      {/* 램프 갓 */}
      <mesh ref={lightRef} position={[0, 0.5, 0]}>
        <coneGeometry args={[0.2, 0.3, 16]} />
        <meshStandardMaterial color="#FFF8DC" emissive="#FFF8DC" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

/**
 * 가족 구성원들 컴포넌트
 */
export function FamilyMembers() {
  return (
    <>
      {/* 아빠 */}
      <BeautifulCharacter
        position={[-1.5, 0, -1]}
        animation="idle"
        expression="normal"
        gender="male"
        age="adult"
        name="아빠"
      />
      
      {/* 엄마 */}
      <BeautifulCharacter
        position={[1.5, 0, -1]}
        animation="idle"
        expression="normal"
        gender="female"
        age="adult"
        name="엄마"
      />
      
      {/* 아이 1 */}
      <BeautifulCharacter
        position={[-0.5, 0, 1]}
        animation="idle"
        expression="happy"
        gender="male"
        age="child"
        name="아이1"
      />
      
      {/* 아이 2 (작은 아이) */}
      <BeautifulCharacter
        position={[0.5, 0, 1]}
        animation="idle"
        expression="happy"
        gender="female"
        age="baby"
        name="아이2"
      />
    </>
  );
}

/**
 * 예쁜 방 전체 컴포넌트
 */
export function BeautifulRoom() {
  return (
    <>
      {/* 바닥 (나무 바닥) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#D2691E" />
      </mesh>
      
      {/* 바닥 패턴 (나무 결) */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-8 + i * 4, -0.49, 0]}
          receiveShadow
        >
          <planeGeometry args={[3.5, 20]} />
          <meshStandardMaterial color="#CD853F" />
        </mesh>
      ))}
      
      {/* 벽 (뒤) */}
      <mesh position={[0, 2, -5]} receiveShadow>
        <planeGeometry args={[20, 5]} />
        <meshStandardMaterial color="#F5E6D3" />
      </mesh>
      
      {/* 벽 (왼쪽) */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-5, 2, 0]} receiveShadow>
        <planeGeometry args={[20, 5]} />
        <meshStandardMaterial color="#D4C4A8" />
      </mesh>
      
      {/* 벽 (오른쪽) */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[5, 2, 0]} receiveShadow>
        <planeGeometry args={[20, 5]} />
        <meshStandardMaterial color="#D4C4A8" />
      </mesh>
      
      {/* 천장 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.5, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#FFF8DC" />
      </mesh>
      
      {/* 벽난로 */}
      <Fireplace position={[2, 0, 0]} />
      
      {/* 커튼 */}
      <Curtain position={[2, 0, 0]} />
      
      {/* 식탁 */}
      <DiningTable position={[-2, 0, -2]} />
      
      {/* 그림들 */}
      <Picture position={[-4, 2, -4.9]} />
      <Picture position={[4, 2, -4.9]} />
      
      {/* 램프들 */}
      <Lamp position={[-3, 0.3, -2]} />
      <Lamp position={[3, 0.3, -2]} />
      
      {/* 가족 구성원들 */}
      <FamilyMembers />
    </>
  );
}

