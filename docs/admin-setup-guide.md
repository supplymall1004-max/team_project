# 관리자 사용자 설정 가이드

> **작성일**: 2025년 12월 2일  
> **목적**: Clerk 사용자에게 관리자 역할을 부여하여 관리자 콘솔 접근 권한 제공

---

## 📋 개요

맛의 아카이브 관리자 콘솔(`/admin`)에 접근하려면 Clerk 사용자에게 `admin` 역할이 필요합니다.

관리자 권한 확인은 `app/admin/layout.tsx`에서 수행되며, Clerk의 `publicMetadata` 또는 `privateMetadata`에서 `role: "admin"`을 확인합니다.

---

## 🔧 방법 1: Clerk 대시보드에서 수동 설정 (권장)

### 단계별 가이드

1. **Clerk 대시보드 접속**
   - https://dashboard.clerk.com 접속
   - 프로젝트 선택

2. **사용자 찾기**
   - 좌측 메뉴에서 "Users" 클릭
   - 관리자로 만들 사용자 검색 또는 선택

3. **메타데이터 설정**
   - 사용자 상세 페이지에서 "Metadata" 탭 클릭
   - "Public metadata" 섹션에서 다음 JSON 추가:
   ```json
   {
     "role": "admin",
     "roles": ["admin"]
   }
   ```
   - "Save" 클릭

4. **확인**
   - 사용자가 로그아웃 후 다시 로그인
   - `/admin` 경로 접근 시도
   - 관리자 콘솔이 정상적으로 로드되는지 확인

---

## 🔧 방법 2: 스크립트를 사용한 자동 설정

### 사전 준비

1. **환경 변수 확인**
   - `.env` 파일에 `CLERK_SECRET_KEY`가 설정되어 있는지 확인

2. **Clerk User ID 확인**
   - Clerk 대시보드에서 관리자로 만들 사용자의 User ID 복사
   - 또는 로그인한 사용자의 경우 브라우저 콘솔에서 확인:
   ```javascript
   // 브라우저 콘솔에서 실행
   // (Clerk 프론트엔드 SDK 사용 시)
   ```

### 스크립트 실행

```bash
# 관리자 역할 부여
npx tsx scripts/setup-admin.ts grant <clerk_user_id>

# 또는 환경 변수 사용
CLERK_USER_ID=<clerk_user_id> npx tsx scripts/setup-admin.ts grant
```

**예시:**
```bash
npx tsx scripts/setup-admin.ts grant user_2abc123def456ghi789
```

### 관리자 역할 제거

```bash
npx tsx scripts/setup-admin.ts revoke <clerk_user_id>
```

---

## 🔧 방법 3: API 라우트를 통한 설정 (개발용)

개발 환경에서 빠르게 테스트하려면 임시 API 라우트를 만들 수 있습니다:

```typescript
// app/api/admin/grant-role/route.ts (임시)
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // 개발 환경에서만 허용
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  await client.users.updateUser(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      role: "admin",
      roles: ["admin"],
    },
  });

  return NextResponse.json({ success: true });
}
```

**주의**: 이 방법은 개발 환경에서만 사용하고, 프로덕션에서는 제거해야 합니다.

---

## ✅ 확인 방법

### 1. 브라우저 콘솔 확인

관리자 콘솔 접근 시 브라우저 콘솔에 다음 로그가 출력됩니다:

```
[AdminConsole][Guard]
  event: access-check
  userId: user_xxxxx
  isAdmin: true
```

### 2. 관리자 콘솔 접근 테스트

1. 로그인 상태 확인
2. `/admin` 경로로 이동
3. 관리자 콘솔이 정상적으로 로드되는지 확인
4. 사이드바 메뉴가 표시되는지 확인

---

## 🚨 문제 해결

### 문제: 관리자 역할을 부여했지만 접근이 안 됨

**해결 방법:**
1. 사용자가 로그아웃 후 다시 로그인했는지 확인
2. Clerk 대시보드에서 메타데이터가 올바르게 저장되었는지 확인
3. 브라우저 콘솔에서 `isAdmin` 값 확인
4. 개발 환경에서는 관리자 체크가 비활성화되어 있으므로 프로덕션 모드로 테스트

### 문제: 스크립트 실행 시 오류 발생

**해결 방법:**
1. `CLERK_SECRET_KEY` 환경 변수 확인
2. Clerk User ID가 올바른지 확인
3. 네트워크 연결 확인
4. Clerk API 할당량 확인

---

## 📝 참고사항

### 개발 환경 vs 프로덕션 환경

- **개발 환경** (`NODE_ENV !== "production"`): 관리자 체크가 비활성화되어 있어 모든 로그인 사용자가 접근 가능
- **프로덕션 환경**: 관리자 역할이 있는 사용자만 접근 가능

코드 위치: `app/admin/layout.tsx` (line 154-158)

```typescript
// 개발 중에는 관리자 체크를 임시로 비활성화
// TODO: 프로덕션 배포 전에 다시 활성화 필요
if (!isAdmin && process.env.NODE_ENV === "production") {
  redirect("/");
}
```

### 보안 고려사항

1. **프로덕션 배포 전**: 관리자 체크가 활성화되어 있는지 확인
2. **메타데이터 보안**: `publicMetadata`는 클라이언트에서 접근 가능하므로 민감한 정보는 저장하지 않음
3. **역할 관리**: 관리자 역할을 가진 사용자 목록을 정기적으로 검토

---

## 🎯 다음 단계

관리자 사용자 생성 후:

1. ✅ 관리자 콘솔 접근 확인
2. ✅ 홈페이지 콘텐츠 관리 기능 테스트
3. ✅ 팝업 공지 관리 기능 테스트
4. ✅ 레시피 작성 기능 테스트
5. ✅ 보안 설정 확인

자세한 내용은 `docs/todocheck.md`의 "Phase 1: 긴급 복구" 섹션을 참고하세요.


