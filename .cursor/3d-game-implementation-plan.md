# 3D 모델링 게임 구현 계획

## 📋 개요

아파트 내부 3D 모델을 활용한 인터랙티브 게임을 구현합니다.
사용자는 3D 공간 내에서 캐릭터를 조작하고, 다양한 게임 요소와 상호작용할 수 있습니다.

## 🎯 목표

1. **3D 공간 탐험**: 아파트 내부를 자유롭게 탐험
2. **캐릭터 조작**: 키보드/마우스로 캐릭터 이동 및 상호작용
3. **게임 요소**: 퀘스트, 아이템, NPC 등 게임 요소 추가
4. **성능 최적화**: 부드러운 60fps 유지

## 🏗️ 아키텍처

### 기술 스택
- **3D 렌더링**: React Three Fiber (@react-three/fiber)
- **3D 유틸리티**: React Three Drei (@react-three/drei)
- **물리 엔진**: Rapier (@react-three/rapier) 또는 Cannon.js
- **애니메이션**: Three.js Animation Mixer
- **상태 관리**: Zustand 또는 Jotai (최소한의 전역 상태)

### 디렉토리 구조
```
components/game/
├── threejs/
│   ├── game-scene.tsx          # 메인 게임 씬
│   ├── character-controller.tsx # 캐릭터 컨트롤러
│   ├── camera-controller.tsx    # 카메라 컨트롤러
│   ├── physics-world.tsx        # 물리 엔진 월드
│   ├── game-ui-overlay.tsx      # 게임 UI 오버레이
│   ├── interaction-system.tsx   # 상호작용 시스템
│   └── game-hud.tsx             # 게임 HUD
├── game-state/
│   ├── use-game-state.ts        # 게임 상태 관리
│   └── use-character-state.ts  # 캐릭터 상태 관리
└── character-game-view.tsx      # 게임 뷰 래퍼
```

## 📐 구현 단계

### Phase 1: 기본 3D 씬 구성 (1-2주)

#### 1.1 게임 씬 설정
- [ ] React Three Fiber Canvas 설정
- [ ] 기본 조명 설정 (Directional, Ambient, Point Lights)
- [ ] 아파트 모델 로드 및 배치
- [ ] 카메라 초기 위치 설정

#### 1.2 모델 최적화
- [ ] GLB 모델 로드 및 최적화
- [ ] 텍스처 압축 및 LOD 설정
- [ ] 그림자 맵 최적화
- [ ] 프러스텀 컬링 설정

**파일**: `components/game/threejs/game-scene.tsx`

### Phase 2: 캐릭터 시스템 (2-3주)

#### 2.1 캐릭터 모델
- [ ] 캐릭터 GLB 모델 로드
- [ ] 캐릭터 애니메이션 시스템 (걷기, 뛰기, 대기 등)
- [ ] 캐릭터 본(Bone) 구조 확인 및 설정

#### 2.2 캐릭터 컨트롤러
- [ ] 키보드 입력 처리 (WASD, 화살표 키)
- [ ] 캐릭터 이동 로직 (Third-person 컨트롤)
- [ ] 점프 및 액션 처리
- [ ] 애니메이션 블렌딩

**파일**: 
- `components/game/threejs/character-controller.tsx`
- `components/game/threejs/character-model.tsx`

### Phase 3: 물리 엔진 (1-2주)

#### 3.1 물리 월드 설정
- [ ] Rapier 또는 Cannon.js 초기화
- [ ] 바닥 및 벽 콜라이더 설정
- [ ] 캐릭터 캡슐 콜라이더 설정
- [ ] 중력 및 충돌 감지

#### 3.2 상호작용 가능한 오브젝트
- [ ] 문, 가구 등 상호작용 오브젝트 콜라이더
- [ ] 트리거 영역 설정 (퀘스트, 아이템 등)
- [ ] 레이캐스팅 기반 상호작용 감지

**파일**: 
- `components/game/threejs/physics-world.tsx`
- `components/game/threejs/interaction-system.tsx`

### Phase 4: 카메라 시스템 (1주)

#### 4.1 Third-Person 카메라
- [ ] 캐릭터 뒤를 따라가는 카메라
- [ ] 마우스로 카메라 회전
- [ ] 카메라 충돌 감지 (벽에 가려지지 않도록)
- [ ] 부드러운 카메라 전환

**파일**: `components/game/threejs/camera-controller.tsx`

### Phase 5: 게임 UI 및 HUD (1-2주)

#### 5.1 게임 HUD
- [ ] 체력/에너지 바
- [ ] 미니맵
- [ ] 퀘스트 목록
- [ ] 인벤토리 UI

#### 5.2 상호작용 UI
- [ ] 상호작용 가능한 오브젝트 하이라이트
- [ ] 상호작용 프롬프트 (E키로 상호작용 등)
- [ ] 대화창 UI

**파일**: 
- `components/game/threejs/game-hud.tsx`
- `components/game/threejs/game-ui-overlay.tsx`

### Phase 6: 게임 요소 (2-3주)

#### 6.1 퀘스트 시스템
- [ ] 퀘스트 데이터 구조 설계
- [ ] 퀘스트 진행 상태 관리
- [ ] 퀘스트 목표 추적
- [ ] 퀘스트 완료 처리

#### 6.2 아이템 시스템
- [ ] 아이템 스폰 및 수집
- [ ] 인벤토리 관리
- [ ] 아이템 사용 로직

#### 6.3 NPC 시스템
- [ ] NPC 모델 배치
- [ ] NPC 대화 시스템
- [ ] NPC 애니메이션 (대기, 걷기 등)

**파일**: 
- `components/game/threejs/npc-system.tsx`
- `components/game/threejs/quest-system.tsx`
- `components/game/threejs/item-system.tsx`

### Phase 7: 성능 최적화 (1주)

#### 7.1 렌더링 최적화
- [ ] 오브젝트 인스턴싱
- [ ] 프러스텀 컬링 최적화
- [ ] 그림자 품질 조정
- [ ] LOD (Level of Detail) 구현

#### 7.2 물리 최적화
- [ ] 물리 업데이트 주기 조정
- [ ] 불필요한 콜라이더 제거
- [ ] 물리 오브젝트 풀링

## 🎮 게임 기능 명세

### 기본 조작
- **이동**: WASD 또는 화살표 키
- **카메라 회전**: 마우스 드래그
- **상호작용**: E키
- **점프**: Space바
- **달리기**: Shift + 이동

### 게임 요소
1. **방 탐험**: 아파트 내 여러 방을 자유롭게 탐험
2. **가구 상호작용**: 의자에 앉기, 침대에서 휴식 등
3. **퀘스트 수행**: NPC로부터 퀘스트를 받고 완료
4. **아이템 수집**: 방 안에 있는 아이템 수집
5. **건강 관리**: 캐릭터의 체력, 에너지 관리

## 📊 데이터 구조

### 게임 상태
```typescript
interface GameState {
  character: {
    position: [number, number, number];
    rotation: number;
    health: number;
    energy: number;
    level: number;
    experience: number;
  };
  inventory: Item[];
  quests: Quest[];
  currentRoom: string;
}
```

### 퀘스트 구조
```typescript
interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: Reward[];
  status: 'available' | 'in_progress' | 'completed';
}
```

## 🔧 개발 우선순위

### 높은 우선순위
1. ✅ 기본 3D 씬 구성
2. ✅ 캐릭터 이동 및 조작
3. ✅ 카메라 시스템
4. ✅ 기본 상호작용

### 중간 우선순위
5. 퀘스트 시스템
6. NPC 시스템
7. 아이템 시스템

### 낮은 우선순위
8. 고급 애니메이션
9. 사운드 효과
10. 파티클 효과

## 📝 참고 자료

- [React Three Fiber 문서](https://docs.pmnd.rs/react-three-fiber)
- [React Three Drei 문서](https://github.com/pmndrs/drei)
- [Rapier 물리 엔진](https://rapier.rs/)
- [Three.js 문서](https://threejs.org/docs/)

## 🚀 시작하기

1. **Phase 1부터 시작**: 기본 3D 씬 구성
2. **점진적 개발**: 각 Phase를 완료한 후 다음 Phase로 진행
3. **테스트 중심**: 각 기능 구현 후 충분한 테스트
4. **성능 모니터링**: FPS 및 메모리 사용량 지속 모니터링

## 📅 예상 일정

- **Phase 1-2**: 3-4주 (기본 씬 + 캐릭터)
- **Phase 3-4**: 2-3주 (물리 + 카메라)
- **Phase 5-6**: 3-4주 (UI + 게임 요소)
- **Phase 7**: 1주 (최적화)

**총 예상 기간**: 9-12주

