# Three.js 게임 기능 목록

## ✅ 구현 완료된 기능

### 1. 기본 3D 게임 시스템
- ✅ Three.js 기반 3D 렌더링
- ✅ React Three Fiber 통합
- ✅ 3D 씬 환경 (방, 가구)
- ✅ 카메라 제어 (OrbitControls)
- ✅ 조명 시스템

### 2. 향상된 캐릭터 시스템
- ✅ 3D 캐릭터 모델 (기하학적)
- ✅ 애니메이션 시스템
  - Idle (대기)
  - Walk (걷기)
  - Sit (앉기)
  - Happy (행복 - 뛰기)
  - Sad (슬픔 - 고개 숙임)
- ✅ 표정 시스템
  - Normal (일반)
  - Happy (행복)
  - Sad (슬픔)
  - Surprised (놀람)
- ✅ 인터랙션 (클릭, 호버)

### 3. 파티클 효과 시스템
- ✅ 기본 파티클 시스템
- ✅ 하트 파티클 (이벤트 완료)
- ✅ 별 파티클 (레벨업)
- ✅ 이벤트별 파티클 (색상 변경)

### 4. 사운드 시스템
- ✅ 배경음악 지원
- ✅ 효과음 시스템
  - 클릭 사운드
  - 성공 사운드
  - 알림 사운드
  - 레벨업 사운드

### 5. 방 오브젝트
- ✅ 장난감 블록 (인터랙티브)
- ✅ 책
- ✅ 식물 (애니메이션)
- ✅ 공
- ✅ 인형

### 6. 날씨/시간 시스템
- ✅ 시간대별 조명 변경
  - 아침 (따뜻한 빛)
  - 오후 (밝은 빛)
  - 저녁 (따뜻한 빛)
  - 밤 (차가운 빛)

### 7. 캐릭터 이동 시스템
- ✅ 클릭 위치로 이동
- ✅ 부드러운 이동 애니메이션
- ✅ 도착 콜백

### 8. 이벤트 시스템 통합
- ✅ 기존 이벤트 시스템과 연동
- ✅ 이벤트별 파티클 효과
- ✅ 이벤트별 캐릭터 표정 변경
- ✅ 네온 말풍선 알림

## 🚀 추가 구현 가능한 기능

### 1. 고급 기능
- [ ] GLTF 모델 로드 (더 상세한 캐릭터/가구)
- [ ] 물리 엔진 (Cannon.js 또는 Rapier)
- [ ] 미니게임 시스템
- [ ] 캐릭터 커스터마이징
- [ ] 인벤토리 시스템

### 2. 시각적 개선
- [ ] 더 많은 파티클 효과
- [ ] 후처리 효과 (Bloom, SSAO)
- [ ] 더 많은 가구/오브젝트
- [ ] 텍스처 매핑
- [ ] 애니메이션 블렌딩

### 3. 게임플레이
- [ ] 퀘스트 시스템
- [ ] 업적 시스템
- [ ] 점수/랭킹 시스템
- [ ] 멀티플레이어 (선택적)

### 4. 최적화
- [ ] LOD (Level of Detail)
- [ ] 오클루전 컬링
- [ ] 텍스처 압축
- [ ] 메모리 관리

### 5. 접근성
- [ ] 키보드 컨트롤
- [ ] 화면 읽기 지원
- [ ] 설정 메뉴 (사운드, 그래픽)

## 📝 사용 방법

### 기본 사용
```tsx
<ThreeJSGameCanvas
  characterData={characterData}
  onCharacterClick={() => console.log("클릭!")}
  onEventTrigger={(type) => console.log("이벤트:", type)}
/>
```

### 애니메이션 제어
```tsx
// EnhancedCharacter 컴포넌트에서
<EnhancedCharacter
  animation="walk"  // idle, walk, sit, happy, sad
  expression="happy"  // normal, happy, sad, surprised
/>
```

### 파티클 효과
```tsx
<ParticleSystem
  position={[0, 1, 0]}
  count={100}
  eventType="medication"
/>
```

### 사운드 재생
```tsx
import { playSound } from "./threejs/sound-system";

playSound("click");
playSound("success");
playSound("notification");
playSound("levelup");
```

## 🎮 컨트롤

- **마우스 드래그**: 카메라 회전
- **휠**: 줌 인/아웃
- **캐릭터 클릭**: 인터랙션
- **바닥 클릭**: 캐릭터 이동 (구현 예정)

## 🔧 커스터마이징

### 조명 변경
`components/game/threejs-game-canvas.tsx`의 `Lighting` 컴포넌트 수정

### 캐릭터 모델 변경
`components/game/threejs/enhanced-character.tsx` 수정

### 파티클 효과 변경
`components/game/threejs/particle-system.tsx` 수정

### 사운드 파일 추가
`public/sounds/` 폴더에 사운드 파일 추가 후 `sound-system.tsx`에서 경로 수정

