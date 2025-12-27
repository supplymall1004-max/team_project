# 3D 모델 다운로드 및 교체 가이드

## 개요

현재 아파트 내부에 가족 구성원(아빠, 엄마, 나, 강아지)의 placeholder 모델이 표시됩니다.
실제 고퀄리티 모델로 교체하려면 아래 가이드를 따르세요.

## 무료 3D 모델 리소스

### 1. Sketchfab (추천)
- **URL**: https://sketchfab.com
- **검색 키워드**: "human character", "family", "dog", "puppy"
- **라이선스**: CC0 또는 CC-BY (상업적 사용 가능)
- **형식**: GLB 또는 GLTF 다운로드 가능

### 2. Poly Haven (이전 Google Poly)
- **URL**: https://polyhaven.com/models
- **특징**: 완전 무료, CC0 라이선스
- **검색**: "character", "person", "dog"

### 3. Mixamo (Adobe)
- **URL**: https://www.mixamo.com
- **특징**: 캐릭터 모델 + 애니메이션 제공
- **형식**: FBX (GLTF로 변환 필요)

### 4. Free3D
- **URL**: https://free3d.com
- **검색**: "human", "character", "dog"
- **주의**: 라이선스 확인 필수

## 모델 다운로드 및 설정

### 1. 모델 다운로드
1. 위 사이트에서 원하는 모델 검색
2. GLB 또는 GLTF 형식으로 다운로드
3. 라이선스 확인 (CC0 또는 CC-BY 권장)

### 2. 모델 파일 배치
```
public/
  models/
    family/
      dad.glb          # 아빠 모델
      mom.glb           # 엄마 모델
      child.glb         # 나(아이) 모델
      dog.glb           # 강아지 모델
```

### 3. 코드 수정

`components/game/threejs/family-members.tsx` 파일을 수정하여 실제 모델을 로드하세요:

```typescript
// 실제 모델 사용 예시
function DadCharacter({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF("/models/family/dad.glb");
  
  return (
    <group position={position} scale={1}>
      <primitive object={scene} />
    </group>
  );
}
```

## 모델 크기 조정

다운로드한 모델의 크기가 다를 수 있으므로 `scale` 속성을 조정하세요:

```typescript
<primitive object={scene} scale={[1, 1, 1]} /> // X, Y, Z 축별로 조정 가능
```

## 권장 모델 검색어

### 아빠/엄마
- "human character"
- "person model"
- "character rigged"
- "family member"

### 아이
- "child character"
- "kid model"
- "young character"

### 강아지
- "dog model"
- "puppy 3d"
- "pet dog"
- "cute dog"

## 라이선스 확인 사항

1. **CC0 (Public Domain)**: 자유롭게 사용 가능
2. **CC-BY (Attribution)**: 출처 표기 필요
3. **상업적 사용**: 프로젝트가 상업적이면 라이선스 확인 필수

## 모델 최적화 팁

1. **파일 크기**: 5MB 이하 권장
2. **폴리곤 수**: 모바일 고려 시 10,000 이하
3. **텍스처**: 1024x1024 이하 권장
4. **애니메이션**: 필요 시만 포함

## 문제 해결

### 모델이 보이지 않을 때
1. 파일 경로 확인
2. 브라우저 콘솔에서 에러 확인
3. 모델 크기가 너무 작거나 큰지 확인

### 모델 위치 조정
`components/game/threejs/family-members.tsx`의 `position` 값을 수정하세요.

## 참고 링크

- [Three.js GLTF Loader 문서](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)
- [React Three Fiber 문서](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
- [Sketchfab 검색](https://sketchfab.com/3d-models?features=downloadable&sort_by=-likeCount)

