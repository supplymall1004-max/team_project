# ERDCloud용 데이터베이스 스키마 추출 가이드

## 방법 1: Supabase CLI 사용 (권장)

Supabase CLI를 사용하면 전체 스키마를 DDL 형식으로 쉽게 추출할 수 있습니다.

```bash
# Supabase CLI 설치 (아직 설치하지 않은 경우)
npm install -g supabase

# Supabase 로그인
supabase login

# 프로젝트 링크
supabase link --project-ref xlbhrgvnfioxtvocwban

# 전체 스키마 DDL 추출
supabase db dump -f erdcloud_schema.sql

# 또는 특정 스키마만 추출
supabase db dump --schema public -f erdcloud_schema.sql
```

생성된 `erdcloud_schema.sql` 파일을 ERDCloud에 직접 import할 수 있습니다.

## 방법 2: ERDCloud 웹사이트에서 직접 import

1. https://www.erdcloud.com/ 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 열기
3. "Import" 또는 "Import Database" 메뉴 선택
4. SQL DDL 형식 선택
5. 아래 SQL DDL을 복사하여 붙여넣기

## 방법 3: 제공된 파일 사용

이 디렉토리에 다음 파일들이 포함되어 있습니다:

- `erdcloud_schema.sql`: 주요 테이블과 관계를 포함한 SQL DDL
- `erdcloud_import.csv`: CSV 형식의 테이블/컬럼 정보 (일부 테이블만 포함)

## 주요 테이블 관계

### 핵심 엔티티
- **users**: 모든 사용자 관련 테이블의 부모 테이블
- **family_members**: 가족 구성원 (사람/반려동물)
- **user_health_profiles**: 사용자 건강 프로필 (1:1 관계)

### 레시피 관련
- **recipes**: 레시피 기본 정보
- **recipe_ingredients**: 레시피 재료
- **recipe_steps**: 레시피 조리 단계
- **diet_plans**: 식단 계획
- **weekly_diet_plans**: 주간 식단 메타데이터

### 건강 관리
- **diseases**: 질병 마스터 데이터
- **allergies**: 알레르기 마스터 데이터
- **medication_records**: 약물 복용 기록
- **hospital_records**: 병원 방문 기록
- **user_vaccination_records**: 예방접종 기록

### 구독/결제
- **subscriptions**: 구독 정보
- **promo_codes**: 프로모션 코드
- **payment_transactions**: 결제 내역

### 게임화/소셜
- **user_gamification**: 게임화 데이터
- **community_groups**: 커뮤니티 그룹
- **group_posts**: 그룹 게시글
- **notifications**: 통합 알림

## ERDCloud Import 시 주의사항

1. **외래키 관계**: ERDCloud는 외래키 관계를 자동으로 인식하지만, 일부 복잡한 관계는 수동으로 설정해야 할 수 있습니다.

2. **데이터 타입**: PostgreSQL 특화 타입(예: JSONB, ARRAY)은 ERDCloud에서 올바르게 표시되지 않을 수 있습니다. 필요시 수정하세요.

3. **인덱스 및 제약조건**: 현재 DDL에는 기본적인 PRIMARY KEY와 FOREIGN KEY만 포함되어 있습니다. 추가 인덱스나 제약조건이 필요하면 수동으로 추가하세요.

4. **테이블 수**: 현재 데이터베이스에는 100개 이상의 테이블이 있습니다. ERDCloud에서 모든 테이블을 한 번에 import하면 성능 문제가 발생할 수 있으므로, 주요 테이블만 먼저 import하고 나머지는 점진적으로 추가하는 것을 권장합니다.

## 다음 단계

1. ERDCloud에 스키마 import
2. 테이블 위치 조정 및 관계선 정리
3. 테이블 색상 및 그룹핑 설정
4. 주석 및 설명 추가
5. 팀과 공유

