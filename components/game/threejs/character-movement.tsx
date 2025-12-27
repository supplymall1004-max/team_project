/**
 * @file components/game/threejs/character-movement.tsx
 * @description 캐릭터 이동 시스템
 *
 * 캐릭터를 클릭한 위치로 이동시킵니다.
 */

"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";

interface CharacterMovementProps {
  targetPosition: [number, number, number];
  speed?: number;
  onArrive?: () => void;
}

/**
 * 캐릭터 이동 컴포넌트
 */
export function useCharacterMovement(
  initialPosition: [number, number, number] = [0, 0, 0],
  speed: number = 2
) {
  const [targetPosition, setTargetPosition] = useState<[number, number, number]>(initialPosition);
  const [currentPosition, setCurrentPosition] = useState<[number, number, number]>(initialPosition);
  const [isMoving, setIsMoving] = useState(false);
  const onArriveCallback = useRef<(() => void) | null>(null);

  useFrame((state, delta) => {
    if (isMoving) {
      const current = new Vector3(...currentPosition);
      const target = new Vector3(...targetPosition);
      const direction = target.clone().sub(current);
      const distance = direction.length();

      if (distance > 0.1) {
        // 이동
        const moveDistance = speed * delta;
        const newPosition = current.clone().add(
          direction.normalize().multiplyScalar(Math.min(moveDistance, distance))
        );
        setCurrentPosition([newPosition.x, newPosition.y, newPosition.z]);
      } else {
        // 도착
        setCurrentPosition(targetPosition);
        setIsMoving(false);
        if (onArriveCallback.current) {
          onArriveCallback.current();
          onArriveCallback.current = null;
        }
      }
    }
  });

  const moveTo = (position: [number, number, number], onArrive?: () => void) => {
    setTargetPosition(position);
    setIsMoving(true);
    if (onArrive) {
      onArriveCallback.current = onArrive;
    }
  };

  return {
    position: currentPosition,
    isMoving,
    moveTo,
  };
}

/**
 * 바닥 클릭 감지 및 캐릭터 이동
 */
export function useFloorClick(onClick: (position: [number, number, number]) => void) {
  const { camera, raycaster, pointer, scene } = useThree();
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      // 바닥과 교차하는지 확인
      const floorIntersect = intersects.find(
        (intersect) => intersect.object.userData.isFloor
      );

      if (floorIntersect) {
        const position: [number, number, number] = [
          floorIntersect.point.x,
          0,
          floorIntersect.point.z,
        ];
        onClick(position);
        setClicked(true);
        setTimeout(() => setClicked(false), 100);
      }
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [camera, raycaster, pointer, scene, onClick]);

  return clicked;
}

