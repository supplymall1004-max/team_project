# Sunrise Village 게임 상세 시스템 분석

> **분석 일시**: 2025-01-24  
> **분석 방법**: 게임 실행 중 네트워크 요청 및 콘솔 로그 모니터링

---

## 🎮 게임플레이 시스템 상세

### 1. 게임 액션 시스템

#### API 엔드포인트
- **`POST /village/zone/action`**
  - 게임 내 모든 액션 실행
  - 빌딩 배치, 수확, 채굴, 상호작용 등
  - 실시간으로 서버에 상태 동기화

#### 액션 타입 (추정)
- **빌딩 배치**: 구조물을 게임 월드에 배치
- **수확**: 작물 수확 (`sound_harvest_crops`)
- **채굴**: 광물 채굴 (`sound_mining`)
- **작물 심기**: 작물 심기 (`sound_plant_crops`)
- **오더 완료**: NPC 오더 완료 및 보상 수집

### 2. 보상 시스템

#### 완료된 액션 수집
- **`POST /village/pendingActions/collect`**
  - 완료된 액션의 보상 수집
  - 리소스, 경험치, 골드 등 획득

#### 보상 타입 (사운드 파일 기반 추정)
- **골드**: `sound_coins_added`
- **젬**: `sound_gems_added`
- **에너지**: `sound_energy_added`
- **경험치**: `sound_xp_added`
- **아이템**: `sound_item_added_to_storage`, `sound_collect_item_07`, `sound_happy_collect_item_02`

### 3. NPC 및 빌딩 시스템

#### NPC 타입
1. **제작 NPC**
   - `quarrynpc` - 채석장
   - `sawmillnpc` - 제재소
   - `cannerynpc` - 통조림 공장
   - `glassblowernpc` - 유리공
   - `bakerynpc` - 빵집

2. **상인 NPC**
   - `eventmerchant` / `eventmerchantnpc` - 이벤트 상인

3. **스토리 NPC**
   - `willygrunclenpc` - 스토리 캐릭터
   - `inventornpc` - 발명가
   - `grandpavacationnpc` - 할아버지 (휴가)
   - `grandpawinternpc` - 할아버지 (겨울)
   - `corneliuscuratornpc` - 큐레이터

4. **기타 NPC**
   - `mailmannpc` - 우편 배달부
   - `masonnpc` - 석공

#### 빌딩 구조물
- **펜스**: `fence1x1`, `fence6x1` (다양한 크기)
- **보트 표지판**: `boatsignboard` (단계별 업그레이드: `boatsignboard_step0`)
- **집**: `pjt_homes_camelhouse`, `pjt_homes_carpetweaver`
- **상자**: `pjt_crates_supplies_crate`, `pjt_crates_supplies_lid`

### 4. 플레이어 캐릭터 커스터마이징

#### 커스터마이징 요소
- **스킨톤**: `skintone01`
- **헤어 스타일**: `hairstylestandard`
- **헤어 컬러**: `haircolor_natural_01`, `haircolor_natural_06`
- **의상**: `outfitstandard`
- **얼굴**: `face01`, `facestandard`

#### 특수 의상
- 할로윈: `playercostumes_cos_halloween_skeleton_f_hair`
- 컨트리: `playercostumes_cos_country_grungy_m_hair_mesh`

### 5. 리소스 및 작물 시스템

#### 작물
- 옥수수: `far_crops_corn`
- 면화: `far_crops_cotton`

#### 광물
- 얼음: `rsc_minerals_ice_s`

#### 보물
- 선물 상자: `rsc_treasures_giftables_chest_s_tools`
- 화물: `rsc_treasures_cargo`

#### 동물 사료
- 씨앗: `prp_feed_seeds`
- 풀: `prp_feed_grass`

#### 기타 리소스
- 석류: `rsc_grounds_pomegranate`
- 성게/조개: `rsc_grounds_urchins_shells_s`
- 파인애플: `plants_pineapple`
- 버섯: `plants_mushrooms_special`
- 불꽃 꽃: `rsc_plants_fireflower`

### 6. 오더/퀘스트 시스템

#### 오더 관련 사운드
- 오더 선택: `sound_order_selected`
- 오더 보상 수집: `sound_order_rewards_collected`

#### 오더 플로우 (추정)
1. NPC에게 오더 수락
2. 필요한 아이템 제작/수집
3. 오더 완료
4. 보상 수집 (`pendingActions/collect`)

### 7. 레벨 및 경험치 시스템

#### 레벨업 관련
- 레벨업 사운드: `sound_sunrise_village_levelup_v1`
- 경험치 획득: `sound_xp_added`
- 레벨업 시 보상 지급

### 8. 튜토리얼 시스템

#### 튜토리얼 번들
- `tutorial_70` ~ `tutorial_84`: 단계별 튜토리얼
- 각 튜토리얼별 전용 씬 및 에셋 번들
- 튜토리얼 진행 상황 추적

### 9. 스테이지/월드 시스템

#### 스테이지 구조
- 홈 스테이지: `homestage` (기본 마을)
- 챕터별 스테이지: `c4s2`, `c5s5`, `c6s5`, `c7s4`, `c10s2`, `c11s2` 등
- 특수 스테이지: `mse001_s1`, `mse2s1`, `mse3s1`, `tsm4`, `c3s3` 등

#### 네비게이션
- 각 스테이지별 NavMesh: `*navmesh` 번들
- 캐릭터 이동 경로 계산
- 에이전트 생성 시 NavMesh 근접성 확인

#### 지형 및 환경
- 모래 지형: `wld_div_terrain_sand`
- 물 효과: `wtr_c4s3_b_water`, `wtr_c4s4_water`, `wtr_c6s1_lava`, `wtr_tsm4_water`
- 식생: `trees_ivy_foliage`, `microvegetation`, `c4s2microvegetation_binary`

### 10. 시각 효과 (VFX)

#### 파티클 효과
- 캠프파이어: `vfx_largecampfirefire03`
- 화산 글로우: `vfx_volcano_glow`
- 스캔 영역: `vfx_scanningarea_glow`
- 구름: `vfx_cloud`

#### 셰이더 효과
- 파티클 블렌드: `shader_particleblendadd`, `shader_particleblendaddglow`
- 파티클 디졸브: `shader_particledissolve`
- 파티클 링: `shader_particlering`
- 파티클 포그: `shader_particlefog`
- 파티클 멀티퍼포즈: `shader_particlemultipurposeblend`
- 파티클 멀티플라이: `shader_particlemultiplyx2`

#### 날씨 효과
- 비 영향: `shader_rainimpact`
- 빗방울: `shader_raindrop`

#### 기타 효과
- 신 레이: `shader_godrays`
- 페이크 섀도우: `shader_fakeshadow`
- 스모크 디졸브: `smoke_dissolve_4s_2`
- 모래 디졸브: `sand_dissolve`

### 11. 애니메이션 시스템

#### 동물 애니메이션
- 파랑새: `ani_story_main_bluebird_m_*` (다양한 상태: idleloop, dark 등)
- 물고기: `ani_story_main_fishes_*` (shark, ide 등)
- 바다말: `ani_story_main_seahorse_idle`
- 여우: `ani_story_main_fox_f_idleloop_02`
- 토끼: `ani_story_main_bunny_f_mask_01`

#### NPC 애니메이션
- 위습: `npc_story_main_wisp_n_*` (lieflatloop, lowenergyloop 등)
- 이벤트 상인: `npc_event_merchant_m_showingloop`

#### 애니메이션 컨트롤러
- 단일 루프: `oneloopanimator`
- 동물 스토리: `animalstoryanimator`
- 랜덤: `random_animator_01`

### 12. 사운드 시스템 상세

#### 배경음악
- 인게임: `sound_sunrise_village_ingame_v2`
- 인트로 시작: `sound_intro_start_music_v1`
- 인트로 종료: `sound_intro_end_sfx_v2`
- 인트로 시작 효과음: `sound_intro_start_sfx_v2`

#### 환경음
- 새 소리: `sound_birds_001` ~ `sound_birds_007` (다양한 새 소리)
- 바람: `sound_wind_general_gusty_low_loop_01`
- 마을 앰비언트: `sound_village_amb_village`
- 강/물: `sound_river_stream_night_flowing_water_insects_loop_01`

#### UI 사운드
- 버튼 탭: `sound_button_tap`
- 패널 열기: `sound_panel_opens`
- UI 메뉴 팝업: `sound_ui_menu_popup_01`
- UI 젬 소비: `sound_ui_spend_gems`
- 팝 효과: `sound_pop__1__`

#### 게임 액션 사운드
- 수확: `sound_harvest_crops`
- 작물 심기: `sound_plant_crops`
- 채굴: `sound_mining`
- 게임 오브젝트 탭: `sound_tap_in_game_object`

#### 보상 사운드
- 골드 획득: `sound_coins_added`
- 젬 획득: `sound_gems_added`
- 에너지 획득: `sound_energy_added`
- 경험치 획득: `sound_xp_added`
- 아이템 획득: `sound_item_added_to_storage`, `sound_collect_item_07`, `sound_happy_collect_item_02`
- 특수 효과: `sound_shiny_gems_sparkle_effect`

#### 오더/퀘스트 사운드
- 오더 선택: `sound_order_selected`
- 오더 보상 수집: `sound_order_rewards_collected`

#### 특수 이벤트 사운드
- 레벨업: `sound_sunrise_village_levelup_v1`
- 말풍선: `sound_speech_bubble_appears_tapped`

### 13. 실시간 통신 시스템

#### WebSocket (STOMP)
- **프로토콜**: STOMP over WebSocket
- **엔드포인트**: `wss://un1-chat.sunrisevillagegame.com/ws/stomp`
- **용도**:
  - 채팅 시스템
  - 실시간 게임 상태 동기화
  - 멀티플레이어 요소

### 14. 상점 및 결제 시스템

#### 상점 API
- **`GET /village/shop/getShopOffers`**
  - 상점 오퍼 목록
  - 상품 정보 및 가격

#### 결제 API
- **`POST /core/api/payment/products`**
  - 인앱 구매 상품 정보
  - 결제 처리

### 15. CRM 및 마케팅 시스템

#### CRM API
- **`GET /village/crm/placeholders`**
  - CRM 플레이스홀더 데이터
  - 마케팅 콘텐츠 위치

- **`GET /core/api/crm/contents?locale=ko_KR&deviceType=DESKTOP&platform=browser`**
  - 로케일별 CRM 콘텐츠
  - 디바이스/플랫폼별 맞춤 콘텐츠

### 16. 추적 및 분석 시스템

#### 추적 빈도
- **매우 빈번함**: 게임플레이 중 거의 모든 액션 추적
- 추적되는 이벤트:
  - UI 클릭/탭
  - 게임 오브젝트 상호작용
  - 수확/채굴 액션
  - 레벨업
  - 리소스 획득
  - 상점 구매
  - 패널 열기/닫기
  - 오더 완료

#### 외부 분석 도구
- **Google Tag Manager**: 페이지뷰 및 이벤트 추적
- **Google Ads**: 전환 추적 (AW-11187140461, AW-11248074135)
- **Sentry**: 에러 추적 및 성능 모니터링

---

## 🔍 추가 발견 사항

### 에러 및 경고
1. **NavMesh 에러**: "Failed to create agent because it is not close enough to the NavMesh"
   - 캐릭터 이동 시 NavMesh 근접성 확인 필요

2. **에셋 로딩 경고**: "OnAssetsLoaded called too many times"
   - 에셋 로딩 콜백 중복 호출 이슈

3. **사운드 로딩 경고**: "Trying to get length of sound which is not loaded yet"
   - 사운드가 로드되기 전에 길이 조회 시도
   - 지연 로딩으로 인한 정상적인 현상

### 성능 최적화
- **IndexedDB 캐싱**: 모든 에셋 번들을 IndexedDB에 캐싱
- **재검증**: HEAD 요청으로 캐시 유효성 확인
- **병렬 로딩**: 여러 번들을 동시에 로드
- **지연 로딩**: 필요한 시점에만 에셋 로드

---

## 📊 데이터 흐름

### 게임플레이 플로우
```
1. 사용자 액션 (클릭/탭)
   ↓
2. Unity에서 액션 처리
   ↓
3. zone/action API 호출
   ↓
4. 서버에서 액션 검증 및 처리
   ↓
5. 완료된 액션은 pendingActions에 추가
   ↓
6. 사용자가 collect API 호출
   ↓
7. 보상 지급 (리소스, 경험치 등)
   ↓
8. tracking API로 모든 액션 추적
```

### 리소스 획득 플로우
```
1. 게임 액션 완료
   ↓
2. pendingActions/collect 호출
   ↓
3. 보상 지급
   ↓
4. 리소스 업데이트 (골드, 젬, 에너지 등)
   ↓
5. 사운드 재생 (coins_added, gems_added 등)
   ↓
6. UI 업데이트
   ↓
7. tracking API로 추적
```

---

**다음 단계**: 게임을 더 플레이하여 추가 기능 및 시스템 발견

