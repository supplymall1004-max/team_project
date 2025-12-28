/**
 * @file components/game/threejs/apartment-viewer.tsx
 * @description 3D 아파트 내부 뷰어 컴포넌트
 *
 * Sketchfab과 같은 부드러운 1인칭 아파트 내부 탐색 기능을 제공합니다.
 * - OrbitControls로 마우스 드래그/휠 줌
 * - 자동 카메라 위치 조정
 * - 최적화된 조명 및 ToneMapping
 * - 빠른 로딩을 위한 최적화
 *
 * @dependencies
 * - @react-three/drei: useGLTF, OrbitControls
 * - @react-three/fiber: useThree, useFrame
 * - three: Box3, Vector3, ACESFilmicToneMapping
 */

"use client";

import { useRef, useEffect, useState } from "react";
import { useGLTF, Html } from "@react-three/drei";
import { OrbitControls } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { Group, Box3, Vector3, ACESFilmicToneMapping, PerspectiveCamera, DoubleSide, Mesh } from "three";

/**
 * 아파트 내부 뷰어 컴포넌트
 */
export function ApartmentViewer() {
  const groupRef = useRef<Group>(null);
  const controlsRef = useRef<any>(null);
  // useGLTF는 훅이므로 항상 호출되어야 함
  // 에러는 ErrorBoundary에서 처리됨
  const { scene } = useGLTF("/models/apartment-interior.glb");
  const { camera, gl } = useThree();
  const isInitialized = useRef(false);
  
  // 모델 바운딩 박스 저장 (카메라 제한용)
  const modelBoundsRef = useRef<{ min: Vector3; max: Vector3; center: Vector3 } | null>(null);
  
  // 초기 카메라 위치 및 타겟 저장
  const initialCameraPositionRef = useRef<Vector3 | null>(null);
  const initialCameraTargetRef = useRef<Vector3 | null>(null);
  
  // 카메라 리셋 애니메이션 상태
  const [isResetting, setIsResetting] = useState(false);
  
  // 키보드 입력 상태
  const keysRef = useRef({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  });

  // 모델 프리로드 (로딩 최적화)
  useEffect(() => {
    useGLTF.preload("/models/apartment-interior.glb");
  }, []);

  // 키보드 입력 감지
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp" || event.key === "ArrowDown" || 
          event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        keysRef.current[event.key as keyof typeof keysRef.current] = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp" || event.key === "ArrowDown" || 
          event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        keysRef.current[event.key as keyof typeof keysRef.current] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // 렌더러 ToneMapping 설정 (색감 개선) - 반사 줄이기
  useEffect(() => {
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0; // 노출값 증가 (0.5 -> 1.0) - 사물이 더 잘 보이도록
    gl.setClearColor(0x000000, 0); // 투명 배경 (알파값 0)
  }, [gl]);

  // 모델 자동 중앙 정렬 및 카메라 위치 조정
  useEffect(() => {
    if (!scene || !groupRef.current || isInitialized.current) return;

    // 모델 바운딩 박스 계산
    const box = new Box3().setFromObject(scene);
    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());

    console.log("📦 아파트 모델 정보:", {
      size: { x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2) },
      center: { x: center.x.toFixed(2), y: center.y.toFixed(2), z: center.z.toFixed(2) },
      maxSize: Math.max(size.x, size.y, size.z).toFixed(2),
    });

    // 모델을 원점으로 이동 (중심점 기준)
    groupRef.current.position.set(-center.x, -center.y, -center.z);

    // 모델 바운딩 박스 저장 (카메라 제한용)
    // 벽을 통과하지 않도록 약간의 여유 공간을 둠 (5% 축소로 완화)
    const margin = 0.05; // 5% 여유 공간 (10% -> 5%로 완화하여 더 자유롭게 이동 가능)
    const min = new Vector3(
      box.min.x - center.x - size.x * margin,
      box.min.y - center.y - size.y * margin,
      box.min.z - center.z - size.z * margin
    );
    const max = new Vector3(
      box.max.x - center.x + size.x * margin,
      box.max.y - center.y + size.y * margin,
      box.max.z - center.z + size.z * margin
    );
    modelBoundsRef.current = {
      min,
      max,
      center: new Vector3(0, 0, 0), // 모델이 원점으로 이동했으므로 중심은 (0,0,0)
    };

    console.log("📦 모델 경계 설정:", {
      min: { x: min.x.toFixed(2), y: min.y.toFixed(2), z: min.z.toFixed(2) },
      max: { x: max.x.toFixed(2), y: max.y.toFixed(2), z: max.z.toFixed(2) },
    });

    // 카메라 far plane 설정 (모든 거리에서 사물이 보이도록)
    if (camera instanceof PerspectiveCamera) {
      camera.far = 5000; // 매우 큰 far plane 설정
      // near plane을 모델 크기에 맞게 조정 (너무 작으면 검정 화면 문제 발생)
      const maxSize = Math.max(size.x, size.y, size.z);
      camera.near = Math.max(0.1, maxSize * 0.01); // 모델 크기의 1% 또는 최소 0.1
      camera.updateProjectionMatrix();
    }

    // 카메라 위치 자동 조정 - 아파트 내부 시점으로 설정
    // 모델이 원점으로 이동했으므로, 내부 중앙은 바운딩 박스의 중심 근처
    // 사람 눈높이 정도의 높이에 배치 (약 1.5-1.7m)
    const floorY = min.y; // 바닥 높이
    const ceilingY = max.y; // 천장 높이
    const roomHeight = ceilingY - floorY; // 방 높이
    
    // 카메라를 아파트 내부 중앙에 배치 (사람 눈높이: 바닥에서 약 1.6m 또는 방 높이의 50-60%)
    // 일반적인 아파트 천장 높이가 2.4-2.6m이므로, 눈높이는 약 1.5-1.7m
    const eyeHeight = Math.max(1.5, roomHeight * 0.55); // 최소 1.5m 또는 방 높이의 55%
    const cameraHeight = floorY + eyeHeight; // 바닥에서 눈높이만큼 올린 위치
    const cameraX = (min.x + max.x) * 0.5; // X축 중앙
    const cameraZ = (min.z + max.z) * 0.5; // Z축 중앙 (내부 중앙)
    
    // 카메라를 아파트 내부 중앙에 배치하고 수평으로 앞을 바라보도록 설정
    const initialPosition = new Vector3(cameraX, cameraHeight, cameraZ); // 내부 중앙, 눈높이
    // 카메라가 수평으로 앞을 바라보도록 (같은 높이, 앞쪽 방향)
    const initialTarget = new Vector3(cameraX, cameraHeight, cameraZ + 2); // 같은 높이, 앞쪽 2m 지점
    
    camera.position.copy(initialPosition);
    camera.lookAt(initialTarget);
    camera.updateProjectionMatrix();

    // 초기 카메라 위치 및 타겟 저장
    initialCameraPositionRef.current = initialPosition.clone();
    initialCameraTargetRef.current = initialTarget.clone();

    // OrbitControls 타겟 설정 - 카메라가 바라보는 지점 (수평 앞쪽)
    if (controlsRef.current) {
      controlsRef.current.target.set(cameraX, cameraHeight, cameraZ + 2); // 카메라 앞쪽 수평 지점
      controlsRef.current.update();
    }

    isInitialized.current = true;
    console.log("✅ 아파트 뷰어 초기화 완료", {
      cameraPosition: camera.position,
      cameraFar: camera.far,
      cameraNear: camera.near,
      target: controlsRef.current?.target,
    });
  }, [scene, camera]);

  // 모델 재질 최적화 (천장만 투명 처리, 벽은 완전히 불투명)
  useEffect(() => {
    if (!scene) return;

    scene.traverse((child) => {
      if (child instanceof Mesh && child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach((mat: any) => {
          if (mat) {
            // 그림자 설정
            child.castShadow = true;
            child.receiveShadow = true;

            // 재질 반사 줄이기 (roughness 증가, metalness 감소, emissive 제거)
            if (mat.roughness !== undefined) {
              mat.roughness = Math.max(mat.roughness || 0.5, 0.8); // 최소 0.8로 설정하여 반사 대폭 줄이기
            }
            if (mat.metalness !== undefined) {
              mat.metalness = Math.min(mat.metalness || 0, 0.2); // 최대 0.2로 제한하여 반사 줄이기
            }
            // 발광 효과 제거 (원거리 하얀색 문제 해결)
            if (mat.emissive) {
              mat.emissive.setScalar(0); // 발광 색상을 검은색으로 설정
              mat.emissiveIntensity = 0; // 발광 강도 0으로 설정
            }
            // 색상이 너무 밝으면 어둡게 조정
            if (mat.color) {
              const currentColor = mat.color;
              // 색상이 너무 밝으면 (밝기 > 0.9) 약간 어둡게
              const brightness = (currentColor.r + currentColor.g + currentColor.b) / 3;
              if (brightness > 0.9) {
                currentColor.multiplyScalar(0.85); // 15% 어둡게
              }
            }

            // 메시 위치 및 이름 확인
            const position = new Vector3();
            child.getWorldPosition(position);
            const meshName = child.name?.toLowerCase() || "";
            const materialName = mat.name?.toLowerCase() || "";
            const isHighPosition = position.y > 2.0; // 천장 위치 (2.5 -> 2.0으로 낮춰서 더 많은 천장 감지)
            const isLowPosition = position.y < 0.5; // 바닥 위치

            // 천장 찾기 (Y축 위치가 높은 메시) - 더 넓은 조건으로 감지
            const isCeiling = 
              isHighPosition ||
              meshName.includes("ceiling") ||
              meshName.includes("roof") ||
              meshName.includes("top") ||
              meshName.includes("천장") ||
              materialName.includes("ceiling") ||
              materialName.includes("roof") ||
              materialName.includes("top") ||
              // 수평 방향의 메시 중 높은 위치에 있는 것들
              (position.y > 1.8 && Math.abs(position.y - 2.5) < 1.5);

            if (isCeiling) {
              // 천장을 완전히 투명하게 (거의 보이지 않게)
              mat.transparent = true;
              mat.opacity = 0.05; // 더 투명하게 (0.1 -> 0.05)
              mat.depthWrite = false;
              mat.side = DoubleSide; // 양면 렌더링으로 양쪽에서 보이게
            } else {
              // 천장이 아닌 모든 메시는 불투명하게 (벽 포함)
              // 벽을 더 넓은 조건으로 찾기
              const isWall = 
                meshName.includes("wall") ||
                meshName.includes("exterior") ||
                meshName.includes("외벽") ||
                meshName.includes("side") ||
                materialName.includes("wall") ||
                materialName.includes("exterior") ||
                materialName.includes("side") ||
                // 수직 방향의 메시 (천장과 바닥 사이)
                (!isLowPosition && !isHighPosition && Math.abs(position.y - 1.5) < 1.0);

              if (isWall) {
                // 벽 투명도 완전히 제거
                mat.transparent = false;
                mat.opacity = 1.0;
                mat.depthWrite = true;
                
                // 벽 색상이 너무 밝으면 어둡게 조정
                if (mat.color) {
                  const brightness = (mat.color.r + mat.color.g + mat.color.b) / 3;
                  if (brightness > 0.95) {
                    // 하얀색에 가까우면 회색톤으로 조정
                    mat.color.setRGB(0.9, 0.9, 0.9);
                  } else if (brightness > 0.85) {
                    // 밝으면 약간 어둡게
                    mat.color.multiplyScalar(0.9);
                  }
                }
                
                console.log("✅ 벽 재질 수정 (투명도 제거):", meshName, materialName, `opacity: ${mat.opacity}`);
              } else {
                // 벽이 아닌 다른 메시도 투명도 제거 (바닥, 가구 등)
                mat.transparent = false;
                mat.opacity = 1.0;
                mat.depthWrite = true;
              }
            }
          }
        });
      }
    });

    console.log("✅ 모든 재질 수정 완료 (벽 투명도 제거)");
  }, [scene]);

  // 방향키로 카메라 이동 (벽을 통과하지 않도록 제한)
  useFrame((state, delta) => {
    if (!modelBoundsRef.current || !controlsRef.current) return;

    const keys = keysRef.current;
    if (!keys.ArrowUp && !keys.ArrowDown && !keys.ArrowLeft && !keys.ArrowRight) {
      return; // 키 입력이 없으면 이동하지 않음
    }

    const moveSpeed = 10.0 * delta; // 초당 10 단위 이동 (5.0 -> 10.0) - 더 빠른 이동
    const bounds = modelBoundsRef.current;
    
    // 카메라의 현재 방향 벡터 계산
    const direction = new Vector3();
    camera.getWorldDirection(direction);
    
    // 카메라의 오른쪽 벡터 계산
    const right = new Vector3();
    right.crossVectors(direction, camera.up).normalize();
    
    // 이동 벡터 계산
    const moveDelta = new Vector3(0, 0, 0);
    
    if (keys.ArrowUp) {
      // 앞으로 이동 (카메라가 바라보는 방향)
      moveDelta.add(direction.clone().multiplyScalar(moveSpeed));
    }
    if (keys.ArrowDown) {
      // 뒤로 이동
      moveDelta.add(direction.clone().multiplyScalar(-moveSpeed));
    }
    if (keys.ArrowLeft) {
      // 왼쪽으로 이동
      moveDelta.add(right.clone().multiplyScalar(-moveSpeed));
    }
    if (keys.ArrowRight) {
      // 오른쪽으로 이동
      moveDelta.add(right.clone().multiplyScalar(moveSpeed));
    }

    // 새로운 카메라 위치 계산
    const newPosition = camera.position.clone().add(moveDelta);
    
    // 바운딩 박스 내부로 제한 (벽을 통과하지 않도록)
    newPosition.x = Math.max(bounds.min.x, Math.min(bounds.max.x, newPosition.x));
    newPosition.y = Math.max(bounds.min.y, Math.min(bounds.max.y, newPosition.y));
    newPosition.z = Math.max(bounds.min.z, Math.min(bounds.max.z, newPosition.z));

    // 카메라 위치 업데이트
    camera.position.copy(newPosition);
    
    // OrbitControls 타겟도 함께 이동 (카메라가 바라보는 방향 유지)
    const currentTarget = controlsRef.current.target;
    const newTarget = currentTarget.clone().add(moveDelta);
    
    // 타겟도 바운딩 박스 내부로 제한
    newTarget.x = Math.max(bounds.min.x, Math.min(bounds.max.x, newTarget.x));
    newTarget.y = Math.max(bounds.min.y, Math.min(bounds.max.y, newTarget.y));
    newTarget.z = Math.max(bounds.min.z, Math.min(bounds.max.z, newTarget.z));
    
    controlsRef.current.target.copy(newTarget);
    controlsRef.current.update();
  });

  // 카메라 초기 위치로 리셋 함수
  const resetCamera = () => {
    if (!initialCameraPositionRef.current || !initialCameraTargetRef.current || !controlsRef.current) {
      return;
    }

    setIsResetting(true);

    // 부드러운 애니메이션으로 초기 위치로 이동
    const startPosition = camera.position.clone();
    const startTarget = controlsRef.current.target.clone();
    const endPosition = initialCameraPositionRef.current.clone();
    const endTarget = initialCameraTargetRef.current.clone();

    const duration = 1000; // 1초
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing 함수 (ease-in-out)
      const eased =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      camera.position.lerpVectors(startPosition, endPosition, eased);
      controlsRef.current.target.lerpVectors(startTarget, endTarget, eased);
      controlsRef.current.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsResetting(false);
      }
    };

    animate();
  };

  return (
    <>
      {/* OrbitControls: 마우스 드래그/휠 줌 - 아파트 내부 시점 최적화 */}
      <OrbitControls
        ref={controlsRef}
        enableDamping={true} // 부드러운 움직임
        dampingFactor={0.1} // 더 부드러운 감쇠
        minDistance={0.3} // 최소 줌 (너무 가까이 가면 벽을 통과하지 않도록)
        maxDistance={15} // 최대 줌 (아파트 내부에서 적절한 거리로 제한)
        enablePan={true} // 마우스 오른쪽 클릭으로 화면 이동
        panSpeed={1.0} // 팬 속도 조정 (내부 이동에 적합하게)
        enableRotate={true} // 마우스 드래그로 회전
        rotateSpeed={0.6} // 회전 속도 조정 (부드러운 회전)
        enableZoom={true} // 휠로 확대/축소
        zoomSpeed={0.8} // 줌 속도 조정
        minPolarAngle={Math.PI / 6} // 수직 각도 최소값 (30도 - 위에서 너무 많이 내려다보지 않도록)
        maxPolarAngle={Math.PI * 5 / 6} // 수직 각도 최대값 (150도 - 아래에서 너무 많이 올려보지 않도록)
        screenSpacePanning={false} // 화면 공간 팬 비활성화 (월드 공간 팬 사용)
      />

      {/* 아파트 모델 */}
      <group ref={groupRef}>
        <primitive object={scene} />
      </group>
    </>
  );
}

