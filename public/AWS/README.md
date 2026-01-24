# Supabase to AWS RDS PostgreSQL 마이그레이션 패키지

이 디렉토리는 Supabase PostgreSQL 데이터베이스를 AWS RDS PostgreSQL로 마이그레이션하기 위한 모든 리소스를 포함합니다.

## 📁 파일 구조

```
AWS/
├── README.md                                    # 이 파일 (전체 개요)
├── 01_table_creation_order.md                  # 테이블 생성 순서 가이드
├── 02_ERD.md                                    # ERD 다이어그램 및 관계 설명
├── 03_migration_sql_part1_master_and_users.sql # Part 1: 마스터 데이터 및 사용자 테이블
├── 03_migration_sql_part2_family_and_recipes.sql # Part 2: 가족 구성원 및 레시피 테이블 (예정)
├── 03_migration_sql_part3_diet_and_health.sql  # Part 3: 식단 및 건강 관리 테이블 (예정)
├── 03_migration_sql_part4_notifications.sql    # Part 4: 알림 및 커뮤니티 테이블 (예정)
├── 03_migration_sql_part5_gamification.sql     # Part 5: 게임화 및 기타 테이블 (예정)
└── 04_migration_guide.md                       # 상세 마이그레이션 가이드
```

## 🚀 빠른 시작

### 1단계: 문서 읽기

마이그레이션을 시작하기 전에 다음 문서를 읽어보세요:

1. **`04_migration_guide.md`**: 전체 마이그레이션 프로세스 이해
2. **`01_table_creation_order.md`**: 테이블 생성 순서 및 의존성 이해
3. **`02_ERD.md`**: 데이터베이스 구조 및 관계 이해

### 2단계: AWS RDS 준비

1. AWS RDS PostgreSQL 인스턴스 생성
2. 보안 그룹 설정
3. 데이터베이스 연결 테스트

자세한 내용은 `04_migration_guide.md`의 "AWS RDS 인스턴스 설정" 섹션을 참조하세요.

### 3단계: SQL 스크립트 실행

**중요**: SQL 스크립트는 반드시 순서대로 실행해야 합니다!

```bash
# Part 1 실행
psql -h your-rds-endpoint.region.rds.amazonaws.com \
     -U postgres \
     -d your_database_name \
     -f 03_migration_sql_part1_master_and_users.sql

# Part 2 실행 (준비되면)
psql -h your-rds-endpoint.region.rds.amazonaws.com \
     -U postgres \
     -d your_database_name \
     -f 03_migration_sql_part2_family_and_recipes.sql

# ... 나머지 Part들도 동일하게 실행
```

또는 AWS Query Editor에서 각 SQL 파일을 순서대로 실행할 수 있습니다.

### 4단계: 데이터 마이그레이션

1. Supabase에서 데이터 추출
2. 데이터 변환 (필요한 경우)
3. AWS RDS에 데이터 로드

자세한 내용은 `04_migration_guide.md`의 "데이터 마이그레이션" 섹션을 참조하세요.

### 5단계: 검증

마이그레이션 후 데이터 무결성 및 애플리케이션 연결을 검증하세요.

자세한 내용은 `04_migration_guide.md`의 "마이그레이션 후 검증" 섹션을 참조하세요.

## 📊 데이터베이스 구조

### 주요 테이블 그룹

1. **사용자 및 인증** (Part 1)
   - `users` - 사용자 기본 정보 (중앙 허브 테이블)
   - `user_health_profiles` - 사용자 건강 프로필
   - `user_subscriptions` - 사용자 구독 관리
   - 기타 사용자 확장 테이블

2. **가족 구성원 관리** (Part 2)
   - `family_members` - 가족 구성원
   - `family_groups` - 가족 그룹

3. **레시피 및 식단** (Part 2, 3)
   - `recipes` - 레시피 기본 정보
   - `recipe_ingredients` - 레시피 재료
   - `recipe_steps` - 레시피 조리 단계
   - `weekly_diet_plans` - 주간 식단
   - `diet_plans` - 일일 식단

4. **건강 관리** (Part 3)
   - `health_data_sources` - 건강 데이터 소스
   - `hospital_records` - 병원 방문 기록
   - `medication_records` - 약물 복용 기록
   - `disease_records` - 질병 진단 기록
   - 기타 건강 관련 테이블

5. **알림 시스템** (Part 4)
   - `notifications` - 통합 알림 로그
   - `lifecycle_notification_shares` - 생애주기별 알림 공유

6. **커뮤니티** (Part 4)
   - `community_groups` - 커뮤니티 그룹
   - `group_posts` - 그룹 게시글
   - `post_comments` - 게시글 댓글

7. **게임화** (Part 5)
   - `character_levels` - 캐릭터 레벨
   - `character_game_events` - 캐릭터 게임 이벤트
   - `daily_quests` - 일일 퀘스트

전체 테이블 목록과 관계는 `02_ERD.md`를 참조하세요.

## ⚠️ 중요 사항

### 제외된 항목

이 마이그레이션 스크립트에는 다음이 **포함되지 않습니다**:

1. **RLS (Row Level Security) 정책**
   - 프로덕션 환경에서는 별도로 추가해야 합니다
   - 또는 애플리케이션 레벨에서 권한 제어 구현

2. **Supabase Extensions**
   - `uuid-ossp`: PostgreSQL 기본 함수 사용
   - `pgcrypto`: 필요한 경우 별도 설치
   - 기타 Supabase 특수 확장

3. **auth 스키마**
   - Clerk 인증 사용 시 불필요

4. **트리거 및 함수**
   - 데이터베이스 함수 및 트리거는 별도 마이그레이션 필요
   - 애플리케이션 로직으로 대체 권장

### 주의사항

1. **테이블 생성 순서**: 반드시 `01_table_creation_order.md`에 명시된 순서대로 실행
2. **외래 키 의존성**: 의존하는 테이블이 먼저 생성되어야 함
3. **순환 참조**: `recipes`와 `recipe_variation_groups`는 순환 참조 주의
4. **자기 참조**: `post_comments`와 `user_follows`는 자기 참조 처리 필요

## 🔍 문제 해결

일반적인 문제와 해결 방법은 `04_migration_guide.md`의 "주의사항 및 문제 해결" 섹션을 참조하세요.

### 자주 발생하는 오류

1. **외래 키 오류**: 테이블 생성 순서 확인
2. **데이터 타입 불일치**: 타입 변환 필요
3. **권한 오류**: 사용자 권한 부여 필요
4. **연결 타임아웃**: 보안 그룹 및 네트워크 설정 확인

## 📚 추가 문서

- **`01_table_creation_order.md`**: 테이블 생성 순서 및 의존성 상세 설명
- **`02_ERD.md`**: ERD 다이어그램 및 테이블 관계 설명
- **`04_migration_guide.md`**: 단계별 마이그레이션 가이드

## 🛠️ 도구 및 리소스

### 필요한 도구

- PostgreSQL 클라이언트 (`psql` 또는 GUI 도구)
- AWS 계정 및 RDS 접근 권한
- Supabase 프로젝트 접근 권한

### 유용한 링크

- [AWS RDS PostgreSQL 문서](https://docs.aws.amazon.com/rds/latest/userguide/CHAP_PostgreSQL.html)
- [Supabase 마이그레이션 가이드](https://supabase.com/docs/guides/database/migrations)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)

## 📝 체크리스트

마이그레이션 전 확인사항:

- [ ] AWS RDS 인스턴스 생성 완료
- [ ] 보안 그룹 설정 완료
- [ ] 데이터베이스 연결 테스트 완료
- [ ] Supabase 데이터 크기 확인
- [ ] 백업 계획 수립
- [ ] 롤백 계획 수립

마이그레이션 중:

- [ ] Part 1 실행 완료
- [ ] Part 2 실행 완료
- [ ] Part 3 실행 완료
- [ ] Part 4 실행 완료
- [ ] Part 5 실행 완료
- [ ] 데이터 마이그레이션 완료

마이그레이션 후:

- [ ] 스키마 검증 완료
- [ ] 데이터 무결성 검증 완료
- [ ] 애플리케이션 연결 테스트 완료
- [ ] 성능 테스트 완료
- [ ] 백업 생성 완료

## 💡 팁

1. **작은 단위로 테스트**: 먼저 개발 환경에서 전체 프로세스를 테스트하세요
2. **백업 필수**: 마이그레이션 전후로 반드시 백업을 생성하세요
3. **문서화**: 마이그레이션 과정에서 발생한 문제와 해결 방법을 기록하세요
4. **점진적 마이그레이션**: 가능하면 애플리케이션 다운타임을 최소화하는 전략을 고려하세요

## 📞 지원

문제가 발생하면:

1. `04_migration_guide.md`의 문제 해결 섹션 확인
2. AWS RDS 로그 확인
3. Supabase 로그 확인
4. 애플리케이션 로그 확인

---

**마이그레이션 완료 후 반드시 데이터 백업을 수행하세요!**

**작성일**: 2025-01-27
**버전**: 1.0.0

