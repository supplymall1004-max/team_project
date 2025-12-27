# Three.js 게임 퀄리티 향상 가이드

이 문서는 Three.js 기반 웹 게임의 시각적 퀄리티를 높이기 위한 실전 가이드를 제공합니다.

## 📋 목차

1. [개선된 시스템 개요](#개선된-시스템-개요)
2. [조명과 그림자 시스템](#조명과-그림자-시스템)
3. [후처리 효과](#후처리-효과)
4. [안개 효과](#안개-효과)
5. [PBR 재질 시스템](#pbr-재질-시스템)
6. [GLTF 모델 사용 가이드](#gltf-모델-사용-가이드)
7. [무료 3D 모델 다운로드 사이트](#무료-3d-모델-다운로드-사이트)
8. [성능 최적화 팁](#성능-최적화-팁)

---

## 개선된 시스템 개요

프로젝트에 다음 시스템들이 추가되었습니다:

- ✅ **향상된 조명 시스템** (`enhanced-lighting.tsx`)
- ✅ **후처리 효과** (`post-processing.tsx`)
- ✅ **안개 효과** (`fog-system.tsx`)
- ✅ **PBR 재질 시스템** (`pbr-materials.tsx`)
- ✅ **개선된 GLTF 로더** (`gltf-loader.tsx`)

---

## 조명과 그림자 시스템

### 기본 사용법

```tsx
import { EnhancedLighting, AutoTimeLighting } from "./threejs/enhanced-lighting";

// 자동 시간대별 조명 (권장)
<AutoTimeLighting enableShadows={true} />

// 또는 수동 설정
<EnhancedLighting 
  timeOfDay="afternoon"
  enableShadows={true}
  shadowQuality="medium" // "low" | "medium" | "high"
/>
```

### 주요 기능

1. **Soft Shadows (부드러운 그림자)**
   - PCF (Percentage Closer Filtering) 사용
   - 그림자 가장자리가 부드럽게 처리됨

2. **시간대별 조명**
   - 아침: 따뜻한 빛 (#FFF8DC)
   - 오후: 밝은 빛 (#FFFFFF)
   - 저녁: 따뜻한 노을빛 (#FFA07A)
   - 밤: 차가운 달빛 (#4169E1)

3. **그림자 품질 설정**
   - Low: 1024x1024 (성능 우선)
   - Medium: 2048x2048 (균형)
   - High: 4096x4096 (품질 우선)

---

## 후처리 효과

### 기본 사용법

```tsx
import { PostProcessing, LightweightPostProcessing } from "./threejs/post-processing";

// 경량 버전 (권장 - 성능 우선)
<LightweightPostProcessing />

// 또는 전체 효과
<PostProcessing
  enableBloom={true}
  enableSSAO={true}
  enableVignette={true}
  bloomIntensity={0.5}
  ssaoIntensity={1.0}
/>
```

### 주요 효과

1. **Bloom (빛나는 효과)**
   - 밝은 부분이 빛나도록 처리
   - `bloomIntensity`: 0.3 ~ 0.8 권장

2. **SSAO (Screen Space Ambient Occlusion)**
   - 그림자 깊이감 추가
   - `ssaoIntensity`: 0.5 ~ 1.5 권장

3. **Vignette (주변 어둡게)**
   - 화면 주변을 어둡게 처리하여 집중도 향상

---

## 안개 효과

### 기본 사용법

```tsx
import { FogSystem, AutoTimeFog } from "./threejs/fog-system";

// 자동 시간대별 안개 (권장)
<AutoTimeFog />

// 또는 수동 설정
<FogSystem
  type="linear" // "linear" | "exponential"
  color="#F0F8FF"
  near={5}
  far={20}
  timeOfDay="afternoon"
/>
```

### 안개 타입

1. **Linear Fog (선형 안개)**
   - `near`에서 시작하여 `far`에서 완전히 불투명
   - 깊이감이 자연스러움

2. **Exponential Fog (지수 안개)**
   - `density` 값으로 조절
   - 더 부드러운 전환

---

## PBR 재질 시스템

### 기본 사용법

```tsx
import { usePBRMaterial, createPBRMaterial } from "./threejs/pbr-materials";

// 훅 사용 (권장)
const woodMaterial = usePBRMaterial("wood", {
  color: "#8B4513",
  roughness: 0.8,
  metalness: 0.0,
});

// 또는 직접 생성
const metalMaterial = createPBRMaterial("metal", {
  roughness: 0.2,
  metalness: 0.9,
});
```

### 재질 프리셋

- `wood`: 나무 (roughness: 0.8, metalness: 0.0)
- `metal`: 금속 (roughness: 0.2, metalness: 0.9)
- `plastic`: 플라스틱 (roughness: 0.4, metalness: 0.0)
- `fabric`: 천 (roughness: 0.9, metalness: 0.0)
- `ceramic`: 도자기 (roughness: 0.1, metalness: 0.0)
- `glass`: 유리 (roughness: 0.0, metalness: 0.0)
- `rubber`: 고무 (roughness: 0.9, metalness: 0.0)

### 텍스처 사용

```tsx
import { createTexturedPBRMaterial } from "./threejs/pbr-materials";

const texturedMaterial = createTexturedPBRMaterial("wood", {
  diffuse: "/textures/wood_diffuse.jpg",
  normal: "/textures/wood_normal.jpg",
  roughness: "/textures/wood_roughness.jpg",
  metalness: "/textures/wood_metalness.jpg",
  ao: "/textures/wood_ao.jpg",
});
```

---

## GLTF 모델 사용 가이드

### 기본 사용법

```tsx
import { GLTFModelLoader, CharacterGLTF, FurnitureGLTF } from "./threejs/gltf-loader";

// 기본 모델 로드
<GLTFModelLoader
  path="/models/furniture.glb"
  position={[0, 0, 0]}
  rotation={[0, 0, 0]}
  scale={1}
  castShadow={true}
  receiveShadow={true}
  autoPlayAnimation={true}
  animationName="idle"
/>

// 캐릭터 모델
<CharacterGLTF
  modelPath="/models/character.glb"
  position={[0, 0, 0]}
  onClick={() => console.log("캐릭터 클릭!")}
/>

// 가구 모델
<FurnitureGLTF
  modelPath="/models/table.glb"
  position={[-2, 0, -2]}
  scale={1.5}
/>
```

### 모델 프리로드 (성능 최적화)

```tsx
import { preloadGLTFModels } from "./threejs/gltf-loader";

// 게임 시작 전에 모델 프리로드
preloadGLTFModels([
  "/models/character.glb",
  "/models/table.glb",
  "/models/chair.glb",
]);
```

---

## 무료 3D 모델 다운로드 사이트

### 1. Quaternius (완전 무료 - 강력 추천) ⭐

**사이트**: [quaternius.com](https://quaternius.com/)

**특징**:
- 모든 모델이 **CC0 라이선스** (저작권 소멸, 출처 표기 불필요)
- 로우폴리 스타일로 웹에 최적화
- 테마별 패키지 제공 (Furniture Pack, Nature Pack 등)

**사용 방법**:
1. 상단 메뉴에서 **[Packs]** 클릭
2. 원하는 패키지 선택 (예: Furniture Pack)
3. 하단 **[Download]** 버튼 클릭
4. GLB 또는 GLTF 포맷 다운로드
5. `public/models/` 폴더에 저장

**추천 패키지**:
- Cyberpunk Pack
- Furniture Pack
- Nature Pack
- Low Poly Characters

---

### 2. Poly Haven (실사 지향 완전 무료)

**사이트**: [polyhaven.com/models](https://polyhaven.com/models)

**특징**:
- 전문가들이 기부금으로 운영
- 매우 높은 퀄리티
- CC0 라이선스
- 모델뿐만 아니라 텍스처, HDRI도 제공

**사용 방법**:
1. 원하는 모델 선택
2. 오른쪽 상단 다운로드 설정에서 **GLTF** 선택
3. 해상도는 **1K** 권장 (웹에서는 충분)
4. 다운로드 후 `public/models/` 폴더에 저장

**추천 모델**:
- 나무, 돌, 벤치 등 자연물
- 가구 (의자, 테이블 등)

---

### 3. Sketchfab (무료 필터링 활용)

**사이트**: [sketchfab.com](https://sketchfab.com/)

**특징**:
- 전 세계에서 가장 많은 무료 모델
- 필터를 정확히 사용해야 함
- 일부 모델은 출처 표기 필요 (CC BY)

**사용 방법**:
1. 검색창에 영어로 검색 (예: `isometric room`, `game character`)
2. 검색 결과 상단 필터에서:
   - **[Downloadable]** 체크
   - 가격 필터에서 **[Free]** 선택
3. 모델 선택 후 **[Download 3D Model]** 클릭
4. **GLTF** 포맷 다운로드
5. 라이선스 확인 (CC0 또는 CC BY)

**주의사항**:
- CC BY 라이선스는 출처 표기 필요
- CC0 라이선스는 출처 표기 불필요

---

## 성능 최적화 팁

### 1. 그림자 품질 조절

```tsx
// 저사양 기기
<EnhancedLighting shadowQuality="low" />

// 중간 사양
<EnhancedLighting shadowQuality="medium" />

// 고사양 기기
<EnhancedLighting shadowQuality="high" />
```

### 2. 후처리 효과 최적화

```tsx
// 저사양 기기
<LightweightPostProcessing />

// 고사양 기기
<PostProcessing enableBloom={true} enableSSAO={true} />
```

### 3. 모델 최적화

- GLB 포맷 사용 (GLTF보다 작음)
- 텍스처 해상도: 1K (1024x1024) 권장
- 불필요한 폴리곤 제거

### 4. 모델 프리로드

```tsx
// 게임 시작 전에 모든 모델 프리로드
useEffect(() => {
  preloadGLTFModels([
    "/models/character.glb",
    "/models/table.glb",
  ]);
}, []);
```

---

## 실제 적용 예시

### 예시 1: 가구 모델 추가

```tsx
import { FurnitureGLTF } from "./threejs/gltf-loader";

// Quaternius에서 다운로드한 테이블 모델
<FurnitureGLTF
  modelPath="/models/table.glb"
  position={[-2, 0, -2]}
  scale={1.5}
/>

// 의자 모델
<FurnitureGLTF
  modelPath="/models/chair.glb"
  position={[-1.5, 0, -1]}
  scale={1.2}
/>
```

### 예시 2: PBR 재질 적용

```tsx
import { usePBRMaterial } from "./threejs/pbr-materials";

function WoodenTable() {
  const material = usePBRMaterial("wood", {
    color: "#8B4513",
    roughness: 0.8,
  });

  return (
    <mesh material={material}>
      <boxGeometry args={[2, 0.1, 1]} />
    </mesh>
  );
}
```

### 예시 3: 전체 씬 설정

```tsx
<Canvas shadows gl={{ antialias: true }}>
  {/* 향상된 조명 */}
  <AutoTimeLighting enableShadows={true} />
  
  {/* 안개 효과 */}
  <AutoTimeFog />
  
  {/* 3D 모델들 */}
  <FurnitureGLTF modelPath="/models/table.glb" />
  <CharacterGLTF modelPath="/models/character.glb" />
  
  {/* 후처리 효과 */}
  <LightweightPostProcessing />
</Canvas>
```

---

## 문제 해결

### 그림자가 보이지 않을 때

1. `Canvas`에 `shadows` prop 추가 확인
2. `EnhancedLighting`의 `enableShadows={true}` 확인
3. 모델의 `castShadow` 및 `receiveShadow` 확인

### 성능이 느릴 때

1. 그림자 품질을 "low"로 낮춤
2. `LightweightPostProcessing` 사용
3. 모델 폴리곤 수 확인
4. 텍스처 해상도 낮춤 (1K 권장)

### 모델이 로드되지 않을 때

1. 파일 경로 확인 (`/models/` 폴더에 있는지)
2. GLB 또는 GLTF 포맷 확인
3. 브라우저 콘솔에서 에러 확인
4. 모델 파일 크기 확인 (너무 크면 최적화 필요)

---

## 추가 리소스

- [Three.js 공식 문서](https://threejs.org/docs/)
- [React Three Fiber 문서](https://docs.pmnd.rs/react-three-fiber/)
- [React Three Drei 문서](https://github.com/pmndrs/drei)
- [Post-processing 문서](https://github.com/pmndrs/postprocessing)

---

## 요약

이 가이드를 따라하면:

1. ✅ **부드러운 그림자**로 깊이감 추가
2. ✅ **후처리 효과**로 화면 퀄리티 향상
3. ✅ **안개 효과**로 분위기 연출
4. ✅ **PBR 재질**로 현실적인 표현
5. ✅ **GLTF 모델**로 고퀄리티 3D 오브젝트 사용

모든 시스템이 이미 프로젝트에 통합되어 있으므로, 위의 예시 코드를 참고하여 바로 사용할 수 있습니다!

