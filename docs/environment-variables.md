# 음식 이미지 생성 파이프라인 환경 변수

## 개요

음식 이미지 생성 파이프라인에서 사용하는 모든 환경 변수를 정리합니다.

## 필수 환경 변수

### Gemini AI 설정
```bash
# Google Gemini API 키 (필수)
# Google AI Studio (https://makersuite.google.com/app/apikey)에서 생성
GEMINI_API_KEY=AIzaSyD_your_actual_key_here
```

### Supabase 설정
```bash
# Supabase 프로젝트 URL (필수)
SUPABASE_URL=https://your-project.supabase.co

# 서비스 롤 키 - 데이터베이스 조작용 (필수)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# 익명 키 - 클라이언트용 (선택, 기본값 있음)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 선택 환경 변수

### Storage 설정
```bash
# Storage 버킷 이름 (선택, 기본값: uploads)
NEXT_PUBLIC_STORAGE_BUCKET=food-images
```

### Notion 연동 (선택)
```bash
# Notion API 키 - Notion 연동 시 필요
NOTION_API_KEY=secret_your_notion_api_key_here

# Notion 데이터베이스 ID - 이미지 기록용 데이터베이스
NOTION_DATABASE_ID=your_database_id_here
```

### Edge Function 설정
```bash
# 이미지 생성 파이프라인용 시크릿 (선택)
IMAGE_PIPELINE_CRON_SECRET=your_cron_secret_here
```

## 환경별 설정

### 개발 환경 (.env.local)
```bash
# 개발용 API 키 (실제 키와 분리)
GEMINI_API_KEY=AIzaSyD_dev_key_here
SUPABASE_URL=https://dev-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=dev_service_key_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev_anon_key_here

# 개발용 Storage 버킷
NEXT_PUBLIC_STORAGE_BUCKET=dev-food-images
```

### 프로덕션 환경
```bash
# 프로덕션용 실제 키
GEMINI_API_KEY=AIzaSyD_prod_key_here
SUPABASE_URL=https://prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=prod_service_key_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_anon_key_here

# 프로덕션용 Storage 버킷
NEXT_PUBLIC_STORAGE_BUCKET=food-images

# Notion 연동 (선택)
NOTION_API_KEY=secret_prod_notion_key_here
NOTION_DATABASE_ID=prod_database_id_here
```

## Edge Function 환경 변수 설정

Supabase Edge Function에서 환경 변수를 설정하는 방법:

```bash
# 환경 변수 설정
supabase secrets set GEMINI_API_KEY=your_key_here
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key_here
supabase secrets set NOTION_API_KEY=secret_your_key_here
supabase secrets set NOTION_DATABASE_ID=your_database_id_here

# 설정된 변수 확인
supabase secrets list

# 특정 변수 확인
supabase secrets get GEMINI_API_KEY
```

## 보안 고려사항

### API 키 관리
- **Gemini API 키**: Google AI Studio에서 생성, 정기적으로 교체
- **Supabase 키**: 서비스 롤 키는 서버 사이드에서만 사용
- **Notion 키**: Notion Integration에서 생성, 최소 권한 원칙 적용

### 환경 분리
- **개발/프로덕션 키 분리**: 각 환경에 맞는 별도 키 사용
- **키 노출 방지**: `.env` 파일을 `.gitignore`에 포함
- **정기 교체**: API 키를 3-6개월마다 교체

### 접근 권한
- **Gemini API**: 이미지 생성 전용으로 제한
- **Supabase**: 서비스 롤은 관리자 권한, 익명 키는 읽기 전용
- **Notion**: 데이터베이스 쓰기 권한만 부여

## 검증 및 테스트

### 환경 변수 검증 스크립트
```bash
# 환경 변수 검증 실행
npm run check:env

# 또는 직접 실행
node scripts/check-env.js
```

### 연결 테스트
```bash
# Gemini API 연결 테스트
curl -H "Content-Type: application/json" \
  -d '{"contents": [{"parts": [{"text": "Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$GEMINI_API_KEY"

# Supabase 연결 테스트
curl -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  "$SUPABASE_URL/rest/v1/foods?select=id,name&limit=1"
```

## 문제 해결

### 일반적인 에러

#### "GEMINI_API_KEY is not set"
- 환경 변수가 설정되지 않음
- `.env.local` 파일 확인
- Edge Function에서는 `supabase secrets set` 명령어 사용

#### "Invalid API key"
- API 키 형식이 잘못됨 (Google AI 키는 `AIza`로 시작해야 함)
- 키가 만료되었거나 취소됨

#### "Database connection failed"
- SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 잘못됨
- Supabase 프로젝트가 일시 중단되었을 수 있음

### 디버깅 명령어
```bash
# 환경 변수 확인
echo $GEMINI_API_KEY | head -c 10  # 키 형식 확인

# Supabase 연결 테스트
supabase db test

# Edge Function 로그 확인
supabase functions logs generate-food-images --limit 10
```

## 업데이트 기록

- 2025-01-26: 초기 환경 변수 목록 작성
- 2025-01-26: Notion 연동 변수 추가
- 2025-01-26: 보안 가이드라인 추가
