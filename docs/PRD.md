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
| **작성일** | 2025년 11월 (가상) |
| **제품 비전** | 시대와 세대를 아울러 모든 요리 지식을 통합하고 보존하며, 데이터 기반의 건강한 식생활을 제안하고 요리 창작자의 상업적 활동을 지원하는 세계 최고의 요리 전문 아카이브. |
| **핵심 목표 (MVP 기준)** | 레거시 콘텐츠 뷰어 및 현대 레시피 검색 기능 안정화 및 초기 사용자 5,000명 확보. |

---

### 2. 사용자 정의 (User Persona)

본 서비스의 핵심 사용자는 다음 세 그룹으로 정의합니다.

| 사용자 그룹 | 주요 동기 | 핵심 요구 사항 |
| :--- | :--- | :--- |
| **A. 전통/향토 요리 학습자** | 구전으로만 전해지는 희귀 레시피나 조리법에 대한 정확한 기록 및 지식 습득. | 신뢰성 있는 출처의 고품질 영상 및 문서 콘텐츠 (레거시 아카이브) |
| **B. 건강 관리 식단 사용자** | 본인의 건강 상태(질병, 알레르기)와 목표에 맞는 맞춤형 식단 추천 및 간편한 식자재 구매. | AI 기반 맞춤 식단 추천 및 식자재 연동 (AI 큐레이션) |
| **C. 일반 요리/창작자** | 쉽고 빠르게 따라 할 수 있는 현대적 레시피 검색, 자신의 레시피 공유 및 수익 창출 기회. | 초보자 맞춤 단계별 가이드, UGC 커뮤니티 및 상업화 인증 기회 (현대 레시피 북) |

---

### 3. 기능 요구 사항 (구현 완료 기준)

아래 표는 2025년 11월 27일 기준으로 실제 서비스에 반영된 기능을 정리한 것입니다.

#### 3.1. 📜 레거시 아카이브

| ID | 기능명 | 구현 요약 | 세부 사항 |
| :--- | :--- | :--- | :--- |
| **A-1** | 명인 인터뷰 뷰어 | HD 이상 영상 스트리밍과 프리미엄 구독 시 광고 없이 시청. | `components/legacy/legacy-archive-section.tsx`, `legacy-video-cta.tsx` |
| **A-2** | 전문 문서화 기록 | 영상과 연계된 레시피, 도구, 출처를 문서 카드로 제공. | `components/legacy/legacy-archive-client.tsx` |
| **A-3** | 아카이브 분류 검색 | 지역/시대/재료 필터 및 검색어 조합 지원. | `/legacy` 페이지 + 통합 검색 (`app/search`) |
| **A-4** | 대체재료 안내 | 전통 재료 옆에 현대 대체재 및 구입처 안내. | 카드 내 대체 정보 컴포넌트 |

#### 3.2. 🍴 현대 레시피 북

| ID | 기능명 | 구현 요약 | 세부 사항 |
| :--- | :--- | :--- | :--- |
| **B-1** | 단계별 레시피 카드 | 사진/텍스트/영상 단계를 카드로 제공, 타이머·체크리스트 포함. | `components/recipes/recipe-detail-client.tsx`, 타이머/체크리스트 훅 |
| **B-2** | 레시피 업로드 (UGC) | 레시피 작성 시 썸네일 자동 배정, 재료/단계/난이도 필수 입력. | `/recipes/new`, `actions/recipe-create.ts` |
| **B-3** | 커뮤니티 평가 | 별점(0.5 단위), 저작권/불량 신고 기능 구현. | 댓글 기능은 범위에서 제외됨. 신고 데이터는 관리자 뷰에서 확인 가능. |

#### 3.3. 🧠 AI 기반 개인 맞춤 식단

| ID | 기능명 | 구현 요약 | 세부 사항 |
| :--- | :--- | :--- | :--- |
| **C-1** | 건강 정보 입력 고도화 | 질병·알레르기 상세 입력(사용자 정의 가능), 선호/비선호 식재료, 프리미엄 식단 타입 설정. | `/health/profile`, `health-api` 라우트, `HealthProfileForm` |
| **C-2** | AI 맞춤 식단 추천 | Mifflin-St Jeor 공식 기반 칼로리 계산(수동 설정 가능), 3대 영양소 규칙 기반 일일 식단 자동 생성. | `lib/diet/calorie-calculator.ts`, `lib/diet/recommendation.ts` |
| **C-3** | 주간 식단 추천 시스템 | 7일치 식단을 한 번에 생성하여 주간 식단 계획 및 장보기 리스트 제공. | `lib/diet/weekly-diet-generator.ts`, `app/(dashboard)/diet/weekly/page.tsx` |
| **C-5** | 식자재 원클릭 구매 | 추천 식단의 재료 리스트를 외부 마켓 링크로 연결. | `components/diet/meal-card.tsx` |
| **C-6** | 가족 구성원 관리 | `family_members` 테이블, CRUD API, UI 완비. 나이 기반 `is_child` 자동 설정. | `/health/family` 페이지, `types/family.ts` |
| **C-6.1** | 통합 식단 포함/제외 제어 | 구성원별 `include_in_unified_diet` 토글 및 PATCH 엔드포인트 제공. | `components/family/unified-diet-section.tsx` |
| **C-7** | 가족 맞춤 식단 추천 | 개인/통합 식단 동시 생성, 토글 상태 반영, 결과 UI 제공. | `components/family/family-diet-view.tsx` |
| **C-7.1** | AI 맞춤 식단 탭 | “어제의 AI 맞춤 식단” 옆에 사용자 + 가족 이름 탭 배치, On/Off 스위치 제공. | `components/diet/family-diet-tabs.tsx` |
| **C-8** | 엄격한 알레르기 필터링 | 질병별 제외 음식뿐만 아니라, 알레르기 유발 재료의 파생 재료(예: 새우 -> 새우젓, 김치)까지 엄격하게 필터링. | `lib/diet/food-filtering.ts` (ALLERGY_DERIVED_INGREDIENTS) |
| **C-9** | 질병관리청 예방접종/독감 알림 | 질병관리청 공개 데이터를 동기화하여 독감 유행 단계와 예방접종 일정 알림. | `app/api/health/kcdc/*` |
| **C-10** | 앱 상태 팝업 인프라 | 공통 팝업 컴포넌트 및 QA 체크리스트 정의. | `components/diet/diet-notification-popup.tsx` |
| **C-11** | 즐겨찾기 식단 저장 | 식단 카드에 즐겨찾기 버튼 추가, 프리미엄 사용자 무제한 저장. | `components/diet/favorite-button.tsx` |
| **C-12** | 밀키트 식단 기능 | 쿠팡 파트너스 API 연동(시뮬레이션), 밀키트 옵션 토글. | `lib/diet/meal-kit-service.ts` |
| **C-13** | 특수 식단 타입 (다중 선택) | 도시락, 헬스, 저탄수, 비건/베지테리언 식단 필터링. | `lib/diet/special-diet-filters.ts` |
| **C-14** | 도시락 반찬 위주 식단 | 보관이 용이한 반찬 중심 식단 추천. | `bento` 필터 |
| **C-15** | 헬스인 닭가슴살 위주 식단 | 고단백 저지방 닭가슴살 중심 식단. | `fitness` 필터 |
| **C-16** | 다이어트 저탄수화물 식단 | 탄수화물 제한 식단. | `low_carb` 필터 |
| **C-17** | 비건/베지테리언 식단 | 동물성 식품 제외 식단. | `vegan`, `vegetarian` 필터 |
| **C-18** | 응급 조치 및 안전 경고 | 알레르기 반응 시 응급 대처법(에피네프린 등) 안내 페이지 및 식단 내 안전 경고 문구 표시. | `/health/emergency`, `components/diet/safety-warning.tsx` |

#### 3.3.1. 🏥 건강정보 관리 시스템 대폭 강화 (문서 기반 구현)

| ID | 기능명 | 구현 요약 | 세부 사항 |
| :--- | :--- | :--- | :--- |
| **C-19** | 질병 마스터 데이터 시스템 | 12개 주요 질병 (당뇨, 심혈관, CKD, 통풍, 위장, 임신 관련)에 대한 마스터 데이터 및 질병별 제외 음식 관리. | `diseases`, `disease_excluded_foods_extended` 테이블 |
| **C-20** | 알레르기 마스터 데이터 시스템 | 8대 주요 알레르기 + 특수 알레르기 (니켈, 아황산염, 히스타민, 셀리악, FDEIA) 마스터 데이터 관리. | `allergies` 테이블 |
| **C-21** | 알레르기 파생 재료 추적 | 알레르기 유발 재료의 모든 파생 재료 추적 (예: 새우 → 새우젓, 김치, 해물 육수). 엄격한 필터링 모드. | `allergy_derived_ingredients` 테이블, `lib/health/allergy-manager.ts` |
| **C-22** | 다중 칼로리 계산 공식 지원 | Mifflin-St Jeor, Harris-Benedict, EER (어린이), 임신부 공식 등 연령대별 최적 공식 자동 선택. | `calorie_calculation_formulas` 테이블, `lib/health/calorie-calculator-enhanced.ts` |
| **C-23** | 칼로리 계산 공식 표시 | 사용자가 선택한 공식의 수식과 계산 과정을 화면에 표시하여 투명성 제공. | `components/health/calorie-calculator-display.tsx` |
| **C-24** | 질병별 칼로리 자동 조정 | 당뇨, 비만 등 질병 보유 시 칼로리 자동 감량. 최소 안전 칼로리 보장 (여성 1200kcal, 남성 1500kcal). | `lib/health/disease-manager.ts` |
| **C-25** | 수동 목표 칼로리 설정 | 사용자가 계산된 칼로리 대신 직접 목표 칼로리를 설정할 수 있는 옵션. | `health_profiles.manual_target_calories` |
| **C-26** | 질병 선택 UI (다중 + 사용자 정의) | 카테고리별 질병 선택 (대사, 심혈관, 소화기, 신장, 통풍) + 사용자 정의 질병 입력. | `components/health/disease-selector.tsx` |
| **C-27** | 알레르기 선택 UI (8대 + 특수 + 사용자 정의) | 8대 주요 알레르기, 특수 알레르기, 사용자 정의 알레르기 입력 지원. | `components/health/allergy-selector.tsx` |
| **C-28** | 선호/비선호 식재료 관리 | 사용자가 선호하는 식재료와 비선호하는 식재료를 입력하여 식단 생성 시 반영. | `health_profiles.preferred_ingredients`, `excluded_ingredients` |
| **C-29** | 프리미엄 식단 타입 확장 | 도시락 (반찬 위주), 헬스인 (고단백), 다이어트 (저탄수), 비건, 베지테리언 식단 필터. | `lib/diet/premium-diet-filters.ts` |
| **C-30** | 질병별 제외 음식 필터링 | 당뇨 환자는 설탕/주스 제외, 고혈압 환자는 라면/찌개 제외, CKD 환자는 바나나/시금치 제외 등. | `lib/health/disease-manager.ts` |
| **C-31** | 알레르기 엄격 모드 필터링 | 레시피의 모든 재료, 소스, 조미료에서 알레르기 유발 재료 및 파생 재료 검사. | `lib/health/allergy-manager.ts` |
| **C-32** | 안전 경고 시스템 | 불확실한 재료 정보가 있는 경우 "섭취 전 재료명 확인" 안내 문구 표시. | `components/health/safety-warning.tsx` |
| **C-33** | 응급조치 정보 데이터베이스 | 아나필락시스, 경증 반응 등 알레르기별 응급조치 정보 저장. | `emergency_procedures` 테이블 |
| **C-34** | 에피네프린 사용법 안내 | 에피네프린 자가주사기 사용법 단계별 안내 (4단계: 안전 캡 제거 → 투여 부위 확인 → 주사 및 유지 → 제거 및 마사지). | `/health/emergency/epinephrine` |
| **C-35** | 알레르기별 응급조치 상세 페이지 | 특정 알레르기에 대한 상세 응급조치, 위험 신호 인식, 119 신고 시기 안내. | `/health/emergency/[allergyCode]` |
| **C-36** | 질병 관리 API | 질병 목록 조회, 질병 상세 정보, 제외 음식 목록 조회 API. | `GET /api/health/diseases`, `GET /api/health/diseases/[code]` |
| **C-37** | 알레르기 관리 API | 알레르기 목록 조회, 파생 재료 조회 API. | `GET /api/health/allergies`, `GET /api/health/allergies/[code]/derived` |
| **C-38** | 칼로리 계산 API | 다중 공식 지원 칼로리 계산 API (공식 설명 포함). | `POST /api/health/calculate-calories` |
| **C-39** | 응급조치 정보 API | 알레르기별 응급조치 정보 조회 API. | `GET /api/health/emergency/[allergyCode]` |
| **C-40** | 건강정보 입력 폼 대폭 개선 | 질병, 알레르기, 선호 식재료, 프리미엄 식단 타입, 칼로리 계산 방식 등 모든 건강 정보를 한 화면에서 입력. | `components/health/health-profile-form.tsx` (확장) |
| **C-41** | 식단 생성 로직 통합 | 질병, 알레르기, 선호도, 프리미엄 타입, 칼로리 계산 결과를 모두 반영한 통합 식단 생성. | `lib/diet/recommendation.ts` (확장) |

> **비고:** GI 지수 필터, 영양 리포트, 일일 알림 팝업, 어린이 성장기 식단 등은 현재 제품 범위에서 제외되어 본 문서에서도 제거했습니다. 필요 시 별도 백로그 문서로 관리합니다.

#### 3.4. 🛠 관리자 페이지

| ID | 기능명 | 구현 요약 | 세부 사항 |
| :--- | :--- | :--- | :--- |
| **D-1** | 관리자 콘솔 베타 | `/admin` 경로에 기본 레이아웃을 제공하고, 페이지 내 텍스트/공지/팝업 콘텐츠를 수정하거나 일괄 배포할 수 있는 에디터와 권한 체크를 탑재합니다. | `app/admin/layout.tsx`, `components/admin/*` |
| **D-2** | 홈페이지 콘텐츠 관리 | 홈페이지의 모든 하드코딩된 텍스트, 링크, 이미지 URL을 관리자 페이지에서 쉽게 수정할 수 있도록 데이터베이스 기반 콘텐츠 관리 시스템을 구축합니다. | `actions/admin/copy/slots.ts`, `lib/admin/copy-reader.ts`, `components/home/*`, `components/footer.tsx` |

#### 3.5. 🎨 홈페이지 UI/UX 개선 (배달의민족 앱 참고)

| ID | 기능명 | 구현 요약 | 세부 사항 |
| :--- | :--- | :--- | :--- |
| **E-1** | 상단 고정 헤더 | 검색바와 프리미엄 배너를 상단에 고정하여 스크롤해도 항상 접근 가능하도록 합니다. 청록색 배너, 검색바 포커스 애니메이션, 키보드 네비게이션 지원. | `components/home/fixed-header.tsx`, `premium-banner.tsx`, `search-bar.tsx` ✅ 완료 |
| **E-2** | 바로가기 메뉴 | 주요 기능(레거시, 레시피, AI 식단 등)을 아이콘 그리드 형태로 제공하여 빠른 접근을 가능하게 합니다. 반응형 그리드, 호버 효과, 접근성 지원. | `components/home/quick-access-menu.tsx` ✅ 완료 |
| **E-3** | 하단 네비게이션 | 모바일 환경에서 주요 페이지로의 쉬운 이동을 위한 고정 네비게이션 바를 제공합니다. 현재 페이지 하이라이트, 키보드 네비게이션 지원. | `components/layout/bottom-navigation.tsx` ✅ 완료 |
| **E-4** | 주간 식단 요약 | 홈 화면에 이번 주 식단을 한눈에 볼 수 있는 요약 섹션을 제공합니다. 7일 캘린더 미리보기와 총 칼로리 표시를 포함합니다. | `components/home/weekly-diet-summary.tsx` ✅ 완료 |
| **E-5** | 자주 구매하는 식자재 | 사용자의 주간 식단 기반으로 자주 구매하는 식자재를 추천하고, 원클릭 장바구니 추가 기능을 제공합니다. | `components/home/frequent-items-section.tsx`, `app/api/shopping/frequent-items/route.ts` ✅ 완료 |

---

### 4. 비기능 요구 사항 (Non-Functional Requirements)

제품의 품질과 안정성을 위한 요구 사항입니다.

| 구분 | 요구 사항 내용 | 대응 전략 |
| :--- | :--- | :--- |
| **성능/속도** | 모든 레시피 검색 결과는 **3초 이내**에 사용자에게 표시되어야 합니다. | 클라우드 기반 미디어 저장소(A-5) 및 CDN 도입. |
| **보안** | 개인 건강 정보(C-1) 및 결제 정보는 **최고 수준으로 암호화**되어 보관되어야 합니다. | 「개인정보보호법」 준수 및 보안 전문가 투입. |
| **접근성** | 모든 페이지는 **모바일 환경(iOS/Android)에서 가장 편리하게** 작동하도록 반응형 웹 디자인을 우선 적용합니다. | 초기 개발 전략: 반응형 디자인 우선 적용. |
| **신뢰성** | AI 추천 결과 및 영양 정보(C-2, C-3, C-4)는 **전문 영양사의 검수(QC)를 통과**해야 합니다. | AI 검증 체계 구축 (6.6 리스크 대응 전략). |
| **법적 준수** | 마켓플레이스 운영 시 모든 판매자는 **식품 영업 신고증**을 제출해야 합니다. | 6.1 식품 위생 및 6.2 전자상거래 법규 준수 의무화. |

---

### 5. 출시 현황 및 후속 로드맵

#### 5.1. 현재 배포된 MVP 범위

| 목표 | 포함된 기능 |
| :--- | :--- |
| **콘텐츠 뷰어 안정화** | A-1, A-2, A-3, A-4 |
| **현대 레시피 경험** | B-1, B-2, B-3(별점·신고) |
| **AI 식단 기초** | C-1, C-2, C-3, C-5 |
| **가족 맞춤 기능** | C-6, C-6.1, C-7, C-8 |
| **프리미엄 식단 고급 기능** | C-11, C-12, C-13, C-14, C-15, C-16, C-17 |
| **홈페이지 UI/UX 개선** | E-1, E-2, E-3, E-4, E-5 (계획 중) |

#### 5.2. 후속 고려 대상

- GI 지수/저염 필터, 영양 리포트 등 정교화 기능 (과거 C-3, C-4)
- 일일 식단 알림 팝업 및 브라우저 알림 (과거 C-9)
- 어린이 전용 성장기 식단 고도화 (과거 C-10)
- 창작자 상업화/마켓 관련 기능 (과거 B-4, B-5)

위 기능들은 현재 제품 범위에서는 제외되었으며, 재개가 필요할 경우 별도 백로그에서 스펙을 재정의합니다.

---

### 6. 면책 및 법적 고지 (Disclaimer & Legal Notices)

모든 서비스 영역에서 다음 내용을 **명확하게 고지**하고 이용약관에 포함해야 합니다.

* **의료 면책 조항 (6.6):** "본 서비스는 **건강 관리 보조 수단**이며, 전문적인 진료 및 치료 행위를 대신하지 않습니다. 질병 관련 내용은 반드시 의사 또는 전문 영양사와 상담하십시오."
* **통신판매 중개자 고지 (6.4):** 플랫폼은 통신판매 중개자로서, 식품의 위생, 품질, 제조/생산에 대한 **1차적인 법적 책임은 판매자/생산자에게 있음**을 명시합니다.

---

### 7. 기술적 구현 세부사항 (Technical Implementation Details)

#### 7.1. 데이터베이스 스키마

**가족 구성원 테이블 (`family_members`)**
- 각 가족 구성원의 건강 정보를 독립적으로 저장
- `is_child` 플래그: 나이 0-18세 자동 판단
- `user_id`: 가족의 주 사용자 (본인)

**질병별 제외 음식 테이블 (`disease_excluded_foods`)**
- 질병별로 피해야 할 음식 목록 관리
- `excluded_food_type`: 'ingredient' (재료) 또는 'recipe_keyword' (레시피 키워드)
- 초기 데이터: 당뇨/고혈압 제외 음식 목록 사전 등록

**가족 식단 테이블 (`family_diet_plans`)**
- 구성원별 개인 식단 및 통합 식단 저장
- `family_member_id`: NULL이면 통합 식단
- `is_unified`: 통합 식단 여부 플래그

**식단 알림 설정 테이블 (`diet_notification_settings`)**
- 사용자별 알림 설정 관리
- 팝업 알림, 브라우저 알림 활성화/비활성화
- 마지막 알림 날짜 저장 (중복 방지)

#### 7.2. 알고리즘 로직

**엄격한 알레르기 필터링 (Strict Allergy Filtering)**
1. 사용자의 알레르기 정보 조회
2. `ALLERGY_DERIVED_INGREDIENTS` 매핑 테이블을 통해 파생 재료 확인 (예: 새우 -> 새우젓, 김치, 해물 육수)
3. 레시피 제목 및 재료 목록에서 원재료 및 파생 재료 키워드 검색
4. 매칭되는 항목이 하나라도 있으면 해당 레시피 제외 (안전 최우선)

**칼로리 계산 로직 (Calorie Calculation)**
1. **BMR 계산**: Mifflin-St Jeor 공식 사용 (성별, 체중, 신장, 나이 고려)
   - 남자: (10 × 체중) + (6.25 × 키) - (5 × 나이) + 5
   - 여자: (10 × 체중) + (6.25 × 키) - (5 × 나이) - 161
2. **활동 대사량(TDEE)**: 활동량 계수(1.2 ~ 1.9) 곱하기
3. **목표 칼로리 조정**:
   - 질병(당뇨, 비만) 보유 시 자동 감량
   - 프리미엄 다이어트 모드 시 15% 감량
   - 사용자 수동 설정 시 해당 값 우선 사용
4. **최소 칼로리 보장**: 성인 기준 최소 1200kcal(남성 1500kcal) 미만으로 떨어지지 않도록 안전장치 적용

**질병별 제외 음식 필터링**
1. 사용자의 질병 정보 조회
2. 각 질병별 제외 음식 목록 조회 (데이터베이스)
3. 레시피의 제목, 설명, 재료 목록에서 제외 음식 키워드 검색
4. 매칭되면 해당 레시피 제외

**어린이 식단 추천**
1. 나이 0-18세 자동 감지
2. 영양소 비율 목표 설정 (탄수화물 50%, 단백질 20%, 지방 30%)
3. 식사별 칼로리 분배 (아침 25%, 점심 35%, 저녁 30%, 간식 10%)
4. 영양소 비율을 고려한 레시피 점수 계산 및 선택

**복합 가족 식단 생성**
1. 각 구성원별 개인 식단 생성
   - 구성원의 질병, 알레르기, 선호도 고려
   - 어린이는 성장기 식단 로직 적용
2. 통합 식단 생성
   - 모든 구성원의 제약 조건을 동시에 만족하는 레시피만 선택
   - 평균 칼로리 목표 사용

**특수 식단 필터링**
1. 사용자의 `dietary_preferences` 배열 확인
2. 각 식단 타입별 필터 함수 적용:
   - 도시락(bento): 반찬 위주, 밥/국 제외
   - 헬스인(fitness): 닭가슴살 포함, 고단백 저지방
   - 다이어트(low_carb): 탄수화물 30g 이하, 주식 제외
   - 비건(vegan): 모든 동물성 식품 제외 (고기, 해산물, 유제품, 계란 등)
   - 베지테리언(vegetarian): 육류와 생선 제외
3. 모든 선택된 식단 타입을 만족하는 레시피만 선택 (AND 조건)

#### 7.3. 크론 작업

**실행 시간**: 매일 오후 6시 (18:00 KST)

**동작 흐름**:
1. 모든 활성 사용자 조회
2. 각 사용자의 가족 구성원 조회
3. **일일 식단 생성** (다음 날)
   - 가족 구성원이 있으면: 가족 식단 생성
   - 가족 구성원이 없으면: 본인 건강 정보로 AI 식단 생성
   - AI 추천 로직 사용 (`generateAndSaveDietPlan`)
4. **주간 식단 생성** (일요일 오후 6시에만 실행)
   - 다음 주 월요일부터 7일치 식단 생성
   - AI 식단 로직 반영 (개인/가족 식단 자동 적용)
   - 레시피 다양성 강화 (주간 내 중복 최소화)
     - 다양성 수준에 따른 중복 허용 범위: high(1회), medium(2회), low(3회)
     - 주간 레시피 사용 빈도 추적 및 통계
   - 장보기 리스트 및 영양 통계 자동 생성
5. 데이터베이스에 저장

**생성 시점**:
- 전날 오후 6시에 생성하여 사용자가 재료 확인 및 구매할 시간 확보
- 일일 식단: 매일 오후 6시에 다음 날 식단 생성
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
- **클라이언트 폴백**: `getRecipeImageUrlEnhanced()`가 상세/카드/AI 식단 컴포넌트 전반에서 동일한 우선순위(썸네일 → 특정 매핑 → 카테고리 SVG)를 적용해 항상 이미지를 노출합니다.
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
- **핵심 모듈** (✅ Phase 0-4 완료):
  - **"페이지 문구 편집" 패널**: JSON 블록 CRUD, 버전 히스토리, diff 비교, 미리보기 모달
  - **"팝업 공지" 패널**: 팝업 CRUD, 배포/배포취소, 우선순위/세그먼트 관리, 미리보기 모달
  - **"알림 로그" 패널**: KCDC/식단 팝업 로그 조회, 필터링/검색, JSON 상세 Drawer
  - **"보안 설정" 패널**: 비밀번호 변경/2FA/세션 관리/보안 감사 로그
- **데이터베이스**: `admin_copy_blocks`, `popup_announcements`, `notification_logs`, `admin_security_audit` 테이블
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
- **고정 헤더**:
  - `components/home/fixed-header.tsx`: 검색바와 프리미엄 배너를 포함하는 고정 헤더
  - `position: sticky`, `top: 0`, `z-index: 50` 설정
  - 배경색 흰색, 그림자 효과로 다른 콘텐츠와 구분
- **프리미엄 배너**:
  - `components/home/premium-banner.tsx`: 청록색 배경(`bg-teal-500`), 흰색 텍스트
  - 클릭 시 `/pricing` 페이지로 이동
  - 텍스트: "프리미엄 결제 혜택을 받아보세요"
- **바로가기 메뉴**:
  - `components/home/quick-access-menu.tsx`: 8개 주요 기능을 아이콘 그리드로 제공
  - 반응형 그리드: 모바일 4열, 태블릿 5열, 데스크톱 6-8열
  - 각 아이템별 고유 색상 (Tailwind 클래스)
  - 호버/터치 효과: `hover:scale-105`, `active:scale-95`
- **하단 네비게이션**:
  - `components/layout/bottom-navigation.tsx`: 5개 메뉴 (홈, 레시피, 찜, 식단, 마이)
  - `position: fixed`, `bottom: 0` (모바일에서만 표시)
  - 현재 페이지 하이라이트: 활성 색상 `text-teal-600`
- **주간 식단 요약**:
  - `components/home/weekly-diet-summary.tsx`: 7일 캘린더 미리보기 및 총 칼로리 표시
  - 배경: 그라데이션 (`from-teal-50 to-blue-50`)
  - "전체보기" 링크로 `/diet/weekly` 페이지로 이동
- **자주 구매하는 식자재**:
  - `components/home/frequent-items-section.tsx`: 사용자의 주간 식단 기반 재료 추천
  - API: `GET /api/shopping/frequent-items` (인증 필요)
  - 최근 4주간의 주간 식단에서 재료 빈도순 집계, 상위 8개 반환
  - 원클릭 장바구니 추가 기능
- **반응형 디자인**:
  - 모바일 우선 접근: 터치 영역 최소 44x44px
  - 하단 네비게이션 높이: 64px (h-16)
  - 스크롤 성능: 60fps 유지 목표
- **접근성**:
  - 키보드 네비게이션: Tab, Enter/Space 키 지원
  - 스크린리더: `aria-label`, `aria-current` 속성
  - 색상 대비: WCAG AA 기준 준수 (4.5:1)
- **성능 최적화**:
  - 이미지 lazy loading
  - 코드 스플리팅: 각 섹션별 동적 import
  - API 호출 최적화: 병렬 요청, 캐싱
  - Lighthouse 성능 점수: 90점 이상 목표

#### 7.9. 어제 AI 식단 가족 탭 동작

- **데이터 계약**
  - `GET /api/family/diet/[date]?scope=previous` 응답에 `memberTabs[]`(id, name, included, healthFlags), `nutrientTotals`(kcal, carb, protein, fat), `exclusionNotes[]` 필드를 포함합니다.
  - `memberTabs[].healthFlags`에는 질병, 알레르기, 사용자 정의 메모가 담겨 탭 하단 설명란에 그대로 노출됩니다.
- **UI 흐름**
  - “전체” 기본 탭 + 구성원별 탭을 가로 스크롤로 배치하고, 토글은 탭 헤더 우측에 배치합니다.
  - On/Off 전환 시 Optimistic 업데이트 → `/api/family/members/[id]/toggle-unified` PATCH 호출 → 실패 시 이전 상태로 롤백하고 토스트/로그를 출력합니다.
  - 탭 콘텐츠에는 선택된 구성원이 먹을 수 있는 메뉴 카드(칼로리, 탄/단/지)를 보여주고, 하단 “특이 사항” 박스에 제외 음식·대체 조리법을 요약합니다.
- **로그 및 접근성**
  - 주요 상호작용마다 `console.group('[FamilyDietTabs]')` + 이벤트명(`tab-change`, `toggle`, `note-expand`)과 payload를 기록합니다.
  - 탭/토글은 모두 키보드 포커스 가능해야 하며, `aria-controls`, `aria-pressed` 속성을 통해 스크린리더가 현재 포함 상태를 읽을 수 있도록 합니다.
  - 포함 인원/영양 합산 패널은 표 구조(`<table>`)를 사용해 스크린리더 친화적으로 제공하고, 합산 기준(온 상태 구성원) 설명을 시각적으로 함께 표기합니다.

---

### 8. 참고 문서

- **상세 구현 계획서**: 
  - [implementation-plan-family-diet.md](./implementation-plan-family-diet.md) — 가족 식단 세부 로드맵
  - [implementation-plan-homepage-ui-ux.md](./implementation-plan-homepage-ui-ux.md) — 홈페이지 UI/UX 개선 상세 계획
- **UI/UX 분석 문서**: [ui-ux-analysis-baemin.md](./ui-ux-analysis-baemin.md) — 배달의민족 앱 UI/UX 분석 및 적용 방안
- **개발 TODO 리스트**: [TODO.md](./TODO.md)

---

혹시 이 PRD에서 **가장 중요하게 생각하는 기능(A, B, C 중)**이 무엇인지 알려주시면, 해당 기능을 먼저 개발하기 위한 **구체적인 사용자 스토리**를 작성해 드릴 수 있습니다.