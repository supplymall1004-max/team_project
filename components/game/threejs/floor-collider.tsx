/**
 * @file components/game/threejs/floor-collider.tsx
 * @description 바닥 충돌 감지 컴포넌트
 *
 * Phase 3: 물리 엔진 통합
 * - 바닥 콜라이더 설정
 * - 캐릭터가 바닥에 떨어지지 않도록 함
 *
 * @dependencies
 * - @react-three/rapier: RigidBody
 * - three: BoxGeometry, MeshStandardMaterial
 */

"use client";

import { RigidBody } from "@react-three/rapier";
import { Box } from "@react-three/drei";

interface FloorColliderProps {
  position?: [number, number, number];
  size?: [number, number, number];
  visible?: boolean;
}

/**
 * 바닥 충돌 감지 컴포넌트
 * 캐릭터가 바닥에 떨어지지 않도록 바닥 콜라이더를 생성합니다.
 */
export function FloorCollider({
  position = [0, -0.1, 0],
  size = [50, 0.2, 50], // 넓은 바닥 (50x50)
  visible = false, // 디버그 모드에서만 보이도록
}: FloorColliderProps) {
  return (
    <RigidBody
      type="fixed" // 고정된 바닥 (움직이지 않음)
      position={position}
      colliders="cuboid" // 큐보이드 콜라이더 자동 생성
      restitution={0} // 반발력 없음
      friction={1} // 마찰력 있음
    >
      <Box args={size}>
        <meshStandardMaterial
          color="gray"
          opacity={visible ? 0.3 : 0}
          transparent
          wireframe={visible}
        />
      </Box>
    </RigidBody>
  );
}

