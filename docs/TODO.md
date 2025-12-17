# 맛의 아카이브 (Flavor Archive) 개발 현황 & TODO

> **최종 업데이트: 2025-01-27**  
> PRD/Design 문서와 실제 구현을 교차 검토하여 **구현 완료 기능**과 **남은 우선순위 작업**을 정리했습니다.  
> Supabase MCP를 통해 데이터베이스 스키마를 직접 확인하여 실제 구현 상태를 반영했습니다.  
> 프로젝트 파일 정리 작업 완료 (레거시 파일 삭제, 중복 파일 통합).

---

## ✅ 구현 완료 현황

### 1. 공통 인프라 & 레이아웃

- [x] Next.js 15 + React 19 + Tailwind v4 기반 프로젝트 초기화
- [x] Clerk 인증 및 Supabase 통합
- [x] 글로벌 헤더/푸터, 반응형 레이아웃, 로딩/에러 컴포넌트
- [x] 통합 검색 페이지(`app/search`) 및 홈 히어로 섹션
- [x] 코드 품질 도구 설정 (ESLint, Prettier)

### 2. 📜 레거시 아카이브

- [x] 마카의 음식 동화 (스토리북)
  - [x] 스토리북 플레이어 페이지 (`app/(main)/storybook/page.tsx`)
  - [x] 인터랙티브 방 형태 UI (`components/storybook/storybook-room.tsx`)
  - [x] YouTube 비디오 재생 기능 (`components/storybook/vintage-tv.tsx`)
  - [x] 선물 상자 플레이리스트 (`components/storybook/gift-box.tsx`)
  - [x] 계절별 효과 (크리스마스, 눈 효과 등)
- [x] 명인 인터뷰 뷰어 (HD 스트리밍, 프리미엄 광고 제거)
- [x] 전문 문서 카드(고증 정보, 출처, 도구 안내)
- [x] 지역/시대/재료 필터 + 검색 조합
- [x] 대체 재료/도구 안내 UI
- [x] 레거시 아카이브 섹션 및 카드 그리드 레이아웃

### 3. 🍴 현대 레시피 북

- [x] 궁중 레시피 아카이브
  - [x] 궁중 레시피 블로그 시스템 (`royal_recipes_posts` 테이블)
  - [x] 시대별 분류 (고려, 조선, 삼국시대)
  - [x] 궁중 레시피 상세 페이지 (`app/royal-recipes/*`)
  - [x] 빠른 접근 메뉴 (`components/royal-recipes/royal-recipes-quick-access.tsx`)
- [x] 단계별 레시피 상세(타이머, 체크리스트, 초보자 가이드)
- [x] 레시피 업로드 + 자동 썸네일 할당(`actions/recipe-create.ts`)
- [x] 레시피 카드/검색/정렬 컴포넌트
- [x] 별점 및 신고 기능
- [x] 레시피 업로드 폼 (재료, 난이도, 조리 시간 입력)
- [x] 요리 모드 (Cooking Mode) UI

### 4. 🧠 AI 기반 맞춤 식단

- [x] 결제 및 프리미엄 시스템 (Mock 모드)
  - [x] 프리미엄 구독 시스템 (`app/(main)/pricing/page.tsx`)
  - [x] 결제 처리 (Mock 토스페이먼츠 클라이언트)
  - [x] 프로모션 코드 시스템 (`promo_codes`, `promo_code_uses` 테이블)
  - [x] 구독 관리 페이지 (`app/(main)/account/subscription/page.tsx`)
  - [x] 프리미엄 가드 컴포넌트 (`components/premium/premium-gate.tsx`)
  - [ ] 실제 토스페이먼츠 결제 연동 (현재 Mock 모드)
- [x] 건강 정보 입력 페이지 및 스키마
- [x] 일일 식단 추천(칼로리/3대 영양소 규칙 기반) + 카드 UI
- [x] 일일 식단 자동 생성 크론 작업 (매일 오후 6시, 다음 날 식단 생성)
  - [x] 크론 스케줄 설정 (`vercel.json`: `0 18 * * *`)
  - [x] 개인/가족 식단 자동 생성 로직
  - [x] AI 추천 로직 반영
- [x] 식자재 원클릭 구매(외부 링크 연동)
- [x] 가족 구성원 관리 시스템
  - [x] `family_members` 테이블 및 CRUD API
  - [x] `include_in_unified_diet` 토글 기능
  - [x] 나이 기반 `is_child` 자동 설정 (0-18세)
  - [x] 가족 구성원 카드, 폼, 리스트 UI
- [x] 가족 맞춤/통합 식단 생성
  - [x] 개인 식단 및 통합 식단 알고리즘
  - [x] 복합 가족 식단 생성 로직
  - [x] 가족 식단 뷰어 (`components/family/family-diet-view.tsx`)
  - [x] 개인 식단 탭 (`individual-diet-tabs.tsx`)
  - [x] 통합 식단 섹션 (`unified-diet-section.tsx`)
  - [x] 장바구니 재료 수량 제어 (포함 인원 기반)
- [x] 어제 건강 맞춤 식단 가족 탭
  - [x] 가족 구성원별 탭 UI (`components/health/yesterday-family-tabs.tsx`)
  - [x] 탭별 토글 스위치 (포함/제외 제어)
  - [x] 영양소 합산 및 요약 패널
  - [x] 질병/알레르기 정보 표시
- [x] 질병별 제외 음식 관리
  - [x] `disease_excluded_foods` 테이블
  - [x] 질병별 제외 음식 초기 데이터 (당뇨, 고혈압)
  - [x] 레시피 필터링 로직 통합
- [x] 주간 식단 추천 시스템 (완료)
  - [x] 데이터베이스 스키마 (`weekly_diet_plans`, `weekly_shopping_lists`, `weekly_nutrition_stats`)
  - [x] 주간 식단 생성 알고리즘 (`lib/diet/weekly-diet-generator.ts`)
    - [x] 7일치 식단을 한 번에 고려하여 레시피 중복 최소화
    - [x] 다양성 수준에 따른 중복 허용 범위 설정 (high: 1회, medium: 2회, low: 3회)
    - [x] 주간 레시피 사용 빈도 추적 및 통계
  - [x] 주간 식단 API 엔드포인트 (`/api/diet/weekly/generate`, `/api/diet/weekly/[week]`)
  - [x] 주간 장보기 리스트 통합 (재료 자동 집계)
  - [x] 주간 식단 캘린더 뷰 UI (`components/diet/weekly-diet-calendar.tsx`)
    - [x] 7일간의 식단을 그리드 형식으로 표시
    - [x] 날짜별 식사(아침/점심/저녁/간식) 카드 표시
    - [x] 오늘 날짜 하이라이트
  - [x] 주간 영양 밸런스 차트 (`components/diet/weekly-nutrition-chart.tsx`)
    - [x] 주간 평균 영양소 표시 (칼로리, 탄수화물, 단백질, 지방)
    - [x] 일별 칼로리 섭취량 바 차트
    - [x] 평균 영양소 비율 시각화
  - [x] 장보기 리스트 UI (`components/diet/weekly-shopping-list.tsx`)
    - [x] 카테고리별 재료 그룹화
    - [x] 구매 완료 체크박스 및 진행률 표시
    - [x] 전체 완료/초기화 기능
  - [x] 주간 식단 페이지 (`app/(dashboard)/diet/weekly/page.tsx`)
    - [x] 캘린더/장보기/영양 통계 탭 구성
    - [x] 주간 식단 생성/재생성 버튼
  - [x] 주간 식단 자동 생성 크론 작업 (일요일 오후 6시)
  - [x] 건강 맞춤 식단 로직 반영 (주간 식단도 건강 맞춤 추천 사용)
  - [x] 레시피 다양성 강화 (주간 내 중복 최소화)

### 5. 🍽️ 이미지 자산 관리

- [x] `docs/foodjpg.md` 기반 음식명→이미지 경로 매핑
- [x] `foodImageService` 자동 썸네일 배정
- [x] `getRecipeImageUrlEnhanced()` 통합 폴백 전략
- [x] 관리자용 이미지 모니터링 대시보드
- [x] **Gemini 이미지 생성 파이프라인** (완전 구현)
  - [x] 프롬프트 빌더 시스템 (`lib/image-pipeline/prompt-builder.ts`)
  - [x] 프롬프트 라이브러리 (`prompt-library.ts`)
  - [x] Gemini API 클라이언트 (`lib/gemini/image-client.ts`)
  - [x] 환경 변수 검증 (`env-validation.ts`)
  - [x] 이미지 프로세서 (WebP 변환, 썸네일 생성)
  - [x] Storage 업로더 (Supabase Storage 연동)
  - [x] 응답 파서 (Base64 → Buffer 변환)
  - [x] 데이터베이스 연동
    - [x] `food_images` 테이블
    - [x] `food_image_batches` 테이블
    - [x] 배치 상태 관리 (pending/success/failed)
  - [x] Edge Function 스케줄러 (`supabase/functions/generate-food-images`)
  - [x] 단위 테스트 (프롬프트, 클라이언트, 프로세서, 업로더, 파서, DB)
  - [x] 모니터링 문서 (`docs/image-generation-monitoring.md`)
  - [x] Storage 비용 추적 (`docs/storage-cost-tracking.md`)
  - [x] 에러 핸들링 가이드 (`docs/error-handling-guide.md`)
- [x] Notion 통합 설계 (`docs/notion-food-image-integration.md`)

### 6. 🛠️ 관리자 콘솔 (Admin Console)

- [x] `/admin` 레이아웃 및 네비게이션 (`app/admin/layout.tsx`)
- [x] 관리자 권한 가드 (Clerk `role=admin` 기반)
- [x] Sidebar 레이아웃 (`components/admin/sidebar-layout.tsx`)
- [x] **페이지 문구 편집 모듈** (`/admin/copy`)
  - [x] JSON 블록 CRUD (`components/admin/copy/copy-list-panel.tsx`)
  - [x] 슬롯 셀렉터 (`slot-selector.tsx`)
  - [x] 카피 에디터 (`admin-copy-editor.tsx`)
  - [x] 생성 다이얼로그 (`copy-create-dialog.tsx`)
  - [x] 버전 히스토리 및 diff 비교
  - [x] Server Actions (`actions/admin/copy/`)
- [x] **홈페이지 콘텐츠 관리 시스템**
  - [x] TEXT_SLOTS 확장 (Hero, 빠른 시작 카드, Footer, 섹션 제목/설명, 배경 이미지)
  - [x] 콘텐츠 조회 유틸리티 (`lib/admin/copy-reader.ts`)
    - [x] `getCopyContent()` 함수 (단일 슬롯 조회)
    - [x] `getMultipleCopyContent()` 함수 (병렬 조회)
    - [x] 기본값(fallback) 지원
    - [x] 캐싱 전략 (60초, revalidateTag)
  - [x] 컴포넌트 통합
    - [x] HeroSection: 하드코딩 제거, 데이터베이스에서 읽기
    - [x] Footer: 서버 컴포넌트로 변경, 데이터베이스에서 읽기
    - [x] RecipeSection: 섹션 제목/설명/버튼 텍스트를 데이터베이스에서 읽기
    - [x] DietSection: 섹션 제목/설명을 데이터베이스에서 읽기
    - [x] LegacyArchiveSection: 섹션 제목/설명을 데이터베이스에서 읽기
  - [x] 초기 데이터 마이그레이션 (`supabase/migrations/20251130000000_insert_homepage_default_content.sql`)
- [x] **팝업 공지 관리 모듈** (`/admin/popups`)
  - [x] 팝업 테이블 (`components/admin/popups/popup-table.tsx`)
  - [x] 상세 패널 (`popup-detail-panel.tsx`)
  - [x] 생성 다이얼로그 (`popup-create-dialog.tsx`)
  - [x] 미리보기 모달 (`popup-preview-modal.tsx`)
  - [x] 이미지 업로드 (`image-upload.tsx`)
  - [x] 배포/취소 기능
  - [x] Server Actions (`actions/admin/popups/`)
- [x] **알림 로그 뷰어** (`/admin/logs`)
  - [x] DataTable 기반 로그 뷰어 (`components/admin/logs/notification-logs-viewer.tsx`)
  - [x] 필터링 (타입/상태/날짜/사용자)
  - [x] JSON 상세 Drawer
  - [x] Server Action (`actions/admin/logs/list.ts`)
- [x] **보안 설정 모듈** (`/admin/security`)
  - [x] 비밀번호 변경 패널 (`components/admin/security/password-change-panel.tsx`)
  - [x] MFA 설정 패널 (`mfa-setup-panel.tsx`)
  - [x] 세션 관리 패널 (`session-management-panel.tsx`)
  - [x] 보안 감사 로그 뷰어 (`security-audit-viewer.tsx`)
  - [x] Server Actions (`actions/admin/security/`)
- [x] **프로모션 코드 관리 모듈** (`/admin/promo-codes`)
  - [x] 프로모션 코드 목록 조회 (`components/admin/promo-codes/promo-code-table.tsx`)
  - [x] 프로모션 코드 상세 패널 (`promo-code-detail-panel.tsx`)
  - [x] 프로모션 코드 생성 다이얼로그 (`promo-code-create-dialog.tsx`)
  - [x] 프로모션 코드 수정/삭제 기능
  - [x] Server Actions (`actions/admin/promo-codes/*`)
- [x] **정산 내역 관리 모듈** (`/admin/settlements`)
  - [x] 정산 통계 대시보드 (`components/admin/settlements/settlement-cards.tsx`)
  - [x] 정산 내역 상세 페이지 (`app/admin/settlements/page.tsx`)
  - [x] 결제 방법별 필터링 (카드/현금/프로모션 코드)
  - [x] 기간별 통계 조회
  - [x] Server Actions (`actions/admin/settlements/*`)
- [x] **밀키트 관리 모듈** (`/admin/meal-kits`)
  - [x] 밀키트 제품 목록 조회 (`components/admin/meal-kits/meal-kit-table.tsx`)
  - [x] 밀키트 제품 상세 패널 (`meal-kit-detail-panel.tsx`)
  - [x] 밀키트 제품 생성 다이얼로그 (`meal-kit-create-dialog.tsx`)
  - [x] 밀키트 제품 수정/삭제 기능
  - [x] Server Actions (`actions/admin/meal-kits/*`)
- [x] **레시피 관리 모듈** (`/admin/recipes`)
  - [x] 레시피 목록 조회 및 관리
  - [x] 레시피 일괄 삭제 기능
  - [x] 시드 데이터 생성 기능
  - [x] Server Actions (`actions/admin/recipes/*`)
- [x] **데이터베이스 테이블**
  - [x] `admin_copy_blocks` (페이지 문구)
  - [x] `popup_announcements` (팝업 공지)
  - [x] `popup_images` Storage 버킷
  - [x] `notification_logs` (알림 로그)
  - [x] `admin_security_audit` (보안 감사)
  - [x] `promo_codes` (프로모션 코드)
  - [x] `promo_code_uses` (프로모션 코드 사용 내역)
  - [x] `meal_kits` (밀키트 제품)
  - [x] `meal_kit_products` (쿠팡 API 제품 캐시)
- [x] QA 문서 (`docs/admin-qa.md`)

### 7. 🎨 디자인 시스템

- [x] 색상 팔레트 설정 (주황/빨강, 녹색, 금색)
- [x] Jalnan 폰트 적용
- [x] shadcn/ui 컴포넌트 시스템
- [x] lucide-react 아이콘
- [x] 반응형 디자인 (모바일/태블릿/데스크톱)

### 8. 🔒 보안 및 법적 준수

- [x] Clerk 기반 인증 및 권한 관리
- [x] Next.js XSS, CSRF 기본 방어
- [x] 이용약관 페이지
- [x] 개인정보처리방침 페이지
- [x] 의료 면책 조항 (푸터 및 이용약관)

### 9. 🚀 성능 최적화

- [x] Next.js Image 컴포넌트 적용
- [x] 코드 스플리팅 및 지연 로딩 (Next.js 기본)
- [x] 이미지 프리로딩 구현
- [x] 캐시 전략 (이미지, API)

### 10. 📱 접근성 (Accessibility)

- [x] 모든 이미지에 Alt Text 추가
- [x] 키보드 네비게이션 지원 (shadcn/ui 기본)
- [x] 색상 대비 비율 WCAG AA 기준 준수

### 11. 🏠 홈페이지 챕터 구조

- [x] 챕터 1: 레시피 & 식단 아카이브 페이지 (`app/chapters/recipes-diet/page.tsx`)
  - [x] 현대 레시피 섹션 통합
  - [x] 궁중 레시피 섹션 통합
  - [x] 건강 맞춤 식단 섹션 통합
  - [x] 주간 식단 섹션 통합
  - [x] 마카의 음식 동화 섹션 통합
  - [x] 건강 시각화 대시보드 통합
- [x] 챕터 2: 건강 관리 현황 페이지 (`app/chapters/health/page.tsx`)
  - [x] 건강 시각화 대시보드 통합
  - [x] 가족 건강 대시보드 통합
  - [x] 건강 트렌드 섹션
  - [x] 건강 알림 및 권장사항 섹션
- [x] 챕터 미리보기 컴포넌트 (`components/home/chapter-preview.tsx`)
  - [x] 챕터 1 미리보기 카드
  - [x] 챕터 2 미리보기 카드
  - [x] 전체보기 링크 통합

### 12. 💚 건강 시각화 시스템

- [x] 건강 시각화 타입 정의 (`types/health-visualization.ts`)
- [x] 건강 메트릭스 카드 (`components/health/visualization/HealthMetricsCard.tsx`)
  - [x] BMI, 체지방률, 근육량, 기초대사율 표시
  - [x] 건강 점수 및 상태 등급 표시
- [x] 영양 균형 차트 (`components/health/visualization/NutritionBalanceChart.tsx`)
  - [x] 탄수화물/단백질/지방 비율 도넛 차트
  - [x] 비타민 및 미네랄 레벨 바 차트
- [x] 식단 효과 예측 (`components/health/visualization/MealImpactPredictor.tsx`)
  - [x] 식사 전/후 건강 상태 비교
  - [x] 목표 달성률 링 차트
  - [x] 영양소별 개선량 표시
- [x] 질병 위험도 게이지 (`components/health/visualization/DiseaseRiskGauge.tsx`)
  - [x] 심혈관, 당뇨, 신장 질병 위험도 표시
- [x] 건강 인사이트 카드 (`components/health/visualization/HealthInsightsCard.tsx`)
  - [x] 우선순위별 인사이트 분류
  - [x] 실행 가능한 개선 추천사항
- [x] 건강 종합 대시보드 (`components/health/visualization/HealthDashboard.tsx`)
  - [x] 모든 시각화 컴포넌트 통합
- [x] 건강 시각화 API
  - [x] `/api/health/metrics` - 현재 건강 상태 계산
  - [x] `/api/health/meal-impact` - 식단 효과 예측
- [x] 건강 시각화 미리보기 (`components/home/health-visualization-preview.tsx`)
  - [x] 홈페이지용 컴팩트 버전
  - [x] 챕터 페이지용 전체 버전

---

## ⏳ 진행 중 · 후속 작업

### A. 홈페이지 콘텐츠 관리 후속 작업

- [ ] 관리자 페이지 UI 개선 (배열 편집 전용 UI, 이미지 URL 입력 필드)
- [x] 콘텐츠 변경 이력 추적 및 롤백 기능
- [ ] 다국어 지원 확장 (현재는 'ko'만)

### A-1. 홈페이지 UI/UX 개선 (배달의민족 앱 참고)

- [x] 배달의민족 앱 UI/UX 분석 문서 작성 (`docs/ui-ux-analysis-baemin.md`)
- [x] 상세 구현 계획서 작성 (`docs/implementation-plan-homepage-ui-ux.md`)
- [x] 마카의 음식 동화 섹션 추가 (`components/storybook/storybook-section.tsx`)
  - [x] 스토리북 플레이어 페이지 생성 (`app/(main)/storybook/page.tsx`)
  - [x] 인터랙티브 방 형태 UI (`components/storybook/storybook-room.tsx`)
  - [x] YouTube 비디오 재생 기능 (`components/storybook/vintage-tv.tsx`)
  - [x] 선물 상자 플레이리스트 (`components/storybook/gift-box.tsx`)
  - [x] HeroSection 빠른 시작 카드에 추가
  - [x] 바로가기 메뉴에 추가
- [x] 홈페이지 챕터 구조 레이아웃 설계 (`docs/home-chapter-layout-design.md`)
  - [x] 챕터 1: 레시피 & 식단 아카이브 페이지 구현 (`app/chapters/recipes-diet/page.tsx`)
  - [x] 챕터 2: 건강 관리 현황 페이지 구현 (`app/chapters/health/page.tsx`)
  - [x] 챕터 미리보기 컴포넌트 구현 (`components/home/chapter-preview.tsx`)
  - [x] 건강 시각화 미리보기 컴포넌트 구현 (`components/home/health-visualization-preview.tsx`)

#### Phase 1: 핵심 레이아웃 (1주)

- [x] 고정 헤더 컴포넌트 (`components/home/fixed-header.tsx`)
  - [x] 검색바와 프리미엄 배너 포함 레이아웃
  - [x] `position: sticky`, `top: 0`, `z-index: 50` 설정
  - [x] 배경색 흰색, 그림자 효과
  - [x] 반응형 테스트 (모바일/태블릿/데스크톱)
- [x] 프리미엄 배너 컴포넌트 (`components/home/premium-banner.tsx`)
  - [x] 청록색 배경 (`bg-teal-500`), 흰색 텍스트
  - [x] 오른쪽 화살표 아이콘 (ChevronRight)
  - [x] 클릭 시 `/pricing` 페이지로 이동
  - [x] 호버 효과 (배경색 약간 어둡게)
  - [x] 텍스트: "프리미엄 결제 혜택을 받아보세요"
- [x] 검색바 컴포넌트 개선 (`components/home/search-bar.tsx`)
  - [x] 둥근 모서리, 흰색 배경
  - [x] 플레이스홀더: "레시피, 명인, 재료를 검색해보세요"
  - [x] 검색 아이콘 (오른쪽)
  - [x] 검색어 입력 시 `/search?q={query}`로 이동
  - [x] 엔터 키 입력 시 검색 실행
- [x] 하단 네비게이션 컴포넌트 (`components/layout/bottom-navigation.tsx`)
  - [x] 5개 메뉴: 홈, 레시피, 찜, 식단, 마이
  - [x] `position: fixed`, `bottom: 0`
  - [x] 현재 페이지 하이라이트 (활성 상태)
  - [x] 아이콘 크기: 24px, 텍스트: 12px
  - [x] 활성 색상: `text-teal-600`, 비활성: `text-gray-500`
  - [x] 모바일에서만 표시 (데스크톱 숨김)
- [x] 홈페이지 레이아웃 수정 (`app/page.tsx`)
  - [x] `FixedHeader` 컴포넌트 추가 (고정 영역)
  - [x] 기존 섹션들을 스크롤 가능 영역으로 이동
  - [x] `BottomNavigation` 컴포넌트 추가
  - [x] 하단 네비게이션 높이만큼 패딩 추가 (모바일)
  - [x] 스크롤 테스트 (고정 영역 확인)

#### Phase 2: 바로가기 메뉴 (3일)

- [x] 바로가기 메뉴 컴포넌트 (`components/home/quick-access-menu.tsx`)
  - [x] 8개 아이템 정의 (레거시, 레시피, 건강 맞춤 식단, 주간 식단, 장보기, 즐겨찾기, 명인, 전통)
  - [x] 각 아이템별 고유 색상 정의
  - [x] 섹션 제목: "빠른 시작"
- [x] 그리드 레이아웃
  - [x] 모바일: 4열 (`grid-cols-4`)
  - [x] 태블릿: 5열 (`sm:grid-cols-5`)
  - [x] 데스크톱: 6-8열 (`md:grid-cols-6 lg:grid-cols-8`)
  - [x] 간격: `gap-4` (16px)
  - [x] 각 아이콘: 원형 배경 (w-14 h-14)
- [x] 스타일링 및 효과
  - [x] 각 아이템별 색상 클래스 적용
  - [x] 호버 효과: `hover:scale-105`
  - [x] 터치 효과: `active:scale-95`
  - [x] 전환 효과: `transition-transform`

#### Phase 3: 콘텐츠 섹션 (1주)

- [x] 주간 식단 요약 섹션 (`components/home/weekly-diet-summary.tsx`)
  - [x] 섹션 제목: "이번 주 식단 요약" (Calendar 아이콘)
  - [x] "전체보기" 링크 (`/diet/weekly`)
  - [x] 7일 캘린더 미리보기 (요일, 날짜)
  - [x] 총 칼로리 표시 (실제 데이터 기반)
  - [x] 배경: 그라데이션 (`from-teal-50 to-blue-50`)
- [x] 자주 구매하는 식자재 섹션 (`components/home/frequent-items-section.tsx`)
  - [x] 섹션 제목: "자주 구매하는 식자재"
  - [x] "전체보기" 링크 (`/shopping`)
  - [x] 상품 그리드 (모바일 2열, 태블릿 3열, 데스크톱 4열)
  - [x] 각 상품 카드: 이미지, 상품명, 가격, "장바구니 추가" 버튼
  - [x] 로딩 상태: 스켈레톤 UI
  - [x] 빈 상태: 섹션 숨김
- [x] API 엔드포인트 구현 (`app/api/shopping/frequent-items/route.ts`)
  - [x] 사용자의 주간 식단 기반 재료 조회
  - [x] 구매 빈도순 정렬
  - [x] 최대 8개 항목 반환
- [x] 추천 레시피 섹션 개선
  - [x] 섹션 제목 스타일 통일
  - [x] 카드 레이아웃 개선 (필요 시)

#### Phase 4: 세부 개선 (3일)

- [x] 애니메이션 및 효과
  - [x] 프리미엄 배너: 페이드인 효과
  - [x] 바로가기 메뉴: 호버 시 확대 애니메이션
  - [x] 하단 네비게이션: 활성 상태 전환 애니메이션
- [x] 모바일 최적화
  - [x] 터치 영역 최소 44x44px 확보
  - [x] 하단 네비게이션 높이: 64px
  - [x] 스크롤 성능 최적화 (will-change, backfaceVisibility, contain 속성 적용)
  - [x] 터치 최적화 (touch-action: manipulation)
  - [ ] 실제 모바일 기기 테스트 (iOS/Android) - 권장
- [x] 접근성
  - [x] 키보드 네비게이션 지원 (Tab, Enter/Space)
  - [x] 스크린리더 지원 강화 (`aria-label`, `aria-current`, `aria-describedby`, `role`)
  - [x] 색상 대비: WCAG AA 기준 준수 (4.5:1)
  - [x] 포커스 표시: 명확한 포커스 링 (focus-visible:ring-2)
  - [x] 스크린리더 전용 텍스트 (sr-only 클래스)
- [x] 성능 최적화
  - [x] 이미지 lazy loading 적용
  - [x] 코드 스플리팅: 각 섹션별 동적 import
  - [x] API 호출 최적화: 병렬 요청, 캐싱
  - [x] 스크롤 성능 최적화 (will-change, contain 속성)
  - [ ] Lighthouse 성능 점수: 90점 이상 목표 (실제 테스트 권장)

#### Phase 5: 챕터 구조 및 건강 시각화 통합 (완료)

- [x] 챕터 구조 레이아웃 설계 문서 작성 (`docs/home-chapter-layout-design.md`)
- [x] 챕터 1 페이지 구현 (`app/chapters/recipes-diet/page.tsx`)
  - [x] 현대 레시피, 궁중 레시피, 건강 맞춤 식단, 주간 식단, 마카의 음식 동화 통합
  - [x] 건강 시각화 대시보드 통합
- [x] 챕터 2 페이지 구현 (`app/chapters/health/page.tsx`)
  - [x] 가족 건강 대시보드, 건강 트렌드, 건강 알림 통합
  - [x] 건강 시각화 대시보드 통합
- [x] 챕터 미리보기 컴포넌트 (`components/home/chapter-preview.tsx`)
  - [x] 챕터 1 미리보기 카드
  - [x] 챕터 2 미리보기 카드
  - [x] 전체보기 링크 통합
- [x] 건강 시각화 시스템 구현
  - [x] 건강 시각화 타입 정의 (`types/health-visualization.ts`)
  - [x] 6개 시각화 컴포넌트 구현 (`components/health/visualization/*`)
  - [x] 건강 시각화 API 구현 (`/api/health/metrics`, `/api/health/meal-impact`)
  - [x] 건강 시각화 미리보기 컴포넌트 (`components/home/health-visualization-preview.tsx`)

### B. 이미지 자산 후속 조치

- [ ] `docs/foodjpg.md` 미등록 음식 정리 및 SVG 폴백 감소
- [ ] 이미지 노출/실패 로그 수집 및 성공률 대시보드 확장
- [ ] `foodImageService.getCacheStats()`/`scheduledCacheCleanup()` 실 구현
- [ ] Gemini 생성 이미지 품질 모니터링 및 개선

### B. 식단 기능 고도화

- [x] 주간 식단 추천 모드 (완료)
- [x] 일일 식단 알림 팝업 + `diet_notification_settings` 스키마 (완료)
- [x] 어린이 성장기 전용 식사별 칼로리 분배 로직 (아침 25%, 점심 35%, 저녁 30%, 간식 10%) (완료)
- [x] 레시피 재료 정보 DB 통합 (`recipe_ingredients` 테이블)
- [x] 주간 장보기 리스트 실제 재료 데이터 사용
- [x] 레시피 업로드 시 재료 입력 UI
  - [x] 재료 카테고리 선택 필드 추가
  - [x] 선택 재료 체크박스 추가
  - [x] 손질 방법 입력 필드 추가
  - [x] Server Action에서 신 DB 스키마 필드로 저장
  - [x] 레시피 상세 페이지에서 신 스키마 필드 표시
- [x] **건강 정보 시스템 고도화** (완료)
  - [x] 상세 질병/알레르기 입력 (사용자 정의 입력 지원)
  - [x] 프리미엄 기능 통합 (도시락, 헬스, 다이어트, 비건 모드)
  - [x] 칼로리 계산 투명화 (Mifflin-St Jeor 공식 + 수동 설정)
  - [x] 엄격한 알레르기 필터링 (파생 재료 포함)
  - [x] 응급 조치 페이지 (`/health/emergency`) 및 안전 경고 컴포넌트

### B-2. 프리미엄 식단 고급 기능

- [x] 즐겨찾기 기능 구현
  - [x] `favorite_meals` 테이블 생성
  - [x] 즐겨찾기 서비스 (`lib/diet/favorite-meals.ts`)
  - [x] 즐겨찾기 버튼 컴포넌트 (`components/diet/favorite-button.tsx`)
  - [x] 식단 카드에 즐겨찾기 버튼 통합
  - [x] 즐겨찾기 목록 페이지 (`app/(dashboard)/diet/favorites/page.tsx`)
- [x] 밀키트 식단 기능 구현
  - [x] `meal_kits`, `meal_kit_products` 테이블 생성
  - [x] 밀키트 서비스 (`lib/diet/meal-kit-service.ts`) - 쿠팡 API + 폴백
  - [x] 밀키트 선택 UI (`components/diet/meal-kit-selector.tsx`)
  - [x] 식단 뷰에 밀키트 옵션 통합
- [x] 특수 식단 타입 필터링 구현
  - [x] 특수 식단 필터 로직 (`lib/diet/special-diet-filters.ts`)
  - [x] 도시락 반찬 위주 식단 필터
  - [x] 헬스인 닭가슴살 위주 식단 필터
  - [x] 다이어트 저탄수화물 식단 필터
  - [x] 비건/베지테리언 식단 필터
  - [x] 식단 추천 로직에 통합 (`lib/diet/recommendation.ts`, `personal-diet-generator.ts`)
- [x] 건강 정보 폼에 식단 타입 선택 추가
  - [x] 다중 선택 체크박스 UI
  - [x] 프리미엄 전용 안내 배너
- [x] 프리미엄 가드 적용
  - [x] 즐겨찾기 버튼 프리미엄 체크
  - [x] 밀키트 선택 UI 프리미엄 체크
  - [x] 특수 식단 타입 선택 프리미엄 체크
- [ ] 쿠팡 파트너스 API 실제 연동 (현재는 시뮬레이션)
- [x] 밀키트 제품 수동 등록 관리자 페이지
  - [x] Server Actions 생성 (list, save, delete)
  - [x] 관리자 페이지 컴포넌트 (page.tsx, meal-kits-page-client.tsx)
  - [x] UI 컴포넌트 (meal-kit-table, meal-kit-detail-panel, meal-kit-create-dialog)
  - [x] 관리자 사이드바에 밀키트 메뉴 추가

### B-1. 질병관리청 (KCDC) 연동 및 예방접종 알림

- [x] KCDC 공개 API 파싱 유틸 생성 (`lib/kcdc/kcdc-parser.ts`)
- [x] 공공데이터포털 API 연동 (인플루엔자, 예방접종)
- [x] API 키 설정 및 환경 변수 관리
- [x] 폴백 전략 (API 실패 시 더미 데이터)
- [x] `app/api/health/kcdc/refresh` Server Action/Route 구현
- [x] `app/api/health/kcdc/alerts` 조회 API 구현
- [x] Supabase Edge Function 생성 (`supabase/functions/sync-kcdc-alerts`)
- [x] 독감/예방접종 팝업 UI (`components/health/kcdc-alert-popup.tsx`)
- [x] KCDC 알림 Provider (`components/providers/kcdc-alerts-provider.tsx`)
- [x] `kcdc_alerts` 테이블 및 캐시 전략
- [x] API 설정 가이드 작성 (`docs/KCDC_API_SETUP.md`)
- [x] Supabase Edge Function 크론 스케줄 설정 (매일 05:00 KST)
  - [x] pg_cron 확장 활성화 마이그레이션
  - [x] KCDC 동기화 크론 잡 생성 SQL
  - [x] 크론 잡 설정 가이드 문서 작성
- [ ] 리마인더 주기 설정 (주간/월간) - DB 설정 테이블 추가 필요

### B-2. KCDC 프리미엄 기능 (Phase 1 & Phase 9)

- [x] 데이터베이스 스키마 마이그레이션 (`supabase/migrations/20250127120000_create_kcdc_premium_tables.sql`)
- [x] 구현 계획서 작성 (`docs/kcdc-premium-implementation-plan.md`)
- [ ] **Phase 1: 핵심 프리미엄 기능**
  - [ ] 타입 정의 (`types/kcdc.ts` 확장)
    - [ ] `InfectionRiskScore` 인터페이스
    - [ ] `VaccinationRecord`, `VaccinationSchedule` 인터페이스
    - [ ] `TravelRiskAssessment` 인터페이스
    - [ ] `HealthCheckupRecord`, `HealthCheckupRecommendation` 인터페이스
  - [ ] 비즈니스 로직 구현
    - [ ] `lib/kcdc/risk-calculator.ts` - 감염병 위험 지수 계산
    - [ ] `lib/kcdc/vaccination-manager.ts` - 예방접종 기록/일정 관리
    - [ ] `lib/kcdc/travel-risk-assessor.ts` - 여행 위험도 평가
    - [ ] `lib/kcdc/checkup-manager.ts` - 건강검진 기록/권장 일정 관리
  - [ ] API 라우트 구현
    - [ ] `app/api/health/kcdc-premium/risk-scores/route.ts`
    - [ ] `app/api/health/kcdc-premium/vaccinations/route.ts`
    - [ ] `app/api/health/kcdc-premium/travel-risk/route.ts`
    - [ ] `app/api/health/kcdc-premium/checkups/route.ts`
  - [ ] UI 컴포넌트 구현
    - [ ] `components/health/infection-risk-card.tsx`
    - [ ] `components/health/vaccination-record-card.tsx`
    - [ ] `components/health/vaccination-schedule-list.tsx`
    - [ ] `components/health/travel-risk-form.tsx`
    - [ ] `components/health/checkup-record-card.tsx`
  - [ ] 페이지 구현
    - [ ] `app/(dashboard)/health/premium/page.tsx` (대시보드)
    - [ ] `app/(dashboard)/health/premium/infection-risk/page.tsx`
    - [ ] `app/(dashboard)/health/premium/vaccinations/page.tsx`
    - [ ] `app/(dashboard)/health/premium/travel-risk/page.tsx`
    - [ ] `app/(dashboard)/health/premium/checkups/page.tsx`
- [ ] **Phase 9: 주기적 건강 관리 서비스**
  - [ ] 타입 정의 (`types/kcdc.ts` 확장)
    - [ ] `PeriodicHealthService` 인터페이스
    - [ ] `DewormingRecord`, `DewormingMedication` 인터페이스
    - [ ] `UserNotificationSettings` 인터페이스
  - [ ] 비즈니스 로직 구현
    - [ ] `lib/kcdc/periodic-service-manager.ts`
    - [ ] `lib/kcdc/deworming-manager.ts`
  - [ ] API 라우트 구현
    - [ ] `app/api/health/kcdc-premium/periodic-services/route.ts`
    - [ ] `app/api/health/kcdc-premium/deworming/route.ts`
    - [ ] `app/api/health/kcdc-premium/notification-settings/route.ts`
  - [ ] UI 컴포넌트 구현
    - [ ] `components/health/periodic-service-list.tsx`
    - [ ] `components/health/deworming-record-card.tsx`
    - [ ] `components/health/premium-notification-settings.tsx`
  - [ ] 페이지 구현
    - [ ] `app/(dashboard)/health/premium/periodic-services/page.tsx`

### B-3. 건강정보 자동 연동 및 예방주사 알림 서비스

- [x] **Phase 1: 데이터베이스 스키마 확장**
  - [x] 건강정보 자동 연동 관련 테이블 생성 (`supabase/migrations/20250201000000_create_health_data_integration_tables.sql`)
    - [x] `health_data_sources` 테이블 생성 (데이터 소스 연결 정보)
    - [x] `hospital_records` 테이블 생성 (병원 방문 기록)
    - [x] `medication_records` 테이블 생성 (약물 복용 기록)
    - [x] `disease_records` 테이블 생성 (질병 진단 기록)
    - [x] `health_data_sync_logs` 테이블 생성 (동기화 로그)
  - [x] 예방주사 알림 서비스 스키마 확장
    - [x] `vaccination_notification_logs` 테이블 생성 (알림 발송 로그)
    - [x] `lifecycle_vaccination_schedules` 테이블 생성 (생애주기별 예방주사 마스터 데이터)
    - [x] `user_vaccination_schedules` 테이블에 알림 관련 필드 추가
  - [x] 기존 스키마 관계도 유지 (users → family_members, diseases 등)
  - [x] 인덱스 및 트리거 생성
- [x] **Phase 2: 공공 API 연동 인프라 구축**
  - [x] 마이데이터 서비스 연동
    - [x] 마이데이터 API 클라이언트 구현 (`lib/health/mydata-client.ts`)
    - [x] 사용자 인증 및 동의 처리
    - [x] 토큰 관리 및 갱신 로직
  - [x] 건강정보고속도로 API 클라이언트 구현 (`lib/health/health-highway-client.ts`)
    - [x] 보건복지부 건강정보고속도로 API 연동
    - [x] 진료기록, 건강검진 결과, 투약 정보 조회
  - [x] API 연동 서비스 레이어 구현 (`lib/health/health-data-sync-service.ts`)
    - [x] 데이터 소스별 동기화 로직 통합
    - [x] 에러 처리 및 재시도 로직
    - [x] 데이터 변환 및 정규화
  - [x] 공공 API 설정 및 문서화
    - [x] 환경 변수 추가 (`docs/env-setup-guide.md` 업데이트)
    - [x] API 연동 가이드 문서 작성 (`docs/health-data-integration-guide.md`)
    - [x] 타입 정의 파일 생성 (`types/health-data-integration.ts`)
- [ ] **Phase 3: 건강정보 자동 연동 기능 구현**
  - [ ] 데이터 소스 연결 관리
    - [ ] 데이터 소스 연결 UI 컴포넌트 구현 (`components/health/data-source-connector.tsx`)
    - [ ] 데이터 소스 연결 API 구현 (`app/api/health/data-sources/route.ts`)
    - [ ] 사용자 동의 처리 페이지 구현 (`app/(dashboard)/health/data-sources/consent/page.tsx`)
  - [ ] 병원기록 자동 연동
    - [ ] 병원기록 동기화 로직 구현 (`lib/health/hospital-records-sync.ts`)
    - [ ] 병원기록 조회 API 구현 (`app/api/health/hospital-records/route.ts`)
    - [ ] 병원기록 UI 컴포넌트 구현 (`components/health/hospital-records-list.tsx`)
  - [ ] 약물 복용 기록 자동 연동
    - [ ] 약물 복용 기록 동기화 로직 구현 (`lib/health/medication-records-sync.ts`)
    - [ ] 약물 복용 기록 관리 API 구현 (`app/api/health/medications/route.ts`)
    - [ ] 약물 복용 기록 UI 컴포넌트 구현 (`components/health/medication-records-list.tsx`)
  - [ ] 질병 기록 자동 연동
    - [ ] 질병 기록 동기화 로직 구현 (`lib/health/disease-records-sync.ts`)
    - [ ] 질병 기록 관리 API 구현 (`app/api/health/diseases/records/route.ts`)
    - [ ] 질병 기록 UI 컴포넌트 구현 (`components/health/disease-records-list.tsx`)
  - [ ] 건강검진 정보 자동 연동
    - [ ] 건강검진 결과 동기화 로직 구현 (`lib/health/checkup-results-sync.ts`)
    - [ ] 건강검진 결과 연동 API 확장 (`app/api/health/kcdc-premium/checkups/sync/route.ts`)
    - [ ] 건강검진 결과 UI 개선 (`components/health/premium/checkup-record-card.tsx` 확장)
- [x] **Phase 4: 생애주기별 예방주사 알림 서비스 고도화**
  - [x] 생애주기별 예방주사 일정 생성 알고리즘
    - [x] 예방주사 일정 생성 로직 개선 (`lib/health/lifecycle-vaccination-scheduler.ts`)
    - [x] KCDC 표준 생애주기별 예방주사 마스터 데이터 구현
    - [x] 출생일 기준 생애주기 계산 및 일정 생성
  - [x] 예방주사 알림 시스템 구현
    - [x] 알림 발송 서비스 구현 (`lib/health/vaccination-notification-service.ts`)
    - [x] 예방주사 알림 API 구현 (`app/api/health/vaccinations/notifications/route.ts`)
    - [x] 크론 잡 설정 (Supabase Edge Function: `supabase/functions/schedule-vaccination-notifications/`)
  - [x] 예방주사 알림 UI 구현
    - [x] 예방주사 알림 설정 컴포넌트 (`components/health/vaccination-notification-settings.tsx`)
    - [ ] 예방주사 알림 내역 컴포넌트 (`components/health/vaccination-notification-history.tsx`)
  - [x] 예방주사 일정 관리 UI 개선
    - [x] 생애주기별 예방주사 일정 생성 API (`app/api/health/lifecycle-vaccinations/route.ts`)
    - [x] 예방주사 캘린더 뷰 개선 (`components/health/vaccination-lifecycle-calendar.tsx`)
- [ ] **Phase 5: 통합 건강 관리 대시보드**
  - [ ] 건강 정보 통합 대시보드 페이지 구현 (`app/(dashboard)/health/dashboard/page.tsx`)
  - [ ] 건강 정보 요약 컴포넌트 구현 (`components/health/health-summary-dashboard.tsx`)
  - [ ] 가족 구성원별 건강 관리
    - [ ] 가족 구성원별 건강 정보 탭 구현 (`components/health/family-health-tabs.tsx`)
    - [ ] 가족 건강 정보 통합 뷰 (`components/health/family-health-overview.tsx`)
- [ ] **Phase 6: 알림 시스템 통합**
  - [ ] 통합 알림 설정 페이지 구현 (`app/(dashboard)/health/notifications/settings/page.tsx`)
  - [ ] 알림 설정 컴포넌트 구현 (`components/health/unified-notification-settings.tsx`)
  - [ ] 알림 발송 인프라
    - [ ] 알림 발송 서비스 확장 (`lib/notifications/health-notification-service.ts`)
    - [ ] 알림 템플릿 관리 (`lib/notifications/notification-templates.ts`)
- [ ] **Phase 7: 데이터 동기화 및 모니터링**
  - [ ] 자동 동기화 스케줄러
    - [ ] 데이터 동기화 크론 잡 구현 (`supabase/functions/sync-health-data`)
    - [ ] 수동 동기화 API 구현 (`app/api/health/sync/route.ts`)
  - [ ] 동기화 모니터링
    - [ ] 동기화 로그 조회 API 구현 (`app/api/health/sync/logs/route.ts`)
    - [ ] 동기화 상태 UI 컴포넌트 구현 (`components/health/sync-status-indicator.tsx`)
- [ ] **Phase 8: 보안 및 개인정보 보호**
  - [ ] 개인정보 암호화
    - [ ] 민감 건강정보 암호화 적용
    - [ ] 암호화 키 관리 (`lib/security/encryption.ts`)
  - [ ] 접근 제어 강화
    - [ ] RLS 정책 추가 (프로덕션 환경)
    - [ ] API 인증 강화
  - [ ] 개인정보 처리 방침 업데이트 (`app/privacy/page.tsx`)
- [ ] **Phase 9: 테스트 및 문서화**
  - [ ] 테스트 작성
    - [ ] 건강정보 동기화 로직 단위 테스트 (`__tests__/health-data-sync.test.ts`)
    - [ ] 예방주사 일정 생성 알고리즘 테스트 (`__tests__/vaccination-scheduler.test.ts`)
    - [ ] 알림 발송 서비스 테스트 (`__tests__/vaccination-notification.test.ts`)
    - [ ] 통합 테스트 작성 (E2E 테스트)
  - [ ] 문서화
    - [ ] 건강정보 자동 연동 사용 가이드 작성 (`docs/user-manual/health-data-integration-guide.md`)
    - [ ] 예방주사 알림 서비스 사용 가이드 작성 (`docs/user-manual/vaccination-notification-guide.md`)
    - [ ] API 문서 업데이트 (Swagger/OpenAPI)

### C. 테스트 & 품질

- [ ] 유닛 테스트 확대 (현재: 이미지 파이프라인만 완료)
- [ ] 통합 테스트 작성
- [ ] E2E 테스트 (Playwright)
- [ ] 모바일 실제 기기 테스트

### D. 보안 · 법무

- [ ] 민감 데이터 암호화 (개인 건강 정보)
- [ ] 결제/상업 기능 추가 시 보안 플로우 설계
- [ ] 정기 보안 감사

### E. 성능 · 접근성

- [ ] CDN 구성 (이미지/정적 자산)
- [ ] DB 쿼리 튜닝 및 인덱스 최적화
- [ ] 스크린리더/보이스오버 수동 테스트
- [ ] Lighthouse 성능 점수 개선

### E-1. 팝업 인프라 & 앱 상태 QA

- [ ] 공통 팝업 상태 관리 훅 정의
- [ ] 팝업 로그 정책 수립
- [ ] 앱(WebView) 시뮬레이터 테스트 체크리스트
- [ ] 디자인 시스템 기준 준수 검증 (버튼 48px, 대비 4.5:1)

### F. 문서화

- [ ] API 문서 작성 (Swagger/OpenAPI)
- [ ] 컴포넌트 스토리북 구축
- [ ] 배포 & 운영 가이드 작성
- [ ] 사용자 가이드 작성 (선택)
- [ ] Admin 콘솔 릴리즈 노트 및 사용 가이드

---

## 🚀 구현 가능한 기능 (Future Enhancements)

다음 기능들은 현재 구현되지 않았으나, 향후 개발 가능한 기능들입니다.

### B-3. 건강정보 관리 시스템 고도화 (대부분 구현 완료, UI 개선 필요)

- [x] **데이터베이스 스키마 설계 및 마이그레이션**
  - [x] `diseases` 테이블 생성 (질병 마스터 데이터) - 16개 질병 데이터 존재
  - [x] `disease_excluded_foods_extended` 테이블 생성 (질병별 제외 음식 확장)
  - [x] `allergies` 테이블 생성 (알레르기 마스터 데이터) - 14개 알레르기 데이터 존재
  - [x] `allergy_derived_ingredients` 테이블 생성 (알레르기 파생 재료)
  - [x] `emergency_procedures` 테이블 생성 (응급조치 정보)
  - [x] `calorie_calculation_formulas` 테이블 생성 (칼로리 계산 공식)
  - [x] `user_health_profiles` 테이블 확장 (diseases, allergies, dietary_preferences 등)

- [x] **질병 관리 시스템**
  - [x] 16개 주요 질병 데이터 시드 (데이터베이스에 존재)
  - [x] 질병별 제외 음식 데이터 시드
  - [x] 질병 관리 서비스 (`lib/health/disease-manager.ts`)
  - [x] 질병 선택 UI 컴포넌트 (`components/health/disease-selector.tsx`)
  - [ ] 질병별 칼로리 조정 계수 설정 (부분 구현, UI 통합 필요)

- [x] **알레르기 관리 시스템 (엄격 모드)**
  - [x] 14개 주요 알레르기 데이터 시드 (데이터베이스에 존재)
  - [x] 알레르기 파생 재료 데이터 시드
  - [x] 알레르기 관리 서비스 (`lib/health/allergy-manager.ts`)
  - [x] 알레르기 선택 UI 컴포넌트 (`components/health/allergy-selector.tsx`)
  - [x] 레시피 알레르기 검사 로직 (모든 재료, 소스, 조미료 포함) - `lib/diet/food-filtering.ts`
  - [x] 안전 경고 컴포넌트 (`components/health/safety-warning.tsx`, `components/diet/safety-warning.tsx`)
  - [x] 불확실한 재료 정보 안내 문구 표시

- [x] **칼로리 계산 시스템 고도화**
  - [x] 다중 공식 지원 (Mifflin-St Jeor 기본 구현, 공식 테이블 존재)
  - [x] 수동 목표 칼로리 설정 기능 (`user_health_profiles.manual_target_calories`)
  - [x] 계산 공식 표시 기능 (`components/health/calorie-calculator-display.tsx`)
  - [ ] 연령대별 공식 자동 선택 (공식 테이블 존재, 로직 통합 필요)
  - [ ] 질병 조정 적용 (부분 구현, UI 통합 필요)

- [x] **프리미엄 식단 타입 확장**
  - [x] 도시락 식단 필터 (반찬 위주, 보관 용이) - `bento` 필터
  - [x] 헬스인 식단 필터 (고단백 저지방, 닭가슴살 중심) - `fitness` 필터
  - [x] 다이어트 식단 필터 (저탄수화물) - `low_carb` 필터
  - [x] 비건 식단 필터 (모든 동물성 제외) - `vegan` 필터
  - [x] 베지테리언 식단 필터 (육류, 생선 제외) - `vegetarian` 필터
  - [x] 프리미엄 식단 필터 서비스 (`lib/diet/special-diet-filters.ts`)
  - [x] 건강정보 폼에 식단 타입 선택 UI 추가

- [x] **응급조치 정보 시스템**
  - [x] 응급조치 데이터 시드 (`emergency_procedures` 테이블)
  - [x] 응급조치 메인 페이지 (`app/(dashboard)/health/emergency/page.tsx`)
  - [x] 알레르기별 응급조치 상세 페이지 (`app/(dashboard)/health/emergency/[allergyCode]/page.tsx`)
  - [x] 응급 연락처 (119) 강조 표시
  - [x] 증상별 대처법 안내
  - [x] 위험 신호 인식 가이드

- [x] **선호/비선호 식재료 관리**
  - [x] 선호 식재료 입력 UI (`components/health/ingredient-preferences.tsx`)
  - [x] 비선호 식재료 입력 UI
  - [x] 식단 생성 시 선호도 반영 로직

- [x] **API 엔드포인트**
  - [x] `GET /api/health/diseases` - 질병 목록 조회
  - [x] `GET /api/health/allergies` - 알레르기 목록 조회
  - [x] `GET /api/health/allergies/[code]/derived` - 파생 재료 조회
  - [x] `POST /api/health/calculate-calories` - 칼로리 계산

- [x] **건강정보 입력 폼 대폭 개선**
  - [x] 질병 정보 섹션 (다중 선택 + 사용자 정의)
  - [x] 알레르기 정보 섹션 (주요 + 특수 + 사용자 정의)
  - [x] 선호/비선호 식재료 섹션
  - [x] 프리미엄 식단 타입 섹션
  - [x] 칼로리 계산 방식 섹션 (자동 vs 수동)
  - [x] 계산 공식 표시 토글
  - [ ] 폼 유효성 검사 강화 (기본 검사 존재, 추가 개선 필요)

- [x] **식단 생성 로직 통합**
  - [x] 질병별 제외 음식 필터링 적용
  - [x] 알레르기 파생 재료 필터링 적용 (엄격 모드)
  - [x] 선호/비선호 식재료 반영
  - [x] 프리미엄 식단 타입 필터링 적용
  - [x] 칼로리 계산 결과 반영
  - [x] 안전 경고 표시 로직

- [ ] **테스트 및 검증**
  - [ ] 칼로리 계산 정확도 테스트 (문서 예시 값과 비교)
  - [ ] 알레르기 파생 재료 검출 테스트 (새우→새우젓 등)
  - [ ] 질병별 칼로리 조정 테스트
  - [ ] 프리미엄 식단 필터링 테스트 (비건 등)
  - [ ] 응급조치 정보 검증
  - [ ] 통합 테스트 (복합 조건)

- [ ] **문서화**
  - [ ] 건강정보 입력 가이드 작성
  - [ ] 알레르기 관리 가이드 작성
  - [ ] 응급조치 사용 가이드 작성
  - [ ] 의료 면책 조항 강화
  - [ ] API 문서 업데이트

---

## 🔄 Post-MVP 기능 (추후 개발)

### AI 고도화

- [ ] 특수 식단 필터 (GI 지수, 저염식, 영양소 목표 기반)
- [ ] 영양 코칭 리포트 (프리미엄 기능)
- [ ] 식단 추천 정확도 개선 (ML 모델 도입)

### 창작자 경제

- [ ] 상업화 인증 시스템 (검증단 심사)
- [ ] UGC 전용 마켓 섹션
- [ ] 완제품/밀키트 판매 중개
- [ ] 결제 시스템 연동

### 수익 모델 다각화

- [ ] 라이선싱 기능
- [ ] B2B 라이선싱
- [ ] 프리미엄 구독 고도화

---

## 🗂️ 참고 문서

### 핵심 문서

- [PRD.md](./PRD.md) — 제품 요구사항 정의서 (구현 완료 기능 반영)
- [implementation-plan-family-diet.md](./implementation-plan-family-diet.md) — 가족 식단 세부 로드맵
- [implementation-plan-homepage-ui-ux.md](./implementation-plan-homepage-ui-ux.md) — 홈페이지 UI/UX 개선 상세 계획

### UI/UX 문서

- [ui-ux-analysis-baemin.md](./ui-ux-analysis-baemin.md) — 배달의민족 앱 UI/UX 분석 및 적용 방안

### 기술 문서

- [image-loading-analysis.md](./image-loading-analysis.md) — 이미지 문제 분석 기록
- `notion-food-image-integration.md` — Notion 통합 설계
- `food-image-storage-spec.md` — Storage 구조 사양
- `image-generation-monitoring.md` — Gemini 이미지 생성 모니터링
- `storage-cost-tracking.md` — Storage 비용 추적
- `error-handling-guide.md` — 에러 대응 가이드

### QA 문서

- `admin-qa.md` — 관리자 콘솔 QA 체크리스트

> **참고:** Post-MVP 기능(상업화 인증, GI 지수 필터, 레시피 댓글 등)은 별도 백로그 문서에서 재정의 후 재반영 예정입니다.

---

**마지막 업데이트**: 2025-01-27  
**업데이트 내용**:

- 홈페이지 챕터 구조 기능 추가 (챕터 1, 챕터 2 페이지 및 미리보기 컴포넌트)
- 건강 시각화 시스템 완료 상태 반영 (6개 시각화 컴포넌트, 2개 API 엔드포인트)
- 프로젝트 파일 정리 작업 완료 (레거시 파일 삭제, 중복 파일 통합)
- 관리자 콘솔 추가 기능 반영 (프로모션 코드 관리, 정산 내역 관리, 밀키트 관리, 레시피 관리)
- 실제 구현된 컴포넌트 및 페이지 확인 및 문서화
- PRD.md에 관리자 페이지 기능 추가 (D-3 ~ D-6)
- 데이터베이스 테이블 목록 업데이트

**다음 마일스톤**:

- 실제 토스페이먼츠 결제 연동 (현재 Mock 모드)
- 건강정보 입력 폼 UI 개선
- 테스트 확대 (유닛/통합/E2E)
- 성능 최적화 (CDN, DB 쿼리 튜닝)

---

## 📎 첨부: 레포 ↔ PRD/TODO 대조 결과(자동 보강, 2025-12-17)

아래는 **레포에는 존재하지만 TODO(또는 PRD)에 명시가 없거나 부족한 항목**입니다. “문서에 추가해야 할 TODO”로 간단히 붙였습니다.

### 1) 응급조치(의료기관/약국/지도/위치권한) — 문서 누락

- [ ] PRD/TODO에 “의료기관/약국 찾기 + 지도 + 위치 권한 UX”를 기능으로 명시하고 범위/예외(권한 거부, 위치 오차) 정의
  - 근거: `app/(dashboard)/health/emergency/medical-facilities/*`, `app/api/health/medical-facilities/*`, `app/api/health/pharmacy/search/route.ts`, `components/health/medical-facilities/*`, `lib/naver/*`, `components/location/LocationPermissionToggle.tsx`

### 2) 건강정보 자동 연동(마이데이터/건강정보고속도로) — PRD 쪽에 기능 트랙이 없음

- [ ] PRD의 Future Enhancements/로드맵에 “건강정보 자동 연동(연결/동의/동기화/로그/보안)” 트랙을 추가
  - 근거: `app/health/data-sources/*`, `types/health-data-integration.ts`, `docs/health-data-integration-guide.md`

### 3) Baby 레시피 아카이브 — PRD/TODO에 범주 정리가 없음

- [ ] PRD(B. 레시피) 하위에 “Baby 레시피 아카이브”를 포함할지/별도 제품 라인으로 분리할지 결정 후 문서 반영
  - 근거: `app/archive/recipes/baby/[id]/page.tsx`, `docs/baby.md`

### 4) 홈/유틸: 날씨 위젯 — PRD/TODO 누락

- [ ] 홈 기능 목록에 “날씨 위젯”을 포함할지 결정 후 문서 반영(또는 숨김/제거 백로그로 이동)
  - 근거: `app/api/weather/route.ts`, `components/home/weather-widget.tsx`

### 5) 문서 간 불일치 정리

- [ ] “일일 식단 크론이 18:00에 생성하는 식단이 오늘/내일 중 무엇인지”를 PRD/TODO에서 동일한 문장으로 통일

### 6) 동의(Consent) 기록 관리/내보내기 — 문서 누락

- [ ] 관리자 기능(D-\*)에 “동의 기록 조회/내보내기”를 명시하고, 운영 정책(보관 기간/권한/감사 로그)을 TODO로 추가
  - 근거: `app/admin/consent/*`, `app/api/admin/consent-records/*`

### 7) 식약처(MFDS) 레시피 탐색/검색 + 테스트 페이지 — 문서 누락

- [ ] PRD/TODO에 “MFDS 레시피 탐색/검색(API + 페이지)”을 기능으로 명시(테스트 페이지는 내부 검증용으로 분리 표기)
  - 근거: `app/recipes/mfds/*`, `app/api/mfds-recipes/*`, `app/test/foodsafety/page.tsx`, `app/api/test/foodsafety/route.ts`

### 8) 스낵(과일 상세) 라우트 — 문서 누락

- [ ] `snacks` 기능을 제품 범위에 포함할지 결정 후 PRD/TODO에 반영(포함 시 사용자 스토리/데이터 소스/화면 위치 정의)
  - 근거: `app/snacks/[fruitId]/page.tsx`

### 9) 내부 점검용 `/test` 페이지 묶음 — PRD/TODO에 “운영 정책”이 없음

- [ ] `/test/*` 페이지를 “내부 점검 도구”로 문서에 명시하고, 배포 환경에서 접근 제어 정책(관리자만/비공개/비활성)을 결정
  - 근거: `app/test/*`, `docs/production-checklist.md`, `docs/final-status-report.md`, `docs/todocheck.md`

### 10) 스토리 관련 독립 페이지(스토리북 외) — PRD/TODO에 기능 정의 없음

- [ ] `food-stories`, `stories`, `special-video`를 PRD에서 어떤 범주로 둘지 결정(레거시 하위 통합 vs 별도 콘텐츠 허브)
  - 근거: `app/food-stories/page.tsx`, `app/stories/page.tsx`, `app/special-video/page.tsx`

### 11) `tc/`(프로토타입/실험용 별도 앱) — 문서에 관리 정책 없음

- [ ] `tc/` 폴더를 제품 범위에서 제외(프로토타입)할지, 포함할지 결정 후 문서화(배포/유지보수 정책 포함)
  - 근거: `tc/christmas-storybook-player/*` (독립 `package.json`/`next.config.mjs` 보유)

### 12) 신원확인(본인/가족) 기능 — PRD/TODO에 기능 정의 누락

- [ ] “신원확인(이름/주민등록번호 입력 → 해시 저장 → 가족 구성원 검증)” 기능을 PRD에 독립 항목으로 추가하고, 어디에 쓰이는지(예: 건강정보 자동 연동/데이터 소스 연결 선행 조건) 명시
  - 근거: `app/api/identity/verifications/route.ts`, `app/api/health/data-sources/auth-url/route.ts`

### 13) 알림 설정이 2트랙(식단/건강)으로 분리 — 문서 구조 명시 필요

- [ ] 알림 설정을 “식단 알림(기본)”과 “건강 알림(프리미엄)”으로 분리해 PRD/TODO에 구조와 정책을 명시(사용 테이블/권한/설정 UI 위치 포함)
  - 근거: `app/api/diet/notifications/settings/route.ts` (`diet_notification_settings`), `app/api/health/notifications/settings/route.ts` (`user_notification_settings`)

### 14) 건강정보 자동 연동(OAuth) 사용자 흐름 문서화 — PRD에 단계 설명 보강 필요

- [ ] 데이터 소스 연결 흐름을 “auth-url → callback → connect 페이지 → connect API” 기준으로 사용자 관점 단계(어떤 화면을 거치는지)로 PRD에 정리
  - 근거: `app/health/data-sources/page.tsx`, `app/api/health/data-sources/auth-url/route.ts`, `app/api/health/data-sources/callback/route.ts`, `app/health/data-sources/connect/page.tsx`, `app/api/health/data-sources/route.ts`

### 15) 건강정보 자동 연동 “동기화 결과 데이터(테이블)” 문서화 — PRD에 데이터 흐름 보강 필요

- [ ] 자동 연동 결과가 어디에 저장되는지(연결/로그/병원/약/질병/검진/프로필 반영)를 PRD에 정리
  - 근거: `lib/health/health-data-sync-service.ts`, `lib/health/hospital-records-sync.ts`, `lib/health/medication-records-sync.ts`, `lib/health/disease-records-sync.ts`, `lib/health/checkup-results-sync.ts`

### 16) 건강정보 자동 연동 “실행/운영 정책” 문서화 — PRD에 운영 정책 보강 필요

- [ ] 자동 연동의 실행 방식(수동 버튼/API), 쿨다운(1시간), 상태/로그 화면 및 접근 제어(프리미엄/신원확인) 정책을 PRD에 정리
  - 근거: `components/health/health-sync-button.tsx`, `app/api/health/sync/route.ts`, `app/api/health/sync/logs/route.ts`, `app/health/sync-status/page.tsx`

### 17) 가족 구성원 단위 동기화 문서화 + “동기화 상태 페이지” 동작 불일치 수정

- [ ] PRD에 가족 구성원 단위 동기화(`familyMemberId`) 지원을 명시하고, UX 흐름(구성원별 신원확인 선행)을 정리
  - 근거: `components/health/family-member-health-sync-button.tsx`, `app/api/health/sync/route.ts`
- [ ] `app/health/sync-status/page.tsx`의 “수동 동기화” 버튼이 실제 `/api/health/sync`를 호출하도록 구현 정합성 맞추기(현재는 더미 대기 로직)
