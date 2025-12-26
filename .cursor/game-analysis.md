# Sunrise Village 게임 분석 문서

> **분석 대상**: https://un-game.sunrisevillagegame.com/  
> **분석 일시**: 2025-01-24  
> **게임 타입**: Unity WebGL 기반 빌리지 빌딩 시뮬레이션 게임

---

## 📋 목차

1. [기술 스택 분석](#기술-스택-분석)
2. [게임 시스템 분석](#게임-시스템-분석)
3. [UI/UX 분석](#uiux-분석)
4. [애니메이션 및 시각 효과](#애니메이션-및-시각-효과)
5. [코드 구조 분석](#코드-구조-분석)
6. [네트워크 통신 분석](#네트워크-통신-분석)
7. [구현 계획](#구현-계획)

---

## 🔧 기술 스택 분석

### 핵심 기술

- **게임 엔진**: Unity 6000.0.58f2
- **렌더링**: WebGL 2.0 (OpenGL ES 3.0)
- **물리 엔진**: PhysX 4.1.2
- **오디오**: Web Audio API
- **로컬 스토리지**: IndexedDB (IndexDBControl.js)

### 로드된 리소스

#### JavaScript 파일
- `config/unity.js` - Unity WebGL 설정
- `IndexDBControl.js` - IndexedDB 관리
- `ClientTracking.js` - 클라이언트 추적/분석
- `unitybridge.js` - Unity-브라우저 브릿지
- `es5.js` - ES5 호환성
- `compatibility.js` - 브라우저 호환성
- `pretty-console.js` - 콘솔 로그 포맷팅

#### Unity 빌드 파일
- `Build/6888b24fbb0e1263d2c24a9f10e65020.loader.js` - Unity 로더
- `Build/fc89d53d1526af9790097f91d5460c2d.framework.js` - Unity 프레임워크
- `Build/fe09d0fa1c9e301528bdf7a767083079.wasm` - WebAssembly 바이너리
- `Build/7a405cd75a3564e19e34e54f214b789d.data` - 게임 데이터

#### 이미지 리소스
- `logo.png` - 게임 로고
- `AnimalTiledPattern.jpg` - 동물 타일 패턴
- `woodframe_slice.png` - 나무 프레임 슬라이스

#### 스타일시트
- `css/style.css` - 게임 페이지 스타일

### CDN 및 외부 리소스
- `vilun.innogamescdn.com` - InnoGames CDN (Unity 빌드 파일 호스팅)
- `sentry-prod.innogames.de` - Sentry 에러 추적 서비스

### Unity Asset Bundle 구조

게임은 여러 Asset Bundle로 나뉘어져 동적 로딩됩니다:

#### Bootstrap 번들
- `bootstrap_0_mainscene_*` - 메인 씬 및 에셋
- `bootstrap_1_maininstaller_*` - 메인 인스톨러
- `bootstrap_2_basestatechartdependencies_*` - 상태 차트 의존성
- `bootstrap_3_generated_viewgamedesigndatacontainer_*` - 게임 디자인 데이터 컨테이너
- `bootstrap_4_compositionrootstate_*` - 컴포지션 루트 상태
- `bootstrap_5_sunrisevillageaudioeventconfig_*` - 오디오 이벤트 설정

#### 게임 월드 번들
- `bootstatechartstartup_24_sharedgameworldscene_*` - 공유 게임 월드 씬
- `bootstatechartstartup_23_gameworldrendertexture_*` - 게임 월드 렌더 텍스처

#### 셰이더 번들
- `shader_tmp_sprite_*` - 스프라이트 임시 셰이더
- `shader_ui_greyscale_*` - UI 그레이스케일 셰이더
- `shader_ui_default_additive_*` - UI 기본 애디티브 셰이더
- `shader_color_*` - 컬러 셰이더
- `shader_ui_gameworld_*` - 게임 월드 UI 셰이더
- `shader_depthpasscopy_*` - 깊이 패스 복사 셰이더
- `shader_selection_*` - 선택 셰이더

#### 폰트 번들
- `font_lilitaone_regular_sdf_*` - LilitaOne 일반체 (SDF)
- `font_notosanstc_medium_sdf_*` - Noto Sans TC 중간체 (번체)
- `font_notosans_extrabold_sdf_*` - Noto Sans 엑스트라 볼드
- `font_notosansjp_medium_sdf_*` - Noto Sans JP 중간체 (일본어)
- `font_notosanskr_medium_sdf_*` - Noto Sans KR 중간체 (한국어)
- `font_notosansthai_extrabold_sdf_*` - Noto Sans Thai 엑스트라 볼드
- `font_notokufiarabic_extrabold_sdf_*` - Noto Kufi Arabic 엑스트라 볼드

#### 기타 번들
- `gamedesignconfigs_*` - 게임 디자인 설정
- `loadinghints_*` - 로딩 힌트
- `bootstatechartstartup_8_loading_*` - 로딩 화면
- `bootstatechartstartup_7_debugloginscreen_*` - 디버그 로그인 화면
- `bootstatechartstartup_6_debugversionoverlay_*` - 디버그 버전 오버레이

#### 번들 로딩 전략
- **Lazy Loading**: 필요한 시점에 번들 로드
- **캐싱**: IndexedDB를 통한 브라우저 캐싱
- **재검증**: HEAD 요청으로 캐시 유효성 확인
- **병렬 로딩**: 여러 번들을 동시에 로드

---

## 🎮 게임 시스템 분석

### 게임 장르
- **빌리지 빌딩 시뮬레이션**
- **타임 매니지먼트**
- **리소스 관리**

### 게임플레이 요소 (분석 중)

#### 확인된 시스템
1. **빌리지 빌딩**
   - 구조물 배치 및 관리
   - 게임 월드 렌더링 (RenderTexture 사용)

2. **리소스 관리**
   - 초기 데이터에 리소스 정보 포함
   - 밸런싱 데이터로 리소스 가격/생산 시간 관리

3. **스테이지/레벨 시스템**
   - 개별 스테이지 데이터 관리
   - 진행 상황 추적

4. **다국어 지원**
   - 한국어, 일본어, 중국어(번체), 태국어, 아랍어 지원
   - Noto Sans 폰트 패밀리 사용
   - SDF (Signed Distance Field) 폰트 렌더링

5. **오디오 시스템**
   - 오디오 이벤트 설정 파일
   - Web Audio API 사용
   - **사운드 카테고리**:
     - 배경음악: `sound_sunrise_village_ingame_v2`, `sound_intro_start_music_v1`
     - 환경음: `sound_birds_*`, `sound_wind_*`, `sound_river_*`, `sound_village_amb_*`
     - UI 사운드: `sound_button_tap`, `sound_panel_opens`, `sound_ui_menu_popup_01`
     - 게임 액션: `sound_harvest_crops`, `sound_plant_crops`, `sound_mining`
     - 보상: `sound_coins_added`, `sound_gems_added`, `sound_energy_added`, `sound_xp_added`
     - 특수 효과: `sound_shiny_gems_sparkle_effect`, `sound_sunrise_village_levelup_v1`
   - **지연 로딩**: 사운드는 필요 시점에 동적으로 로드
   - **로딩 상태 관리**: 로드되지 않은 사운드 길이 조회 시 경고 발생

#### 게임 아키텍처
- **State Chart 패턴**: 상태 기반 게임 플로우 관리
- **Composition Root**: 의존성 주입 패턴
- **View-Data 분리**: 게임 디자인 데이터와 뷰 분리

#### 게임플레이 시스템 (실행 중 확인)

1. **빌딩/구조물 시스템**
   - 다양한 NPC 빌딩: `quarrynpc`, `sawmillnpc`, `cannerynpc`, `inventornpc`, `glassblowernpc`, `mailmannpc`, `bakerynpc` 등
   - 펜스 시스템: `fence1x1`, `fence6x1` (다양한 크기)
   - 보트 표지판: `boatsignboard` (단계별 업그레이드)

2. **NPC 시스템**
   - 다양한 NPC 캐릭터:
     - 제작 NPC: `quarrynpc`, `sawmillnpc`, `cannerynpc`, `glassblowernpc`
     - 상인 NPC: `eventmerchant`, `eventmerchantnpc`
     - 스토리 NPC: `willygrunclenpc`, `inventornpc`
     - 특수 NPC: `grandpavacationnpc`, `grandpawinternpc`, `corneliuscuratornpc`
   - NPC 애니메이션: 각 NPC별 고유 애니메이션 번들

3. **플레이어 캐릭터**
   - 캐릭터 커스터마이징:
     - 헤어 스타일: `hairstylestandard`
     - 의상: `outfitstandard`
     - 스킨톤: `skintone01`
     - 헤어 컬러: `haircolor_natural_*`
     - 얼굴: `face01`, `facestandard`
   - 특수 의상: `playercostumes_cos_halloween_skeleton_f_hair`, `playercostumes_cos_country_grungy_m_hair_mesh`

4. **리소스 및 수확 시스템**
   - 작물: `far_crops_corn`, `far_crops_cotton`
   - 광물: `rsc_minerals_ice_s`
   - 보물: `rsc_treasures_*`
   - 동물 사료: `prp_feed_seeds`, `prp_feed_grass`

5. **퀘스트/오더 시스템**
   - 오더 선택: `sound_order_selected`
   - 오더 보상 수집: `sound_order_rewards_collected`
   - 오더 완료 시 보상 지급

6. **레벨 및 경험치 시스템**
   - 레벨업 사운드: `sound_sunrise_village_levelup_v1`
   - 경험치 획득: `sound_xp_added`
   - 레벨업 시 보상 지급

7. **튜토리얼 시스템**
   - 단계별 튜토리얼 번들: `tutorial_70` ~ `tutorial_84`
   - 튜토리얼 씬: 각 튜토리얼별 전용 씬 번들

8. **스테이지/월드 시스템**
   - 다양한 스테이지: `homestage`, `c4s2`, `c5s5`, `c6s5`, `c7s4`, `c10s2`, `c11s2` 등
   - 네비게이션 메시: 각 스테이지별 NavMesh (`*navmesh` 번들)
   - 지형: `wld_div_terrain_sand`, 다양한 물 효과 (`wtr_*` 번들)

9. **시각 효과 (VFX)**
   - 파티클 효과: `vfx_largecampfirefire03`, `vfx_volcano_glow`, `vfx_scanningarea_glow`, `vfx_cloud`
   - 셰이더 효과: `shader_particleblendadd`, `shader_particledissolve`, `shader_particleblendaddglow`
   - 날씨 효과: `shader_rainimpact`, `shader_raindrop`

10. **애니메이션 시스템**
    - 동물 애니메이션: `ani_story_main_bluebird_m_*`, `ani_story_main_fishes_*`, `ani_story_main_seahorse_*`, `ani_story_main_fox_f_*`, `ani_story_main_bunny_f_*`
    - NPC 애니메이션: `npc_story_main_wisp_n_*`, `npc_event_merchant_m_showingloop`
    - 루프 애니메이션: `oneloopanimator`, `animalstoryanimator`, `random_animator_01`

---

## 🎨 UI/UX 분석

### 레이아웃 구조
- **Unity Canvas 기반**: WebGL Canvas 요소로 렌더링
- **게임 월드 렌더 텍스처**: 별도 RenderTexture로 게임 월드 렌더링
- **UI 오버레이**: 게임 위에 UI 레이어 오버레이

### 폰트 시스템
- **SDF (Signed Distance Field) 폰트**: 고품질 텍스트 렌더링
- **다국어 폰트**: 언어별 전용 폰트 번들
- **폴백 처리**: 폰트에 없는 문자는 공백으로 대체 (한글 폰트 이슈 확인됨)

### 색상 팔레트
- **셰이더 기반**: 다양한 커스텀 셰이더 사용
- **UI 그레이스케일**: 그레이스케일 셰이더로 비활성 상태 표현
- **애디티브 블렌딩**: UI 기본 애디티브 셰이더

### 인터랙션 패턴
- **Unity Input Manager**: Unity 내장 입력 시스템
- **WebGL 컨텍스트**: 마우스/키보드 입력 처리
- **실시간 동기화**: WebSocket을 통한 즉각적인 상태 업데이트
- **게임 오브젝트 클릭**: `sound_tap_in_game_object` 사운드 재생
- **UI 패널**: `sound_panel_opens` 사운드로 피드백 제공
- **수확 액션**: `sound_harvest_crops` 사운드
- **채굴 액션**: `sound_mining` 사운드
- **보상 수집**: `sound_collect_item_07`, `sound_happy_collect_item_02` 사운드

### 로딩 시스템
- **단계별 로딩**: Bootstrap → 게임 월드 → UI 순차 로드
- **로딩 힌트**: 사용자에게 로딩 중 힌트 제공
- **진행률 표시**: 로딩 텍스트 및 설명 텍스트
- **동적 로딩**: 게임플레이 중 필요한 에셋만 로드 (Lazy Loading)
- **캐시 활용**: IndexedDB를 통한 에셋 캐싱으로 재방문 시 빠른 로딩

### 게임플레이 UI 요소
- **리소스 표시**: 골드, 나무, 돌 등 리소스 HUD
- **레벨/경험치**: 레벨 표시 및 경험치 바
- **오더/퀘스트**: NPC 오더 시스템
- **상점**: 인앱 구매 상점
- **설정**: 게임 설정 패널
- **채팅**: WebSocket 기반 실시간 채팅 (STOMP 프로토콜)

---

## ✨ 애니메이션 및 시각 효과

### 렌더링 설정
- **WebGL 2.0 컨텍스트** 사용
- **물리 엔진**: PhysX (Single-Threaded 모드)
- **그래픽스**: WebKit WebGL 렌더러

### 지원 확장 기능
- EXT_clip_control
- EXT_color_buffer_float
- EXT_texture_compression_bptc
- WEBGL_compressed_texture_s3tc
- 기타 WebGL 2.0 확장 기능 다수

---

## 💻 코드 구조 분석

### Unity-브라우저 통신
- `unitybridge.js`를 통한 양방향 통신
- JavaScript ↔ Unity C# 메시지 교환

### 데이터 저장
- **IndexedDB** 사용 (로컬 저장소)
- `IndexDBControl.js`로 관리

### 클라이언트 추적
- `ClientTracking.js` - 사용자 행동 추적/분석
- Sentry 통합 - 에러 추적 및 성능 모니터링
- **매우 빈번한 추적**: 게임플레이 중 모든 주요 액션 추적
  - UI 클릭/탭
  - 게임 오브젝트 상호작용
  - 수확/채굴 액션
  - 레벨업
  - 리소스 획득
  - 상점 구매
  - 패널 열기/닫기
- **Google Analytics 통합**: Google Tag Manager 및 Google Ads 전환 추적

### Unity-브라우저 브릿지
- `unitybridge.js`를 통한 양방향 통신
- JavaScript ↔ Unity C# 메시지 교환
- 게임 상태 동기화
- 사용자 입력 전달
- 게임 이벤트 전달
- **에러 처리**: `OnAssetsLoaded called too many times` 같은 Unity 내부 에러 추적
- **NavMesh 경고**: 에이전트 생성 시 NavMesh 근접성 확인

### 로컬 스토리지 전략
- **IndexedDB**: Unity 캐시 및 게임 데이터 저장
- **캐시 키 패턴**: `catalog`, `bundle_*` 등
- **자동 동기화**: `autoSyncPersistentDataPath` 설정 (향후 버전)

---

## 🌐 네트워크 통신 분석

### API 엔드포인트

#### 계정 및 인증
- `POST https://un0.sunrisevillagegame.com/core/api/account/play`
  - 게임 플레이 시작 요청
  - 계정 정보 및 세션 초기화

#### 게임 서버 통신
- `POST https://un1.sunrisevillagegame.com/village/socketserver/login`
  - WebSocket 서버 로그인
  - 실시간 게임 상태 동기화를 위한 소켓 연결

- `GET https://un1.sunrisevillagegame.com/village/getInitialData`
  - 게임 초기 데이터 로드
  - 사용자 진행 상황, 빌딩 상태, 리소스 등

- `GET https://un1.sunrisevillagegame.com/village/gameDesign/getBalancingData`
  - 게임 밸런싱 데이터 (아이템 가격, 생산 시간 등)
  - 게임 디자인 설정값

- `POST https://un1.sunrisevillagegame.com/village/gameDesign/getIndividualStagesData`
  - 개별 스테이지/레벨 데이터
  - 스테이지별 진행 상황

#### 로컬라이제이션
- `POST https://un1.sunrisevillagegame.com/village/localization/getLocalization`
  - 다국어 지원 데이터
  - 언어별 텍스트 리소스

#### 게임플레이 API
- `POST https://un1.sunrisevillagegame.com/village/zone/action`
  - 게임 액션 실행 (빌딩 배치, 수확, 채굴 등)
  - 게임 상태 변경 요청

- `POST https://un1.sunrisevillagegame.com/village/pendingActions/collect`
  - 완료된 액션 수집
  - 보상 획득

#### 상점 및 결제
- `GET https://un1.sunrisevillagegame.com/village/shop/getShopOffers`
  - 상점 오퍼 목록 조회
  - 상품 정보

- `POST https://un1.sunrisevillagegame.com/core/api/payment/products`
  - 결제 상품 정보
  - 인앱 구매 상품

#### CRM 및 콘텐츠
- `GET https://un1.sunrisevillagegame.com/village/crm/placeholders`
  - CRM 플레이스홀더 데이터
  - 마케팅 콘텐츠

- `GET https://un1.sunrisevillagegame.com/core/api/crm/contents?locale=ko_KR&deviceType=DESKTOP&platform=browser`
  - 로케일별 CRM 콘텐츠
  - 디바이스/플랫폼별 맞춤 콘텐츠

#### 공지사항
- `POST https://un1.sunrisevillagegame.com/village/announcement`
  - 게임 공지사항 조회

#### 추적 및 분석
- `POST https://un1.sunrisevillagegame.com/village/tracking`
  - 사용자 행동 추적 (매우 빈번한 호출)
  - 게임 이벤트 로깅
  - 모든 주요 액션 추적 (클릭, 수확, 레벨업 등)

- `POST https://un1.sunrisevillagegame.com/core/api/tracking/update-locale`
  - 로케일 정보 업데이트

#### 에러 추적
- `POST https://sentry-prod.innogames.de/api/83/envelope/`
  - Sentry를 통한 에러 추적
  - 크래시 리포트 및 성능 모니터링

### 데이터 동기화 패턴

1. **초기 로드 시퀀스**:
   ```
   1. 계정 플레이 시작 (account/play)
   2. 소켓 서버 로그인 (socketserver/login)
   3. 초기 데이터 로드 (getInitialData)
   4. 밸런싱 데이터 로드 (getBalancingData)
   5. 스테이지 데이터 로드 (getIndividualStagesData)
   6. 로컬라이제이션 로드 (getLocalization)
   7. 상점 오퍼 로드 (getShopOffers)
   8. CRM 콘텐츠 로드 (crm/contents)
   9. 공지사항 로드 (announcement)
   ```

2. **실시간 동기화**:
   - **WebSocket (STOMP 프로토콜)**: `wss://un1-chat.sunrisevillagegame.com/ws/stomp`
     - 채팅 및 실시간 게임 상태 동기화
     - 양방향 통신
   - **게임 액션**: `zone/action` API로 게임 상태 변경
   - **완료된 액션 수집**: `pendingActions/collect`로 보상 획득

3. **사용자 추적 패턴**:
   - **매우 빈번한 추적**: 모든 주요 액션마다 tracking API 호출
   - 추적되는 이벤트:
     - UI 클릭/탭
     - 게임 오브젝트 상호작용
     - 수확/채굴 액션
     - 레벨업
     - 리소스 획득
     - 상점 구매
     - 패널 열기/닫기

4. **에러 처리**:
   - Sentry를 통한 자동 에러 리포팅
   - 클라이언트 추적을 통한 사용자 행동 분석

---

## 📝 구현 계획

### Next.js 15 + React 19 기반 구현 방안

#### 1. Unity WebGL 통합
- Unity WebGL 빌드를 Next.js 프로젝트에 통합
- `public/game/` 디렉토리에 Unity 빌드 파일 배치
- Next.js 동적 라우팅으로 게임 페이지 구성

#### 2. 게임 로더 컴포넌트
```typescript
// components/game/unity-loader.tsx
// Unity WebGL 게임 로드 및 초기화
```

#### 3. 브릿지 시스템
```typescript
// lib/game/unity-bridge.ts
// Unity ↔ React 통신 관리
```

#### 4. 상태 관리
- 게임 상태: Zustand 또는 Jotai
- 사용자 진행 상황: Supabase 저장

#### 5. UI 컴포넌트
- 게임 HUD 오버레이
- 설정 패널
- 인벤토리/빌딩 메뉴
- 로딩 화면 컴포넌트

#### 6. API 통합
```typescript
// lib/game/api/
// - account.ts: 계정 관련 API
// - village.ts: 빌리지 데이터 API
// - socket.ts: WebSocket 연결 관리
// - tracking.ts: 사용자 추적
```

#### 7. Asset Bundle 관리
- Unity Asset Bundle 로더 구현
- IndexedDB 캐싱 전략
- 번들 버전 관리 및 업데이트

#### 8. 다국어 지원
- i18n 시스템 구축
- 폰트 동적 로딩
- SDF 폰트 렌더링 지원

---

## 🔍 추가 분석 필요 항목

### 게임플레이 분석
- [x] API 엔드포인트 구조 ✅
- [x] Unity 번들 로딩 전략 ✅
- [x] 네트워크 통신 패턴 ✅
- [x] 게임 액션 시스템 (`zone/action` API) ✅
- [x] 빌딩/구조물 배치 시스템 (NPC 빌딩 확인됨) ✅
- [x] 리소스 관리 시스템 (API 구조 확인됨) ✅
- [x] 퀘스트/오더 시스템 (오더 선택/수집 확인됨) ✅
- [x] NPC 시스템 (다양한 NPC 확인됨) ✅
- [x] 캐릭터/아바타 시스템 (커스터마이징 확인됨) ✅
- [x] 애니메이션 및 파티클 효과 (VFX 번들 확인됨) ✅
- [x] 사운드/음악 시스템 (카테고리별 사운드 확인됨) ✅
- [x] 저장/로드 시스템 (IndexedDB 사용 확인됨) ✅
- [x] 멀티플레이어 요소 (WebSocket STOMP 확인됨) ✅
- [x] 상점/결제 시스템 (상점 오퍼, 결제 상품 확인됨) ✅
- [x] 레벨/경험치 시스템 (레벨업 사운드/이벤트 확인됨) ✅
- [x] 튜토리얼 시스템 (단계별 튜토리얼 확인됨) ✅
- [ ] 게임 메인 화면 UI 구조 (Canvas 접근 제한)
- [ ] 인벤토리 시스템 (추가 확인 필요)

### 기술적 분석
- [x] Unity WebGL 빌드 구조 ✅
- [x] Asset Bundle 시스템 ✅
- [x] 폰트 시스템 (SDF) ✅
- [x] 셰이더 시스템 ✅
- [ ] 성능 최적화 전략
- [ ] 메모리 관리 전략
- [ ] 렌더링 파이프라인

### 구현 우선순위
1. **Phase 1: 기본 인프라**
   - Unity WebGL 통합
   - API 클라이언트 구현
   - WebSocket 연결 관리

2. **Phase 2: 게임 로딩**
   - Asset Bundle 로더
   - 로딩 화면 구현
   - 초기 데이터 로드

3. **Phase 3: 게임 월드**
   - 게임 월드 렌더링
   - 빌딩 배치 시스템
   - 리소스 관리 UI

4. **Phase 4: 고급 기능**
   - 실시간 동기화
   - 다국어 지원
   - 에러 추적 시스템

---

## 📸 스크린샷 및 참고 자료

(게임 실행 후 캡처 예정)

---

**다음 단계**: 게임이 완전히 로드된 후 상세 UI/UX 및 게임플레이 분석 진행

