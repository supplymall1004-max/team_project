/**
 * @file components/game/threejs/npc-system.tsx
 * @description NPC 시스템 컴포넌트
 *
 * Phase 6: 게임 요소
 * - NPC 모델 배치
 * - NPC 대화 시스템
 * - NPC 애니메이션 (대기, 걷기 등)
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
import { DialogueUI, InteractionUI } from "./interaction-ui";
import { useCharacterContext } from "./character-context";

interface NPCProps {
  id: string;
  name: string;
  position: [number, number, number];
  dialogue?: string[];
  onInteract?: () => void;
}

/**
 * NPC 컴포넌트
 * NPC 모델과 상호작용 기능을 제공합니다.
 */
export function NPC({
  id,
  name,
  position,
  dialogue = [],
  onInteract,
}: NPCProps) {
  const groupRef = useRef<Group>(null);
  const [isDialogueOpen, setIsDialogueOpen] = useState(false);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [isNearby, setIsNearby] = useState(false);
  const { characterPositionRef } = useCharacterContext();

  // 간단한 부유 애니메이션 및 거리 감지
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y =
      position[1] + Math.sin(state.clock.getElapsedTime() * 2) * 0.1;

    // 캐릭터와의 거리 확인
    const charPos = characterPositionRef.current;
    const npcPos = groupRef.current.position;
    const distance = charPos.distanceTo(npcPos);

    setIsNearby(distance < 2.5); // 2.5 유닛 이내
  });

  const handleInteract = () => {
    if (dialogue.length > 0) {
      setIsDialogueOpen(true);
      setDialogueIndex(0);
    }
    onInteract?.();
  };

  return (
    <>
      <group ref={groupRef} position={position}>
        {/* NPC 모델 (현재는 프리미티브 기하체) */}
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[0.5, 2, 0.5]} />
          <meshStandardMaterial color="lightblue" />
        </mesh>
        <mesh position={[0, 2.3, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="peachpuff" />
        </mesh>

        {/* NPC 이름 표시 */}
        {isNearby && (
          <Html position={[0, 3, 0]} center>
            <div className="bg-black/70 text-white px-2 py-1 rounded text-sm font-semibold">
              {name}
            </div>
          </Html>
        )}
      </group>

      {/* 상호작용 프롬프트 */}
      {isNearby && dialogue.length > 0 && !isDialogueOpen && (
        <InteractionUI
          isInteractable={true}
          interactionText={`${name}와 대화하기`}
          interactionKey="E"
          onInteract={handleInteract}
        />
      )}

      {/* 대화창 UI */}
      {isDialogueOpen && dialogue.length > 0 && (
        <DialogueUI
          isOpen={isDialogueOpen}
          speaker={name}
          message={dialogue[dialogueIndex]}
          onClose={() => {
            if (dialogueIndex < dialogue.length - 1) {
              setDialogueIndex(dialogueIndex + 1);
            } else {
              setIsDialogueOpen(false);
              setDialogueIndex(0);
            }
          }}
        />
      )}
    </>
  );
}

