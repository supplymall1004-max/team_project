# 라우트 구조 정리 문서

> **작성일**: 2025-01-27  
> **목적**: 프로젝트의 웹 주소(라우트) 구조를 일관성 있게 정리하고 문서화

---

## 📋 목차

1. [라우트 구조 원칙](#라우트-구조-원칙)
2. [메인 라우트](#메인-라우트)
3. [설정 관련 라우트](#설정-관련-라우트)
4. [건강 관련 라우트](#건강-관련-라우트)
5. [식단 관련 라우트](#식단-관련-라우트)
6. [레시피 관련 라우트](#레시피-관련-라우트)
7. [기타 라우트](#기타-라우트)
8. [리다이렉트 규칙](#리다이렉트-규칙)

---

## 라우트 구조 원칙

### 1. 계층적 구조
- 관련 기능은 동일한 경로 그룹으로 묶습니다
- 예: 모든 설정은 `/settings` 하위에 위치

### 2. 명확한 네이밍
- 경로명은 기능을 명확히 나타냅니다
- 복수형 사용: `/recipes`, `/settings` (목록/관리 페이지)
- 단수형 사용: `/profile`, `/health` (단일 리소스 또는 메인 페이지)

### 3. 일관성 유지
- 유사한 기능은 유사한 경로 구조를 사용합니다
- 중복된 경로는 제거하고 하나로 통합합니다

---

## 메인 라우트

### 홈 및 검색
- `/` - 홈 페이지
- `/search` - 검색 결과 페이지
- `/about` - 소개 페이지

### 인증
- `/sign-in` - 로그인
- `/sign-up` - 회원가입

---

## 설정 관련 라우트

**모든 설정 관련 기능은 `/settings` 하위에 위치합니다.**

### 설정 메인
- `/settings` - 설정 메인 페이지 (모든 설정 항목 목록)

### 개별 설정 페이지
- `/settings/profile` - 프로필 설정 (이름, 이메일, 프로필 사진)
- `/settings/health` - 건강 정보 관리 (건강 정보 요약 및 수정 링크)
- `/settings/family` - 가족 구성원 관리
- `/settings/notifications` - 알림 설정
- `/settings/billing` - 결제 관리
  - `/settings/billing/history` - 결제 내역
  - `/settings/billing/promo` - 프로모션 코드 등록
  - `/settings/billing/cancel` - 구독 취소

### 리다이렉트
- `/profile` → `/settings/profile` (프로필 설정으로 통합)

---

## 건강 관련 라우트

**건강 관련 기능은 `/health` 하위에 위치합니다.**

### 건강 메인
- `/health` - 건강 관리 메인 페이지 (대시보드, 프로필, 가족, 기록, 인사이트 탭)

### 건강 프로필
- `/health/profile` - 건강 정보 입력/수정 페이지
  - 기본 정보 (나이, 성별, 키, 몸무게, 활동량)
  - 질병 정보
  - 알레르기 정보
  - 선호/비선호 식재료

### 가족 건강
- `/health/family` - 가족 건강 메인
- `/health/family/[memberId]` - 가족 구성원별 건강 상세
- `/health/family/diet/[date]` - 가족 식단
- `/health/family/notifications` - 가족 건강 알림

### 건강 기록
- `/health/vaccinations` - 예방접종 기록
- `/health/medication-records` - 약물 복용 기록
- `/health/hospital-records` - 병원 기록
- `/health/disease-records` - 질병 기록

### 건강 시각화
- `/health/visualization/status` - 건강 상태 시각화
- `/health/visualization/nutrition` - 영양 균형 시각화
- `/health/visualization/impact` - 식단 효과 시각화

### 건강 데이터 소스
- `/health/data-sources` - 데이터 소스 목록
- `/health/data-sources/connect` - 데이터 소스 연결
- `/health/sync-status` - 동기화 상태

### 건강 대시보드 (프리미엄)
- `/(dashboard)/health/dashboard` - 건강 관리 대시보드
- `/(dashboard)/health/notifications/settings` - 건강 알림 설정
- `/(dashboard)/health/emergency` - 응급 상황 대응
  - `/(dashboard)/health/emergency/[allergyCode]` - 알레르기별 응급 대응
- `/(dashboard)/health/premium` - 프리미엄 건강 기능
  - `/(dashboard)/health/premium/travel-risk` - 여행 위험도
  - `/(dashboard)/health/premium/periodic-services` - 정기 검진

### 리다이렉트
- `/health/manage` → `/settings` (가족 관리는 설정으로 통합)

---

## 식단 관련 라우트

**식단 관련 기능은 `/diet` 하위에 위치합니다.**

### 식단 메인
- `/diet` - 식단 메인 페이지

### 식단 상세
- `/diet/breakfast/[date]` - 아침 식단
- `/diet/lunch/[date]` - 점심 식단
- `/diet/dinner/[date]` - 저녁 식단

### 주간 식단 (대시보드)
- `/(dashboard)/diet/weekly` - 주간 식단 캘린더
- `/(dashboard)/diet/favorites` - 즐겨찾기 식단

---

## 레시피 관련 라우트

**레시피 관련 기능은 `/recipes` 또는 `/archive/recipes` 하위에 위치합니다.**

### 레시피 아카이브
- `/archive/recipes` - 레시피 아카이브 메인 (레시피 목록)

### 레시피 상세
- `/recipes` - 레시피 목록
- `/recipes/[slug]` - 레시피 상세 페이지
- `/recipes/new` - 레시피 업로드

### 식약처 레시피
- `/recipes/mfds` - 식약처 레시피 목록
- `/recipes/mfds/[recipeId]` - 식약처 레시피 상세

### 궁중 레시피
- `/royal-recipes` - 궁중 레시피 목록
- `/royal-recipes/[era]` - 시대별 궁중 레시피
- `/royal-recipes/[era]/[slug]` - 궁중 레시피 상세

---

## 기타 라우트

### 스토리 및 학습
- `/stories` - 스토리 목록
- `/food-stories` - 음식 스토리
- `/chapters/health` - 건강 챕터
- `/chapters/recipes-diet` - 레시피/식단 챕터
- `/(main)/storybook` - 스토리북

### 간식
- `/snacks` - 간식 목록
- `/snacks/[fruitId]` - 과일 상세

### 결제 및 구독
- `/(main)/pricing` - 가격 정책
- `/(main)/checkout/success` - 결제 성공
- `/(main)/checkout/fail` - 결제 실패
- `/(main)/checkout/mock` - 결제 모의 테스트
- `/(main)/account/subscription` - 구독 정보

### 관리자
- `/admin` - 관리자 메인
- `/admin/copy` - 페이지 문구 관리
- `/admin/popups` - 팝업 공지 관리
- `/admin/recipes` - 레시피 작성
- `/admin/meal-kits` - 밀키트 제품 관리
- `/admin/promo-codes` - 프로모션 코드 관리
- `/admin/settlements` - 정산 내역
- `/admin/logs` - 알림 로그
- `/admin/security` - 보안 설정
- `/admin/consent` - 동의 내역

### 법적 문서
- `/terms` - 이용약관
- `/privacy` - 개인정보처리방침

### 테스트 및 개발
- `/test` - 테스트 페이지
- `/auth-test` - 인증 테스트
- `/storage-test` - 스토리지 테스트
- `/special-video` - 특별 비디오

---

## 리다이렉트 규칙

### 설정 관련
- `/profile` → `/settings/profile`
  - 사용자 프로필 설정은 설정 페이지로 통합

### 건강 관련
- `/health/manage` → `/settings`
  - 가족 관리는 설정 페이지로 통합

---

## 라우트 네이밍 컨벤션

### 1. 복수형 vs 단수형
- **복수형**: 목록/관리 페이지 (`/recipes`, `/settings`)
- **단수형**: 단일 리소스 또는 메인 페이지 (`/profile`, `/health`)

### 2. 동적 라우트
- `[slug]` - 슬러그 기반 (예: `/recipes/[slug]`)
- `[id]` - ID 기반 (예: `/health/family/[memberId]`)
- `[date]` - 날짜 기반 (예: `/diet/breakfast/[date]`)

### 3. 그룹 라우트
- `(dashboard)` - 대시보드 관련 그룹
- `(main)` - 메인 관련 그룹

---

## 변경 이력

### 2025-01-27
- `/profile` → `/settings/profile` 리다이렉트 추가
- `/health/manage` → `/settings` 리다이렉트 확인 및 링크 업데이트
- Navbar의 설정 링크를 `/health/manage`에서 `/settings`로 변경
- 라우트 구조 문서 작성

---

## 참고사항

- 모든 라우트는 Next.js App Router를 사용합니다
- 동적 라우트는 `[param]` 형식을 사용합니다
- 그룹 라우트는 `(group)` 형식을 사용합니다
- 리다이렉트는 `redirect()` 함수를 사용합니다

