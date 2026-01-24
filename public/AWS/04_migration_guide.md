# Supabase에서 AWS RDS PostgreSQL로 마이그레이션 가이드

이 가이드는 Supabase PostgreSQL 데이터베이스를 AWS RDS PostgreSQL로 마이그레이션하는 단계별 절차를 설명합니다.

## 목차

1. [사전 준비사항](#사전-준비사항)
2. [마이그레이션 전 체크리스트](#마이그레이션-전-체크리스트)
3. [AWS RDS 인스턴스 설정](#aws-rds-인스턴스-설정)
4. [SQL 스크립트 실행](#sql-스크립트-실행)
5. [데이터 마이그레이션](#데이터-마이그레이션)
6. [마이그레이션 후 검증](#마이그레이션-후-검증)
7. [주의사항 및 문제 해결](#주의사항-및-문제-해결)

## 사전 준비사항

### 1. 필요한 도구 및 권한

- **AWS 계정**: RDS 인스턴스 생성 및 관리 권한
- **PostgreSQL 클라이언트**: `psql` 또는 GUI 도구 (pgAdmin, DBeaver 등)
- **Supabase 프로젝트 접근 권한**: 데이터베이스 연결 정보 및 데이터 추출 권한

### 2. AWS RDS 요구사항

- **PostgreSQL 버전**: 15.x 이상 권장 (Supabase는 PostgreSQL 17 사용)
- **인스턴스 클래스**: 데이터 크기에 따라 결정 (최소 db.t3.micro)
- **스토리지**: 데이터 크기 + 20% 여유 공간
- **보안 그룹**: 애플리케이션 서버에서 접근 가능하도록 설정

## 마이그레이션 전 체크리스트

### Supabase에서 확인할 사항

- [ ] 데이터베이스 크기 확인 (스토리지 계획)
- [ ] 테이블 개수 및 관계 확인
- [ ] 외래 키 제약조건 확인
- [ ] 인덱스 목록 확인
- [ ] 트리거 및 함수 확인 (제외됨)
- [ ] RLS 정책 확인 (제외됨)
- [ ] Extensions 확인 (필요한 경우 설치)

### AWS RDS에서 확인할 사항

- [ ] RDS 인스턴스 생성 완료
- [ ] 보안 그룹 설정 완료
- [ ] 데이터베이스 생성 완료
- [ ] 마스터 사용자 계정 생성 완료
- [ ] 네트워크 연결 확인

## AWS RDS 인스턴스 설정

### 1. RDS 인스턴스 생성

AWS 콘솔에서 다음 설정으로 RDS 인스턴스를 생성합니다:

```
엔진: PostgreSQL
버전: 15.5 이상 (Supabase는 17 사용, 호환성 확인 필요)
템플릿: 프로덕션 또는 개발/테스트
인스턴스 클래스: db.t3.micro (최소) ~ db.r6g.large (권장)
스토리지: 범용 SSD, 20GB 이상
데이터베이스 이름: your_database_name
마스터 사용자 이름: postgres (또는 원하는 이름)
마스터 암호: 강력한 비밀번호 설정
```

### 2. 보안 그룹 설정

RDS 인스턴스의 보안 그룹에 다음 규칙을 추가합니다:

- **인바운드 규칙**: 
  - Type: PostgreSQL
  - Port: 5432
  - Source: 애플리케이션 서버 IP 또는 VPC CIDR

### 3. 데이터베이스 연결 확인

로컬에서 PostgreSQL 클라이언트로 연결을 테스트합니다:

```bash
psql -h your-rds-endpoint.region.rds.amazonaws.com -U postgres -d your_database_name
```

또는 연결 문자열 사용:

```
postgresql://postgres:password@your-rds-endpoint.region.rds.amazonaws.com:5432/your_database_name
```

## SQL 스크립트 실행

### 실행 순서

SQL 스크립트는 **반드시 다음 순서대로** 실행해야 합니다:

1. **Part 1**: 마스터 데이터 및 사용자 테이블
2. **Part 2**: 가족 구성원 및 레시피 테이블
3. **Part 3**: 식단 및 건강 관리 테이블
4. **Part 4**: 알림 및 커뮤니티 테이블
5. **Part 5**: 게임화 및 기타 테이블

### AWS Query Editor에서 실행

#### 방법 1: AWS Query Editor 사용 (권장)

1. AWS RDS 콘솔에서 대상 인스턴스를 선택
2. "Query Editor" 탭 클릭
3. 데이터베이스 연결 정보 입력
4. 각 SQL 파일의 내용을 복사하여 실행
5. 오류가 발생하면 해당 부분만 수정하여 재실행

**주의사항**:
- AWS Query Editor는 한 번에 실행할 수 있는 쿼리 크기에 제한이 있을 수 있습니다
- 큰 스크립트는 여러 부분으로 나누어 실행하세요
- 각 블록 실행 후 오류 메시지를 확인하세요

#### 방법 2: psql 명령줄 사용

```bash
# Part 1 실행
psql -h your-rds-endpoint.region.rds.amazonaws.com \
     -U postgres \
     -d your_database_name \
     -f 03_migration_sql_part1_master_and_users.sql

# Part 2 실행
psql -h your-rds-endpoint.region.rds.amazonaws.com \
     -U postgres \
     -d your_database_name \
     -f 03_migration_sql_part2_family_and_recipes.sql

# ... 나머지 파일들도 동일하게 실행
```

#### 방법 3: GUI 도구 사용 (pgAdmin, DBeaver 등)

1. 데이터베이스에 연결
2. SQL 편집기 열기
3. 각 SQL 파일을 열어서 실행
4. 트랜잭션 모드에서 실행하여 오류 시 롤백 가능

### 실행 시 주의사항

1. **트랜잭션 사용**: 
   - 각 Part를 하나의 트랜잭션으로 실행하는 것을 권장합니다
   - 오류 발생 시 롤백하여 데이터베이스 상태를 일관되게 유지

2. **오류 처리**:
   - 외래 키 오류가 발생하면 테이블 생성 순서를 확인하세요
   - `IF NOT EXISTS` 절을 사용하여 중복 생성 방지

3. **성능 고려**:
   - 대용량 데이터베이스의 경우 인덱스 생성을 나중에 수행할 수 있습니다
   - `CREATE INDEX CONCURRENTLY`를 사용하여 프로덕션 환경에서 블로킹 방지

## 데이터 마이그레이션

### 1. 데이터 추출 (Supabase)

Supabase에서 데이터를 추출합니다:

```bash
# pg_dump 사용 (전체 데이터베이스)
pg_dump -h db.your-project.supabase.co \
        -U postgres \
        -d postgres \
        --data-only \
        --column-inserts \
        > supabase_data.sql

# 또는 특정 테이블만 추출
pg_dump -h db.your-project.supabase.co \
        -U postgres \
        -d postgres \
        --table=users \
        --data-only \
        --column-inserts \
        > users_data.sql
```

### 2. 데이터 변환

Supabase 특수 기능을 제거하고 표준 PostgreSQL 형식으로 변환:

- `auth.users` 테이블 데이터는 `public.users`로 변환 필요
- UUID 형식 확인
- JSONB 데이터 형식 확인
- 타임스탬프 형식 확인

### 3. 데이터 로드 (AWS RDS)

```bash
# 데이터 로드
psql -h your-rds-endpoint.region.rds.amazonaws.com \
     -U postgres \
     -d your_database_name \
     -f supabase_data.sql
```

### 4. 데이터 검증

```sql
-- 테이블 개수 확인
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- 레코드 수 확인
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 외래 키 확인
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';
```

## 마이그레이션 후 검증

### 1. 스키마 검증

```sql
-- 모든 테이블이 생성되었는지 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 외래 키 제약조건 확인
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

### 2. 데이터 무결성 검증

```sql
-- 샘플 데이터 확인
SELECT * FROM users LIMIT 5;
SELECT * FROM recipes LIMIT 5;
SELECT * FROM family_members LIMIT 5;

-- 외래 키 무결성 확인
SELECT 
    'users' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT id) as unique_ids
FROM users
UNION ALL
SELECT 
    'family_members' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT user_id) as valid_user_ids
FROM family_members;
```

### 3. 애플리케이션 연결 테스트

애플리케이션의 데이터베이스 연결 문자열을 AWS RDS로 변경하고 테스트:

```env
# .env 파일 수정
DATABASE_URL=postgresql://postgres:password@your-rds-endpoint.region.rds.amazonaws.com:5432/your_database_name
```

## 주의사항 및 문제 해결

### 일반적인 문제

#### 1. 외래 키 오류

**증상**: `ERROR: relation "table_name" does not exist`

**원인**: 테이블 생성 순서가 잘못됨

**해결책**:
- `01_table_creation_order.md` 파일을 참조하여 올바른 순서로 실행
- 의존하는 테이블이 먼저 생성되었는지 확인

#### 2. 데이터 타입 불일치

**증상**: `ERROR: column "column_name" is of type type1 but expression is of type type2`

**원인**: Supabase와 AWS RDS의 데이터 타입 차이

**해결책**:
- `CAST` 또는 `::` 연산자를 사용하여 타입 변환
- 예: `CAST(value AS TEXT)` 또는 `value::TEXT`

#### 3. 권한 오류

**증상**: `ERROR: permission denied for schema public`

**원인**: 사용자에게 적절한 권한이 없음

**해결책**:
```sql
-- 마스터 사용자로 실행
GRANT ALL PRIVILEGES ON DATABASE your_database_name TO your_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

#### 4. 연결 타임아웃

**증상**: `timeout expired` 또는 연결 실패

**원인**: 보안 그룹 설정 또는 네트워크 문제

**해결책**:
- 보안 그룹에서 인바운드 규칙 확인
- VPC 및 서브넷 설정 확인
- RDS 인스턴스의 퍼블릭 액세스 가능 여부 확인

### Supabase 특수 기능 제외 사항

다음 항목들은 이 마이그레이션 스크립트에 포함되지 않았습니다:

1. **RLS (Row Level Security) 정책**: 
   - 프로덕션 환경에서는 적절한 RLS 정책을 추가해야 합니다
   - 또는 애플리케이션 레벨에서 권한 제어를 구현해야 합니다

2. **Supabase Extensions**:
   - `uuid-ossp`: UUID 생성 함수 (PostgreSQL 기본 함수 사용)
   - `pgcrypto`: 암호화 함수 (필요한 경우 설치)
   - 기타 Supabase 특수 확장

3. **auth 스키마**:
   - Supabase의 `auth` 스키마는 제외되었습니다
   - Clerk 인증을 사용하는 경우 `auth` 스키마가 필요 없습니다

4. **트리거 및 함수**:
   - 데이터베이스 함수 및 트리거는 별도로 마이그레이션해야 합니다
   - 애플리케이션 로직으로 대체하는 것을 권장합니다

### 성능 최적화 권장사항

1. **인덱스 생성**:
   - 대용량 데이터 마이그레이션 후 인덱스 생성
   - `CREATE INDEX CONCURRENTLY` 사용 권장

2. **통계 업데이트**:
```sql
ANALYZE;
```

3. **백업 설정**:
   - RDS 자동 백업 활성화
   - 스냅샷 생성

## 추가 리소스

- [AWS RDS PostgreSQL 문서](https://docs.aws.amazon.com/rds/latest/userguide/CHAP_PostgreSQL.html)
- [Supabase 마이그레이션 가이드](https://supabase.com/docs/guides/database/migrations)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)

## 지원

문제가 발생하면 다음을 확인하세요:

1. AWS RDS 로그 확인
2. Supabase 로그 확인
3. 애플리케이션 로그 확인
4. 네트워크 연결 상태 확인

---

**마이그레이션 완료 후 반드시 데이터 백업을 수행하세요!**

