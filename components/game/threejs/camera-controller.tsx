/**
 * @file components/game/threejs/camera-controller.tsx
 * @description 게임 카메라 컨트롤러
 *
 * Phase 4: Third-person 카메라 시스템
 * - 캐릭터 뒤를 따라가는 카메라
 * - 마우스로 카메라 회전
 * - 부드러운 카메라 전환
 *
 * @dependencies
 * - @react-three/fiber: useThree, useFrame
 * - three: PerspectiveCamera, Vector3, Spherical
 * - @/components/game/threejs/character-context: 캐릭터 위치 추적
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Vector3, Spherical } from "three";
import { useCharacterContext } from "./character-context";

/**
 * 마우스 입력 상태 관리 Hook
 */
function useMouseInput() {
  const mouseDeltaRef = useRef({ x: 0, y: 0 });
  const isMouseDownRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      isMouseDownRef.current = true;
      lastMousePosRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseDownRef.current) return;
      
      const deltaX = event.clientX - lastMousePosRef.current.x;
      const deltaY = event.clientY - lastMousePosRef.current.y;
      
      mouseDeltaRef.current = {
        x: deltaX * 0.002, // 회전 감도 조정
        y: deltaY * 0.002,
      };
      
      lastMousePosRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
      mouseDeltaRef.current = { x: 0, y: 0 };
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseleave", handleMouseUp); // 마우스가 창 밖으로 나가면

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseleave", handleMouseUp);
    };
  }, []);

  return mouseDeltaRef;
}

/**
 * Third-person 카메라 컨트롤러
 * 캐릭터를 따라가며 마우스로 회전할 수 있습니다.
 */
export function CameraController() {
  const { camera } = useThree();
  const characterContext = useCharacterContext();
  const mouseDeltaRef = useMouseInput();
  
  // 카메라 설정
  const cameraOffsetRef = useRef(new Spherical(5, Math.PI / 3, 0)); // 거리, 수직각, 수평각
  const targetPositionRef = useRef(new Vector3(0, 1, 0)); // 캐릭터 위치
  const currentCameraPositionRef = useRef(new Vector3(0, 3, 8)); // 현재 카메라 위치
  const smoothFactor = 0.1; // 카메라 부드러움 (낮을수록 부드러움)

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;

    // 초기 카메라 설정
    camera.fov = 75;
    camera.near = 0.1;
    camera.far = 1000;
    camera.updateProjectionMatrix();

    console.log("✅ Third-person 카메라 초기화 완료");
  }, [camera]);

  useFrame(() => {
    if (!(camera instanceof PerspectiveCamera)) return;

    // 마우스 입력으로 카메라 각도 조정
    const mouseDelta = mouseDeltaRef.current;
    if (mouseDelta.x !== 0 || mouseDelta.y !== 0) {
      cameraOffsetRef.current.theta -= mouseDelta.x; // 수평 회전
      cameraOffsetRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI / 2, cameraOffsetRef.current.phi + mouseDelta.y)
      ); // 수직 각도 제한
      
      // 마우스 델타 초기화 (다음 프레임을 위해)
      mouseDeltaRef.current = { x: 0, y: 0 };
    }

    // 캐릭터 위치 가져오기
    const characterPos = characterContext.characterPositionRef.current;
    targetPositionRef.current.set(
      characterPos.x,
      characterPos.y + 1, // 캐릭터 머리 높이
      characterPos.z
    );

    // 카메라 목표 위치 계산 (구면 좌표계 사용)
    const spherical = cameraOffsetRef.current;
    const offset = new Vector3();
    offset.setFromSpherical(spherical);
    
    const desiredPosition = targetPositionRef.current.clone().add(offset);

    // 부드러운 카메라 이동 (Lerp)
    currentCameraPositionRef.current.lerp(desiredPosition, 1 - Math.pow(1 - smoothFactor, 1));
    camera.position.copy(currentCameraPositionRef.current);

    // 카메라가 캐릭터를 바라보도록 설정
    camera.lookAt(targetPositionRef.current);
  });

  return null;
}

