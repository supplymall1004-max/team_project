/**
 * @file components/game/threejs/item-system.tsx
 * @description 아이템 시스템 컴포넌트
 *
 * Phase 6: 게임 요소
 * - 아이템 스폰 및 수집
 * - 아이템 시각화
 * - 아이템 상호작용
 *
 * @dependencies
 * - @react-three/fiber: useFrame
 * - three: Vector3, Group
 */

"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { Html } from "@react-three/drei";
import { useInventoryState } from "../game-state/use-inventory-state";
import { Item } from "../game-state/item-types";
import { InteractionUI } from "./interaction-ui";
import { useCharacterContext } from "./character-context";

interface ItemProps {
  item: Item;
  position: [number, number, number];
  onCollect?: (item: Item) => void;
}

/**
 * 아이템 컴포넌트
 * 3D 공간에 배치된 아이템을 표시하고 수집할 수 있게 합니다.
 */
export function GameItem({ item, position, onCollect }: ItemProps) {
  const groupRef = useRef<Group>(null);
  const [isCollected, setIsCollected] = useState(false);
  const [isNearby, setIsNearby] = useState(false);
  const addItem = useInventoryState((state) => state.addItem);
  const { characterPositionRef } = useCharacterContext();

  // 회전 및 부유 애니메이션
  useFrame((state) => {
    if (!groupRef.current || isCollected) return;

    groupRef.current.rotation.y = state.clock.getElapsedTime() * 2;
    groupRef.current.position.y =
      position[1] + Math.sin(state.clock.getElapsedTime() * 3) * 0.2;

    // 캐릭터와의 거리 확인
    const charPos = characterPositionRef.current;
    const itemPos = groupRef.current.position;
    const distance = charPos.distanceTo(itemPos);

    setIsNearby(distance < 2.0); // 2 유닛 이내
  });

  const handleCollect = () => {
    if (isCollected) return;

    const success = addItem(item, 1);
    if (success) {
      setIsCollected(true);
      onCollect?.(item);
      console.log("✅ 아이템 수집:", item.name);
    } else {
      console.warn("⚠️ 인벤토리가 가득 찼습니다.");
    }
  };

  if (isCollected) {
    return null;
  }

  return (
    <>
      <group ref={groupRef} position={position}>
        {/* 아이템 모델 (현재는 프리미티브 기하체) */}
        <mesh>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial
            color={item.type === "quest" ? "gold" : "lightgreen"}
            emissive={item.type === "quest" ? "gold" : "lightgreen"}
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* 아이템 이름 표시 */}
        {isNearby && (
          <Html position={[0, 0.5, 0]} center>
            <div className="bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold">
              {item.name}
            </div>
          </Html>
        )}
      </group>

      {/* 상호작용 프롬프트 */}
      {isNearby && (
        <InteractionUI
          isInteractable={true}
          interactionText={`${item.name} 수집`}
          interactionKey="E"
          onInteract={handleCollect}
        />
      )}
    </>
  );
}

