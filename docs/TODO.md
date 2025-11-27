# 맛의 아카이브 (Flavor Archive) 개발 현황 & TODO

> 2025-11-26 업데이트. PRD/Design 문서와 실제 구현을 교차 검토해 **구현 완료 기능**과 **남은 우선순위 작업**만 남겼습니다.  
> 제외·삭제된 기능(레시피 댓글, 상업화 인증, GI 지수 필터, Gemini 이미지 파이프라인 등)은 본 문서에서 제거하거나 별도 백로그로 이관했습니다.

---

## ✅ 구현 완료 현황

### 1. 공통 인프라 & 레이아웃
- [x] Next.js 15 + React 19 + Tailwind v4 기반 프로젝트 초기화
- [x] Clerk 인증 및 Supabase 통합
- [x] 글로벌 헤더/푸터, 반응형 레이아웃, 로딩/에러 컴포넌트
- [x] 통합 검색 페이지(`app/search`) 및 홈 히어로 섹션

### 2. 📜 레거시 아카이브
- [x] 명인 인터뷰 뷰어 (HD 스트리밍, 프리미엄 광고 제거)
- [x] 전문 문서 카드(고증 정보, 출처, 도구 안내)
- [x] 지역/시대/재료 필터 + 검색 조합
- [x] 대체 재료/도구 안내 UI

### 3. 🍴 현대 레시피 북
- [x] 단계별 레시피 상세(타이머, 체크리스트, 초보자 가이드)
- [x] 레시피 업로드 + 자동 썸네일 할당(`actions/recipe-create.ts`)
- [x] 레시피 카드/검색/정렬 컴포넌트
- [x] 별점 및 신고 기능 (댓글 기능은 스코프 제외로 문서에서 삭제)

### 4. 🧠 AI 기반 맞춤 식단
- [x] 건강 정보 입력 페이지 및 스키마
- [x] 일일 식단 추천(칼로리/3대 영양소 규칙 기반) + 카드 UI
- [x] 식자재 원클릭 구매(외부 링크 연동)
- [x] 가족 구성원 관리 + `include_in_unified_diet` 토글
- [x] 가족 맞춤/통합 식단 생성 알고리즘 및 UI
- [x] 질병별 제외 음식 테이블 + 필터링 로직

### 5. 🍽️ 이미지 자산 (2025-11 기준)
- [x] `docs/foodjpg.md` 기반 음식명→이미지 경로 매핑 도입
- [x] `foodImageService`가 매핑/폴백 이미지를 반환, `actions/recipe-create`에서 자동 적용
- [x] `getRecipeImageUrlEnhanced()`로 상세/카드/AI 섹션 통일된 폴백 전략 유지
- [x] 관리자용 이미지 모니터링 대시보드(`components/admin/image-monitoring-dashboard.tsx`)

---

## ⏳ 진행 중 · 남은 우선순위 작업

### A. 이미지 자산 후속 조치
- [ ] `docs/foodjpg.md` 미등록 음식 정리 및 SVG 폴백 감소
- [ ] 이미지 노출/실패 로그 수집 및 성공률 대시보드 확장
- [ ] `foodImageService.getCacheStats()`/`scheduledCacheCleanup()` 실 구현 (현재 더미 반환)
- [ ] 필요 시 Gemini/외부 생성 파이프라인 재도입 여부 결정

### A-1. 가족 구성원 식단 제어 고도화
- [x] 구성원 카드/탭에서 “식단 포함/제외” 설정으로 바로 이동(개인 탭 내 CTA → 통합 탭 이동)
- [x] `individual-diet-tabs` ↔ `unified-diet-section` 포함 토글 상태 동기화 (로컬 상태/토글 콜백)
- [x] 장바구니 재료 수량 `+/-` 제어 및 포함 인원 기반 기본값/로그 동기화
- [ ] 문서화: PRD/TODO 업데이트 (본 문서 항목을 기준으로 세부 정의)

### A-2. AI 맞춤 식단 탭 확대
- [ ] “어제의 AI 맞춤 식단” 카드 옆에 가족 이름 탭 표시
- [ ] 탭마다 On/Off 토글로 칼로리·탄/단/지 합산 포함 여부 제어 (기본 전원 On)
- [ ] 설명 영역에 질병/알레르기, 제외 음식 이유 문장 표시
- [ ] `daily-diet-view.tsx`, `family-diet-tabs.tsx` 연동 계획 수립 (데이터 재계산, API scope=previous 핸들링)

### A-2.1. QA/검증 포인트
- [ ] 토글 On/Off 시 영양 합산 재계산 값이 포함 인원 수와 일치하는지 검증
- [ ] 질병/알레르기 기반 제외 음식이 설명 영역에 정확히 표시되는지 확인
- [ ] “기본 모두 포함” 상태에서 제외 후 다시 포함 시 초기 식단과 동일하게 표시되는지 확인

### B. 식단 기능 고도화
- [ ] 주간 식단 추천 모드 (C-2 확장)
- [ ] 일일 식단 알림 팝업 + `diet_notification_settings` 스키마(C-9)
- [ ] 어린이 성장기 전용 영양 비율 로직 (C-10)
- [ ] 어제 식단 + 가족 탭 UI 설계/구현

#### B-2. 어제 AI 식단 가족 탭 고도화 계획
- [ ] **요구사항 정밀화 & UX 플로우 정리**
  - “어제의 AI 맞춤 식단” 카드 우측에 **가족 이름 탭 바**를 배치하고, 기본 탭은 “전체”.
  - 각 탭에는 온/오프 토글 스위치를 노출하여, **온(On)** 상태일 때만 통합 식단에 해당 구성원이 포함되도록 명시.
  - 특이 사항(질병, 알레르기, 선호 제외 등)은 탭 하단 설명 영역에 자동 서술되도록 문구 규칙 정의.
- [ ] **데이터 계약 정의**
  - `GET /api/family/diet/[date]?scope=previous` 응답에 `includedMemberIds`, `nutrientTotals`(칼로리/탄·단·지), `exclusionNotes` 필드 추가.
  - 질병·알레르기 필터링 결과를 `excludedItems` 배열로 반환하여 UI 설명란에 사용.
  - “전체” 탭의 기본 상태는 `include_in_unified_diet = true` 구성원만 포함하며, 첫 로드 시 모든 구성원을 On 상태로 표시.
- [ ] **상태/이벤트 흐름 설계**
  - 탭 전환, 토글 변경, 제외 음식 확인 이벤트마다 `console.group('[FamilyDietTabs]')` + 핵심 payload 로깅.
  - 토글 변경 시 Optimistic UI → API PATCH (`/api/family/members/[id]/toggle-unified`) 호출 순서 정의.
  - 어제 식단이 없을 때의 빈 상태 UX 및 재생성 CTA 정리.
- [ ] **UI 컴포넌트 작업**
  - `components/family/family-diet-view.tsx`에 재사용 가능한 `FamilyMemberTabs` 컴포넌트 추가.
  - 탭 패널은 식단 카드 + 요약 패널로 구성, 요약 패널에는 선택된 구성원별 칼로리와 3대 영양소를 누적 표 형태로 노출.
  - 설명란에는 질병/알레르기 기반 제외 음식, 대체 메뉴 권장사항을 2~3줄 텍스트로 표기.
- [ ] **테스트 & 문서화**
  - 가족 수 1명/5명/10명, 질병 조건 O/X, 알레르기 다수/없음 등 시나리오별 플로우 테스트 항목 정의.
  - 접근성: 탭 키보드 내비게이션, 스크린리더 탭명(`aria-controls`) 확인 체크리스트 추가.
  - 문서 반영: PRD 3.3, 7.x 섹션 업데이트 및 사용자 가이드 초안에 탭 조작 시나리오 추가.

### B-1. 질병관리청 연동 및 예방접종 알림
- [ ] KCDC 공개 RSS/JSON 파싱 유틸 생성
- [ ] `app/api/health/kcdc/refresh` Server Action/Route 설계
- [ ] Supabase Edge Function 스케줄 및 실패 폴백 로직 정의
- [ ] 독감/예방주사 팝업 UI 및 리마인더 주기 설정 시나리오 작성

### C. 테스트 & 품질
- [ ] 유닛 테스트
- [ ] 통합 테스트
- [ ] E2E 및 모바일 실제 기기 테스트

### D. 보안 · 법무
- [ ] 민감 데이터 암호화(개인 건강 정보)
- [ ] 결제/상업 기능 추가 시 보안 플로우 설계

### E. 성능 · 접근성
- [ ] CDN 구성 (이미지/정적 자산)
- [ ] DB 쿼리 튜닝 및 모니터링
- [ ] 스크린리더/보이스오버 수동 테스트

### E-1. 팝업 인프라 & 앱 상태 QA
- [ ] 공통 팝업 상태 관리 훅 정의 및 로그 정책 수립
- [ ] 앱(WebView) 시뮬레이터에서 팝업 노출/차단 테스트 체크리스트 작성
- [ ] 디자인 시스템 기준(버튼 48px, 대비 4.5:1) 준수 여부 점검
- [ ] QA 완료 후 결과를 docs/PRD.md 7.4 섹션과 동기화

### F. 문서화
- [ ] API 문서
- [ ] 컴포넌트/스토리 문서
- [ ] 배포 & 운영 가이드
- [ ] 사용자 가이드(선택)

### F-1. 관리자 페이지 기본 틀
- [ ] `/admin` 레이아웃 와이어프레임 초안
- [ ] 텍스트/팝업 공지 편집 모듈 설계
- [ ] 관리자 권한 정책 및 Clerk 역할 매핑 문서화
- [ ] 알림/콘텐츠 변경 로그 뷰어 요구사항 정의

---

## 🗂️ 참고 문서 & 백로그 분리
- [PRD.md](./PRD.md) — 구현 완료 기능 중심으로 갱신됨
- [implementation-plan-family-diet.md](./implementation-plan-family-diet.md) — 가족 식단 세부 로드맵 (참고용)
- [image-loading-analysis.md](./image-loading-analysis.md) — 기존 문제 분석 기록 (현행 매핑 기반 구조 참고)
- `docs/notion-food-image-integration.md`, `docs/food-image-storage-spec.md` — 향후 이미지 파이프라인 재도입 시 사용

> Post-MVP 기능(상업화 인증, GI 지수 필터 등)은 별도 백로그 문서에서 재정의 후 재반영 예정입니다.
# 맛의 아카이브 (Flavor Archive) 개발 현황 & TODO

> 2025-11-26 업데이트. PRD/Design 문서와 실제 구현을 교차 검토해 **구현 완료 기능**과 **남은 우선순위 작업**만 남겼습니다.  
> 제외·삭제된 기능(레시피 댓글, 상업화 인증, GI 지수 필터, Gemini 이미지 파이프라인 등)은 본 문서에서 제거하거나 별도 백로그로 이관했습니다.

---

## ✅ 구현 완료 현황

### 1. 공통 인프라 & 레이아웃
- [x] Next.js 15 + React 19 + Tailwind v4 기반 프로젝트 초기화
- [x] Clerk 인증 및 Supabase 통합
- [x] 글로벌 헤더/푸터, 반응형 레이아웃, 로딩/에러 컴포넌트
- [x] 통합 검색 페이지(`app/search`) 및 홈 히어로 섹션

### 2. 📜 레거시 아카이브
- [x] 명인 인터뷰 뷰어 (HD 스트리밍, 프리미엄 광고 제거)
- [x] 전문 문서 카드(고증 정보, 출처, 도구 안내)
- [x] 지역/시대/재료 필터 + 검색 조합
- [x] 대체 재료/도구 안내 UI

### 3. 🍴 현대 레시피 북
- [x] 단계별 레시피 상세(타이머, 체크리스트, 초보자 가이드)
- [x] 레시피 업로드 + 자동 썸네일 할당(`actions/recipe-create.ts`)
- [x] 레시피 카드/검색/정렬 컴포넌트
- [x] 별점 및 신고 기능 (댓글 기능은 스코프 제외로 문서에서 삭제)

### 4. 🧠 AI 기반 맞춤 식단
- [x] 건강 정보 입력 페이지 및 스키마
- [x] 일일 식단 추천(칼로리/3대 영양소 규칙 기반) + 카드 UI
- [x] 식자재 원클릭 구매(외부 링크 연동)
- [x] 가족 구성원 관리 + `include_in_unified_diet` 토글
- [x] 가족 맞춤/통합 식단 생성 알고리즘 및 UI
- [x] 질병별 제외 음식 테이블 + 필터링 로직

### 5. 🍽️ 이미지 자산 (2025-11 기준)
- [x] `docs/foodjpg.md` 기반 음식명→이미지 경로 매핑 도입
- [x] `foodImageService`가 매핑/폴백 이미지를 반환, `actions/recipe-create`에서 자동 적용
- [x] `getRecipeImageUrlEnhanced()`로 상세/카드/AI 섹션 통일된 폴백 전략 유지
- [x] 관리자용 이미지 모니터링 대시보드(`components/admin/image-monitoring-dashboard.tsx`)

---

## ⏳ 진행 중 · 남은 우선순위 작업

### A. 이미지 자산 후속 조치
- [ ] `docs/foodjpg.md` 미등록 음식 정리 및 SVG 폴백 감소
- [ ] 이미지 노출/실패 로그 수집 및 성공률 대시보드 확장
- [ ] `foodImageService.getCacheStats()`/`scheduledCacheCleanup()` 실 구현 (현재 더미 반환)
- [ ] 필요 시 Gemini/외부 생성 파이프라인 재도입 여부 결정

### B. 식단 기능 고도화
- [ ] 주간 식단 추천 모드 (C-2 확장)
- [ ] 일일 식단 알림 팝업 + `diet_notification_settings` 스키마(C-9)
- [ ] 어린이 성장기 전용 영양 비율 로직 (C-10)

### C. 테스트 & 품질
- [ ] 유닛 테스트
- [ ] 통합 테스트
- [ ] E2E 및 모바일 실제 기기 테스트

### D. 보안 · 법무
- [ ] 민감 데이터 암호화(개인 건강 정보)
- [ ] 결제/상업 기능 추가 시 보안 플로우 설계

### E. 성능 · 접근성
- [ ] CDN 구성 (이미지/정적 자산)
- [ ] DB 쿼리 튜닝 및 모니터링
- [ ] 스크린리더/보이스오버 수동 테스트

### F. 문서화
- [ ] API 문서
- [ ] 컴포넌트/스토리 문서
- [ ] 배포 & 운영 가이드
- [ ] 사용자 가이드(선택)

---

## 🗂️ 참고 문서 & 백로그 분리
- [PRD.md](./PRD.md) — 구현 완료 기능 중심으로 갱신됨
- [implementation-plan-family-diet.md](./implementation-plan-family-diet.md) — 가족 식단 세부 로드맵 (참고용)
- [image-loading-analysis.md](./image-loading-analysis.md) — 기존 문제 분석 기록 (현행 매핑 기반 구조 참고)
- `docs/notion-food-image-integration.md`, `docs/food-image-storage-spec.md` — 향후 이미지 파이프라인 재도입 시 사용

> Post-MVP 기능(상업화 인증, GI 지수 필터 등)은 별도 백로그 문서에서 재정의 후 재반영 예정입니다.

# 맛의 아카이브 (Flavor Archive) 개발 TODO 리스트

> PRD와 Design 문서를 기반으로 작성된 기능 개발 체크리스트입니다.
> 완료된 항목은 `- [x]`로 체크 표시하세요.

---

## 📋 MVP 필수 기능 (우선순위 높음)

### 1. 프로젝트 기본 설정
- [x] 프로젝트 초기 설정 (Next.js, TypeScript, Tailwind CSS 등)
- [x] 환경 변수 설정 (`.env.example` 기반)
- [x] Supabase 프로젝트 연결 및 설정
- [x] 기본 디렉토리 구조 생성
- [x] 코드 품질 도구 설정 (ESLint, Prettier, Husky)

### 2. 공통 컴포넌트 및 레이아웃
- [x] 헤더 컴포넌트 (로고, 네비게이션, 로그인 버튼)
  - [x] 모바일 햄버거 메뉴 구현
  - [x] Sticky Header 기능
- [x] 푸터 컴포넌트 (회사정보, 링크, 면책 조항)
- [x] 반응형 레이아웃 시스템 구축
- [x] 로딩 스피너 및 에러 처리 컴포넌트

### 3. 인증 시스템
- [x] Supabase Auth 연동
- [x] 로그인/회원가입 페이지
- [x] 로그인 모달 컴포넌트
- [x] 사용자 프로필 관리

> 2025-11-21 상태 점검: 위 항목들은 `docs/status-report-20251121.md`에 근거와 함께 정리되었습니다.

---

## 📜 레거시 아카이브 (Section A)

### A-1. 명인 인터뷰 뷰어
- [x] 영상 플레이어 컴포넌트 (HD 이상 고화질 지원)
- [x] 영상 목록 페이지
- [x] 영상 상세 페이지
- [x] 프리미엄 구독 체크 기능 (광고 없이 무제한 시청)
- [x] 영상 데이터베이스 스키마 설계

### A-2. 전문 문서화 기록
- [x] 문서화 레시피 표시 컴포넌트
- [x] 재료 고증 정보 표시
- [x] 도구 사용법 안내
- [x] 출처 및 인물 정보 표시
- [x] 문서 데이터베이스 스키마 설계

### A-3. 아카이브 분류 검색
- [x] 지역별 필터 기능
- [x] 시대별 필터 기능
- [x] 재료별 필터 기능
- [x] 검색 기능 구현
- [x] 필터 조합 검색 기능

### A-4. 대체재료 안내
- [x] 전통 재료/도구 정보 표시
- [x] 현대 대체 재료/도구 정보 표시
- [x] 대체 정보 UI 컴포넌트

### 레거시 아카이브 UI
- [x] 홈페이지 레거시 아카이브 섹션 (Section A)
- [x] 레거시 아카이브 전체 페이지
- [x] 콘텐츠 카드 그리드 레이아웃
- [x] 모바일 가로 스크롤 카드 리스트
- [ ] 카드 호버 시 미리보기 기능 (선택적, Post-MVP)

---

## 🍴 현대 레시피 북 (Section B)

### B-1. 단계별 레시피 카드
- [x] 레시피 상세 페이지 (단계별 카드 형식)
- [x] 사진/영상/텍스트 기반 단계 표시
- [x] '요리 시작' 버튼 기능
- [x] 타이머 기능
- [x] 재료 체크리스트 기능
- [x] 초보자 맞춤형 가이드 UI

### B-2. 레시피 업로드 (UGC)
- [x] 레시피 업로드 페이지
- [x] 사진 업로드 기능 (외부 링크 방식)
- [x] 필수 정보 입력 폼 (재료, 난이도, 조리 시간)
- [x] 레시피 데이터베이스 스키마 설계
- [x] 이미지 저장소 연동 (외부 링크 사용)

### B-3. 커뮤니티 및 평가
- [x] 별점 평가 기능 (0.5점 단위, 1~5점)
- [ ] 댓글 기능 (요구사항에 따라 제외)
- [x] 평가 및 댓글 데이터베이스 스키마
- [x] 불량/저작권 침해 신고 기능
- [ ] 신고 처리 시스템 (관리자 기능, 추후 구현)

### B-4. 상업화 인증 시스템 (Post-MVP)
- [ ] 검증단 심사 시스템
- [ ] 상업화 인증 마크 UI
- [ ] 인증 레시피 필터 기능

### B-5. UGC 전용 마켓 섹션 (Post-MVP)
- [ ] 마켓플레이스 페이지
- [ ] 완제품 음식 판매 중개 기능
- [ ] 밀키트 판매 중개 기능
- [ ] 결제 시스템 연동

### 현대 레시피 북 UI
- [x] 홈페이지 현대 레시피 북 섹션 (Section B)
- [x] 레시피 북 전체 페이지
- [x] 레시피 카드 컴포넌트 (이미지, 별점, 제목, 시간, 난이도)
- [x] 인기 레시피 정렬 기능
- [x] 레시피 검색 기능

---

## 🧠 AI 기반 개인 맞춤 식단 큐레이션 (Section C)

### C-1. 건강 정보 입력
- [x] 건강 정보 입력 페이지
- [x] 알레르기 정보 입력 폼
- [x] 질병 정보 입력 폼 (당뇨, 고혈압 등)
- [x] 선호/비선호 식재료 선택
- [ ] 개인정보 암호화 처리 (MVP에서는 제외, 개발 단계)
- [x] 건강 정보 데이터베이스 스키마 설계

### C-2. AI 맞춤 식단 추천
- [x] 일일 식단 추천 알고리즘 (칼로리/3대 영양소 기반, 규칙 기반)
- [ ] 주간 식단 추천 기능 (추후 구현)
- [x] 식단 카드 UI 컴포넌트
- [x] 프리미엄 구독 체크 기능 (간단한 플래그 방식)

### C-3. 특수 식단 필터 (Post-MVP)
- [ ] GI 지수 필터 기능
- [ ] 저염식 필터 기능
- [ ] 영양소 목표 기반 필터

### C-4. 영양 코칭 리포트 (Post-MVP)
- [ ] 영양소 섭취 목표량 계산
- [ ] 리포트 생성 기능
- [ ] 리포트 표시 UI
- [ ] 프리미엄 구독 연동

### C-5. 식자재 원클릭 구매
- [x] 식자재 마켓플레이스 연동 (링크 제공 방식)
- [x] 추천 식단 재료 목록 추출
- [x] 한 번에 구매 기능 (외부 링크)
- [ ] 장바구니 기능 (추후 구현)

### AI 식단 큐레이션 UI
- [x] 홈페이지 AI 맞춤 식단 섹션 (Section C)
- [x] 식단 카드 컴포넌트 (아침/점심/저녁)
- [x] 영양 정보 표시 UI
- [x] 로그인하지 않은 사용자 안내 메시지
- [x] 건강 정보 미입력 사용자 안내

### C-6. 가족 구성원 관리
- [x] 데이터베이스 스키마 설계
  - [x] `family_members` 테이블 생성 (마이그레이션 파일)
  - [x] 인덱스 생성 (user_id, is_child)
  - [x] 트리거 설정 (updated_at 자동 업데이트)
- [x] 타입 정의
  - [x] `types/family.ts` 생성 (FamilyMember 인터페이스)
  - [x] FamilyDietPlan 인터페이스 정의
- [x] API 엔드포인트 구현
  - [x] `GET /api/family/members` - 구성원 목록 조회
  - [x] `POST /api/family/members` - 구성원 추가
  - [x] `PUT /api/family/members/[id]` - 구성원 수정
  - [x] `DELETE /api/family/members/[id]` - 구성원 삭제
- [x] 데이터베이스 쿼리 함수
  - [x] `lib/diet/family-queries.ts` 생성
  - [x] 가족 구성원 CRUD 함수 구현
- [x] UI 컴포넌트
  - [x] 가족 구성원 관리 페이지 (`/health/family`)
  - [x] `components/family/family-member-list.tsx` - 목록 컴포넌트
  - [x] `components/family/family-member-form.tsx` - 추가/수정 폼
  - [x] `components/family/family-member-card.tsx` - 구성원 카드
  - [x] 나이 입력 시 자동으로 `is_child` 판단 로직 (0-18세)

### C-6.1. 통합 식단 포함/제외 제어 기능
- [x] 데이터베이스 스키마 확장
  - [x] `family_members` 테이블에 `include_in_unified_diet` BOOLEAN 컬럼 추가
  - [x] 기존 레코드 업데이트 (모두 포함으로 설정)
  - [x] 인덱스 추가 (성능 최적화)
- [x] 타입 정의 확장
  - [x] `FamilyMember` 인터페이스에 `include_in_unified_diet?: boolean` 필드 추가
- [x] 구독 제한 조정
  - [x] 가족 구성원 수 제한 변경 (무료: 1명, 프리미엄: 5명, 엔터프라이즈: 무제한)
- [x] API 엔드포인트 확장
  - [x] POST/PUT 엔드포인트에서 `include_in_unified_diet` 필드 처리
  - [x] 토글 전용 PATCH 엔드포인트 추가 (`/api/family/members/[id]/toggle-unified`)
- [x] 통합 식단 생성 로직 수정
  - [x] `include_in_unified_diet = true`인 구성원만 통합 식단에 포함
  - [x] 통합 식단 생성 시 포함된 구성원 수 로깅
- [x] UI 컴포넌트 확장
  - [x] 가족 식단 탭에 각 구성원별 토글 스위치 추가
  - [x] 토글 변경 시 실시간 API 호출 및 UI 업데이트
  - [x] 로딩 상태 및 에러 처리

### C-7. 가족 맞춤 식단 추천
- [x] 데이터베이스 스키마 설계
  - [x] `diet_plans` 테이블 활용 (기존 테이블로 충분함)
  - [x] 인덱스 생성 (user_id, family_member_id, plan_date, is_unified) - 기존 인덱스 활용
- [x] 알고리즘 로직 구현
  - [x] `lib/diet/family-diet-generator.ts` 활용 (별도 파일 불필요)
  - [x] 개인 식단 생성 함수 (`recommendDailyDietForMember`) - `generatePersonalDiet` 활용
  - [x] 통합 식단 생성 함수 (`generateUnifiedDiet`) - 구현 완료
  - [x] 복합 가족 식단 생성 함수 (`generateFamilyDiet`) - 구현 완료
  - [x] 모든 구성원 제약 조건 동시 고려 로직 - 질병/알레르기 필터링 구현 완료
- [x] API 엔드포인트 구현
  - [x] `POST /api/family/diet/generate` - 식단 생성 (수동 트리거) - 구현 완료
  - [x] `GET /api/family/diet/[date]` - 특정 날짜 식단 조회 - 구현 완료
  - [x] 쿼리 파라미터: `?unified=true` (통합 식단 포함) - 필요시 확장 가능
- [x] 데이터베이스 쿼리 함수
  - [x] 가족 식단 저장 함수 - API 내 구현 완료
  - [x] 가족 식단 조회 함수 - API 내 구현 완료
- [x] UI 컴포넌트
  - [x] 가족 식단 표시 페이지 (`/health/family/diet/[date]`) - 구현 완료
  - [x] `components/family/family-diet-view.tsx` - 메인 뷰 - 구현 완료
  - [x] `components/family/individual-diet-tabs.tsx` - 구성원별 탭 - 구현 완료
  - [x] `components/family/unified-diet-section.tsx` - 통합 식단 섹션 - 구현 완료
  - [x] `components/family/diet-meal-card.tsx` - 식사 카드 - 구현 완료

### C-8. 질병별 제외 음식 관리
- [x] 데이터베이스 스키마 설계
  - [x] `disease_excluded_foods` 테이블 생성 (마이그레이션 파일)
  - [x] 인덱스 생성 (disease, excluded_food_name)
  - [x] UNIQUE 제약조건 (disease, excluded_food_name)
- [x] 초기 데이터 삽입
  - [x] 당뇨 제외 음식 목록 (설탕, 꿀, 시럽, 초콜릿, 케이크, 과자 등)
  - [x] 고혈압 제외 음식 목록 (소금, 간장, 된장, 젓갈, 라면, 햄, 베이컨 등)
  - [x] 제외 유형 구분: 'ingredient' (재료), 'recipe_keyword' (레시피 키워드)
- [x] 알고리즘 로직 구현
  - [x] `lib/diet/family-recommendation.ts`에 제외 음식 필터링 함수 추가
  - [x] `getExcludedFoods(disease)` - 질병별 제외 음식 조회
  - [x] `isRecipeExcludedForDisease()` - 레시피 제외 여부 확인
  - [x] 레시피 재료 조회 및 키워드 매칭 로직
- [x] 기존 알고리즘 통합
  - [x] `lib/diet/recommendation.ts`의 `isRecipeCompatible()` 함수 확장
  - [x] 질병별 제외 음식 필터링 로직 통합
- [ ] 관리자용 제외 음식 관리 기능 (선택적, Post-MVP)

### C-9. 일일 식단 알림 팝업
- [ ] 데이터베이스 스키마 설계
  - [ ] `diet_notification_settings` 테이블 생성 (마이그레이션 파일)
  - [ ] 인덱스 생성 (user_id)
- [ ] 크론 작업 구현
  - [ ] Supabase Edge Function 또는 Next.js API Route 생성
  - [ ] `POST /api/cron/generate-daily-diets` - 크론 작업 엔드포인트
  - [ ] API 키 검증 로직 (CRON_SECRET)
  - [ ] 모든 활성 사용자 조회 및 식단 생성 로직
  - [ ] 크론 스케줄 설정 (매일 오전 5시 KST)
- [ ] API 엔드포인트 구현
  - [ ] `GET /api/diet/notifications/check` - 알림 표시 여부 확인
  - [ ] `POST /api/diet/notifications/dismiss` - 오늘 알림 닫기
  - [ ] `PUT /api/diet/notifications/settings` - 알림 설정 업데이트
- [ ] 클라이언트 로직
  - [ ] 사용자 접속 시 오전 5시 이후 확인 로직
  - [ ] 오늘 식단 존재 여부 확인
  - [ ] 마지막 알림 날짜 확인 (중복 방지)
- [ ] UI 컴포넌트
  - [ ] `components/diet/diet-notification-popup.tsx` - 팝업 모달 컴포넌트
  - [ ] 식단 카드 표시 (아침/점심/저녁)
  - [ ] "닫기" 버튼 (오늘 하루 보지 않기)
  - [ ] "식단 보기" 버튼 (상세 페이지로 이동)
- [ ] 브라우저 알림 기능
  - [ ] 브라우저 알림 권한 요청
  - [ ] 알림 표시 로직 (선택적)
- [ ] 알림 설정 페이지
  - [ ] `/health/family/notifications` 페이지
  - [ ] 팝업 알림 활성화/비활성화 토글
  - [ ] 브라우저 알림 활성화/비활성화 토글
  - [ ] 알림 시간 설정 (기본: 오전 5시)

### C-10. 어린이 성장기 식단 추천
- [ ] 나이 판단 로직
  - [ ] `is_child` 자동 설정 로직 (0-18세)
  - [ ] 가족 구성원 추가/수정 시 자동 판단
- [ ] 영양소 비율 설정
  - [ ] 탄수화물 50%, 단백질 20%, 지방 30% 목표 비율
  - [ ] 식사별 칼로리 분배 (아침 25%, 점심 35%, 저녁 30%, 간식 10%)
- [ ] 알고리즘 로직 구현
  - [ ] `lib/diet/family-recommendation.ts`에 어린이 식단 함수 추가
  - [ ] `recommendChildDiet()` - 어린이 식단 추천 함수
  - [ ] `isRecipeCompatibleForChild()` - 어린이용 레시피 호환성 검사
  - [ ] `selectRecipesByNutritionRatio()` - 영양소 비율 고려 레시피 선택
  - [ ] 영양소 균형 검증 로직
- [ ] 통합
  - [ ] 가족 식단 생성 시 어린이 자동 감지 및 특별 처리
  - [ ] 어린이 식단 UI 표시 (기존 식단 카드 재사용)

---

## 🏠 홈페이지 메인 페이지

### 히어로 섹션
- [x] 히어로 섹션 컴포넌트
- [x] 슬로건 표시
- [x] 메인 검색창 (레시피 통합 검색)
- [x] 빠른 접근 버튼 3개 (레거시, 레시피북, AI식단)
- [x] 배경 이미지/비디오 처리 (이미지 fallback 포함)
- [x] 모바일 반응형 레이아웃

### 통합 검색 기능
- [x] 레시피 통합 검색 API (레시피 + 레거시 아카이브 + 기타)
- [x] 검색 결과 페이지 (통합 리스트, 타입별 태그)
- [x] 관련도순 정렬
- [ ] 검색어 자동완성 기능 (MVP에서는 제외)

---

## 🎨 디자인 시스템

### 색상 및 스타일
- [x] 색상 팔레트 설정 (주황/빨강, 녹색, 금색)
- [x] 타이포그래피 설정 (Jalnan 폰트 적용)
- [x] 버튼 스타일 컴포넌트 (shadcn/ui 기반)
- [x] 카드 스타일 컴포넌트 (브랜드 색상 적용)
- [x] 아이콘 시스템 (lucide-react)

### 반응형 디자인
- [x] 모바일 레이아웃 테스트 가이드 작성
- [x] 태블릿 레이아웃 테스트 가이드 작성
- [x] 데스크톱 레이아웃 테스트 가이드 작성
- [x] 터치 친화적 요소 크기 조정 (최소 44px) - 가이드 작성

---

## 🔒 보안 및 법적 준수

### 보안
- [ ] 개인정보 암호화 처리 (Post-MVP, 개발 단계에서는 제외)
- [ ] 결제 정보 보안 처리 (Post-MVP, 결제 시스템 연동 시 구현)
- [x] API 인증 및 권한 관리 (Clerk 기반 인증 적용)
- [x] XSS, CSRF 방어 (Next.js 기본 기능 활용)

### 법적 고지
- [x] 이용약관 페이지
- [x] 개인정보처리방침 페이지
- [x] 의료 면책 조항 표시 (이용약관 및 푸터에 포함)
- [x] 통신판매 중개자 고지 (이용약관에 포함)

---

## 🚀 성능 최적화

### 성능
- [x] 이미지 최적화 (Next.js Image 컴포넌트 적용 완료)
- [ ] CDN 설정 (프로덕션 배포 시 설정)
- [x] 레시피 검색 결과 3초 이내 표시 최적화 (기본 구현 완료, 추가 최적화 필요 시 진행)
- [x] 코드 스플리팅 및 지연 로딩 (Next.js 기본 기능 활용)
- [ ] 데이터베이스 쿼리 최적화 (성능 모니터링 후 필요 시 진행)

---

## 📱 접근성 (Accessibility)

- [x] 모든 이미지에 Alt Text 추가
- [x] 키보드 네비게이션 지원 (shadcn/ui 기반 컴포넌트 기본 지원)
- [x] 색상 대비 비율 WCAG AA 기준 준수 (디자인 시스템 적용)
- [ ] 스크린 리더 호환성 테스트 (수동 테스트 필요)

---

## 🧪 테스트

- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] E2E 테스트 작성 (선택적)
- [ ] 모바일 디바이스 테스트

---

## 📚 문서화

- [ ] API 문서 작성
- [ ] 컴포넌트 문서 작성
- [ ] 배포 가이드 작성
- [ ] 사용자 가이드 작성 (선택적)

---

## 🔄 Post-MVP 기능 (추후 개발)

### AI 고도화
- [ ] C-3: 특수 식단 필터 (GI 지수 연동)
- [ ] C-4: 영양 코칭 리포트

### 창작자 경제
- [ ] B-4: 상업화 인증 시스템
- [ ] B-5: UGC 전용 마켓 섹션

### 수익 모델 다각화
- [ ] 밀키트 판매 시스템
- [ ] 라이선싱 기능
- [ ] B2B 라이선싱

---

---

## 🗂️ 가족 맞춤 식단 기능 구현 단계

> 상세 구현 계획은 [implementation-plan-family-diet.md](./implementation-plan-family-diet.md) 참고

### Phase 1: 데이터베이스 스키마 구축 (1-2일)
- [ ] 마이그레이션 파일 생성: `YYYYMMDDHHmmss_create_family_diet_tables.sql`
- [ ] `family_members` 테이블 생성
- [ ] `disease_excluded_foods` 테이블 생성 및 초기 데이터 삽입
- [ ] `family_diet_plans` 테이블 생성
- [ ] `diet_notification_settings` 테이블 생성
- [ ] 마이그레이션 실행 및 테스트

### Phase 2: 타입 정의 및 유틸리티 함수 (1일)
- [ ] `types/family.ts` 생성 (FamilyMember, FamilyDietPlan 인터페이스)
- [ ] `lib/diet/family-queries.ts` 생성 (가족 구성원 CRUD 함수)

### Phase 3: 알고리즘 로직 구현 (2-3일)
- [ ] `lib/diet/family-recommendation.ts` 생성
- [ ] 질병별 제외 음식 필터링 함수
- [ ] 어린이 식단 추천 함수
- [ ] 복합 가족 식단 생성 함수
- [ ] 기존 `lib/diet/recommendation.ts` 확장
- [ ] 테스트 및 디버깅

### Phase 4: API 엔드포인트 구현 (2일)
- [ ] 가족 구성원 관리 API (GET, POST, PUT, DELETE)
- [ ] 가족 식단 생성/조회 API
- [ ] 식단 알림 확인/설정 API
- [ ] 크론 작업 API (서버 전용)

### Phase 5: UI 컴포넌트 구현 (3-4일)
- [ ] 가족 구성원 관리 페이지
- [ ] 식단 알림 팝업 컴포넌트
- [ ] 가족 식단 표시 페이지
- [ ] 알림 설정 페이지

### Phase 6: 크론 작업 구현 (1-2일)
- [ ] Supabase Edge Function 또는 Next.js API Route 생성
- [ ] 크론 스케줄 설정
- [ ] 테스트 (수동 트리거)

### Phase 7: 통합 테스트 및 최적화 (2일)
- [ ] 전체 플로우 테스트
- [ ] 성능 최적화 (캐싱, 인덱스)
- [ ] 에러 처리 개선
- [ ] 로그 추가

---

## 🍽️ 이미지 로딩 기능 개선 계획

> 현재 레시피와 AI 식단에서 불러오는 사진이 제대로 작동하지 않는 문제를 해결하기 위한 상세 구현 계획입니다.

### Phase 1: 문제 분석 및 현재 상태 파악 (1일) ✅
- [x] 현재 이미지 로딩 방식 분석
  - 레시피 상세 페이지: `recipe.thumbnail_url` 직접 사용
  - AI 식단 카드: `getRecipeImageUrlEnhanced()` 함수로 폴백 처리
  - 문제: 레시피 생성 시 `thumbnail_url`이 설정되지 않아 항상 기본 SVG 이미지 표시
  - **분석 문서**: `docs/image-loading-analysis.md` 참조
- [x] Pixabay 이미지 캐싱 시스템 상태 확인
  - `food_images_cache` 테이블 데이터 확인
  - 캐시 적중률 및 만료 데이터 분석
  - **SQL 쿼리**: `scripts/check-image-cache-status.sql` 사용
  - **TypeScript 분석 스크립트**: `scripts/analyze-image-loading-issues.ts` 사용
- [x] API 호출 로그 분석으로 문제 지점 식별
  - **주요 문제점**:
    1. 레시피 생성 시 이미지 미할당 (사용자 입력 없으면 `null`)
    2. 레시피 상세 페이지 폴백 이미지 처리 없음
    3. 일관성 없는 이미지 처리 (카드 vs 상세 페이지)

### Phase 2: 레시피 생성 시 이미지 자동 할당 구현 (2일) ✅
- [x] 레시피 생성 API 확장 (`actions/recipe-create.ts`)
  - 레시피 제목으로 이미지 검색 및 캐싱 로직 추가
  - `thumbnail_url` 필드 자동 설정
  - 이미지 검색 실패 시 적절한 카테고리별 기본 이미지 사용
- [x] 이미지 검색 우선순위 로직 구현
  1. 레시피 제목으로 Pixabay 검색
  2. 검색 실패 시 카테고리별 기본 이미지 (SVG)
  3. 이미지 품질 검증 (calculateImageQualityScore 활용)
- [x] 데이터베이스 스키마 검토 및 인덱스 최적화
  - `recipes.thumbnail_url` 필드 활용도 확인
  - 이미지 URL 길이 제한 검토

### Phase 3: 이미지 캐싱 시스템 개선 (2일) ✅
- [x] 캐시 만료 정책 구현
  - `last_accessed_at` 필드 활용한 LRU 캐시 전략
  - 30일 이상 미접근 이미지 자동 삭제
  - 캐시 크기 제한 (음식당 최대 5개 이미지)
- [x] 캐시 효율성 모니터링
  - 캐시 적중률 측정 함수 추가 (`calculateCacheHitRate`)
  - 캐시 통계 대시보드 (`getCacheStats` 메소드)
- [x] 이미지 품질 기반 캐싱 최적화
  - 품질 점수 50점 이상만 캐싱
  - 동일 음식의 중복 이미지 방지 (유사도 기반 검사)

### Phase 4: 이미지 로딩 성능 및 오류 처리 개선 (2일) ✅
- [x] 이미지 프리로딩 구현
  - 식단 카드 표시 전 이미지 미리 로딩
  - 로딩 상태 표시 개선 (Skeleton UI 추가)
- [x] 오류 처리 강화
  - 이미지 URL 유효성 검증 함수 개선 (타임아웃, 콘텐츠 타입 검증)
  - 네트워크 타임아웃 처리 (5초 타임아웃 적용)
  - 재시도 로직 구현 (최대 3회, 지수적 백오프 적용)
- [x] 이미지 최적화
  - Next.js Image 컴포넌트 최적화 설정 (quality, placeholder, blur)
  - 외부 이미지 서비스(WebP 지원) 최적화 생략
  - 반응형 이미지 사이즈 설정 개선 (더 세밀한 breakpoint)

### Phase 5: 모니터링 및 유지보수 (1일)
- [ ] 이미지 로딩 로그 추가
  - 성공/실패율 추적
  - 평균 로딩 시간 측정
  - 에러 패턴 분석
- [ ] 캐시 정리 크론 작업 구현
  - Supabase Edge Function 활용
  - 매일 자정 실행
- [ ] 성능 모니터링
  - 이미지 로딩 속도 측정
  - 캐시 효율성 분석
  - 사용자 경험 개선 지표

### Gemini 기반 음식 이미지 아카이브 파이프라인 (신규, 5~7일)
> 음식명으로 Google Gemini 이미지 API를 호출해 **하루 3장의 이미지**를 생성하고, Supabase Storage에 장기 보관하기 위한 상세 계획입니다. 저장 비용은 Supabase Storage(또는 외부 객체 스토리지)로 관리하고, Notion은 큐레이션/리뷰용 메모에 한정합니다.  
> 우선순위: 국/찌개 카테고리 데이터를 먼저 채우고, 해당 카테고리 작업이 완료된 뒤에만 레시피의 반찬 카테고리로 넘어갑니다.

#### Phase 1: 데이터 모델 및 스토리지 설계 (1일)
- [x] `foods` 테이블 확장: `needs_images`, `image_priority`, `last_generated_at` 컬럼 추가
- [x] 음식 유형 필드 체계화 (`category`: soup_stew, side_dish, dessert 등) 및 국/찌개 우선 처리 플래그 추가
- [x] `food_image_batches` 테이블 설계
  - 필드: `id`, `food_id`, `batch_date`, `status(pending|success|failed)`, `error_reason`, `gemini_latency_ms`
- [x] `food_images` 테이블 설계
  - 필드: `id`, `food_id`, `batch_id`, `prompt`, `gemini_response_meta`, `storage_path_original`, `storage_path_thumbnail`, `quality_score`, `created_at`
- [x] Supabase Storage 버킷 구조 정의
  - 경로: `food-images/{foodId}/{yyyyMMdd}/{size}.webp`
  - 썸네일/원본 2종 저장, WebP 변환 규칙 문서화 (`docs/food-image-storage-spec.md`)
- [x] Notion 연계 방향 정리
  - Notion은 "선별된 이미지와 설명 링크"만 기록, 원본 파일은 저장하지 않음 (`docs/notion-food-image-integration.md`)

#### Phase 2: Gemini 이미지 생성 모듈 (1.5일)
- [x] Gemini API 클라이언트 래퍼 작성 (`lib/gemini/image-client.ts`)
  - 프롬프트 템플릿, 모델/사이즈/스타일 파라미터 상수화
  - 요청/응답 로깅(PII 제외)
- [x] 프롬프트 생성기 구현 (`lib/image-pipeline/prompt-builder.ts`)
  - `docs/foodprompt.md` 가이드라인을 머신 가독 형태로 파싱해 요소(메인 음식, 스타일/분위기, 배경/소품, 기술 요소)를 Weight 기반으로 선택
  - 음식명, 계절, 촬영 스타일을 조합한 **3개 프롬프트** 생성 (국/찌개 전용 템플릿 우선)
  - 한국어/영어 병행 표현, 로마자 표기, 부정 프롬프트(negative prompt) 옵션 반영
  - 재사용 가능하도록 `buildPrompt(foodName, category, season)` API 정의
- [x] 응답 파서 + 이미지 바이너리 변환 로직
  - Base64 → Buffer → WebP 변환 (`lib/image-pipeline/response-parser.ts`)
  - 메타데이터(json) 저장 포맷 표준화
- [x] `.env`에 추가된 `GEMINI_API_KEY` 기반 연결 검증
  - 개발/프로덕션 환경 모두 `.env.local` → Edge Function 환경 변수 싱크 가이드 작성
  - 키 누락 시 명확한 에러 메시지와 확인 체크리스트 제공 (`lib/gemini/env-validation.ts`)

#### Phase 3: Storage 업로드 및 메타데이터 기록 (1일)
- [x] 이미지 리사이저/압축기 (`lib/image-pipeline/image-processor.ts`)
  - sharp 기반 WebP 변환
  - 썸네일(512px), 원본(2048px) 두 버전
- [x] Supabase Storage 업로더 (`lib/image-pipeline/storage-uploader.ts`)
  - 경로 생성, 중복 파일 처리, 업로드 재시도(최대 3회)
- [x] `food_images`/`food_image_batches` insert 함수 작성
  - 트랜잭션 유사 동작: 배치 상태 → 진행 중 → 성공/실패 업데이트
  - 실패 시 에러 메시지 저장 (`lib/image-pipeline/database-operations.ts`)

#### Phase 4: 일일 스케줄러 & 파이프라인 제어 (1.5일)
- [x] Supabase Edge Function `generate-food-images` 작성
  - 입력: 하루당 처리 음식 수(기본 1), 음식 선택 로직(`needs_images` + 카테고리 우선순위)
  - 실행 단계: 배치 생성 → 프롬프트 생성 → Gemini 호출 → Storage 업로드 → 메타데이터 기록
  - (`supabase/functions/generate-food-images/index.ts`)
- [x] Supabase Scheduled Function 크론 설정
  - 매일 오전 4시 UTC (KST 13시) 실행 가능 (수동 설정 필요)
  - 실패 시 로깅으로 대체 (Slack/Webhook은 옵션)
- [x] 재시도/에러 처리
  - Gemini 오류 발생 시 당일에는 추가 재시도 없이 배치를 `failed` 상태로 두고, 다음날 새 배치에서 재시도
  - Storage 오류도 동일 정책 적용
- [x] 실행 로그 표준화
  - `console.group('generate-food-images')` 패턴 준수
  - Latency, 프롬프트, 저장 경로, 실패 사유 기록

#### Phase 5: 모니터링 & 운영 자동화 (1일)
- [x] `food_image_batches` 기반 대시보드/쿼리 문서화
  - 최근 7일 성공률, 평균 처리 시간, 실패 원인 (`docs/image-generation-monitoring.md`)
- [x] Storage 비용 추적 SQL/스크립트 작성
  - 월별 저장 용량/이미지 수 집계 (`docs/storage-cost-tracking.md`)
- [x] Notion 자동 동기화(선택)
  - 성공한 이미지 중 상위 품질만 Notion 페이지에 링크 추가
  - Supabase Function → Notion API 연동 스크립트 (`supabase/functions/sync-notion-images/index.ts`)
- [x] 장애 대응 가이드
  - Gemini quota 초과 시 대안(다음날 재시작, 다른 모델)
  - Storage 업로드 누락 시 수동 재실행 절차 (`docs/error-handling-guide.md`)

#### Phase 6: 테스트 & 문서화 (1일)
- [x] 단위 테스트
  - 프롬프트 빌더, Gemini 클라이언트, 이미지 프로세서, 업로더, 응답 파서, DB 조작 함수
- [ ] 통합 테스트
  - Edge Function 로컬 실행 → Storage mock 버킷에 저장 확인
- [ ] 시뮬레이션 스크립트
  - 개발 환경에서 2~3개 음식 대상으로 하루치 생성 연습
- [x] 운영 문서 업데이트
  - `docs/TODO.md` 상태 체크 및 업데이트
  - 복구/재실행 절차, 환경 변수 목록 정리
  - **데이터 축적 후에는 생성된 이미지 데이터베이스만으로 서비스에서 불러오도록 전환할 계획**(라이브 생성 호출 최소화)

#### 환경 변수 및 보안 메모
- `GEMINI_API_KEY`, `IMAGE_PIPELINE_CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`는 Edge Function 환경 변수로 주입
- 프롬프트/응답 로그에서 개인정보 및 과도한 Base64 데이터 저장 금지
- 개발 환경에서는 Staging Storage 버킷 사용, 프로덕션 전환 시 버킷 분리

#### Notion 활용 방안
- 이미지 원본은 Supabase에, Notion에는 “선정된 이미지 썸네일 + Storage 경로 링크 + 메모”만 기록
- 자동 동기화 스크립트가 Notion rate limit을 초과하지 않도록 일일 1회 이하로 실행
- Notion 페이지 템플릿: 음식 이름, 이미지 링크, 생성일, 품질 메모, 태그(계절/스타일)

### 구현 시 고려사항
- **API 제한**: Pixabay 무료 티어는 시간당 100회, 월 5,000회 제한
- **저장소**: 외부 이미지 URL 사용으로 Supabase Storage 비용 절감
- **성능**: 캐시 우선 전략으로 API 호출 최소화
- **안정성**: 다중 폴백 메커니즘으로 이미지 로딩 실패 방지
- **확장성**: 이미지 소스 추가 가능하도록 모듈화 (Unsplash, Pexels 등)

### 예상 결과물
- 레시피 생성 시 자동 이미지 할당
- AI 식단 카드에 실제 음식 사진 표시
- 이미지 로딩 속도 50% 향상
- 캐시 적중률 80% 이상 달성
- 이미지 로딩 실패율 1% 미만

---

## 📝 구현 상세 사항

### 가족 구성원 관리 (C-6)
- **입력 방식**: 별도 페이지에서 관리 (`/health/family` 또는 `/family`)
- **구성원 정보**: 이름, 나이, 성별, 질병 정보, 알레르기 정보
- **관계 설정**: 본인, 배우자, 자녀 등 관계 정보 (선택적)

### 팝업 알림 방식 (C-9)
- **웹사이트 내 팝업**: 모달 컴포넌트로 식단 표시 (기본)
- **브라우저 알림**: 사용자 권한 허용 시 브라우저 알림도 제공 (선택적)
- **설정**: 사용자가 팝업 표시 여부를 설정할 수 있음

### 스케줄링 방식 (C-9)
- **서버 크론**: 매일 오전 5시에 자동으로 식단 생성 (Supabase Edge Functions 또는 외부 크론 서비스)
- **클라이언트 확인**: 사용자가 사이트 접속 시 오전 5시 이후인지 확인하여 팝업 표시

### 질병별 제외 음식 관리 (C-8)
- **저장 방식**: 데이터베이스 테이블 (`disease_excluded_foods`)로 관리
- **필터링**: 레시피 추천 알고리즘에서 질병별 제외 음식 목록을 참조하여 자동 필터링
- **예시**:
  - 당뇨: 설탕, 꿀, 단순 탄수화물 등 고당류 음식
  - 고혈압: 나트륨 함량이 높은 음식 (일일 나트륨 기준 초과)

### 어린이 식단 판단 기준 (C-10)
- **나이 범위**: 0-18세
- **영양소 비율**: 탄수화물 50%, 단백질 20%, 지방 30% (표준 성장기 비율)
- **추가 고려사항**: 칼슘, 철분 등 성장에 필요한 미네랄 고려

### 복합 가족 식단 생성 방식 (C-7)
- **개인별 식단**: 각 구성원별로 개별 식단 생성 (당뇨 아버지용, 고혈압 어머니용, 어린이용)
- **통합 식단**: 가족 전체가 함께 먹을 수 있는 식단 생성 (모든 구성원의 제약 조건을 만족하는 레시피만 포함)
- **표시 방식**: 두 가지 식단을 모두 제공하여 사용자가 선택 가능

---

**마지막 업데이트**: 2025년 1월  
**참고 문서**: 
- [PRD.md](./PRD.md) - 제품 요구 사항 정의서
- [design.md](./design.md) - 디자인 가이드
- [implementation-plan-family-diet.md](./implementation-plan-family-diet.md) - **가족 맞춤 식단 기능 상세 구현 계획서** ⭐
