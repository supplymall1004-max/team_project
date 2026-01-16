# ERDCloud Import 가이드

## 빠른 시작: Supabase CLI 사용 (가장 쉬운 방법)

### 1. Supabase CLI 설치 및 로그인

```bash
# Supabase CLI 설치
npm install -g supabase

# Supabase 로그인
supabase login

# 프로젝트 링크
supabase link --project-ref xlbhrgvnfioxtvocwban
```

### 2. 전체 스키마 DDL 추출

```bash
# 전체 스키마를 SQL DDL 형식으로 추출
supabase db dump -f erdcloud_full_schema.sql

# 또는 public 스키마만 추출
supabase db dump --schema public -f erdcloud_full_schema.sql
```

### 3. ERDCloud에 Import

1. https://www.erdcloud.com/ 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 열기
3. 상단 메뉴에서 **"Import"** 또는 **"Import Database"** 클릭
4. **"SQL DDL"** 형식 선택
5. 생성된 `erdcloud_full_schema.sql` 파일을 업로드하거나 내용을 복사하여 붙여넣기
6. **"Import"** 버튼 클릭

## 대안: 제공된 파일 사용

현재 디렉토리에 다음 파일들이 포함되어 있습니다:

- `erdcloud_schema.sql`: 주요 테이블과 관계를 포함한 SQL DDL (일부 테이블만 포함)
- `erdcloud_import.csv`: CSV 형식의 테이블/컬럼 정보 (일부 테이블만 포함)

**주의**: 이 파일들은 주요 테이블만 포함하고 있습니다. 전체 스키마를 import하려면 위의 Supabase CLI 방법을 사용하세요.

## 주요 테이블 관계 요약

### 핵심 엔티티 (Core Entities)

```
users (중앙 허브)
├── user_health_profiles (1:1)
├── family_members (1:N)
├── subscriptions (1:N)
├── notifications (1:N)
└── recipes (1:N, SET NULL)
```

### 레시피 관련 (Recipe Domain)

```
recipes
├── recipe_ingredients (1:N)
├── recipe_steps (1:N)
├── recipe_ratings (1:N)
├── recipe_reports (1:N)
└── recipe_usage_history (1:N)

weekly_diet_plans
├── diet_plans (1:N)
└── weekly_nutrition_stats (1:N)
└── weekly_shopping_lists (1:N)
```

### 건강 관리 (Health Domain)

```
users
├── user_health_profiles (1:1)
├── medication_records (1:N)
├── hospital_records (1:N)
├── disease_records (1:N)
├── user_vaccination_records (1:N)
└── vital_signs (1:N)

family_members
├── medication_records (1:N)
├── hospital_records (1:N)
├── disease_records (1:N)
└── user_vaccination_records (1:N)

diseases (마스터)
└── disease_records (1:N)

allergies (마스터)
└── allergy_derived_ingredients (1:N)
```

### 구독/결제 (Subscription Domain)

```
users
├── subscriptions (1:N)
└── payment_transactions (1:N)

subscriptions
└── payment_transactions (1:N)

promo_codes
└── promo_code_uses (1:N)
```

### 게임화/소셜 (Gamification/Social Domain)

```
users
├── user_gamification (1:1)
├── daily_quests (1:N)
├── character_levels (1:N)
├── random_events (1:N)
└── community_groups (1:N, owner)

community_groups
├── group_members (1:N)
└── group_posts (1:N)

group_posts
├── post_comments (1:N)
└── post_likes (1:N)
```

## ERDCloud Import 후 작업

1. **테이블 위치 조정**: ERDCloud에서 테이블을 드래그하여 논리적으로 그룹핑
2. **관계선 확인**: 외래키 관계가 올바르게 표시되는지 확인
3. **색상 코딩**: 도메인별로 테이블 색상 설정
   - 핵심 엔티티: 파란색
   - 레시피 관련: 초록색
   - 건강 관리: 빨간색
   - 구독/결제: 노란색
   - 게임화/소셜: 보라색
4. **주석 추가**: 각 테이블에 설명 추가
5. **그룹 생성**: 관련 테이블들을 그룹으로 묶기

## 문제 해결

### Import 실패 시

1. **SQL 구문 오류**: ERDCloud가 일부 PostgreSQL 특화 구문을 지원하지 않을 수 있습니다.
   - 해결: `pg_dump` 대신 `supabase db dump` 사용
   
2. **테이블이 너무 많음**: 100개 이상의 테이블을 한 번에 import하면 성능 문제가 발생할 수 있습니다.
   - 해결: 주요 테이블만 먼저 import하고 나머지는 점진적으로 추가

3. **외래키 관계가 표시되지 않음**: 
   - 해결: ERDCloud에서 수동으로 관계 추가 또는 SQL DDL에 명시적으로 FOREIGN KEY 제약조건 포함 확인

## 추가 리소스

- [ERDCloud 공식 문서](https://www.erdcloud.com/)
- [Supabase CLI 문서](https://supabase.com/docs/reference/cli/introduction)
- [PostgreSQL DDL 가이드](https://www.postgresql.org/docs/current/ddl.html)

