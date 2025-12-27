# Unity 무료 대안 - WebGL 게임 엔진 비교

Unity의 유료 정책 때문에 무료 대안을 찾고 계신다면, 다음 옵션들을 고려해보세요.

## 🎮 추천 무료 게임 엔진/프레임워크

### 1. **Three.js** ⭐ (가장 추천 - React 통합 용이)

**장점:**
- ✅ 완전 무료, 오픈소스
- ✅ React/Next.js와 통합 매우 쉬움
- ✅ WebGL 기반 3D 렌더링
- ✅ 활발한 커뮤니티
- ✅ TypeScript 지원 우수
- ✅ 설치 없이 npm으로 바로 사용

**단점:**
- ❌ 게임 엔진이 아닌 렌더링 라이브러리 (물리 엔진 등은 별도)
- ❌ 학습 곡선이 있음

**사용 사례:**
- 3D 캐릭터 표시
- 인터랙티브 3D 씬
- WebGL 기반 게임

**설치:**
```bash
pnpm add three @react-three/fiber @react-three/drei
```

---

### 2. **Phaser 3** ⭐ (2D 게임에 최적)

**장점:**
- ✅ 완전 무료, 오픈소스
- ✅ 2D 게임에 특화
- ✅ 물리 엔진 내장
- ✅ 애니메이션 시스템
- ✅ React 통합 가능
- ✅ TypeScript 지원

**단점:**
- ❌ 3D 지원 제한적
- ❌ React 통합이 Three.js보다 복잡

**사용 사례:**
- 2D 캐릭터 게임
- 스프라이트 애니메이션
- 2D 물리 시뮬레이션

**설치:**
```bash
pnpm add phaser
```

---

### 3. **PixiJS**

**장점:**
- ✅ 완전 무료
- ✅ 2D WebGL 렌더러 (매우 빠름)
- ✅ React 통합 가능
- ✅ TypeScript 지원

**단점:**
- ❌ 게임 엔진 기능 제한적 (렌더링에 특화)
- ❌ 물리 엔진 별도 필요

**사용 사례:**
- 고성능 2D 렌더링
- 스프라이트 애니메이션
- 파티클 효과

**설치:**
```bash
pnpm add pixi.js
```

---

### 4. **Godot Engine** (WebGL 빌드 가능)

**장점:**
- ✅ 완전 무료, 오픈소스
- ✅ Unity와 유사한 에디터
- ✅ WebGL 빌드 지원
- ✅ 2D/3D 모두 지원
- ✅ GDScript 또는 C# 사용

**단점:**
- ❌ 별도 에디터 설치 필요
- ❌ React와 직접 통합 어려움 (빌드 후 통합)
- ❌ Unity만큼의 생태계는 아님

**사용 사례:**
- Unity와 유사한 워크플로우 원할 때
- 복잡한 게임 로직
- WebGL로 빌드 후 Next.js에 통합

---

### 5. **Babylon.js**

**장점:**
- ✅ 완전 무료
- ✅ 강력한 3D 엔진
- ✅ React 통합 가능
- ✅ TypeScript 지원

**단점:**
- ❌ Three.js보다 복잡
- ❌ 학습 곡선이 있음

**사용 사례:**
- 고급 3D 게임
- 복잡한 3D 시뮬레이션

**설치:**
```bash
pnpm add @babylonjs/core @babylonjs/loaders
```

---

## 🎯 프로젝트에 가장 적합한 선택

현재 프로젝트 분석:
- ✅ 건강 관리 게임
- ✅ 캐릭터 표시 (2D 또는 간단한 3D)
- ✅ 이벤트 알림 시스템 (이미 구현됨)
- ✅ React/Next.js 기반

### 추천: **Three.js** 또는 **Phaser 3**

**Three.js를 선택하는 경우:**
- 3D 캐릭터가 필요할 때
- React 통합이 가장 쉬움
- `@react-three/fiber`로 React 컴포넌트처럼 사용

**Phaser 3을 선택하는 경우:**
- 2D 게임이면 충분할 때
- 스프라이트 애니메이션이 중요할 때
- 물리 엔진이 필요할 때

---

## 💡 현재 프로젝트 상태

좋은 소식: **이미 Unity 없이도 작동하는 시스템이 구현되어 있습니다!**

- ✅ `CharacterGameCanvas` - 2D 캔버스 기반 게임 뷰
- ✅ `CharacterGameEventNotification` - 이벤트 알림 시스템
- ✅ `NeonSpeechBubble` - 네온 말풍선 알림
- ✅ 게임 이벤트 시스템 (약물, 분유, 건강검진 등)

**Unity 없이도 게임의 핵심 기능은 모두 작동합니다!**

---

## 🚀 다음 단계

1. **현재 상태 유지** (Unity 없이)
   - 이미 작동하는 시스템 활용
   - 추가 기능만 구현

2. **Three.js로 업그레이드** (3D 필요 시)
   - 3D 캐릭터 추가
   - 인터랙티브 씬 구현

3. **Phaser 3으로 업그레이드** (2D 게임 강화)
   - 스프라이트 애니메이션
   - 물리 엔진 활용

---

## 📚 참고 자료

- [Three.js 공식 문서](https://threejs.org/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
- [Phaser 3 공식 문서](https://phaser.io/phaser3)
- [Godot Engine](https://godotengine.org/)

