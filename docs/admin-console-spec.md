---
description: 관리자 콘솔 MVP 설계 및 구현 세부 계획
globs: docs/admin-console-spec.md
alwaysApply: false
---

# 관리자 콘솔 상세 계획서 (MVP)

## 1. 요구사항 요약 & 정보 구조(IA)
- **주요 목적**
  - `/admin` 경로에서 카피/팝업/알림 로그를 단일 화면에서 관리.
  - Clerk `role === 'admin'` 사용자만 접근 가능.
  - 모든 주요 상호작용에 `console.group('[AdminConsole]')` 로그 남김.
- **핵심 작업 흐름**
  | 작업 | 세부 설명 | 우선순위 |
  | --- | --- | --- |
  | 페이지 문구 편집 | JSON 블록 수정, 버전 비교, 미리보기 | P0 |
  | 팝업 공지 관리 | 목록 → 상세 편집 → 즉시 배포/비활성화 | P0 |
  | 알림 로그 조회 | KCDC/식단 팝업 로그 필터 조회 | P1 |
  | 시스템 개요 카드 | 최신 배포/알림 상태 요약 | P1 |
- **정보 구조**
  - 상단: 요약 카드(공지 수, 활성 팝업, 최근 알림 실패 등).
  - 좌측 사이드바: `Overview`, `Copy`, `Popups`, `Logs`.
  - 메인 컨텐츠: 선택된 탭에 맞는 패널(폼/테이블/미리보기).

## 2. 레이아웃 & 네비게이션 셸
- `app/admin/layout.tsx`
  - **구성**: `SidebarLayout`(client) + `AdminGuard`(server). 비인가 시 `/` 리다이렉트.
  - **UI 패턴**: Tailwind v4 Utility + shadcn `Sidebar`, `Card`, `Tabs`.
  - **반응형**
    - ≥1024px: 고정 사이드바, 헤더에 사용자 아바타/환경 토글.
    - <1024px: 햄버거로 사이드바 슬라이드, 헤더 요약 카드만 노출.
  - **상태 관리**
    - 클라이언트 탭 전환: `useState` + `useSelectedLayoutSegment`.
    - 전역 로더: `components/admin/admin-loader.tsx`.
  - **필수 로그**
    ```tsx
    console.group('[AdminConsole]');
    console.log('section', activeSection);
    console.groupEnd();
    ```

## 3. 콘텐츠 모듈 UX 설계
- ### 3.1 페이지 문구 편집 (Copy)
  - 좌측 JSON 블록 리스트, 우측 편집 폼.
  - **기능**
    - 검색/필터 (slug, 경로).
    - 버전 타임라인(최근 5개) + diff 뷰 버튼.
    - `미리보기` 클릭 시 `Modal`로 실제 UI 조각 렌더.
  - **검증**: Zod 스키마(`CopyBlockSchema`), 저장 전 draft 비교.
  - **로그**: `console.group('[AdminConsole][Copy]')`, 이벤트(`select-block`, `preview`, `save`).

- ### 3.2 팝업 공지 (Popups)
  - 목록 테이블 + 우측 상세 탭.
  - **필드**: title, body, active_from/to, target_segments, priority, status.
  - **행동 흐름**: 선택 → 편집 → 상태 토글 → 미리보기 → 배포.
  - **실시간 피드백**: optimistic 업데이트 + 토스트(`useToast`).
  - **모달**: `PopupPreviewModal`는 실제 팝업 컴포넌트 재사용.
  - **로그**: `console.group('[AdminConsole][Popup]')`, payload에 popupId 포함.
  - **배포/노출 상세 계획**
    1. **작성 단계**
       - `PopupEditorForm`에서 제목/본문/스케줄/타겟 세그먼트/CTA URL 입력.
       - Zod 스키마(`PopupSchema`)로 유효성 검사. 필수 필드 누락 시 즉시 에러 표시.
    2. **미리보기**
       - `미리보기` 버튼 클릭 시 `PopupPreviewModal` 오픈.
       - 실제 사용자 팝업 컴포넌트(`components/diet/diet-notification-popup.tsx`)를 iframe 없이 직접 렌더.
       - `console.group('[AdminConsole][Popup]'); console.log('preview', popupDraft);`.
    3. **배포 요청**
       - `배포` 버튼 → `actions/admin/popups/deploy.ts` 호출.
       - Server Action 흐름: 입력 검증 → Supabase `popup_announcements` upsert → 캐시 무효화(`revalidateTag('popup-announcements')`).
       - 상태가 `scheduled`인 경우 `active_from` 기준으로 자동 노출, 즉시 노출은 `active_from = now()`.
    4. **클라이언트 노출**
       - 프론트 전역 `PopupProvider`가 `usePopupAnnouncements` 훅으로 최신 데이터를 구독.
       - 관리자 페이지에서 `즉시 노출 테스트` 버튼을 누르면 선택 팝업 ID를 쿼리 스트링(`?popupPreview=id`)으로 전달하여 사용자 페이지에서도 강제 렌더 가능.
    5. **상태 모니터링**
       - `popup_announcements.status` 값: `draft`, `scheduled`, `active`, `paused`, `expired`.
       - Admin UI에서는 상태별 뱃지 + 필터 제공. `active` 상태가 된 시점은 `notification_logs`에 기록.
    6. **롤백/비활성화**
       - `일시중지` 버튼 → Server Action이 status를 `paused`로 변경 후 실시간 UI 업데이트.
       - 사용자는 해당 팝업을 더 이상 보지 않으며, 재활성화 시 `active_from`을 갱신.
    7. **접근성/디자인 메모**
       - 팝업 본문은 Markdown 지원(굵게/리스트/링크). 미리보기에서 실제 스타일 확인.
       - CTA 버튼 색상/문구 선택 옵션 제공(Primary, Secondary). 디자인 토큰 준수.
       - 다국어가 필요한 경우 locale 탭 추가 예정(백로그).

- ### 3.3 알림 로그 (Logs)
  - 데이터 테이블(shadcn `DataTable`) + 필터 패널
    - 필드: type(KCDC, diet-popup), status(success/fail), triggered_at, payload digest.
    - 필터: 날짜 범위, 타입, 상태, 사용자.
  - 로그 행 클릭 시 JSON Drawer.
  - 빈 상태 메시지 + 재시도 버튼(향후 Edge Function 호출 훅).

## 4. 데이터 계층 설계
- **테이블 제안**
  | 테이블 | 주요 필드 | 용도 |
  | --- | --- | --- |
  | `admin_copy_blocks` | id, slug, locale, content JSONB, version, updated_by | 카피 관리 |
  | `popup_announcements` | id, title, body, schedule, status, target_segments, metadata JSONB | 팝업 |
  | `notification_logs` | id, type, status, payload JSONB, triggered_at, actor | 로그 |
- **정책**
  - 개발 단계: RLS 비활성 (기존 지침 준수).
  - 추후: `role = 'admin'` 전용 정책 준비.
- **Server Actions**
  - 경로: `actions/admin/copy/*.ts`, `actions/admin/popups/*.ts`, `actions/admin/logs/*.ts`.
  - 패턴: 입력 Zod 검증 → `createClerkSupabaseClient`로 authenticated 권한 사용.
  - 대량 조회/배포는 `service-role` 클라이언트 사용, `.server` 파일에 한정.
- **에러 처리**
  - `AdminActionError` 유틸(메시지 + statusCode + hint).
  - 사용자에겐 토스트, 콘솔엔 `.error`.

## 5. 권한 & 감시 체계
- **Clerk 역할**
  - `role` 메타데이터에 `admin` 문자열 포함 시 접근 허용.
  - Guard: `redirect` vs `notFound` 옵션. 기본은 `/`.
  - 로그아웃/권한 없음 상태 모두 tracking(`console.warn('[AdminConsole] denied', userId)`).
- **관리자 계정 암호 정책**
  - **생성·변경 절차**
    1. Clerk 대시보드 또는 `/admin/security` 모듈에서 비밀번호 변경을 시작.
    2. UI는 `current / new / confirm` 3필드 + 실시간 정책 체크리스트 표시.
    3. 성공 시 `console.group('[AdminConsole][Security]')`에서 `password-change` 로그와 actor ID 기록, 실패 시 원인(.warn) 남김.
  - **정책 요건**
    - 길이 12자 이상.
    - 대문자/소문자/숫자/특수문자 중 최소 3종류 포함.
    - 최근 5개 비밀번호와 중복 금지(Clerk password history 기능 사용).
    - 90일마다 재설정 요구: 만료 7일 전 `notification_logs`에 `security-reminder`로 기록 후 팝업/이메일 발송.
  - **보안 절차**
    - 5회 연속 실패 시 계정 잠금 + 관리자 알림 이메일; 잠금 해제는 2FA 후 가능.
    - 비밀번호 변경 성공 시 Webhook → Supabase `admin_security_audit` 테이블에 `actor_id`, `ip`, `user_agent`, `performed_at` 저장.
    - `app/admin/security/page.tsx`에서 TOTP/Passkey 설정 여부와 최근 변경일 표기, 미설정 시 경고 배너.
- **보안 모듈(`/admin/security`) 구성**
  - **레이아웃**
    - 상단 요약 카드: 최근 비밀번호 변경일, 2FA 상태, 계정 잠금 여부.
    - 좌측: 보안 작업 리스트(비밀번호 변경, 2FA 설정, 세션 관리, 감사 로그).
    - 우측: 선택된 작업 상세 패널.
  - **비밀번호 변경 섹션**
    - `AdminPasswordForm` 컴포넌트: 3필드 + 실시간 정책 체크(`PasswordPolicyChecklist`).
    - 제출 → `actions/admin/security/change-password.ts` (Clerk API 호출) → 성공 시 토스트+로그.
    - 실패 시 에러 메시지 + 남은 시도 수 표시.
  - **2FA/Passkey 설정 섹션**
    - `AdminMfaCard`: 현재 활성화된 인증 수단 리스트(TOTP, SMS, Passkey).
    - Passkey 추가 클릭 시 브라우저 WebAuthn 흐름 안내 + `navigator.credentials.create`.
    - 설정 후 `console.log('[AdminConsole][Security]', 'mfa-enabled', method)`.
  - **세션 관리 섹션**
    - 현재 로그인 세션/디바이스 테이블(위치, 브라우저, 마지막 활동).
    - 개별 세션 강제 로그아웃 버튼 → Server Action에서 Clerk `endSession`.
    - 30일 이상 미사용 세션 자동 만료 표시.
  - **감사 로그 뷰어**
    - Supabase `admin_security_audit` 테이블 조회.
    - 필터: 작업 유형(password-change, mfa-update, session-revoke), 날짜 범위.
    - JSON Drawer로 상세 payload 확인.
  - **보조 기능**
    - `SecurityTips` 컴포넌트: 최신 보안 권고(예: 피싱 주의) 카드.
    - “백업 코드 재발급” 버튼: 확인 모달 이후 Clerk API 호출, 다운로드/복사 안내.
- **RBAC 확장**
  - `AdminPermission` 타입 예시:
    ```ts
    export type AdminPermission =
      | 'copy.read'
      | 'copy.write'
      | 'popup.manage'
      | 'logs.view';
    ```
  - 향후 `permissions` 배열을 Clerk 메타데이터에 저장.
- **감시**
  - Edge Function/cron 실패 시 `notification_logs`에 기록.
  - 관리자 콘솔에서 실패 수 카운터 강조.

## 6. QA & 피드백 루프
- **체크리스트 초안 (`/docs/admin-qa.md`)**
  1. 관리자만 접근되는지 (비관리자 → 리다이렉트 확인).
  2. Copy CRUD: 리스트 로딩, 저장, 버전 diff.
  3. Popup CRUD: 상태 토글, 미리보기, 배포 후 목록 반영.
  4. 로그 필터: 타입/상태/날짜 조합 필터링.
  5. 에러/토스트/콘솔 로그 유무 확인.
  6. 모바일 뷰에서 사이드바/모달 동작.
- **피드백 수집**
  - `/admin` 상단에 "피드백 보내기" 버튼 → `mailto:` 또는 `linear` webhook.
  - 릴리즈 노트 카드: 최근 변경 사항 3개 표시.

## 7. 차후 확장 메모
- 이미지 모니터링, 식단 데이터 관리자 모듈은 동일 카드 패턴 재사용.
- Edge Function 상태 모니터(배포/스케줄) 카드 백로그 등록.


