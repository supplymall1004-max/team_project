# 게임 관련 코드 통합 및 정리 계획

## 현재 문제점

### 1. 게임 뷰 컴포넌트 중복
- `character-game-view.tsx`: 게임 뷰 메인 컴포넌트 (Three.js/Unity 선택, 이벤트 알림, HUD 포함)
- `threejs-game-canvas.tsx`: Three.js 3D 게임 캔버스
- `character-game-home-client.tsx`: 홈화면용 게임 클라이언트 (게임 뷰 + 사이드바 + 캐릭터 선택)
- `character-page-client.tsx`: 상세 페이지용 게임 클라이언트 (게임 뷰 + 탭)

### 2. 챕터2 건강 관리 게임과 겹침
- `app/page.tsx`에 `CharacterGameHome` (챕터2 섹션) - 홈화면에 게임 표시
- `app/chapters/health/page.tsx`에 별도의 건강 관리 페이지 - 건강 대시보드
- 둘 다 건강 관리 관련이지만 다른 UI/UX로 혼란 발생

### 3. 게임 로직 분산
- `actions/game/`: Server Actions (10개 파일)
- `lib/game/`: 게임 로직 (20개 파일)
- `components/game/`: UI 컴포넌트 (30개 파일)
- 각각이 너무 많고 중복될 수 있음

### 4. Three.js 관련 컴포넌트 과다
- 사용하지 않는 컴포넌트들 (beautiful-character, beautiful-room, room-objects, enhanced-character, character-movement 등)
- 중복 기능 (enhanced-lighting, fog-system, post-processing 등)

## 통합 계획

### Phase 1: 게임 뷰 컴포넌트 통합

#### 목표
- 단일 게임 뷰 컴포넌트로 통합
- 사용처별로 props로 커스터마이징

#### 구조
```
components/game/
├── game-view.tsx (통합 게임 뷰 - 메인)
├── game-canvas.tsx (Three.js 캔버스)
├── game-hud.tsx (HUD 컴포넌트)
├── game-sidebar.tsx (사이드바 컴포넌트)
└── threejs/
    ├── apartment-scene.tsx (아파트 씬)
    ├── gltf-loader.tsx (모델 로더)
    └── model-credits.tsx (모델 출처)
```

#### 변경 사항
1. `character-game-view.tsx` → `game-view.tsx`로 통합
2. `threejs-game-canvas.tsx` → `game-canvas.tsx`로 이름 변경
3. `character-game-home-client.tsx` → `game-view.tsx` 사용하도록 수정
4. `character-page-client.tsx` → `game-view.tsx` 사용하도록 수정

### Phase 2: 챕터2 건강 관리 게임 통합

#### 목표
- 홈화면의 게임과 건강 관리 페이지의 게임을 통합
- 단일 게임 뷰로 재사용

#### 구조
```
app/
├── page.tsx (홈 - 게임 뷰 사용)
└── chapters/
    └── health/
        └── page.tsx (건강 관리 - 게임 뷰 사용)
```

#### 변경 사항
1. `CharacterGameHome` → `GameView` 사용
2. `app/chapters/health/page.tsx` → `GameView` 사용
3. 중복 코드 제거

### Phase 3: 게임 로직 통합

#### 목표
- 게임 로직을 명확한 모듈로 분리
- 중복 코드 제거

#### 구조
```
lib/game/
├── core/
│   ├── game-state.ts (게임 상태 관리)
│   ├── game-events.ts (이벤트 시스템)
│   └── game-initializer.ts (초기화)
├── systems/
│   ├── quest-system.ts (퀘스트)
│   ├── level-system.ts (레벨)
│   └── collection-system.ts (컬렉션)
└── utils/
    ├── game-bridge.ts (Unity 브릿지)
    └── game-validator.ts (검증)
```

### Phase 4: Three.js 컴포넌트 정리

#### 목표
- 사용하지 않는 컴포넌트 제거
- 필요한 컴포넌트만 유지

#### 제거 대상
- `beautiful-character.tsx`
- `beautiful-room.tsx`
- `room-objects.tsx`
- `enhanced-character.tsx`
- `character-movement.tsx`
- `community-board-overlay.tsx` (사용 안 함)
- `city-scene.tsx` (현재 사용 안 함)

#### 유지 대상
- `apartment-scene.tsx`
- `gltf-loader.tsx`
- `model-credits.tsx`
- `enhanced-lighting.tsx` (필요시)
- `post-processing.tsx` (필요시)

## 실행 순서

1. **Phase 1**: 게임 뷰 컴포넌트 통합 (가장 중요)
2. **Phase 2**: 챕터2 건강 관리 게임 통합
3. **Phase 4**: Three.js 컴포넌트 정리 (빠른 정리)
4. **Phase 3**: 게임 로직 통합 (시간이 걸림)

## 예상 효과

1. 코드 중복 제거로 유지보수성 향상
2. 단일 게임 뷰로 일관된 UX 제공
3. 불필요한 컴포넌트 제거로 번들 크기 감소
4. 명확한 구조로 개발 속도 향상

