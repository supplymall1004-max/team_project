# Three.js 통합 계획 (Unity 대체)

Three.js를 사용하여 Unity를 대체하는 구현 계획입니다.

## 📋 개요

- **목표**: Unity WebGL 게임을 Three.js 기반으로 대체
- **이유**: 완전 무료, React 통합 용이, 설치 불필요
- **기간**: 1-2주 (기능에 따라)

## 🎯 구현 범위

### 1단계: Three.js 기본 설정

#### 1.1 패키지 설치
```bash
pnpm add three @react-three/fiber @react-three/drei
pnpm add -D @types/three
```

#### 1.2 기본 컴포넌트 생성
- `components/game/threejs-game-canvas.tsx` - Three.js 캔버스
- `components/game/threejs-character.tsx` - 3D 캐릭터 컴포넌트
- `lib/game/threejs-game-manager.ts` - 게임 상태 관리

### 2단계: 캐릭터 구현

#### 2.1 3D 캐릭터 모델
- GLTF/GLB 모델 로드
- 또는 기본 Geometry로 캐릭터 생성
- 애니메이션 시스템

#### 2.2 캐릭터 제어
- 마우스/터치 인터랙션
- 캐릭터 이동
- 애니메이션 트리거

### 3단계: 게임 이벤트 통합

#### 3.1 기존 이벤트 시스템 연동
- `CharacterGameEventNotification`과 통합
- Three.js 씬에서 이벤트 표시
- 말풍선/알림 오버레이

#### 3.2 인터랙션
- 캐릭터 클릭 이벤트
- 이벤트 트리거
- React와 양방향 통신

### 4단계: UI/UX 개선

#### 4.1 배경 씬
- 3D 배경 (집, 방 등)
- 조명 설정
- 카메라 제어

#### 4.2 효과
- 파티클 효과
- 애니메이션
- 네온 효과 (기존 말풍선과 통합)

## 📁 파일 구조

```
components/game/
├── threejs-game-canvas.tsx      # Three.js 메인 캔버스
├── threejs-character.tsx        # 3D 캐릭터 컴포넌트
├── threejs-scene.tsx            # 3D 씬 설정
├── threejs-camera.tsx           # 카메라 제어
└── threejs-lights.tsx           # 조명 설정

lib/game/
├── threejs-game-manager.ts      # 게임 상태 관리
├── threejs-character-controller.ts  # 캐릭터 제어
└── threejs-event-handler.ts     # 이벤트 처리
```

## 🔧 구현 예시

### 기본 Three.js 컴포넌트

```tsx
// components/game/threejs-game-canvas.tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { ThreeJSCharacter } from "./threejs-character";

export function ThreeJSGameCanvas() {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <OrbitControls />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      
      <ThreeJSCharacter />
    </Canvas>
  );
}
```

### 캐릭터 컴포넌트

```tsx
// components/game/threejs-character.tsx
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh } from "three";

export function ThreeJSCharacter({ position = [0, 0, 0] }) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}
```

## 🔄 기존 시스템과 통합

### CharacterGameView 수정

```tsx
// components/game/character-game-view.tsx
import { ThreeJSGameCanvas } from "./threejs-game-canvas";

export function CharacterGameView({ ... }) {
  // Unity 대신 Three.js 사용
  return (
    <div>
      {showHUD && <CharacterGameHUD {...} />}
      <ThreeJSGameCanvas />
      <CharacterGameEventNotification {...} />
    </div>
  );
}
```

## ✅ 장점

1. **완전 무료** - Unity 라이선스 걱정 없음
2. **React 통합** - React 컴포넌트처럼 사용
3. **설치 불필요** - npm 패키지만 설치
4. **TypeScript 지원** - 타입 안정성
5. **커뮤니티** - 활발한 지원

## 📚 참고 자료

- [React Three Fiber 문서](https://docs.pmnd.rs/react-three-fiber)
- [Three.js 예제](https://threejs.org/examples/)
- [Drei 컴포넌트](https://github.com/pmndrs/drei)

