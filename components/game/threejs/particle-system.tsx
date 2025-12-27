/**
 * @file components/game/threejs/particle-system.tsx
 * @description 파티클 효과 시스템
 *
 * 이벤트 발생 시 파티클 효과를 표시합니다.
 */

"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

interface ParticleSystemProps {
  position?: [number, number, number];
  count?: number;
  color?: string;
  speed?: number;
  size?: number;
  eventType?: string;
}

/**
 * 파티클 시스템 컴포넌트
 */
export function ParticleSystem({
  position = [0, 0, 0],
  count = 100,
  color = "#ff6b6b",
  speed = 0.5,
  size = 0.05,
  eventType,
}: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // 파티클 위치 생성
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // 초기 위치 (중앙에서 랜덤하게 분산)
      positions[i3] = (Math.random() - 0.5) * 2;
      positions[i3 + 1] = (Math.random() - 0.5) * 2;
      positions[i3 + 2] = (Math.random() - 0.5) * 2;
      
      // 초기 속도
      velocities[i3] = (Math.random() - 0.5) * speed;
      velocities[i3 + 1] = Math.random() * speed * 2;
      velocities[i3 + 2] = (Math.random() - 0.5) * speed;
    }
    
    return { positions, velocities };
  }, [count, speed]);

  // 애니메이션
  useFrame((state, delta) => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      const velocities = particles.velocities;
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // 위치 업데이트
        positions[i3] += velocities[i3] * delta;
        positions[i3 + 1] += velocities[i3 + 1] * delta;
        positions[i3 + 2] += velocities[i3 + 2] * delta;
        
        // 중력 효과
        velocities[i3 + 1] -= 9.8 * delta * 0.1;
        
        // 바닥 충돌
        if (positions[i3 + 1] < -2) {
          positions[i3 + 1] = -2;
          velocities[i3 + 1] *= -0.5; // 반사
        }
        
        // 경계 체크 (재생성)
        if (
          Math.abs(positions[i3]) > 5 ||
          positions[i3 + 1] < -3 ||
          Math.abs(positions[i3 + 2]) > 5
        ) {
          positions[i3] = (Math.random() - 0.5) * 2;
          positions[i3 + 1] = 2;
          positions[i3 + 2] = (Math.random() - 0.5) * 2;
          velocities[i3] = (Math.random() - 0.5) * speed;
          velocities[i3 + 1] = Math.random() * speed * 2;
          velocities[i3 + 2] = (Math.random() - 0.5) * speed;
        }
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  // 이벤트 타입별 색상
  const particleColor = useMemo(() => {
    const colors: Record<string, string> = {
      medication: "#4ECDC4", // 청록색
      baby_feeding: "#FFE66D", // 노란색
      health_checkup: "#95E1D3", // 민트색
      vaccination: "#F38181", // 분홍색
      lifecycle_event: "#AA96DA", // 보라색
      kcdc_alert: "#FF6B6B", // 빨간색
    };
    return colors[eventType || ""] || color;
  }, [eventType, color]);

  return (
    <Points ref={pointsRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <PointMaterial
        size={size}
        color={particleColor}
        transparent
        opacity={0.8}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
}

/**
 * 하트 파티클 효과 (이벤트 완료 시)
 */
export function HeartParticles({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <ParticleSystem
      position={position}
      count={50}
      color="#FF6B9D"
      speed={0.3}
      size={0.1}
    />
  );
}

/**
 * 별 파티클 효과 (레벨업 시)
 */
export function StarParticles({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <ParticleSystem
      position={position}
      count={100}
      color="#FFD700"
      speed={0.5}
      size={0.08}
    />
  );
}

