# 홈페이지 커스터마이징 페이지 구현 내용 및 오류 분석

## 📋 구현된 기능

### 1. **페이지 구조** (`app/settings/customization/page.tsx`)
- **서버 컴포넌트**: Next.js App Router 사용
- **에러 처리**: `ErrorBoundary`로 감싸서 에러 처리
- **로딩 상태**: `Suspense`로 비동기 로딩 처리
- **동적 렌더링**: `force-dynamic` 설정으로 사용자별 설정 지원

### 2. **주요 기능** (`components/settings/home-customization.tsx`)

#### 2.1 테마 설정
- **테마 모드**: light, dark, auto (시스템 설정 따름)
- **구현**: `Select` 컴포넌트로 선택
- **저장**: `updateThemeMode` 함수로 즉시 저장

#### 2.2 배경 설정
- **배경 타입**: 
  - `gradient`: 그라데이션 배경
  - `image`: 이미지 배경 (업로드 가능)
  - `color`: 단색 배경
- **이미지 업로드**:
  - 파일 크기 제한: 5MB
  - 파일 타입 검증: image/*만 허용
  - Supabase Storage에 업로드
  - 업로드 후 자동으로 배경 타입을 "image"로 변경
- **단색 배경**: 
  - 색상 선택기 (`type="color"`)
  - HEX 코드 직접 입력 가능
- **커스텀 그라데이션**: 
  - CSS gradient 문법 직접 입력
  - 예시: `linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)`

#### 2.3 섹션 순서 변경
- **드래그 앤 드롭**: `@dnd-kit` 라이브러리 사용
- **섹션 목록**:
  - 응급조치 안내
  - 날씨 위젯
  - 히어로 섹션
  - 캐릭터 게임
  - 커뮤니티 미리보기
- **저장**: 순서 변경 시 즉시 `updateSectionOrder`로 저장

#### 2.4 기본값 복원
- **기능**: 모든 커스터마이징 설정을 초기 상태로 되돌림
- **처리**:
  - localStorage 초기화
  - Supabase에서 `home_customization` 필드를 `null`로 업데이트
  - 사용자 확인 후 실행

### 3. **상태 관리** (`hooks/use-home-customization.ts`)

#### 3.1 데이터 저장소
- **localStorage**: 클라이언트 사이드 임시 저장
- **Supabase**: 로그인 사용자의 영구 저장
- **동기화 전략**: 
  - Supabase 우선 (서버 데이터가 최신)
  - localStorage와 병합하여 사용

#### 3.2 주요 함수
- `updateThemeMode`: 테마 모드 변경
- `updateBackgroundType`: 배경 타입 변경
- `updateBackgroundImage`: 배경 이미지 URL 변경
- `updateBackgroundColor`: 배경 색상 변경
- `updateCustomGradient`: 커스텀 그라데이션 변경
- `updateSectionOrder`: 섹션 순서 변경
- `updateCardStyle`: 카드 스타일 변경 (현재 UI에 노출되지 않음)
- `resetToDefault`: 기본값으로 복원

#### 3.3 동기화 로직
- **로드 시**:
  1. localStorage에서 로드
  2. 로그인 사용자인 경우 Supabase에서 로드
  3. Supabase 데이터가 있으면 우선 사용
  4. localStorage와 병합
- **저장 시**:
  1. localStorage에 즉시 저장
  2. 로그인 사용자인 경우 500ms 디바운싱 후 Supabase에 저장

### 4. **API 엔드포인트**

#### 4.1 배경 이미지 업로드 (`/api/upload/home-background`)
- **인증**: Clerk 인증 필수
- **검증**: 
  - 파일 크기: 5MB 이하
  - 파일 타입: JPG, PNG, WebP
- **저장**: Supabase Storage (`uploads` 버킷)
- **경로**: `{user_id}/home-background/{filename}`

## 🔍 잠재적 오류 원인 분석

### 1. **콘솔 오류 발생 가능성**

#### 1.1 Supabase 동기화 오류
**위치**: `hooks/use-home-customization.ts`
- **문제**: 
  - `userError`가 빈 객체 `{}`일 때도 에러로 처리될 수 있음
  - Supabase 사용자 조회 실패 시 에러 로그 발생
- **현재 처리**: 
  - 실제 에러인지 확인하는 로직 추가됨
  - 개발 환경에서만 상세 로그 출력
- **잠재적 문제**:
  - 네트워크 오류 시 반복적인 에러 로그
  - 사용자가 아직 생성되지 않은 경우 에러 로그

#### 1.2 localStorage 접근 오류
**위치**: `hooks/use-home-customization.ts`
- **문제**: 
  - SSR 환경에서 `window` 객체 접근 시도
  - localStorage가 비활성화된 브라우저
  - 쿠키 차단으로 인한 localStorage 접근 실패
- **현재 처리**: 
  - `typeof window === "undefined"` 체크 추가됨
  - try-catch로 에러 처리
- **잠재적 문제**:
  - 에러가 발생해도 조용히 실패하여 사용자가 알 수 없음

#### 1.3 이미지 업로드 오류
**위치**: `components/settings/home-customization.tsx`
- **문제**:
  - API 호출 실패 시 에러 로그
  - 파일 검증 실패 시 에러 로그
  - Supabase Storage 업로드 실패
- **현재 처리**:
  - try-catch로 에러 처리
  - 사용자에게 토스트 메시지 표시
- **잠재적 문제**:
  - 네트워크 오류 시 반복적인 에러 로그

### 2. **React Hook 관련 오류**

#### 2.1 useEffect 의존성 배열
**위치**: `hooks/use-home-customization.ts`
- **문제**:
  - `supabase` 객체가 매번 새로 생성될 수 있음
  - 의존성 배열에 포함되어 있어 무한 루프 가능성
- **현재 처리**:
  - `useClerkSupabaseClient` 훅 사용 (메모이제이션됨)
- **잠재적 문제**:
  - 클라이언트 객체가 변경되면 불필요한 재렌더링

#### 2.2 상태 업데이트 타이밍
**위치**: `hooks/use-home-customization.ts`
- **문제**:
  - `customization` 상태 변경 시 즉시 Supabase 동기화
  - 디바운싱이 500ms로 설정되어 있어 빠른 연속 변경 시 문제 가능
- **현재 처리**:
  - `setTimeout`으로 디바운싱
  - cleanup 함수로 이전 타이머 취소
- **잠재적 문제**:
  - 빠른 연속 변경 시 마지막 변경만 저장될 수 있음

### 3. **타입 안전성 문제**

#### 3.1 타입 캐스팅
**위치**: `hooks/use-home-customization.ts`
- **문제**:
  - `userData.home_customization as HomeCustomization` 타입 캐스팅
  - 데이터베이스에 저장된 데이터가 타입과 일치하지 않을 수 있음
- **현재 처리**:
  - 기본값과 병합하여 누락된 필드 보완
- **잠재적 문제**:
  - 잘못된 데이터 형식이 저장되어 있으면 런타임 오류 가능

### 4. **성능 관련 문제**

#### 4.1 불필요한 재렌더링
**위치**: `components/settings/home-customization.tsx`
- **문제**:
  - `customization` 객체가 변경될 때마다 전체 컴포넌트 재렌더링
  - `quickStartCards` 배열이 매번 새로 생성됨
- **현재 처리**:
  - `useMemo`로 메모이제이션 필요 (현재 미구현)
- **잠재적 문제**:
  - 섹션 순서 변경 시 불필요한 재렌더링

#### 4.2 API 호출 최적화
**위치**: `hooks/use-home-customization.ts`
- **문제**:
  - 매번 Supabase에 업데이트 요청
  - 네트워크 오류 시 재시도 로직 없음
- **현재 처리**:
  - 디바운싱으로 요청 수 감소
- **잠재적 문제**:
  - 네트워크 오류 시 데이터 손실 가능

### 5. **사용자 경험 문제**

#### 5.1 로딩 상태
**위치**: `components/settings/home-customization.tsx`
- **문제**:
  - 초기 로딩 중에는 스켈레톤만 표시
  - Supabase 동기화 중에는 로딩 표시 없음
- **현재 처리**:
  - `isLoaded` 상태로 초기 로딩 표시
- **잠재적 문제**:
  - Supabase 동기화 중에는 사용자가 기다려야 함

#### 5.2 에러 피드백
**위치**: 전체
- **문제**:
  - 일부 에러는 콘솔에만 출력되고 사용자에게 알림 없음
  - Supabase 동기화 실패 시 사용자가 알 수 없음
- **현재 처리**:
  - 이미지 업로드 실패 시 토스트 메시지
  - 기본값 복원 실패 시 토스트 메시지
- **잠재적 문제**:
  - 다른 에러는 사용자에게 알림 없음

## 🛠️ 권장 수정 사항

### 1. **콘솔 로그 최적화**
- 모든 `console.error`를 개발 환경에서만 출력하도록 수정
- 프로덕션 환경에서는 에러 추적 서비스(Sentry 등)로 전송

### 2. **에러 처리 개선**
- Supabase 동기화 실패 시 사용자에게 알림
- 재시도 로직 추가
- 네트워크 오류 시 오프라인 모드 지원

### 3. **성능 최적화**
- `quickStartCards` 배열을 `useMemo`로 메모이제이션
- 불필요한 재렌더링 방지
- API 호출 최적화

### 4. **타입 안전성 강화**
- 데이터베이스에서 로드한 데이터 검증 로직 추가
- Zod 등을 사용한 런타임 타입 검증

### 5. **사용자 경험 개선**
- Supabase 동기화 중 로딩 표시
- 에러 발생 시 명확한 피드백
- 오프라인 모드 지원

## 📊 현재 상태 요약

### ✅ 잘 구현된 부분
- 기본 기능 모두 구현됨
- 에러 처리 기본 구조 있음
- localStorage와 Supabase 동기화 로직 구현됨
- 드래그 앤 드롭 기능 정상 작동

### ⚠️ 개선이 필요한 부분
- 콘솔 로그 최적화 (개발 환경에서만 출력)
- 에러 피드백 개선 (사용자 알림)
- 성능 최적화 (메모이제이션)
- 타입 안전성 강화 (런타임 검증)

