/**
 * @file components/game/threejs/quest-system.tsx
 * @description 퀘스트 시스템 컴포넌트
 *
 * Phase 6: 게임 요소
 * - 퀘스트 제공자 표시
 * - 퀘스트 목표 추적
 * - 퀘스트 완료 처리
 *
 * @dependencies
 * - @react-three/fiber: useFrame
 * - three: Vector3, Group
 */

"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { Html } from "@react-three/drei";
import { useQuestState } from "../game-state/use-quest-state";
import { Quest } from "../game-state/quest-types";
import { InteractionUI } from "./interaction-ui";
import { useCharacterContext } from "./character-context";

interface QuestGiverProps {
  quest: Quest;
  position: [number, number, number];
  onQuestAccepted?: (quest: Quest) => void;
}

/**
 * 퀘스트 제공자 컴포넌트
 * 퀘스트를 제공하는 NPC나 오브젝트를 표시합니다.
 */
export function QuestGiver({
  quest,
  position,
  onQuestAccepted,
}: QuestGiverProps) {
  const groupRef = useRef<Group>(null);
  const [isNearby, setIsNearby] = useState(false);
  const addQuest = useQuestState((state) => state.addQuest);
  const updateQuestStatus = useQuestState((state) => state.updateQuestStatus);
  const getQuestById = useQuestState((state) => state.getQuestById);
  const { characterPositionRef } = useCharacterContext();

  // 부유 애니메이션
  useFrame((state) => {
    if (!groupRef.current) return;

    groupRef.current.position.y =
      position[1] + Math.sin(state.clock.getElapsedTime() * 2) * 0.1;

    // 캐릭터와의 거리 확인
    const charPos = characterPositionRef.current;
    const questPos = groupRef.current.position;
    const distance = charPos.distanceTo(questPos);

    setIsNearby(distance < 2.5); // 2.5 유닛 이내
  });

  const handleInteract = () => {
    const existingQuest = getQuestById(quest.id);

    if (!existingQuest) {
      // 새 퀘스트 추가
      addQuest({ ...quest, status: "in_progress" });
      onQuestAccepted?.(quest);
      console.log("✅ 퀘스트 수락:", quest.title);
    } else if (existingQuest.status === "completed") {
      console.log("✅ 퀘스트 이미 완료됨:", quest.title);
    } else {
      console.log("ℹ️ 퀘스트 진행 중:", quest.title);
    }
  };

  const existingQuest = getQuestById(quest.id);
  const canInteract = !existingQuest || existingQuest.status !== "completed";

  return (
    <>
      <group ref={groupRef} position={position}>
        {/* 퀘스트 마커 (현재는 프리미티브 기하체) */}
        <mesh>
          <coneGeometry args={[0.2, 0.5, 8]} />
          <meshStandardMaterial
            color={existingQuest?.status === "completed" ? "gray" : "yellow"}
            emissive={existingQuest?.status === "completed" ? "gray" : "yellow"}
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* 퀘스트 이름 표시 */}
        {isNearby && (
          <Html position={[0, 1, 0]} center>
            <div className="bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold">
              {quest.title}
              {existingQuest?.status === "completed" && " (완료)"}
            </div>
          </Html>
        )}
      </group>

      {/* 상호작용 프롬프트 */}
      {isNearby && canInteract && (
        <InteractionUI
          isInteractable={true}
          interactionText={
            existingQuest ? "퀘스트 확인" : "퀘스트 수락"
          }
          interactionKey="E"
          onInteract={handleInteract}
        />
      )}
    </>
  );
}

