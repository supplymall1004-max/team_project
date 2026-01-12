# 서버 에러 확인 가이드

## 서버 로그 확인 방법

### 1. 개발 환경 (로컬)

#### Next.js 개발 서버 로그
```bash
# 터미널에서 실행 중인 개발 서버 로그 확인
pnpm dev
```

서버 에러는 터미널에 직접 출력됩니다. 다음 키워드로 에러를 찾을 수 있습니다:
- `❌`: 에러 로그
- `⚠️`: 경고 로그
- `Error`: JavaScript 에러
- `Exception`: 예외 발생

#### 주요 체크포인트
1. **식단 생성 관련 에러**
   - `[ServerAction] generateDietPlan`
   - `[DietQueries] 식단 추천 생성`
   - `❌ 식단 생성 중 오류 발생:`
   - `❌ 생성된 식단에 식사가 하나도 없습니다`
   - `❌ generateAndSaveDietPlan 오류:`

2. **데이터베이스 관련 에러**
   - Supabase 연결 에러
   - SQL 쿼리 에러
   - 제약조건 위반

3. **인증 관련 에러**
   - Clerk 인증 실패
   - 사용자 동기화 실패

### 2. 프로덕션 환경 (Vercel)

#### Vercel Dashboard에서 로그 확인
1. Vercel Dashboard 접속
2. 프로젝트 선택
3. **Deployments** → 최신 배포 클릭
4. **Functions** 탭에서 서버 로그 확인
5. **Runtime Logs**에서 실시간 로그 확인

#### Vercel CLI로 로그 확인
```bash
# Vercel CLI 설치 (필요시)
npm i -g vercel

# 로그인
vercel login

# 로그 확인
vercel logs [프로젝트명] --follow
```

### 3. 브라우저 개발자 도구

#### 콘솔 탭
- **F12** 또는 **우클릭 → 검사** → **Console** 탭
- 에러 메시지 확인:
  - `❌ 식단 생성 실패:`
  - `❌ 전체 에러 데이터:`
  - `Error: ...`

#### 네트워크 탭
- **Network** 탭 → 필터: **Fetch/XHR**
- 식단 생성 API 호출 확인:
  - `/api/...` 요청
  - 응답 상태 코드 확인 (200, 400, 500 등)
  - 응답 본문에서 에러 메시지 확인

## 주요 에러 유형 및 확인 방법

### 1. 식단 생성 실패

**에러 로그 패턴:**
```
❌ 식단 생성 실패: "식단을 생성할 수 없습니다."
[ServerAction] generateDietPlan
❌ 식단 생성 실패 - dietPlan이 null입니다
```

**확인할 로그:**
1. `lib/diet/queries.ts:generateAndSaveDietPlan` 함수
   - `❌ 식단 생성 중 오류 발생:`
   - `❌ 식단 추천 결과가 null입니다`
   - `❌ 생성된 식단에 식사가 하나도 없습니다`
   - `❌ generateAndSaveDietPlan 오류:`

2. `lib/diet/personal-diet-generator.ts:generatePersonalDiet` 함수
   - `❌ generatePersonalDiet 함수에서 에러 발생:`
   - `❌ 식단 구성 검증 실패:`
     - 밥이 없습니다
     - 반찬이 N개입니다 (필수: 3개)
     - 국/찌개가 없습니다
     - 반찬에 과일이 포함되어 있습니다

**확인 사항:**
- 레시피 데이터 존재 여부
- 건강 프로필 존재 여부
- 데이터베이스 연결 상태

### 2. 데이터베이스 에러

**에러 로그 패턴:**
```
Supabase error: ...
Postgres error: ...
duplicate key value violates unique constraint
null value in column violates not-null constraint
```

**확인할 로그:**
- `lib/diet/queries.ts:generateAndSaveDietPlan` 함수
  - `❌ UPSERT 오류:`
  - `❌ 저장 중 예외 발생:`

**확인 사항:**
- Supabase 연결 상태
- 데이터베이스 제약조건
- 필수 필드 누락 여부 (recipe_title 등)

### 3. 인증 에러

**에러 로그 패턴:**
```
Unauthorized
User not found
인증 실패
```

**확인할 로그:**
- `actions/diet/plan.ts:generateDietPlan`
  - `❌ 인증 실패`
  - `❌ 사용자 정보 없음`

**확인 사항:**
- Clerk 세션 상태
- 사용자 동기화 상태
- 환경 변수 설정 (Clerk 키)

### 4. 프리미엄 체크 에러

**에러 로그 패턴:**
```
❌ 프리미엄 사용자가 아님 - 식단 생성 차단
건강식단 생성은 프리미엄 회원만 이용할 수 있습니다.
```

**확인할 로그:**
- `actions/diet/plan.ts:generateDietPlan`
  - `❌ 프리미엄 사용자가 아님 - 식단 생성 차단`

**확인 사항:**
- 사용자의 프리미엄 구독 상태
- 프리미엄 체크 로직

## 로그 레벨별 확인 방법

### 개발 환경 (NODE_ENV=development)
- 모든 로그 출력 (console.log, console.error 등)
- 상세한 에러 스택 트레이스
- 디버깅 정보 포함

### 프로덕션 환경 (NODE_ENV=production)
- 에러 로그만 출력 (console.error)
- 민감한 정보 제외
- Vercel 로그에 기록

## 서버 로그 확인 스크립트

### 개발 환경에서 실시간 로그 확인
```bash
# 개발 서버 실행 및 로그 확인
pnpm dev

# 로그를 파일로 저장 (선택사항)
pnpm dev 2>&1 | tee server.log
```

### 특정 에러 검색
```bash
# 로그 파일에서 에러 검색 (Linux/Mac)
grep "❌" server.log
grep "Error" server.log
grep "식단 생성" server.log

# Windows PowerShell
Select-String -Path server.log -Pattern "❌"
Select-String -Path server.log -Pattern "Error"
```

## 주요 체크리스트

서버 에러 확인 시 다음 순서로 확인하세요:

- [ ] 개발 서버 로그 확인 (터미널)
- [ ] 브라우저 콘솔 에러 확인
- [ ] 네트워크 탭에서 API 응답 확인
- [ ] 데이터베이스 연결 상태 확인
- [ ] 환경 변수 설정 확인
- [ ] 사용자 인증 상태 확인
- [ ] 레시피 데이터 존재 여부 확인
- [ ] 건강 프로필 존재 여부 확인

## 에러 보고 시 포함할 정보

서버 에러를 보고할 때 다음 정보를 포함해주세요:

1. **에러 메시지**
   - 전체 에러 메시지
   - 에러 스택 트레이스 (있는 경우)

2. **발생 시점**
   - 어떤 작업을 수행했을 때 발생했는지
   - 재현 가능 여부

3. **환경 정보**
   - 개발 환경 / 프로덕션 환경
   - 브라우저 및 OS 정보

4. **관련 로그**
   - 서버 로그 (터미널 또는 Vercel)
   - 브라우저 콘솔 로그
   - 네트워크 응답 (있는 경우)

5. **상태 정보**
   - 사용자 로그인 상태
   - 프리미엄 구독 상태
   - 건강 프로필 존재 여부

