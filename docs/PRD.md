## 💡 맛의 아카이브 (Flavor Archive) 제품 요구 사항 정의서 (PRD)

사용자께서 제공하신 사업 계획서를 기반으로, **비개발자 초보자**도 이해하기 쉽도록 핵심 기능과 사용자 경험(UX)에 초점을 맞추어 **제품 요구 사항 정의서(PRD, Product Requirements Document)**를 작성했습니다.

이 문서는 제품이 무엇을 해야 하는지, 그리고 왜 필요한지에 대한 청사진 역할을 합니다.

---

### 1. 개요 (Introduction)

| 항목 | 내용 |
| :--- | :--- |
| **제품명** | 맛의 아카이브 (Flavor Archive) |
| **슬로건** | 잊혀진 손맛을 연결하는 디지털 식탁 |
| **버전** | V1.0 (MVP) |
| **작성일** | 2025년 1월 (최종 업데이트: 2025-01-27) |
| **제품 비전** | 시대와 세대를 아울러 모든 요리 지식을 통합하고 보존하며, 데이터 기반의 건강한 식생활을 제안하고 요리 창작자의 상업적 활동을 지원하는 세계 최고의 요리 전문 아카이브. |
| **핵심 목표 (MVP 기준)** | 레거시 콘텐츠 뷰어 및 현대 레시피 검색 기능 안정화 및 초기 사용자 5,000명 확보. |

---

### 2. 사용자 정의 (User Persona)

본 서비스의 핵심 사용자는 다음 세 그룹으로 정의합니다.

| 사용자 그룹 | 주요 동기 | 핵심 요구 사항 |
| :--- | :--- | :--- |
| **A. 전통/향토 요리 학습자** | 구전으로만 전해지는 희귀 레시피나 조리법에 대한 정확한 기록 및 지식 습득. | 신뢰성 있는 출처의 고품질 영상 및 문서 콘텐츠 (레거시 아카이브) |
| **B. 건강 관리 식단 사용자** | 본인의 건강 상태(질병, 알레르기)와 목표에 맞는 맞춤형 식단 추천 및 간편한 식자재 구매. | AI 기반 맞춤 식단 추천 및 식자재 연동 (AI 큐레이션) |
| **C. 일반 요리/창작자** | 쉽고 빠르게 따라 할 수 있는 현대적 레시피 검색, 자신의 레시피 공유 및 수익 창출 기회. | 초보자 맞춤 단계별 가이드, UGC 커뮤니티 및 상업화 인증 기회 (현대 레시피 아카이브) |

---

### 3. 기능 요구 사항 (구현 완료)

아래 표는 **2025년 1월 기준**으로 실제 서비스에 반영된 기능을 정리한 것입니다. 모든 기능은 MVP 범위 내에서 구현 완료되었으며, 데이터베이스 스키마와 API, UI 컴포넌트가 모두 연동되어 동작합니다.

#### 3.1. 📜 레거시 아카이브

| ID | 기능명 | 구현 요약 | 세부 사항 |
| :--- | :--- | :--- | :--- |
| **A-1** | 명인 인터뷰 뷰어 | HD 이상 영상 스트리밍과 프리미엄 구독 시 광고 없이 시청. | `components/legacy/legacy-archive-section.tsx`, `legacy-video-cta.tsx` |
| **A-2** | 전문 문서화 기록 | 영상과 연계된 레시피, 도구, 출처를 문서 카드로 제공. | `components/legacy/legacy-archive-client.tsx` |
| **A-3** | 아카이브 분류 검색 | 지역/시대/재료 필터 및 검색어 조합 지원. | `/legacy` 페이지 + 통합 검색 (`app/search`) |
| **A-4** | 대체재료 안내 | 전통 재료 옆에 현대 대체재 및 구입처 안내. | 카드 내 대체 정보 컴포넌트 |

#### 3.2. 🍴 현대 레시피 아카이브

| ID | 기능명 | 구현 요약 | 세부 사항 |
| :--- | :--- | :--- | :--- |
| **B-1** | 단계별 레시피 카드 | 사진/텍스트/영상 단계를 카드로 제공, 타이머·체크리스트 포함. | `components/recipes/recipe-detail-client.tsx`, 타이머/체크리스트 훅 |
| **B-2** | 레시피 업로드 (UGC) | 레시피 작성 시 썸네일 자동 배정, 재료/단계/난이도 필수 입력. | `/recipes/new`, `actions/recipe-create.ts` |
| **B-3** | 커뮤니티 평가 | 별점(0.5 단위), 저작권/불량 신고 기능 구현. | 댓글 기능은 범위에서 제외됨. 신고 데이터는 관리자 뷰에서 확인 가능. |

#### 3.3. 🧠 건강 맞춤 식단 큐레이션

| ID | 기능명 | 구현 요약 | 세부 사항 |
| :--- | :--- | :--- | :--- |
| **C-1** | 건강 정보 입력 고도화 | 질병·알레르기 상세 입력(사용자 정의 가능), 선호/비선호 식재료, 프리미엄 식단 타입 설정. | `/health/profile`, `health-api` 라우트, `HealthProfileForm` |
| **C-2** | 건강 맞춤 식단 추천 | Mifflin-St Jeor 공식 기반 칼로리 계산(수동 설정 가능), 3대 영양소 규칙 기반 일일 식단 자동 생성. | `lib/diet/calorie-calculator.ts`, `lib/diet/recommendation.ts` |
| **C-3** | 주간 식단 추천 시스템 | 7일치 식단을 한 번에 생성하여 주간 식단 계획 및 장보기 리스트 제공. | `lib/diet/weekly-diet-generator.ts`, `app/(dashboard)/diet/weekly/page.tsx` |
| **C-5** | 식자재 원클릭 구매 | 추천 식단의 재료 리스트를 외부 마켓 링크로 연결. | `components/diet/meal-card.tsx` |
| **C-6** | 가족 구성원 관리 | `family_members` 테이블, CRUD API, UI 완비. 나이 기반 `is_child` 자동 설정. | `/health/family` 페이지, `types/family.ts` |
| **C-6.1** | 통합 식단 포함/제외 제어 | 구성원별 `include_in_unified_diet` 토글 및 PATCH 엔드포인트 제공. | `components/family/unified-diet-section.tsx` |
| **C-7** | 가족 맞춤 식단 추천 | 개인/통합 식단 동시 생성, 토글 상태 반영, 결과 UI 제공. | `components/family/family-diet-view.tsx` |
| **C-7.1** | 건강 맞춤 식단 탭 | "어제의 건강 맞춤 식단" 옆에 사용자 + 가족 이름 탭 배치, On/Off 스위치 제공. | `components/diet/family-diet-tabs.tsx` |
| **C-8** | 엄격한 알레르기 필터링 | 질병별 제외 음식뿐만 아니라, 알레르기 유발 재료의 파생 재료(예: 새우 -> 새우젓, 김치)까지 엄격하게 필터링. | `lib/diet/food-filtering.ts` (ALLERGY_DERIVED_INGREDIENTS) |
| **C-9** | 질병관리청 예방접종/독감 알림 | 질병관리청 공개 데이터를 동기화하여 독감 유행 단계와 예방접종 일정 알림. | `app/api/health/kcdc/*` |
| **C-40** | KCDC 프리미엄 기능 (Phase 1) | 감염병 위험 지수, 예방접종 기록/일정, 여행 위험도 평가, 건강검진 기록/권장 일정 관리. | `app/(dashboard)/health/premium/*`, `app/api/health/kcdc-premium/*` |
| **C-41** | 주기적 건강 관리 서비스 (Phase 9) | 예방접종, 건강검진, 구충제 복용 등 주기적 건강 관리 서비스 통합 관리 및 알림 설정. | `app/(dashboard)/health/premium/periodic-services`, `app/api/health/kcdc-premium/periodic-services/*` |
| **C-10** | 앱 상태 팝업 인프라 | 공통 팝업 컴포넌트 및 QA 체크리스트 정의. | `components/diet/diet-notification-popup.tsx` |
| **C-11** | 즐겨찾기 식단 저장 | 식단 카드에 즐겨찾기 버튼 추가, 프리미엄 사용자 무제한 저장. | `components/diet/favorite-button.tsx` |
| **C-12** | 밀키트 식단 기능 | 쿠팡 파트너스 API 연동(시뮬레이션), 밀키트 옵션 토글. | `lib/diet/meal-kit-service.ts` |
| **C-13** | 특수 식단 타입 (다중 선택) | 도시락, 헬스, 저탄수, 비건/베지테리언 식단 필터링. | `lib/diet/special-diet-filters.ts` |
| **C-14** | 도시락 반찬 위주 식단 | 보관이 용이한 반찬 중심 식단 추천. | `bento` 필터 |
| **C-15** | 헬스인 닭가슴살 위주 식단 | 고단백 저지방 닭가슴살 중심 식단. | `fitness` 필터 |
| **C-16** | 다이어트 저탄수화물 식단 | 탄수화물 제한 식단. | `low_carb` 필터 |
| **C-17** | 비건/베지테리언 식단 | 동물성 식품 제외 식단. | `vegan`, `vegetarian` 필터 |
| **C-18** | 응급 조치 및 안전 경고 | 알레르기 반응 시 응급 대처법(에피네프린 등) 안내 페이지 및 식단 내 안전 경고 문구 표시. | `/health/emergency`, `components/diet/safety-warning.tsx` |
| **C-19** | 질병 마스터 데이터 시스템 | 16개 주요 질병에 대한 마스터 데이터 및 질병별 제외 음식 관리. | `diseases`, `disease_excluded_foods_extended` 테이블, `app/api/health/diseases` |
| **C-20** | 알레르기 마스터 데이터 시스템 | 14개 주요 알레르기 + 특수 알레르기 마스터 데이터 관리. | `allergies` 테이블, `app/api/health/allergies` |
| **C-21** | 알레르기 파생 재료 추적 | 알레르기 유발 재료의 모든 파생 재료 추적 (예: 새우 → 새우젓, 김치, 해물 육수). | `allergy_derived_ingredients` 테이블, `app/api/health/allergies/[code]/derived` |
| **C-22** | 칼로리 계산 공식 테이블 | 다중 공식 지원을 위한 칼로리 계산 공식 데이터베이스. | `calorie_calculation_formulas` 테이블 |
| **C-23** | 칼로리 계산 공식 표시 | 사용자가 선택한 공식의 수식과 계산 과정을 화면에 표시. | `components/health/calorie-calculator-display.tsx` |
| **C-25** | 수동 목표 칼로리 설정 | 사용자가 계산된 칼로리 대신 직접 목표 칼로리를 설정할 수 있는 옵션. | `user_health_profiles.manual_target_calories` |
| **C-26** | 질병 선택 UI | 카테고리별 질병 선택 + 사용자 정의 질병 입력. | `components/health/disease-selector.tsx` |
| **C-27** | 알레르기 선택 UI | 주요 알레르기, 특수 알레르기, 사용자 정의 알레르기 입력 지원. | `components/health/allergy-selector.tsx` |
| **C-28** | 선호/비선호 식재료 관리 | 사용자가 선호하는 식재료와 비선호하는 식재료를 입력하여 식단 생성 시 반영. | `user_health_profiles.preferred_ingredients`, `disliked_ingredients` |
| **C-29** | 프리미엄 식단 타입 확장 | 도시락, 헬스인, 다이어트, 비건, 베지테리언 식단 필터. | `lib/diet/special-diet-filters.ts` (이미 C-13~C-17로 구현됨) |
| **C-30** | 질병별 제외 음식 필터링 | 당뇨, 고혈압, CKD 등 질병별 제외 음식 필터링. | `lib/diet/food-filtering.ts` |
| **C-31** | 알레르기 엄격 모드 필터링 | 레시피의 모든 재료, 소스, 조미료에서 알레르기 유발 재료 및 파생 재료 검사. | `lib/diet/food-filtering.ts` (이미 C-8로 구현됨) |
| **C-32** | 안전 경고 시스템 | 불확실한 재료 정보가 있는 경우 "섭취 전 재료명 확인" 안내 문구 표시. | `components/health/safety-warning.tsx`, `components/diet/safety-warning.tsx` |
| **C-33** | 응급조치 정보 데이터베이스 | 아나필락시스, 경증 반응 등 알레르기별 응급조치 정보 저장. | `emergency_procedures` 테이블 |
| **C-34** | 에피네프린 사용법 안내 | 에피네프린 자가주사기 사용법 단계별 안내. | `/health/emergency` 페이지 내 포함 |
| **C-35** | 알레르기별 응급조치 상세 페이지 | 특정 알레르기에 대한 상세 응급조치, 위험 신호 인식, 119 신고 시기 안내. | `/health/emergency/[allergyCode]` |
| **C-36** | 질병 관리 API | 질병 목록 조회, 질병 상세 정보, 제외 음식 목록 조회 API. | `GET /api/health/diseases` |
| **C-37** | 알레르기 관리 API | 알레르기 목록 조회, 파생 재료 조회 API. | `GET /api/health/allergies`, `GET /api/health/allergies/[code]/derived` |
| **C-38** | 칼로리 계산 API | 다중 공식 지원 칼로리 계산 API (공식 설명 포함). | `POST /api/health/calculate-calories` |
| **C-39** | 응급조치 정보 API | 알레르기별 응급조치 정보 조회 API. | `GET /api/health/emergency/[allergyCode]` (구현 확인 필요) |

> **비고:** GI 지수 필터, 영양 리포트, 일일 알림 팝업, 어린이 성장기 식단 등은 현재 제품 범위에서 제외되어 본 문서에서도 제거했습니다. 필요 시 별도 백로그 문서로 관리합니다.

#### 3.4. 💳 결제 및 프리미엄 시스템

| ID | 기능명 | 구현 요약 | 세부 사항 |
| :--- | :--- | :--- | :--- |
| **F-1** | 프리미엄 구독 시스템 | 토스페이먼츠 연동(현재 Mock 모드), 월간/연간 플랜, 프로모션 코드 지원. | `app/(main)/pricing/page.tsx`, `actions/payments/*`, `lib/payments/*` |
| **F-2** | 결제 처리 | 결제 세션 생성, 결제 승인, 구독 관리, 결제 내역 조회. | `app/(main)/checkout/*`, `subscriptions`, `payment_transactions` 테이블 |
| **F-3** | 프로모션 코드 | 할인 코드 생성 및 검증, 사용 내역 추적. | `promo_codes`, `promo_code_uses` 테이블 |
| **F-4** | 구독 관리 페이지 | 현재 구독 상태 조회, 구독 취소, 재활성화. | `app/(main)/account/subscription/page.tsx` |
| **F-5** | 프리미엄 가드 | 프리미엄 전용 콘텐츠 접근 제어. | `components/premium/premium-gate.tsx` |

> **현재 상태**: 결제 시스템은 Mock 모드로 구현되어 있으며, 실제 토스페이먼츠 계정 연동 시 프로덕션 모드로 전환 가능합니다.

#### 3.5. 📚 궁중 레시피 아카이브

| ID | 기능명 | 구현 요약 | 세부 사항 |
| :--- | :--- | :--- | :--- |
| **G-1** | 궁중 레시피 블로그 | 고려/조선/삼국시대 궁중 요리 레시피를 블로그 형식으로 제공. | `royal_recipes_posts` 테이블, `app/royal-recipes/*`, `components/royal-recipes/*` |
| **G-2** | 시대별 분류 | 고려, 조선, 삼국시대별 레시피 필터링 및 검색. | `era` 필드 기반 필터링 |
| **G-3** | 빠른 접근 메뉴 | 홈페이지에서 궁중 레시피 섹션으로 빠른 이동. | `components/royal-recipes/royal-recipes-quick-access.tsx` |

#### 3.6. 🛠 관리자 페이지

| ID | 기능명 | 구현 요약 | 세부 사항 |
| :--- | :--- | :--- | :--- |
| **D-1** | 관리자 콘솔 베타 | `/admin` 경로에 기본 레이아웃을 제공하고, 페이지 내 텍스트/공지/팝업 콘텐츠를 수정하거나 일괄 배포할 수 있는 에디터와 권한 체크를 탑재합니다. | `app/admin/layout.tsx`, `components/admin/*` |
| **D-2** | 홈페이지 콘텐츠 관리 | 홈페이지의 모든 하드코딩된 텍스트, 링크, 이미지 URL을 관리자 페이지에서 쉽게 수정할 수 있도록 데이터베이스 기반 콘텐츠 관리 시스템을 구축합니다. | `actions/admin/copy/slots.ts`, `lib/admin/copy-reader.ts`, `components/home/*`, `components/footer.tsx` |
| **D-3** | 프로모션 코드 관리 | 프로모션 코드 생성, 수정, 삭제 및 사용 내역 추적 기능을 제공합니다. 할인율, 최대 사용 횟수, 유효 기간 등을 설정할 수 있습니다. | `app/admin/promo-codes`, `components/admin/promo-codes/*`, `actions/admin/promo-codes/*` |
| **D-4** | 정산 내역 관리 | 결제 내역 및 정산 통계를 조회하고 관리할 수 있습니다. 카드/현금/프로모션 코드별 결제 내역 필터링 및 통계 제공. | `app/admin/settlements`, `components/admin/settlements/*`, `actions/admin/settlements/*` |
| **D-5** | 밀키트 관리 | 밀키트 제품을 수동으로 등록하고 관리할 수 있습니다. 쿠팡 파트너스 API 연동(시뮬레이션) 및 제품 정보 CRUD 기능 제공. | `app/admin/meal-kits`, `components/admin/meal-kits/*`, `actions/admin/meal-kits/*` |
| **D-6** | 레시피 관리 | 사용자가 업로드한 레시피를 관리하고, 일괄 삭제, 시드 데이터 생성 등의 기능을 제공합니다. | `app/admin/recipes`, `components/admin/recipes/*`, `actions/admin/recipes/*` |

#### 3.7. 🎨 홈페이지 UI/UX 개선 (배달의민족 앱 참고)

| ID | 기능명 | 구현 요약 | 세부 사항 |
| :--- | :--- | :--- | :--- |
| **E-1** | 상단 고정 헤더 | 검색바와 프리미엄 배너를 상단에 고정하여 스크롤해도 항상 접근 가능하도록 합니다. 청록색 배너, 검색바 포커스 애니메이션, 키보드 네비게이션 지원. | `components/home/fixed-header.tsx`, `premium-banner.tsx`, `search-bar.tsx` ✅ 완료 |
| **E-2** | 바로가기 메뉴 | 주요 기능(레거시, 레시피, 건강 맞춤 식단 등)을 아이콘 그리드 형태로 제공하여 빠른 접근을 가능하게 합니다. 반응형 그리드, 호버 효과, 접근성 지원. | `components/home/quick-access-menu.tsx` ✅ 완료 |
| **E-3** | 하단 네비게이션 | 모바일 환경에서 주요 페이지로의 쉬운 이동을 위한 고정 네비게이션 바를 제공합니다. 현재 페이지 하이라이트, 키보드 네비게이션 지원. | `components/layout/bottom-navigation.tsx` ✅ 완료 |
| **E-4** | 주간 식단 요약 | 홈 화면에 이번 주 식단을 한눈에 볼 수 있는 요약 섹션을 제공합니다. 7일 캘린더 미리보기와 총 칼로리 표시를 포함합니다. | `components/home/weekly-diet-summary.tsx` ✅ 완료 |
| **E-5** | 자주 구매하는 식자재 | 사용자의 주간 식단 기반으로 자주 구매하는 식자재를 추천하고, 원클릭 장바구니 추가 기능을 제공합니다. | `components/home/frequent-items-section.tsx`, `app/api/shopping/frequent-items/route.ts` ✅ 완료 |
| **E-6** | 마카의 음식 동화 | 전통 음식의 탄생과 역사를 동화처럼 들려주는 인터랙티브 스토리북 플레이어를 제공합니다. YouTube 비디오를 방 형태로 재생하며, 선물 상자를 클릭하여 다양한 음식 이야기를 선택할 수 있습니다. | `app/(main)/storybook/page.tsx`, `components/storybook/storybook-room.tsx`, `components/storybook/storybook-section.tsx` ✅ 완료 |
| **E-7** | 챕터 구조 레이아웃 | 홈페이지의 여러 섹션을 두 개의 챕터로 재구성하고, 메인 화면에 대표적인 부분을 배치하는 레이아웃 설계. 챕터 1(레시피 & 식단 아카이브)과 챕터 2(건강 관리 현황)로 구분. | `app/chapters/recipes-diet/page.tsx`, `app/chapters/health/page.tsx`, `components/home/chapter-preview.tsx` ✅ 완료 |
| **E-8** | 건강 시각화 대시보드 | 현재 건강 상태, 영양 균형, 식단 효과 예측, 질병 위험도 등을 시각화하여 제공하는 종합 대시보드. | `components/health/visualization/*`, `app/api/health/metrics`, `app/api/health/meal-impact` ✅ 완료 |

---

### 4. 구현 가능한 기능 (Future Enhancements)

다음 기능들은 현재 부분적으로 구현되었거나 향후 개발 가능한 기능들입니다.

#### 4.1. 🏥 건강정보 관리 시스템 고도화

| ID | 기능명 | 구현 요약 | 세부 사항 |
| :--- | :--- | :--- | :--- |
| **C-24** | 질병별 칼로리 자동 조정 | 당뇨, 비만 등 질병 보유 시 칼로리 자동 감량. 최소 안전 칼로리 보장 (여성 1200kcal, 남성 1500kcal). | `lib/health/disease-manager.ts` (부분 구현, UI 통합 필요) |
| **C-40** | 건강정보 입력 폼 대폭 개선 | 질병, 알레르기, 선호 식재료, 프리미엄 식단 타입, 칼로리 계산 방식 등 모든 건강 정보를 한 화면에서 입력. | `components/health/health-profile-form.tsx` (기본 기능 구현됨, UI 개선 필요) |
| **C-41** | 식단 생성 로직 통합 | 질병, 알레르기, 선호도, 프리미엄 타입, 칼로리 계산 결과를 모두 반영한 통합 식단 생성. | `lib/diet/recommendation.ts` (기본 로직 구현됨, 고도화 필요) |

---

### 5. 비기능 요구 사항 (Non-Functional Requirements)

제품의 품질과 안정성을 위한 요구 사항입니다.

| 구분 | 요구 사항 내용 | 대응 전략 |
| :--- | :--- | :--- |
| **성능/속도** | 모든 레시피 검색 결과는 **3초 이내**에 사용자에게 표시되어야 합니다. | 클라우드 기반 미디어 저장소(A-5) 및 CDN 도입. |
| **보안** | 개인 건강 정보(C-1) 및 결제 정보는 **최고 수준으로 암호화**되어 보관되어야 합니다. | 「개인정보보호법」 준수 및 보안 전문가 투입. |
| **접근성** | 모든 페이지는 **모바일 환경(iOS/Android)에서 가장 편리하게** 작동하도록 반응형 웹 디자인을 우선 적용합니다. | 초기 개발 전략: 반응형 디자인 우선 적용. |
| **신뢰성** | AI 추천 결과 및 영양 정보(C-2, C-3, C-4)는 **전문 영양사의 검수(QC)를 통과**해야 합니다. | AI 검증 체계 구축 (6.6 리스크 대응 전략). |
| **법적 준수** | 마켓플레이스 운영 시 모든 판매자는 **식품 영업 신고증**을 제출해야 합니다. | 6.1 식품 위생 및 6.2 전자상거래 법규 준수 의무화. |

---

### 6. 출시 현황 및 후속 로드맵

#### 6.1. 현재 배포된 MVP 범위

| 목표 | 포함된 기능 |
| :--- | :--- |
| **콘텐츠 뷰어 안정화** | A-1, A-2, A-3, A-4 |
| **현대 레시피 아카이브 경험** | B-1, B-2, B-3(별점·신고) |
| **건강 맞춤 식단 기초** | C-1, C-2, C-3, C-5 |
| **가족 맞춤 기능** | C-6, C-6.1, C-7, C-7.1, C-8 |
| **프리미엄 식단 고급 기능** | C-9, C-10, C-11, C-12, C-13, C-14, C-15, C-16, C-17, C-18 |
| **건강정보 관리 시스템** | C-19, C-20, C-21, C-22, C-23, C-25, C-26, C-27, C-28, C-29, C-30, C-31, C-32, C-33, C-34, C-35, C-36, C-37, C-38, C-39 |
| **결제 및 프리미엄 시스템** | F-1, F-2, F-3, F-4, F-5 |
| **궁중 레시피 아카이브** | G-1, G-2, G-3 |
| **관리자 페이지** | D-1, D-2, D-3, D-4, D-5, D-6 |
| **홈페이지 UI/UX 개선** | E-1, E-2, E-3, E-4, E-5, E-6, E-7, E-8 |

#### 6.2. 후속 고려 대상

- C-24 (질병별 칼로리 자동 조정) - 부분 구현됨, UI 통합 필요
- C-40 (건강정보 입력 폼 대폭 개선) - 기본 기능 구현됨, UI 개선 필요
- C-41 (식단 생성 로직 통합) - 기본 로직 구현됨, 고도화 필요
- GI 지수/저염 필터, 영양 리포트 등 정교화 기능
- 창작자 상업화/마켓 관련 기능
- 실제 토스페이먼츠 결제 연동 (현재 Mock 모드)

위 기능들은 현재 제품 범위에서는 제외되었거나 부분적으로 구현되었으며, 재개가 필요할 경우 별도 백로그에서 스펙을 재정의합니다.

---

### 7. 면책 및 법적 고지 (Disclaimer & Legal Notices)

모든 서비스 영역에서 다음 내용을 **명확하게 고지**하고 이용약관에 포함해야 합니다.

* **의료 면책 조항 (6.6):** "본 서비스는 **건강 관리 보조 수단**이며, 전문적인 진료 및 치료 행위를 대신하지 않습니다. 질병 관련 내용은 반드시 의사 또는 전문 영양사와 상담하십시오."
* **통신판매 중개자 고지 (6.4):** 플랫폼은 통신판매 중개자로서, 식품의 위생, 품질, 제조/생산에 대한 **1차적인 법적 책임은 판매자/생산자에게 있음**을 명시합니다.

---

### 8. 기술적 구현 세부사항 (Technical Implementation Details)

#### 7.1. 데이터베이스 스키마

현재까지 구현된 모든 데이터베이스 테이블과 주요 필드를 정리합니다.

##### 7.1.1. 사용자 관리

**사용자 테이블 (`users`)**
- `id`: UUID (Primary Key)
- `clerk_id`: TEXT (Unique, Clerk User ID)
- `name`: TEXT
- `is_premium`: BOOLEAN (프리미엄 구독 여부)
- `premium_expires_at`: TIMESTAMPTZ
- `trial_ends_at`: TIMESTAMPTZ
- `mfa_secret`: TEXT (2FA 비밀키)
- `mfa_enabled`: BOOLEAN
- `mfa_backup_codes`: TEXT[] (2FA 백업 코드)
- `notification_settings`: JSONB (알림 설정)
- `created_at`: TIMESTAMPTZ

##### 7.1.2. 레시피 시스템

**레시피 기본 정보 테이블 (`recipes`)**
- `id`: UUID (Primary Key)
- `user_id`: UUID (작성자, Foreign Key → users)
- `slug`: TEXT (Unique, URL 친화적 식별자)
- `title`: TEXT
- `description`: TEXT
- `thumbnail_url`: TEXT
- `difficulty`: INTEGER (1~5점)
- `cooking_time_minutes`: INTEGER
- `servings`: INTEGER
- `calories`, `carbohydrates`, `protein`, `fat`, `sodium`: NUMERIC (영양 정보)
- `foodsafety_*`: 식약처 API 연동 필드 (rcp_seq, rcp_way2, rcp_pat2, info_* 등)
- `created_at`, `updated_at`: TIMESTAMPTZ

**레시피 재료 테이블 (`recipe_ingredients`)**
- `id`: UUID (Primary Key)
- `recipe_id`: UUID (Foreign Key → recipes)
- `name`: TEXT (재료명)
- `ingredient_name`: TEXT
- `quantity`: NUMERIC
- `unit`: TEXT
- `category`: ingredient_category ENUM (곡물, 채소, 과일, 육류, 해산물, 유제품, 조미료, 기타)
- `is_optional`: BOOLEAN (선택 재료 여부)
- `preparation_note`: TEXT (손질 방법)
- `display_order`: INTEGER

**레시피 조리 단계 테이블 (`recipe_steps`)**
- `id`: UUID (Primary Key)
- `recipe_id`: UUID (Foreign Key → recipes)
- `step_number`: INTEGER
- `content`: TEXT (조리 설명)
- `image_url`: TEXT
- `video_url`: TEXT
- `timer_minutes`: INTEGER (타이머 시간)
- `foodsafety_manual_img`: TEXT (식약처 조리법 이미지)

**레시피 평가 테이블 (`recipe_ratings`)**
- `id`: UUID (Primary Key)
- `recipe_id`: UUID (Foreign Key → recipes)
- `user_id`: UUID (Foreign Key → users)
- `rating`: NUMERIC (0.5, 1.0, 1.5, ..., 5.0 - 0.5점 단위)
- `created_at`, `updated_at`: TIMESTAMPTZ
- UNIQUE(recipe_id, user_id)

**레시피 신고 테이블 (`recipe_reports`)**
- `id`: UUID (Primary Key)
- `recipe_id`: UUID (Foreign Key → recipes)
- `user_id`: UUID (Foreign Key → users)
- `report_type`: TEXT (inappropriate, copyright, spam, other)
- `reason`: TEXT
- `status`: TEXT (pending, reviewing, resolved, dismissed)
- `created_at`, `updated_at`: TIMESTAMPTZ

**레시피 사용 이력 테이블 (`recipe_usage_history`)**
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key → users)
- `family_member_id`: UUID (Foreign Key → family_members, NULL 가능)
- `recipe_title`: TEXT
- `recipe_url`: TEXT
- `meal_type`: TEXT (breakfast, lunch, dinner, snack)
- `used_date`: DATE

**식약처 레시피 캐시 테이블 (`foodsafety_recipes_cache`)**
- `id`: UUID (Primary Key)
- `rcp_seq`: TEXT (Unique, 식약처 레시피 순번)
- `rcp_nm`: TEXT (레시피명)
- `rcp_pat2`, `rcp_way2`: TEXT (요리종류, 조리방법)
- `info_*`: NUMERIC (영양 정보)
- `manual_data`: JSONB (조리법 데이터)
- `cached_at`: TIMESTAMPTZ

**궁중 레시피 블로그 테이블 (`royal_recipes_posts`)**
- `id`: UUID (Primary Key)
- `title`: TEXT
- `content`: TEXT
- `era`: TEXT (goryeo, joseon, three_kingdoms)
- `slug`: TEXT (Unique)
- `published`: BOOLEAN
- `thumbnail_url`: TEXT
- `excerpt`: TEXT

##### 7.1.3. 건강 관리 시스템

**사용자 건강 프로필 테이블 (`user_health_profiles`)**
- `id`: UUID (Primary Key)
- `user_id`: UUID (Unique, Foreign Key → users)
- `diseases`: TEXT[] (질병 배열)
- `allergies`: TEXT[] (알레르기 배열)
- `preferred_ingredients`: TEXT[] (선호 식재료)
- `disliked_ingredients`: TEXT[] (비선호 식재료)
- `excluded_ingredients`: JSONB
- `daily_calorie_goal`: INTEGER
- `dietary_preferences`: TEXT[] (도시락, 헬스인, 저탄수, 비건, 베지테리언 등)
- `height_cm`, `weight_kg`, `age`: INTEGER/NUMERIC
- `gender`: TEXT (male, female, other)
- `activity_level`: TEXT (sedentary, light, moderate, active, very_active)
- `diseases_jsonb`, `allergies_jsonb`: JSONB (상세 정보)
- `calorie_calculation_method`: VARCHAR(50) (칼로리 계산 방식)
- `manual_target_calories`: INTEGER (수동 목표 칼로리)
- `show_calculation_formula`: BOOLEAN (공식 표시 여부)
- `created_at`, `updated_at`: TIMESTAMPTZ

**가족 구성원 테이블 (`family_members`)**
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key → users)
- `name`: TEXT
- `birth_date`: DATE (나이 자동 계산, 0-18세는 `is_child` 자동 판단)
- `gender`: TEXT (male, female, other)
- `relationship`: TEXT (관계)
- `diseases`: TEXT[] (질병 배열)
- `allergies`: TEXT[] (알레르기 배열)
- `height_cm`, `weight_kg`: INTEGER/NUMERIC
- `activity_level`: TEXT
- `dietary_preferences`: TEXT[]
- `include_in_unified_diet`: BOOLEAN (통합 식단 포함 여부, 기본값 true)
- `created_at`, `updated_at`: TIMESTAMPTZ
- **제약조건**: 사용자당 최대 10명 제한 (`check_family_member_limit()` 함수)

**질병 마스터 테이블 (`diseases`)**
- `id`: UUID (Primary Key)
- `code`: VARCHAR(50) (Unique, 질병 코드)
- `name_ko`: VARCHAR(200) (한글명)
- `name_en`: VARCHAR(200) (영문명)
- `category`: VARCHAR(100) (카테고리)
- `description`: TEXT
- `calorie_adjustment_factor`: NUMERIC (칼로리 조정 계수)
- `created_at`, `updated_at`: TIMESTAMPTZ

**질병별 제외 음식 테이블 (`disease_excluded_foods`) - 레거시**
- `id`: UUID (Primary Key)
- `disease`: TEXT (질병명)
- `excluded_food_name`: TEXT (제외 음식명)
- `excluded_food_type`: TEXT (ingredient 또는 recipe_keyword)
- `reason`: TEXT (제외 이유)
- `severity`: TEXT (low, medium, high, critical 등)
- UNIQUE(disease, excluded_food_name)

**질병별 제외 음식 확장 테이블 (`disease_excluded_foods_extended`)**
- `id`: UUID (Primary Key)
- `disease_code`: VARCHAR(50) (Foreign Key → diseases.code)
- `food_name`: VARCHAR(200)
- `food_type`: VARCHAR(50)
- `severity`: VARCHAR(20)
- `reason`: TEXT

**알레르기 마스터 테이블 (`allergies`)**
- `id`: UUID (Primary Key)
- `code`: VARCHAR(50) (Unique, 알레르기 코드)
- `name_ko`: VARCHAR(200) (한글명)
- `name_en`: VARCHAR(200) (영문명)
- `category`: VARCHAR(100)
- `severity_level`: VARCHAR(20)
- `description`: TEXT
- `created_at`, `updated_at`: TIMESTAMPTZ

**알레르기 파생 재료 테이블 (`allergy_derived_ingredients`)**
- `id`: UUID (Primary Key)
- `allergy_code`: VARCHAR(50) (Foreign Key → allergies.code)
- `ingredient_name`: VARCHAR(200) (파생 재료명, 예: 새우 → 새우젓, 김치)
- `ingredient_type`: VARCHAR(50)
- `description`: TEXT

**응급조치 정보 테이블 (`emergency_procedures`)**
- `id`: UUID (Primary Key)
- `allergy_code`: VARCHAR(50) (Foreign Key → allergies.code)
- `procedure_type`: VARCHAR(50)
- `title_ko`, `title_en`: VARCHAR(200)
- `steps`: JSONB (응급조치 단계)
- `warning_signs`: JSONB (위험 신호)
- `when_to_call_911`: TEXT (119 신고 시기)
- `created_at`, `updated_at`: TIMESTAMPTZ

**칼로리 계산 공식 테이블 (`calorie_calculation_formulas`)**
- `id`: UUID (Primary Key)
- `formula_name`: VARCHAR(100) (Unique, 공식명: Mifflin-St Jeor, Harris-Benedict, EER 등)
- `formula_type`: VARCHAR(50)
- `gender`: VARCHAR(10) (male, female)
- `age_min`, `age_max`: INTEGER (적용 연령대)
- `formula_expression`: TEXT (수식)
- `description`: TEXT
- `is_default`: BOOLEAN (기본 공식 여부)
- `created_at`, `updated_at`: TIMESTAMPTZ

##### 7.1.4. 식단 관리 시스템

**식단 계획 테이블 (`diet_plans`)**
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key → users)
- `family_member_id`: UUID (Foreign Key → family_members, NULL이면 본인 식단)
- `plan_date`: DATE (식단 날짜)
- `meal_type`: TEXT (breakfast, lunch, dinner, snack)
- `recipe_id`: TEXT (레시피 ID)
- `recipe_title`: TEXT
- `recipe_description`: TEXT
- `ingredients`: JSONB (재료 정보)
- `instructions`: TEXT (조리법)
- `calories`: INTEGER
- `protein_g`, `carbs_g`, `fat_g`: NUMERIC (3대 영양소)
- `sodium_mg`: INTEGER
- `fiber_g`: NUMERIC
- `potassium_mg`: INTEGER (CKD 환자용)
- `phosphorus_mg`: INTEGER (CKD 환자용)
- `gi_index`: NUMERIC (혈당지수, 당뇨 환자용)
- `composition_summary`: JSONB (구성 요약)
- `is_unified`: BOOLEAN (통합 식단 여부)
- `created_at`: TIMESTAMPTZ

**주간 식단 메타데이터 테이블 (`weekly_diet_plans`)**
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key → users)
- `week_start_date`: DATE (주 시작일, 월요일)
- `week_year`: INTEGER (ISO 8601 주차 연도)
- `week_number`: INTEGER (ISO 8601 주차 번호)
- `is_family`: BOOLEAN (가족 식단 여부)
- `total_recipes_count`: INTEGER (총 레시피 수)
- `generation_duration_ms`: INTEGER (생성 소요 시간)
- `created_at`, `updated_at`: TIMESTAMPTZ
- UNIQUE(user_id, week_year, week_number)

**주간 장보기 리스트 테이블 (`weekly_shopping_lists`)**
- `id`: UUID (Primary Key)
- `weekly_diet_plan_id`: UUID (Foreign Key → weekly_diet_plans)
- `ingredient_name`: TEXT (재료명)
- `total_quantity`: NUMERIC (총 필요량)
- `unit`: TEXT (단위)
- `category`: TEXT (카테고리)
- `recipes_using`: JSONB (사용 레시피 목록)
- `is_purchased`: BOOLEAN (구매 완료 여부)
- `created_at`: TIMESTAMPTZ

**주간 영양 통계 테이블 (`weekly_nutrition_stats`)**
- `id`: UUID (Primary Key)
- `weekly_diet_plan_id`: UUID (Foreign Key → weekly_diet_plans)
- `day_of_week`: INTEGER (1=월요일, 7=일요일)
- `date`: DATE
- `total_calories`: NUMERIC
- `total_carbohydrates`: NUMERIC
- `total_protein`: NUMERIC
- `total_fat`: NUMERIC
- `total_sodium`: NUMERIC
- `meal_count`: INTEGER (식사 수)
- `created_at`: TIMESTAMPTZ

**식단 알림 설정 테이블 (`diet_notification_settings`)**
- `id`: UUID (Primary Key)
- `user_id`: UUID (Unique, Foreign Key → users)
- `popup_enabled`: BOOLEAN (팝업 알림 활성화)
- `browser_enabled`: BOOLEAN (브라우저 알림 활성화)
- `notification_time`: TIME (알림 시간, 기본값 05:00)
- `kcdc_enabled`: BOOLEAN (질병청 알림 활성화)
- `last_notification_date`: DATE (마지막 알림 날짜)
- `last_dismissed_date`: DATE (마지막 닫기 날짜)
- `created_at`, `updated_at`: TIMESTAMPTZ

##### 7.1.5. 결제 및 프리미엄 기능

**사용자 구독 관리 테이블 (`user_subscriptions`)**
- `id`: UUID (Primary Key)
- `user_id`: UUID (Unique, Foreign Key → users)
- `subscription_plan`: TEXT (free, single, premium, enterprise)
- `started_at`: TIMESTAMPTZ
- `expires_at`: TIMESTAMPTZ
- `is_active`: BOOLEAN
- `created_at`, `updated_at`: TIMESTAMPTZ
- **트리거**: 사용자 생성 시 자동으로 'free' 플랜 생성

**구독 정보 테이블 (`subscriptions`) - 결제 시스템**
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key → users)
- `status`: TEXT (active, inactive, cancelled, paused)
- `plan_type`: TEXT (monthly, yearly)
- `billing_key`: TEXT (결제 키)
- `payment_method`: TEXT
- `last_four_digits`: TEXT (카드 마지막 4자리)
- `started_at`, `current_period_start`, `current_period_end`: TIMESTAMPTZ
- `cancelled_at`: TIMESTAMPTZ
- `price_per_month`: INTEGER
- `total_paid`: INTEGER
- `is_test_mode`: BOOLEAN

**결제 내역 테이블 (`payment_transactions`)**
- `id`: UUID (Primary Key)
- `subscription_id`: UUID (Foreign Key → subscriptions)
- `user_id`: UUID (Foreign Key → users)
- `status`: TEXT (pending, completed, failed, refunded)
- `transaction_type`: TEXT (subscription, one_time, refund)
- `pg_provider`: TEXT (기본값: toss_payments)
- `pg_transaction_id`: TEXT (Unique, PG사 거래 ID)
- `amount`: INTEGER (결제 금액)
- `tax_amount`: INTEGER (세금)
- `net_amount`: INTEGER (실제 금액)
- `payment_method`: TEXT
- `card_info`: JSONB (카드 정보)
- `paid_at`, `refunded_at`: TIMESTAMPTZ
- `metadata`: JSONB
- `is_test_mode`: BOOLEAN

**프로모션 코드 테이블 (`promo_codes`)**
- `id`: UUID (Primary Key)
- `code`: TEXT (Unique, 프로모션 코드)
- `discount_type`: TEXT (percentage, fixed_amount, free_trial)
- `discount_value`: INTEGER (할인 값)
- `max_uses`: INTEGER (최대 사용 횟수)
- `current_uses`: INTEGER (현재 사용 횟수)
- `valid_from`, `valid_until`: TIMESTAMPTZ
- `applicable_plans`: TEXT[] (적용 가능한 플랜)
- `new_users_only`: BOOLEAN (신규 사용자 전용)
- `description`: TEXT
- `created_by`: UUID (Foreign Key → users)

**프로모션 사용 내역 테이블 (`promo_code_uses`)**
- `id`: UUID (Primary Key)
- `promo_code_id`: UUID (Foreign Key → promo_codes)
- `user_id`: UUID (Foreign Key → users)
- `subscription_id`: UUID (Foreign Key → subscriptions)
- `used_at`: TIMESTAMPTZ
- UNIQUE(promo_code_id, user_id)

**즐겨찾기 식단 테이블 (`favorite_meals`)**
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key → users)
- `recipe_id`: UUID (Foreign Key → recipes)
- `recipe_title`: TEXT
- `meal_type`: TEXT (breakfast, lunch, dinner, snack)
- `calories`: INTEGER
- `protein`, `carbs`, `fat`: NUMERIC
- `notes`: TEXT
- `created_at`, `updated_at`: TIMESTAMPTZ
- UNIQUE(user_id, recipe_id)

**수동 등록 밀키트 제품 테이블 (`meal_kits`)**
- `id`: UUID (Primary Key)
- `name`: TEXT
- `description`: TEXT
- `image_url`: TEXT
- `price`: INTEGER
- `serving_size`: INTEGER
- `calories`: INTEGER
- `protein`, `carbs`, `fat`: NUMERIC
- `category`: TEXT
- `meal_type`: TEXT[] (식사 타입 배열)
- `purchase_url`: TEXT
- `is_active`: BOOLEAN
- `is_premium_only`: BOOLEAN
- `created_by`: UUID (Foreign Key → users)
- `created_at`, `updated_at`: TIMESTAMPTZ

**쿠팡 API 제품 캐시 테이블 (`meal_kit_products`)**
- `id`: UUID (Primary Key)
- `coupang_product_id`: TEXT (Unique, 쿠팡 제품 ID)
- `name`: TEXT
- `description`: TEXT
- `image_url`: TEXT
- `price`: INTEGER
- `original_price`: INTEGER
- `discount_rate`: INTEGER
- `product_url`: TEXT
- `affiliate_link`: TEXT (제휴 링크)
- `calories`: INTEGER
- `protein`, `carbs`, `fat`: NUMERIC
- `category`: TEXT
- `meal_type`: TEXT[]
- `last_synced_at`: TIMESTAMPTZ
- `sync_status`: TEXT
- `sync_error`: TEXT
- `is_active`, `is_available`: BOOLEAN
- `created_at`, `updated_at`: TIMESTAMPTZ

##### 7.1.6. 관리자 및 레거시 아카이브

**페이지 문구 관리 테이블 (`admin_copy_blocks`)**
- `id`: UUID (Primary Key)
- `slug`: TEXT (슬롯 식별자)
- `locale`: TEXT (기본값: ko)
- `content`: JSONB (콘텐츠 데이터)
- `version`: INTEGER (버전 번호)
- `updated_by`: TEXT (수정자)
- `created_at`, `updated_at`: TIMESTAMPTZ
- UNIQUE(slug, locale)

**팝업 공지 관리 테이블 (`popup_announcements`)**
- `id`: UUID (Primary Key)
- `title`: TEXT
- `body`: TEXT
- `active_from`: TIMESTAMPTZ (활성화 시작일)
- `active_until`: TIMESTAMPTZ (활성화 종료일)
- `status`: TEXT (draft, published, archived)
- `priority`: INTEGER (우선순위)
- `target_segments`: JSONB (타겟 세그먼트)
- `metadata`: JSONB
- `image_url`: TEXT
- `link_url`: TEXT
- `display_type`: TEXT (modal, checkpoint)
- `created_by`, `updated_by`: TEXT
- `created_at`, `updated_at`: TIMESTAMPTZ

**알림 로그 테이블 (`notification_logs`)**
- `id`: UUID (Primary Key)
- `type`: TEXT (kcdc, diet-popup, system)
- `status`: TEXT (success, failed, pending)
- `payload`: JSONB (알림 데이터)
- `triggered_at`: TIMESTAMPTZ
- `actor`: TEXT (실행자)
- `error_message`: TEXT
- `created_at`: TIMESTAMPTZ

**보안 감사 로그 테이블 (`admin_security_audit`)**
- `id`: UUID (Primary Key)
- `action`: TEXT (password-change, mfa-enable, mfa-disable, session-revoke, admin-access)
- `user_id`: TEXT
- `details`: JSONB
- `ip_address`: INET
- `user_agent`: TEXT
- `created_at`: TIMESTAMPTZ

**레거시 명인 테이블 (`legacy_masters`)**
- `id`: UUID (Primary Key)
- `name`: TEXT (명인 이름)
- `title`: TEXT (칭호)
- `region`: TEXT (지역)
- `bio`: TEXT (소개)

**레거시 비디오 테이블 (`legacy_videos`)**
- `id`: UUID (Primary Key)
- `master_id`: UUID (Foreign Key → legacy_masters)
- `slug`: TEXT (Unique)
- `title`: TEXT
- `description`: TEXT
- `duration_minutes`: INTEGER
- `region`: TEXT (지역)
- `era`: TEXT (시대)
- `ingredients`: TEXT[] (재료 배열)
- `thumbnail_url`: TEXT
- `video_url`: TEXT
- `premium_only`: BOOLEAN (프리미엄 전용 여부)
- `tags`: TEXT[] (태그 배열)
- `created_at`: TIMESTAMPTZ

**레거시 문서 테이블 (`legacy_documents`)**
- `id`: UUID (Primary Key)
- `video_id`: UUID (Foreign Key → legacy_videos)
- `title`: TEXT
- `summary`: TEXT
- `region`: TEXT
- `era`: TEXT
- `ingredients`: JSONB (재료 정보)
- `tools`: JSONB (도구 정보)
- `source`: JSONB (출처 정보)
- `steps`: JSONB (조리 단계)
- `created_at`: TIMESTAMPTZ

**레거시 대체 가이드 테이블 (`legacy_replacement_guides`)**
- `id`: UUID (Primary Key)
- `traditional`: JSONB (전통 재료 정보)
- `modern`: JSONB (현대 대체재 정보)
- `tips`: TEXT[] (팁 배열)
- `created_at`: TIMESTAMPTZ

**질병관리청 알림 테이블 (`kcdc_alerts`)**
- `id`: UUID (Primary Key)
- `alert_type`: TEXT (알림 타입)
- `title`: TEXT
- `content`: TEXT
- `severity`: TEXT (기본값: info)
- `flu_stage`: TEXT (독감 단계)
- `flu_week`: TEXT (독감 주차)
- `vaccine_name`: TEXT (백신명)
- `target_age_group`: TEXT (대상 연령대)
- `recommended_date`: DATE (권장 일정)
- `source_url`: TEXT (출처 URL)
- `published_at`: TIMESTAMPTZ
- `is_active`: BOOLEAN
- `priority`: INTEGER
- `fetched_at`: TIMESTAMPTZ
- `expires_at`: TIMESTAMPTZ
- `created_at`, `updated_at`: TIMESTAMPTZ

##### 7.1.7. 이미지 관리 시스템

**이미지 사용 로그 테이블 (`image_usage_logs`)**
- `id`: UUID (Primary Key)
- `image_path`: TEXT (이미지 경로)
- `food_name`: TEXT (음식명)
- `source_type`: TEXT (static, gemini, placeholder)
- `access_count`: INTEGER (접근 횟수)
- `last_accessed_at`: TIMESTAMPTZ
- `created_at`: TIMESTAMPTZ

**이미지 캐시 통계 테이블 (`image_cache_stats`)**
- `id`: UUID (Primary Key)
- `stat_date`: DATE (Unique, 통계 날짜)
- `total_images`: INTEGER (총 이미지 수)
- `static_images`: INTEGER (정적 이미지 수)
- `gemini_images`: INTEGER (Gemini 생성 이미지 수)
- `placeholder_images`: INTEGER (플레이스홀더 수)
- `total_access_count`: INTEGER (총 접근 횟수)
- `cache_hit_rate`: NUMERIC (캐시 적중률)
- `storage_size_mb`: NUMERIC (저장소 크기)
- `created_at`, `updated_at`: TIMESTAMPTZ

**이미지 캐시 정리 로그 테이블 (`image_cache_cleanup_logs`)**
- `id`: UUID (Primary Key)
- `cleanup_date`: TIMESTAMPTZ
- `images_removed`: INTEGER (삭제된 이미지 수)
- `space_freed_mb`: NUMERIC (해제된 공간)
- `cleanup_duration_ms`: INTEGER (정리 소요 시간)
- `cleanup_type`: TEXT
- `error_message`: TEXT
- `created_at`: TIMESTAMPTZ

##### 7.1.8. Storage 버킷

**업로드 버킷 (`uploads`)**
- 사용자별 폴더 구조: `{clerk_user_id}/{filename}`
- 파일 크기 제한: 6MB
- RLS 정책: 인증된 사용자만 자신의 폴더에 업로드/조회/삭제 가능

**팝업 이미지 버킷 (`popup-images`)**
- 공개 버킷 (public: true)
- 관리자만 업로드 가능

#### 7.2. 건강 맞춤 식단 알고리즘 로직

건강 맞춤 식단 시스템은 사용자의 건강 정보를 기반으로 최적의 식단을 추천하는 규칙 기반 알고리즘을 사용합니다.

**전체 프로세스 흐름**
1. **건강 정보 수집**: 사용자 건강 프로필 조회 (질병, 알레르기, 선호도, 신체 정보)
2. **칼로리 목표 계산**: Mifflin-St Jeor 공식 또는 수동 설정 값 사용
3. **레시피 필터링**: 통합 필터링 파이프라인 적용
4. **식사별 배분**: 아침/점심/저녁/간식별 칼로리 및 영양소 목표 설정
5. **레시피 점수 계산**: 매크로 목표, 선호도, 중복 방지 등을 고려한 점수 계산
6. **최종 선택**: 각 식사별 최고 점수 레시피 선택 및 저장

**1. 엄격한 알레르기 필터링 (Strict Allergy Filtering)**
1. 사용자의 알레르기 정보 조회
2. `allergy_derived_ingredients` 테이블을 통해 파생 재료 확인 (예: 새우 -> 새우젓, 김치, 해물 육수)
3. 레시피 제목, 설명, 재료 목록에서 원재료 및 파생 재료 키워드 검색
4. 매칭되는 항목이 하나라도 있으면 해당 레시피 제외 (안전 최우선)

**2. 칼로리 계산 로직 (Calorie Calculation)**
1. **BMR 계산**: `calorie_calculation_formulas` 테이블에서 선택한 공식 사용 (기본값: Mifflin-St Jeor)
   - 남자: (10 × 체중) + (6.25 × 키) - (5 × 나이) + 5
   - 여자: (10 × 체중) + (6.25 × 키) - (5 × 나이) - 161
2. **활동 대사량(TDEE)**: 활동량 계수(1.2 ~ 1.9) 곱하기
3. **목표 칼로리 조정**:
   - 질병(당뇨, 비만) 보유 시 자동 감량 (질병별 조정 계수 적용)
   - 프리미엄 다이어트 모드 시 15% 감량
   - 사용자 수동 설정(`manual_target_calories`) 시 해당 값 우선 사용
4. **최소 칼로리 보장**: 성인 기준 최소 1200kcal(남성 1500kcal) 미만으로 떨어지지 않도록 안전장치 적용

**3. 통합 필터링 파이프라인 (`lib/diet/integrated-filter.ts`)**
다음 순서로 레시피를 필터링하며, 하나라도 실패하면 제외됩니다:
1. **알레르기 필터링**: 알레르기 유발 재료 및 파생 재료 검사
2. **질병별 제외 음식 필터링**: `disease_excluded_foods_extended` 테이블 기반 제외 음식 검사
3. **질병별 영양소 제한**: 칼륨(신장질환), 인(신장질환), 퓨린(통풍), FODMAPs(과민성 대장증후군) 등
4. **나트륨 제한**: 고혈압/신장질환/심혈관질환 시 식사당 700mg 이하 제한
5. **선호도 필터링**: 비선호 식재료 제외, 선호 식재료 가중치 적용

**4. 질병별 제외 음식 필터링 (상세)**
1. 사용자의 질병 정보 조회 (`user_health_profiles.diseases`)
2. 각 질병별 제외 음식 목록 조회 (`disease_excluded_foods_extended` 테이블)
3. 레시피의 제목, 설명, 재료 목록에서 제외 음식 키워드 검색
4. 매칭되면 해당 레시피 제외 (심각도에 따라 경고 표시 또는 완전 제외)

**5. 식사별 칼로리 및 영양소 배분**
- **성인 기준**: 아침 30%, 점심 35%, 저녁 30%, 간식 5%
- **어린이 기준 (0-18세)**: 아침 25%, 점심 35%, 저녁 30%, 간식 10%
- **매크로 목표**: 탄수화물 50%, 단백질 20%, 지방 30% (기본값, 질병별 조정 가능)

**6. 레시피 점수 계산 (`lib/diet/recommendation.ts`)**
각 레시피에 대해 다음 요소를 고려하여 점수를 계산합니다:
1. **칼로리 적합도**: 목표 칼로리 범위 내 여부
2. **매크로 목표 달성도**: 탄수화물/단백질/지방 목표와의 차이
3. **선호도 가중치**: 선호 식재료 포함 시 가점
4. **중복 방지**: 최근 30일 사용 이력 확인
5. **특수 식단 타입**: 도시락/헬스/저탄수/비건 등 필터 조건 만족 여부

**8. 가족 맞춤 식단 생성 (`lib/diet/family-recommendation.ts`)**
1. **개인 식단 생성**: 각 구성원별로 건강 정보를 기반으로 개인 식단 생성
   - 구성원의 질병, 알레르기, 선호도 고려
   - 어린이는 성장기 식단 로직 적용 (식사별 칼로리 비율 조정)
2. **통합 식단 생성**: `include_in_unified_diet`가 true인 구성원만 포함
   - 모든 포함된 구성원의 제약 조건을 동시에 만족하는 레시피만 선택
   - 평균 칼로리 목표 사용 (포함된 구성원들의 칼로리 평균)
   - 가장 엄격한 제약 조건을 우선 적용 (안전 최우선)

**7. 특수 식단 타입 필터링 (`lib/diet/special-diet-filters.ts`)**
1. 사용자의 `dietary_preferences` 배열 확인
2. 각 식단 타입별 필터 함수 적용:
   - **도시락(bento)**: 반찬 위주, 밥/국 제외, 보관 용이한 음식 우선
   - **헬스인(fitness)**: 닭가슴살 포함, 고단백 저지방, 단백질 20g 이상
   - **다이어트(low_carb)**: 탄수화물 30g 이하, 주식 제외
   - **비건(vegan)**: 모든 동물성 식품 제외 (고기, 해산물, 유제품, 계란 등)
   - **베지테리언(vegetarian)**: 육류와 생선 제외
3. 모든 선택된 식단 타입을 만족하는 레시피만 선택 (AND 조건)

#### 7.3. 크론 작업

**실행 시간**: 매일 오후 6시 (18:00 KST)

**동작 흐름**:
1. 모든 활성 사용자 조회
2. 각 사용자의 가족 구성원 조회
3. **일일 식단 생성** (오늘)
   - 가족 구성원이 있으면: 가족 식단 생성
   - 가족 구성원이 없으면: 본인 건강 정보로 건강 맞춤 식단 생성
   - 건강 맞춤 추천 로직 사용 (`generateAndSaveDietPlan`)
4. **주간 식단 생성** (일요일 오후 6시에만 실행)
   - 다음 주 월요일부터 7일치 식단 생성
   - 건강 맞춤 식단 로직 반영 (개인/가족 식단 자동 적용)
   - 레시피 다양성 강화 (주간 내 중복 최소화)
     - 다양성 수준에 따른 중복 허용 범위: high(1회), medium(2회), low(3회)
     - 주간 레시피 사용 빈도 추적 및 통계
   - 장보기 리스트 및 영양 통계 자동 생성
5. 데이터베이스에 저장

**생성 시점**:
- 매일 오후 6시에 오늘 날짜의 식단을 생성하여 사용자가 당일 식단을 확인할 수 있도록 함
- 일일 식단: 매일 오후 6시에 오늘 식단 생성
- 주간 식단: 일요일 오후 6시에 다음 주 식단 생성

**구현 방법**:
- Next.js API Route + Vercel Cron (`/api/cron/generate-daily-diets`)
- Cron 스케줄: `0 18 * * *` (매일 18:00 KST)

#### 7.3.1. 주간 식단 생성 로직

**핵심 특징**:
1. **7일치 식단을 한 번에 고려**: 일일 식단을 7번 독립적으로 생성하는 것이 아니라, 주간 전체를 고려하여 레시피 중복을 최소화
2. **레시피 다양성 강화**: 
   - 주간 내 레시피 사용 빈도를 추적 (`weeklyRecipeFrequency` Map)
   - 다양성 수준(`diversityLevel`)에 따라 중복 허용 범위 설정
   - high: 주간 내 같은 레시피 최대 1회만 사용
   - medium: 주간 내 같은 레시피 최대 2회 사용
   - low: 주간 내 같은 레시피 최대 3회 사용
3. **주간 영양 밸런스**: 7일간의 평균 영양소 섭취량을 계산하여 균형 잡힌 식단 제공
4. **장보기 리스트 통합**: 7일치 식단의 재료를 자동으로 집계하여 카테고리별로 정리

**생성 흐름**:
1. 주차 정보 계산 (ISO 8601 기준)
2. 7일치 날짜 배열 생성 (월요일~일요일)
3. 일별 식단 생성 (주간 컨텍스트 고려)
   - 사용된 레시피 추적 (`usedRecipeIds`, `usedRecipeTitles`, `weeklyRecipeFrequency`)
   - 주간 중복 방지 로직 적용
4. 장보기 리스트 생성 (재료 통합 및 카테고리별 정렬)
5. 주간 영양 통계 생성 (일별 영양소 합계 및 평균)

**UI 구성**:
- **캘린더 뷰**: 7일간의 식단을 그리드 형식으로 표시, 날짜별 식사(아침/점심/저녁/간식) 카드
- **영양 통계**: 주간 평균 영양소, 일별 칼로리 차트, 영양소 비율 시각화
- **장보기 리스트**: 카테고리별 재료 그룹화, 구매 완료 체크박스, 진행률 표시

#### 7.4. 팝업 알림 동작

**트리거 조건**:
1. 사용자 로그인 상태
2. 오전 5시 이후
3. 오늘 식단이 생성되어 있음
4. 오늘 알림을 아직 보지 않음 (`last_notification_date` 확인)

**표시 방식**:
- 웹사이트 내 팝업 모달 (기본)
- 브라우저 알림 (사용자 권한 허용 시, 선택적)

**사용자 제어**:
- 알림 설정 페이지에서 팝업/브라우저 알림 각각 활성화/비활성화 가능

- **앱 상태 QA 가이드**:
  - 앱(WebView)과 브라우저 모두에서 동일한 팝업 컴포넌트를 사용하며, `console.group('[Popup]')` 로그와 toast 이벤트를 통해 상태 추적
  - QA 체크리스트: 로그인 여부, 오전 5시 이후 조건, 알림 이미 수신 여부, 독감/예방접종 데이터 수신 여부, 닫기/식단 보기 버튼 동작
  - 디자인 요구사항: 최소 320px 가로, 버튼 영역 48px 이상, 접근성 대비 4.5:1 유지

#### 7.5. 이미지 자산 관리 (2025-11 기준)

- **정적 매핑 기반 공급**: `docs/foodjpg.md`에서 Define한 음식명 → 이미지 경로 매핑을 단일 소스로 사용합니다. 모든 경로는 `public/images/food/` 이하의 로컬 자산 또는 카테고리별 SVG 폴백으로 구성됩니다.
- **서버 액션 연동**: `actions/recipe-create.ts`가 `foodImageService.getFoodImage()`를 호출해 레시피 생성 시 자동으로 썸네일을 배정합니다. 실패 시 `lib/food-image-fallback.ts`의 카테고리 이미지가 반환됩니다.
- **클라이언트 폴백**: `getRecipeImageUrlEnhanced()`가 상세/카드/건강 맞춤 식단 컴포넌트 전반에서 동일한 우선순위(썸네일 → 특정 매핑 → 카테고리 SVG)를 적용해 항상 이미지를 노출합니다.
- **관리 도구**: `components/admin/image-monitoring-dashboard.tsx` + `app/api/cache/stats`를 통해 현재 매핑 상태를 조회할 수 있으며, 더 이상 Pixabay/Gemini 파이프라인에 의존하지 않습니다.
- **남은 작업**: 매핑에 없는 음식은 SVG 폴백을 사용하므로, 장기적으로는 `docs/foodjpg.md` 보강 또는 외부 생성 파이프라인 재도입 여부를 별도 결정해야 합니다.

#### 7.6. 질병관리청 API 연동

- **데이터 소스**: 질병관리청(KCDC)에서 제공하는 공개 RSS/JSON 공지(독감 단계, 예방접종 권장 일정)를 1시간 간격으로 pull
- **서버 구성**:
  - `app/api/health/kcdc/refresh` : Server Action/Route가 `fetchKcdcFeed()`를 호출, 최신 문서를 Supabase 테이블 `kcdc_alerts`에 upsert
  - Supabase Edge Function 스케줄러(05:00 KST)로 자동 호출, 실패 시 Slack/Webhook 알림
  - 캐시 만료: 6시간, 연속 실패 시 마지막 성공 데이터를 유지
- **클라이언트 흐름**:
  - `useKcdcAlerts` 훅이 SSG + revalidateTag(`kcdc-alerts`)를 통해 최신 데이터를 구독
  - 독감/예방접종 정보는 `components/diet/diet-notification-popup.tsx`와 새 예방접종 팝업에 props로 전달
  - 사용자별 설정: `diet_notification_settings`에 “독감 팝업 허용”, “예방접종 리마인더 주기(주간/월간)” 필드 추가 예정

#### 7.7. 관리자 페이지 베이스

- **경로**: `/admin` (Server Component 레이아웃 + Client Shell)
- **인증**: Clerk 역할 기반 가드 (`role === 'admin'`)
- **핵심 모듈** (✅ Phase 0-5 완료):
  - **"페이지 문구 편집" 패널**: JSON 블록 CRUD, 버전 히스토리, diff 비교, 미리보기 모달
  - **"팝업 공지" 패널**: 팝업 CRUD, 배포/배포취소, 우선순위/세그먼트 관리, 미리보기 모달
  - **"알림 로그" 패널**: KCDC/식단 팝업 로그 조회, 필터링/검색, JSON 상세 Drawer
  - **"보안 설정" 패널**: 비밀번호 변경/2FA/세션 관리/보안 감사 로그
  - **"프로모션 코드 관리" 패널**: 프로모션 코드 생성/수정/삭제, 사용 내역 추적, 할인율 및 유효기간 설정
  - **"정산 내역" 패널**: 결제 내역 조회, 결제 방법별 필터링(카드/현금/프로모션 코드), 기간별 통계
  - **"밀키트 관리" 패널**: 밀키트 제품 등록/수정/삭제, 쿠팡 파트너스 API 연동(시뮬레이션)
  - **"레시피 관리" 패널**: 레시피 목록 조회, 일괄 삭제, 시드 데이터 생성
- **데이터베이스**: `admin_copy_blocks`, `popup_announcements`, `notification_logs`, `admin_security_audit`, `promo_codes`, `promo_code_uses`, `meal_kits`, `meal_kit_products` 테이블
- **확장 포인트**: 이미지 매핑, 식단/구성원 데이터 모듈 추가를 위한 모듈러 카드 레이아웃

#### 7.9. 홈페이지 콘텐츠 관리 시스템

- **아키텍처**: 데이터베이스 기반 콘텐츠 관리로 하드코딩 제거
- **슬롯 정의**: `actions/admin/copy/slots.ts`에 모든 홈페이지 콘텐츠 위치 정의
  - Hero 섹션: 배지, 타이틀, 서브타이틀, 검색창 placeholder, 검색 버튼, 배경 이미지 URL
  - 빠른 시작 카드: 4개 카드 (레거시, 레시피, 식단, 주간 식단) - 각각 title, description, href
  - Footer: 링크 배열, 의료 면책 조항, 저작권 텍스트
  - 섹션 제목/설명: Recipe Section, Diet Section, Legacy Section
- **콘텐츠 조회**: `lib/admin/copy-reader.ts`
  - `getCopyContent(slug, locale)`: 단일 슬롯 조회
  - `getMultipleCopyContent(slugs, locale)`: 여러 슬롯 병렬 조회
  - 기본값(fallback) 지원: 데이터베이스에 없으면 TEXT_SLOTS의 defaultContent 사용
  - 캐싱: Next.js unstable_cache 활용 (60초, revalidateTag로 무효화 가능)
- **컴포넌트 통합**:
  - `components/home/home-landing.tsx`: 서버 컴포넌트에서 콘텐츠 조회 후 HeroSection에 props 전달
  - `components/home/hero-section.tsx`: 클라이언트 컴포넌트, props로 받은 콘텐츠 표시
  - `components/footer.tsx`: 서버 컴포넌트로 변경, 데이터베이스에서 콘텐츠 조회
  - `components/recipes/recipe-section.tsx`: 섹션 제목/설명/버튼 텍스트를 데이터베이스에서 읽기
  - `components/health/diet-section.tsx`: 섹션 제목/설명을 데이터베이스에서 읽기
  - `components/legacy/legacy-archive-section.tsx`: 섹션 제목/설명을 데이터베이스에서 읽기
- **초기 데이터**: `supabase/migrations/20251130000000_insert_homepage_default_content.sql`
  - 모든 슬롯의 기본값을 데이터베이스에 삽입
  - ON CONFLICT DO NOTHING으로 중복 방지
- **사용 방법**: `/admin/copy` 페이지에서 JSON 에디터로 콘텐츠 수정
  - 배열 편집: 빠른 시작 카드, Footer 링크는 JSON 배열로 편집
  - 이미지 URL: `{"imageUrl": "https://..."}` 형식으로 입력

#### 7.8. 홈페이지 UI/UX 개선 (배달의민족 앱 참고)

- **아키텍처**: 고정 영역과 스크롤 영역을 분리하여 중요한 CTA는 항상 접근 가능하도록 설계
- **레이아웃 구조** (`app/layout.tsx`):
  - RootLayout에서 전체 레이아웃 관리
  - Navbar: `position: fixed`, `top: 44px` (프리미엄 배너 아래), `z-index: 50`
  - 메인 콘텐츠: `marginTop: 108px` (프리미엄 배너 44px + Navbar 64px), `paddingBottom: 80px` (하단 네비게이션 공간)
  - 하단 네비게이션: `position: fixed`, `bottom: 0`, 모바일에서만 표시 (`md:hidden`)
- **프리미엄 배너**:
  - `components/home/fixed-header.tsx`: 프리미엄 배너를 포함하는 고정 헤더
  - `components/home/premium-banner.tsx`: 청록색 배경(`bg-teal-500`), 흰색 텍스트
  - `position: fixed`, `top: 0`, `z-index: 50` 설정
  - 클릭 시 `/pricing` 페이지로 이동
  - 텍스트: "프리미엄 결제 혜택을 받아보세요"
  - 성능 최적화: `willChange: 'transform'`, `backfaceVisibility: 'hidden'`
- **검색바**:
  - `components/Navbar.tsx`: Navbar 내부에 검색 기능 직접 구현
  - `components/home/search-bar.tsx`: 독립적인 검색바 컴포넌트 (재사용 가능)
  - 둥근 모서리 (`rounded-lg`), 흰색 배경
  - 플레이스홀더: "레시피, 명인, 재료를 검색해보세요"
  - 검색어 입력 시 `/search?q={query}`로 이동
  - 엔터 키 입력 시 검색 실행
  - 포커스 애니메이션: 테두리 색상 변경 (`ring-2 ring-teal-500`), 그림자 효과 (`shadow-md`)
  - 검색 아이콘 색상 변경: 포커스/입력 시 `text-teal-600`
  - 접근성: `aria-label`, `aria-describedby`, `role="searchbox"` 속성
  - Escape 키로 포커스 해제 지원
- **바로가기 메뉴**:
  - `components/home/quick-access-menu.tsx`: 6개 주요 기능을 아이콘 그리드로 제공
  - 아이템: 궁중 레시피, 레시피, 건강 맞춤 식단, 주간 식단, 장보기, 즐겨찾기
  - 반응형 그리드: 모바일 4열 (`grid-cols-4`), 태블릿 5열 (`sm:grid-cols-5`), 데스크톱 6-8열 (`md:grid-cols-6 lg:grid-cols-8`)
  - 각 아이템별 고유 색상 (Tailwind 클래스: `bg-{color}-100`, `text-{color}-700`)
  - 호버/터치 효과: `hover:scale-105`, `hover:shadow-lg`, `hover:-translate-y-1`, `active:scale-95`
  - 터치 영역: 최소 88x88px (`min-h-[88px] min-w-[88px]`)
  - 성능 최적화: `willChange: 'transform'`, `touchAction: 'manipulation'`
- **하단 네비게이션**:
  - `components/layout/bottom-navigation.tsx`: 5개 메뉴 (홈, 레시피, 찜, 식단, 마이)
  - `position: fixed`, `bottom: 0`, `z-index: 50` (모바일에서만 표시, `md:hidden`)
  - 현재 페이지 하이라이트: 활성 색상 `text-teal-600`, 비활성 `text-gray-500`
  - 활성 상태: 아이콘 `scale-110`, 텍스트 `font-semibold`, 전체 `scale-105`
  - 아이콘 크기: 24px (`w-6 h-6`), 텍스트: 12px (`text-xs`)
  - 키보드 네비게이션: Tab, Enter/Space 키 지원 (`onKeyDown` 핸들러)
  - 스크린리더: `aria-label`, `aria-current="page"`, `role="button"` 속성
  - 성능 최적화: `willChange: 'transform'`, `backfaceVisibility: 'hidden'`
  - Safe area 지원: `safe-area-inset-bottom` 클래스
- **주간 식단 요약**:
  - `components/home/weekly-diet-summary.tsx`: 7일 캘린더 미리보기 및 총 칼로리 표시
  - 배경: 그라데이션 (`from-teal-50 to-blue-50`)
  - "전체보기" 링크로 `/diet/weekly` 페이지로 이동
  - 지연 로딩: `LazyWeeklyDietSummary` 컴포넌트로 동적 import (`React.lazy`)
  - 데이터 소스: `GET /api/diet/weekly/current` API 호출
  - 캐싱: `weeklyDietCache` 유틸리티로 클라이언트 사이드 캐싱
  - 로딩 상태: 스켈레톤 UI 표시
  - 에러 처리: 에러 발생 시 사용자에게 친화적인 메시지 표시
- **자주 구매하는 식자재**:
  - `components/home/frequent-items-section.tsx`: 사용자의 주간 식단 기반 재료 추천
  - API: `GET /api/shopping/frequent-items` (인증 필요)
  - 최근 4주간의 주간 식단에서 재료 빈도순 집계, 상위 8개 반환
  - 원클릭 장바구니 추가 기능
  - 지연 로딩: `LazyFrequentItemsSection` 컴포넌트로 동적 import
  - 로딩 상태: 스켈레톤 UI
  - 빈 상태: 데이터 없을 때 섹션 숨김
- **홈페이지 레이아웃** (`app/page.tsx`):
  - 고정 헤더 (`FixedHeader`) 최상단 배치
  - 응급조치 바로가기 (`EmergencyQuickAccess`) 배치
  - 즉시 렌더링: `HomeLanding` 컴포넌트 (바로가기 메뉴 포함)
  - 병렬 로딩: 각 섹션을 `Suspense`와 `ErrorBoundary`로 감싸서 독립적으로 로딩
  - 섹션: 궁중 레시피, 추천 레시피, 식약처 레시피, 건강 맞춤 식단, 주간 식단 요약, 자주 구매하는 식자재
  - 하단 네비게이션 높이만큼 패딩 추가 (`h-16 md:hidden`)
- **반응형 디자인**:
  - 모바일 우선 접근: 터치 영역 최소 44x44px (실제 구현: 88x88px)
  - 하단 네비게이션 높이: 64px (`h-16`)
  - 스크롤 성능 최적화: `contain: 'layout style paint'`, `willChange: 'transform'`
  - 터치 최적화: `touchAction: 'manipulation'`
- **접근성**:
  - 키보드 네비게이션: Tab, Enter/Space 키 지원 (`onKeyDown` 핸들러)
  - 스크린리더: `aria-label`, `aria-labelledby`, `aria-current`, `role` 속성
  - 포커스 표시: `focus-visible:ring-2 focus-visible:ring-teal-500`
  - 색상 대비: WCAG AA 기준 준수 (4.5:1)
  - 스크린리더 전용 텍스트: `sr-only` 클래스 사용
- **성능 최적화**:
  - 이미지 lazy loading: Next.js Image 컴포넌트 사용
  - 코드 스플리팅: 각 섹션별 동적 import (`React.lazy`, `Suspense`)
  - API 호출 최적화: 병렬 요청, 캐싱
  - 스크롤 성능: `willChange`, `backfaceVisibility`, `contain` 속성 적용
  - Lighthouse 성능 점수: 90점 이상 목표

#### 7.9. 어제 건강 맞춤 식단 가족 탭 동작

- **데이터 계약**
  - `GET /api/family/diet/[date]?scope=previous` 응답에 `memberTabs[]`(id, name, included, healthFlags), `nutrientTotals`(kcal, carb, protein, fat), `exclusionNotes[]` 필드를 포함합니다.
  - `memberTabs[].healthFlags`에는 질병, 알레르기, 사용자 정의 메모가 담겨 탭 하단 설명란에 그대로 노출됩니다.
- **UI 흐름**
  - "전체" 기본 탭 + 구성원별 탭을 가로 스크롤로 배치하고, 토글은 탭 헤더 우측에 배치합니다.
  - On/Off 전환 시 Optimistic 업데이트 → `/api/family/members/[id]/toggle-unified` PATCH 호출 → 실패 시 이전 상태로 롤백하고 토스트/로그를 출력합니다.
  - 탭 콘텐츠에는 선택된 구성원이 먹을 수 있는 메뉴 카드(칼로리, 탄/단/지)를 보여주고, 하단 "특이 사항" 박스에 제외 음식·대체 조리법을 요약합니다.
- **로그 및 접근성**
  - 주요 상호작용마다 `console.group('[FamilyDietTabs]')` + 이벤트명(`tab-change`, `toggle`, `note-expand`)과 payload를 기록합니다.
  - 탭/토글은 모두 키보드 포커스 가능해야 하며, `aria-controls`, `aria-pressed` 속성을 통해 스크린리더가 현재 포함 상태를 읽을 수 있도록 합니다.
  - 포함 인원/영양 합산 패널은 표 구조(`<table>`)를 사용해 스크린리더 친화적으로 제공하고, 합산 기준(온 상태 구성원) 설명을 시각적으로 함께 표기합니다.

#### 7.10. 홈페이지 챕터 구조 시스템

- **아키텍처**: 홈페이지의 여러 섹션을 논리적으로 두 개의 챕터로 재구성
  - **챕터 1: 레시피 & 식단 아카이브** (`/chapters/recipes-diet`)
    - 현대 레시피, 궁중 레시피, 건강 맞춤 식단, 주간 식단, 마카의 음식 동화 통합
    - 건강 시각화 대시보드 미리보기 포함
  - **챕터 2: 건강 관리 현황** (`/chapters/health`)
    - 가족 건강 대시보드, 건강 트렌드, 건강 알림, 건강 시각화 대시보드 통합
- **메인 화면 미리보기**: `components/home/chapter-preview.tsx`
  - 챕터별 미리보기 카드 제공
  - "전체보기" 링크로 각 챕터 페이지로 이동
  - 반응형 레이아웃 (데스크톱 2열, 태블릿 2열, 모바일 1열)
- **페이지 구조**:
  - `app/chapters/recipes-diet/page.tsx`: 챕터 1 전체 페이지
  - `app/chapters/health/page.tsx`: 챕터 2 전체 페이지
  - 각 페이지는 섹션별로 `Suspense`와 `ErrorBoundary`로 감싸서 독립적으로 로딩
- **네비게이션 통합**: 
  - 홈페이지에서 챕터 미리보기 섹션 제공
  - Navbar에서 "레시피북" → 챕터 1, "건강관리" → 챕터 2로 이동

#### 7.11. 건강 시각화 시스템

- **시각화 컴포넌트** (`components/health/visualization/`):
  - `HealthDashboard.tsx`: 건강 종합 대시보드 (모든 시각화 통합)
  - `HealthMetricsCard.tsx`: 건강 지표 카드 (BMI, 체지방률, 근육량, 기초대사율, 건강 점수)
  - `NutritionBalanceChart.tsx`: 영양 균형 도넛 차트 (탄수화물/단백질/지방 비율, 비타민/미네랄 레벨)
  - `MealImpactPredictor.tsx`: 식단 효과 예측 (식사 전/후 비교, 목표 달성률, 영양소 개선량)
  - `DiseaseRiskGauge.tsx`: 질병 위험도 게이지 (심혈관, 당뇨, 신장 질병 위험도)
  - `HealthInsightsCard.tsx`: 건강 인사이트 카드 (우선순위별 인사이트, 실행 가능한 추천사항)
- **API 엔드포인트**:
  - `GET /api/health/metrics`: 현재 건강 상태 계산
    - 건강 메트릭스 (BMI, 체지방률, 근육량, 기초대사율)
    - 질병 위험도 평가 (심혈관, 당뇨, 신장)
    - 전체 건강 점수 계산 (0-100)
  - `GET /api/health/meal-impact`: 식단 효과 예측
    - 식사 섭취 시뮬레이션
    - 영양소별 개선량 계산
    - 목표 달성률 계산
- **타입 정의**: `types/health-visualization.ts`
  - `HealthMetrics`, `MealImpactPrediction`, `HealthInsight`, `NutritionBalance`, `DiseaseRiskScores` 인터페이스
  - 시각화 컴포넌트용 설정 및 데이터 포맷 표준화
- **통합 위치**:
  - 홈페이지: `components/home/health-visualization-preview.tsx` (컴팩트 버전)
  - 챕터 1: 건강 맞춤 식단 섹션에 시각화 미리보기
  - 챕터 2: 건강 관리 현황에 시각화 대시보드 통합
  - 식단 상세 페이지: 식단 효과 예측 표시

---

### 9. 참고 문서

- **상세 구현 계획서**: 
  - [implementation-plan-family-diet.md](./implementation-plan-family-diet.md) — 가족 식단 세부 로드맵
  - [implementation-plan-homepage-ui-ux.md](./implementation-plan-homepage-ui-ux.md) — 홈페이지 UI/UX 개선 상세 계획
  - [home-chapter-layout-design.md](./home-chapter-layout-design.md) — 홈페이지 챕터 구조 레이아웃 구상도
- **UI/UX 분석 문서**: [ui-ux-analysis-baemin.md](./ui-ux-analysis-baemin.md) — 배달의민족 앱 UI/UX 분석 및 적용 방안
- **건강 시각화 문서**:
  - [health-visualization-implementation-summary.md](./health-visualization-implementation-summary.md) — 건강 시각화 기능 구현 완료 요약
  - [health-visualization-verification-report.md](./health-visualization-verification-report.md) — 건강 시각화 검증 보고서
- **개발 TODO 리스트**: [TODO.md](./TODO.md)

---

혹시 이 PRD에서 **가장 중요하게 생각하는 기능(A, B, C 중)**이 무엇인지 알려주시면, 해당 기능을 먼저 개발하기 위한 **구체적인 사용자 스토리**를 작성해 드릴 수 있습니다.