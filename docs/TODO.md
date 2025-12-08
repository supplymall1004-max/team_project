# 맛의 아카이브 (Flavor Archive) 개발 현황 & TODO

> **최종 업데이트: 2025-11-30**  
> PRD/Design 문서와 실제 구현을 교차 검토하여 **구현 완료 기능**과 **남은 우선순위 작업**을 정리했습니다.

---

## ✅ 구현 완료 현황

### 1. 공통 인프라 & 레이아웃
- [x] Next.js 15 + React 19 + Tailwind v4 기반 프로젝트 초기화
- [x] Clerk 인증 및 Supabase 통합
- [x] 글로벌 헤더/푸터, 반응형 레이아웃, 로딩/에러 컴포넌트
- [x] 통합 검색 페이지(`app/search`) 및 홈 히어로 섹션
- [x] 코드 품질 도구 설정 (ESLint, Prettier)

### 2. 📜 레거시 아카이브
- [x] 명인 인터뷰 뷰어 (HD 스트리밍, 프리미엄 광고 제거)
- [x] 전문 문서 카드(고증 정보, 출처, 도구 안내)
- [x] 지역/시대/재료 필터 + 검색 조합
- [x] 대체 재료/도구 안내 UI
- [x] 레거시 아카이브 섹션 및 카드 그리드 레이아웃

### 3. 🍴 현대 레시피 북
- [x] 단계별 레시피 상세(타이머, 체크리스트, 초보자 가이드)
- [x] 레시피 업로드 + 자동 썸네일 할당(`actions/recipe-create.ts`)
- [x] 레시피 카드/검색/정렬 컴포넌트
- [x] 별점 및 신고 기능
- [x] 레시피 업로드 폼 (재료, 난이도, 조리 시간 입력)
- [x] 요리 모드 (Cooking Mode) UI

### 4. 🧠 AI 기반 맞춤 식단
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
- [x] 어제 AI 맞춤 식단 가족 탭
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
  - [x] AI 식단 로직 반영 (주간 식단도 AI 추천 사용)
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
- [x] **데이터베이스 테이블**
  - [x] `admin_copy_blocks` (페이지 문구)
  - [x] `popup_announcements` (팝업 공지)
  - [x] `popup_images` Storage 버킷
  - [x] `notification_logs` (알림 로그)
  - [x] `admin_security_audit` (보안 감사)
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
  - [x] 8개 아이템 정의 (레거시, 레시피, AI 식단, 주간 식단, 장보기, 즐겨찾기, 명인, 전통)
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

### B-3. 건강정보 관리 시스템 대폭 강화 (문서 기반 구현)
- [ ] **데이터베이스 스키마 설계 및 마이그레이션**
  - [ ] `diseases` 테이블 생성 (질병 마스터 데이터)
  - [ ] `disease_excluded_foods_extended` 테이블 생성 (질병별 제외 음식 확장)
  - [ ] `allergies` 테이블 생성 (알레르기 마스터 데이터)
  - [ ] `allergy_derived_ingredients` 테이블 생성 (알레르기 파생 재료)
  - [ ] `emergency_procedures` 테이블 생성 (응급조치 정보)
  - [ ] `calorie_calculation_formulas` 테이블 생성 (칼로리 계산 공식)
  - [ ] `health_profiles` 테이블 확장 (diseases, allergies, dietary_preferences 등)
  - [ ] 마이그레이션 SQL 파일 작성 및 테스트

- [ ] **질병 관리 시스템**
  - [ ] 12개 주요 질병 데이터 시드 (당뇨, 심혈관, CKD, 통풍, 위장, 임신 관련)
  - [ ] 질병별 제외 음식 데이터 시드 (문서 기반)
  - [ ] 질병별 칼로리 조정 계수 설정
  - [ ] 질병 관리 서비스 (`lib/health/disease-manager.ts`)
  - [ ] 질병 선택 UI 컴포넌트 (`components/health/disease-selector.tsx`)
  - [ ] 질병별 영양소 비율 조정 로직

- [ ] **알레르기 관리 시스템 (엄격 모드)**
  - [ ] 8대 주요 알레르기 데이터 시드
  - [ ] 특수 알레르기 데이터 시드 (니켈, 아황산염, 히스타민, 셀리악, FDEIA)
  - [ ] 알레르기 파생 재료 데이터 시드 (새우→새우젓, 우유→치즈 등)
  - [ ] 알레르기 관리 서비스 (`lib/health/allergy-manager.ts`)
  - [ ] 알레르기 선택 UI 컴포넌트 (`components/health/allergy-selector.tsx`)
  - [ ] 레시피 알레르기 검사 로직 (모든 재료, 소스, 조미료 포함)
  - [ ] 안전 경고 컴포넌트 (`components/health/safety-warning.tsx`)
  - [ ] 불확실한 재료 정보 안내 문구 표시

- [ ] **칼로리 계산 시스템 고도화**
  - [ ] 다중 공식 지원 (Mifflin-St Jeor, Harris-Benedict, EER)
  - [ ] 연령대별 공식 자동 선택 (성인, 어린이, 임신부)
  - [ ] 질병 조정 적용 (당뇨, 비만 시 감량)
  - [ ] 계산 공식 표시 기능 (`components/health/calorie-calculator-display.tsx`)
  - [ ] 수동 목표 칼로리 설정 기능
  - [ ] 계산된 칼로리 vs 목표 칼로리 선택 UI
  - [ ] 칼로리 계산 서비스 (`lib/health/calorie-calculator-enhanced.ts`)
  - [ ] 공식 설명 문자열 생성 기능

- [ ] **프리미엄 식단 타입 확장**
  - [ ] 도시락 식단 필터 (반찬 위주, 보관 용이)
  - [ ] 헬스인 식단 필터 (고단백 저지방, 닭가슴살 중심)
  - [ ] 다이어트 식단 필터 (저탄수화물)
  - [ ] 비건 식단 필터 (모든 동물성 제외)
  - [ ] 베지테리언 식단 필터 (육류, 생선 제외)
  - [ ] 프리미엄 식단 필터 서비스 (`lib/diet/premium-diet-filters.ts`)
  - [ ] 건강정보 폼에 식단 타입 선택 UI 추가
  - [ ] 프리미엄 전용 배지 표시

- [ ] **응급조치 정보 시스템**
  - [ ] 응급조치 데이터 시드 (아나필락시스, 경증 반응)
  - [ ] 에피네프린 자가주사기 사용법 데이터
  - [ ] 응급조치 메인 페이지 (`app/(dashboard)/health/emergency/page.tsx`)
  - [ ] 알레르기별 응급조치 상세 페이지 (`app/(dashboard)/health/emergency/[allergyCode]/page.tsx`)
  - [ ] 응급 연락처 (119) 강조 표시
  - [ ] 증상별 대처법 안내
  - [ ] 위험 신호 인식 가이드

- [ ] **선호/비선호 식재료 관리**
  - [ ] 선호 식재료 입력 UI
  - [ ] 비선호 식재료 입력 UI
  - [ ] 식단 생성 시 선호도 반영 로직
  - [ ] 선호도 점수 시스템

- [ ] **API 엔드포인트**
  - [ ] `GET /api/health/diseases` - 질병 목록 조회
  - [ ] `GET /api/health/diseases/[code]` - 질병 상세 정보
  - [ ] `GET /api/health/allergies` - 알레르기 목록 조회
  - [ ] `GET /api/health/allergies/[code]/derived` - 파생 재료 조회
  - [ ] `POST /api/health/calculate-calories` - 칼로리 계산
  - [ ] `GET /api/health/emergency/[allergyCode]` - 응급조치 정보

- [ ] **건강정보 입력 폼 대폭 개선**
  - [ ] 질병 정보 섹션 (다중 선택 + 사용자 정의)
  - [ ] 알레르기 정보 섹션 (8대 + 특수 + 사용자 정의)
  - [ ] 선호/비선호 식재료 섹션
  - [ ] 프리미엄 식단 타입 섹션
  - [ ] 칼로리 계산 방식 섹션 (자동 vs 수동)
  - [ ] 계산 공식 표시 토글
  - [ ] 폼 유효성 검사 강화

- [ ] **식단 생성 로직 통합**
  - [ ] 질병별 제외 음식 필터링 적용
  - [ ] 알레르기 파생 재료 필터링 적용 (엄격 모드)
  - [ ] 선호/비선호 식재료 반영
  - [ ] 프리미엄 식단 타입 필터링 적용
  - [ ] 칼로리 계산 결과 반영
  - [ ] 안전 경고 표시 로직

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

**마지막 업데이트**: 2025-12-01  
**다음 마일스톤**: 테스트 확대, 홈페이지 콘텐츠 관리 UI 개선, 성능 최적화
