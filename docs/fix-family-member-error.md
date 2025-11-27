# 가족 구성원 저장 에러 해결 가이드

## 문제 상황
가족 구성원을 저장할 때 "Not found" 또는 빈 에러 응답이 발생합니다.

## 해결 방법

### 1. 데이터베이스 마이그레이션 적용

`include_in_unified_diet` 컬럼이 데이터베이스에 없을 수 있습니다. 다음 SQL을 Supabase SQL Editor에서 실행하세요:

```sql
-- 가족 구성원 통합 식단 포함 여부 컬럼 추가
ALTER TABLE public.family_members
ADD COLUMN IF NOT EXISTS include_in_unified_diet BOOLEAN DEFAULT true;

-- 기존 레코드 업데이트
UPDATE public.family_members
SET include_in_unified_diet = true
WHERE include_in_unified_diet IS NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_family_members_include_in_unified_diet
ON public.family_members(include_in_unified_diet);
```

### 2. 데이터베이스 스키마 확인

다음 SQL로 `family_members` 테이블의 컬럼을 확인하세요:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'family_members'
ORDER BY ordinal_position;
```

### 3. 에러 로그 확인

브라우저 개발자 도구(F12)에서:
- **Console 탭**: 클라이언트 측 에러 로그 확인
- **Network 탭**: API 요청/응답 확인
  - `/api/family/members` (POST) 또는 `/api/family/members/[id]` (PUT) 요청 확인
  - Response 탭에서 실제 에러 메시지 확인

서버 콘솔(터미널)에서:
- `➕ POST /api/family/members` 또는 `✏️ PUT /api/family/members/[id]` 그룹의 로그 확인
- 에러 코드, 메시지, 상세 정보 확인

### 4. 일반적인 문제와 해결책

#### 문제 1: `include_in_unified_diet` 컬럼이 없음
**증상**: "column does not exist" 에러
**해결**: 위의 마이그레이션 SQL 실행

#### 문제 2: 필수 필드 누락
**증상**: "null value in column violates not-null constraint" 에러
**확인할 필드**:
- `name` (필수)
- `birth_date` (필수)
- `relationship` (필수)

#### 문제 3: 사용자 동기화 문제
**증상**: "User not found" 에러
**해결**: 
1. Clerk에서 로그아웃 후 다시 로그인
2. `/api/sync-user` 엔드포인트가 정상 작동하는지 확인

#### 문제 4: 권한 문제
**증상**: "permission denied" 에러
**해결**: RLS가 활성화되어 있다면 비활성화:
```sql
ALTER TABLE public.family_members DISABLE ROW LEVEL SECURITY;
```

## 수정된 코드

다음 개선사항이 적용되었습니다:

1. **에러 메시지 개선**: 데이터베이스 에러의 상세 정보 표시
2. **안전한 필드 처리**: `include_in_unified_diet` 컬럼이 없어도 작동
3. **상세 로깅**: 요청/응답 데이터와 에러 정보를 콘솔에 기록

## 테스트 방법

1. 브라우저 개발자 도구 열기 (F12)
2. 가족 구성원 추가/수정 시도
3. Console 탭에서 로그 확인:
   - "📝 가족 구성원 폼 제출" 그룹
   - 요청 URL, 메서드, 데이터 확인
   - 응답 상태와 본문 확인
4. Network 탭에서:
   - API 요청 선택
   - Response 탭에서 실제 에러 메시지 확인

## 추가 도움

문제가 계속되면 다음 정보를 수집하세요:

1. 브라우저 콘솔의 전체 에러 로그
2. Network 탭의 API 응답 본문
3. 서버 콘솔의 에러 로그
4. 데이터베이스 스키마 확인 결과






