# 테이블 통합 계획서

## 개요

기존에 반려동물을 위한 별도 테이블(`pets`, `pet_vaccination_records`, `pet_weight_records`, `pet_health_checkup_records`)을 생성하려던 계획을 변경하여, **기존 테이블을 확장하는 방식**으로 통합하여 테이블 수를 감소시킵니다.

## 통합 원칙

1. **테이블 삭제 금지**: 기존 테이블은 삭제하지 않고 확장만 수행
2. **관계성 유지**: 모든 외래키 관계를 명확하게 유지
3. **하위 호환성**: 기존 데이터와 코드에 영향을 주지 않도록 설계
4. **테이블 수 감소**: 가능한 한 기존 테이블을 재사용하여 테이블 수 최소화

## 통합 전략

### 1. 핵심 테이블 확장

#### `family_members` 테이블 확장
- **목적**: 사람과 반려동물을 모두 가족 구성원으로 관리
- **추가 필드**:
  - `member_type`: 'human' 또는 'pet' 구분
  - `pet_type`: 반려동물 종류 ('dog', 'cat', 'other')
  - `breed`: 견종/묘종
  - `lifecycle_stage`: 생애주기 단계 (반려동물용)
  - `pet_metadata`: 반려동물 추가 정보 (JSONB)
  - `photo_url`: 프로필 사진 URL (사람과 반려동물 모두 사용)

#### `notifications` 테이블
- **현재 상태**: 이미 `family_member_id`로 연결되어 있음
- **변경 사항**: `type`과 `category`에 반려동물 관련 값 추가
- **결과**: 별도 테이블 불필요, 기존 테이블 활용

### 2. 기존 테이블 재사용

#### `user_vaccination_records` 테이블
- **현재 상태**: 이미 `family_member_id`로 연결되어 있음
- **변경 사항**: 코멘트 업데이트 (반려동물도 지원한다는 명시)
- **결과**: 별도 `pet_vaccination_records` 테이블 불필요

#### `weight_logs` 테이블
- **현재 상태**: 이미 `family_member_id`로 연결되어 있음
- **변경 사항**: 코멘트 업데이트 (반려동물도 지원한다는 명시)
- **결과**: 별도 `pet_weight_records` 테이블 불필요

#### `hospital_records` 테이블
- **현재 상태**: 이미 `family_member_id`로 연결되어 있음
- **변경 사항**: 코멘트 업데이트 (반려동물의 경우 수의사 방문 기록으로 사용)
- **결과**: 별도 `pet_health_checkup_records` 테이블 불필요

#### `user_health_checkup_records` 테이블
- **현재 상태**: 이미 `family_member_id`로 연결되어 있음
- **변경 사항**: 코멘트 업데이트 (반려동물의 정기 검진, 치과 검진 등으로 사용)
- **결과**: 별도 `pet_health_checkup_records` 테이블 불필요

### 3. 마스터 데이터 테이블 유지

#### `pet_vaccine_master` 테이블
- **목적**: 반려동물 백신 마스터 데이터 (AVMA/AAHA 기준)
- **이유**: 마스터 데이터이므로 별도 테이블로 유지
- **위치**: `supabase/migrations/20251224153301_create_pet_vaccine_master_table.sql`

## 마이그레이션 파일 구조

### 1. `20251224152300_extend_notifications_for_pet_healthcare.sql`
- **목적**: `notifications` 테이블의 `type`과 `category` 확장
- **변경 사항**: 반려동물 관련 타입/카테고리 추가

### 2. `20251224153300_extend_family_members_for_pets.sql` (신규)
- **목적**: `family_members` 테이블 확장
- **변경 사항**: 반려동물 관련 필드 추가

### 3. `20251224153301_create_pet_vaccine_master_table.sql` (신규)
- **목적**: 반려동물 백신 마스터 데이터 테이블 생성
- **변경 사항**: 마스터 데이터 테이블 생성

### 4. `20251224153302_update_existing_tables_for_pets.sql` (신규)
- **목적**: 기존 테이블 코멘트 업데이트
- **변경 사항**: 반려동물 지원 명시

### 5. `20251224152500_insert_pet_vaccine_master_data.sql`
- **목적**: 반려동물 백신 마스터 데이터 초기화
- **변경 사항**: 주의사항 추가 (테이블 생성 후 실행)

## 테이블 수 감소 효과

### 통합 전 (계획)
- `pets` (신규)
- `pet_vaccination_records` (신규)
- `pet_weight_records` (신규)
- `pet_health_checkup_records` (신규)
- `pet_vaccine_master` (신규)
- **총 5개 테이블 추가**

### 통합 후 (실제)
- `family_members` (확장)
- `pet_vaccine_master` (신규, 마스터 데이터)
- **총 1개 테이블 추가 + 1개 테이블 확장**

### 감소 효과
- **테이블 수 감소**: 5개 → 1개 (80% 감소)
- **기존 테이블 재사용**: 4개 테이블 재사용

## 관계성 구조

```
users
  └── family_members (member_type: 'human' 또는 'pet')
       ├── user_vaccination_records (사람/반려동물 백신 기록)
       ├── weight_logs (사람/반려동물 체중 기록)
       ├── hospital_records (사람/반려동물 병원 방문 기록)
       ├── user_health_checkup_records (사람/반려동물 건강 검진 기록)
       └── notifications (사람/반려동물 알림)

pet_vaccine_master (마스터 데이터)
  └── user_vaccination_records.vaccine_code 참조
```

## 데이터 구분 방법

### 사람 vs 반려동물 구분
```sql
-- 사람 조회
SELECT * FROM family_members WHERE member_type = 'human';

-- 반려동물 조회
SELECT * FROM family_members WHERE member_type = 'pet';

-- 특정 반려동물 종류 조회
SELECT * FROM family_members 
WHERE member_type = 'pet' AND pet_type = 'dog';
```

### 백신 기록 구분
```sql
-- 반려동물 백신 기록 조회
SELECT vr.* 
FROM user_vaccination_records vr
JOIN family_members fm ON vr.family_member_id = fm.id
WHERE fm.member_type = 'pet';
```

## 오류 검사 체크리스트

- [x] SQL 문법 검증
- [x] 제약조건 확인 (CHECK, FOREIGN KEY)
- [x] 인덱스 생성 확인
- [x] 트리거 설정 확인
- [x] RLS 정책 확인
- [x] 권한 부여 확인
- [x] 코멘트 업데이트 확인
- [x] 기존 데이터 호환성 확인

## 실행 순서

1. `20251224152300_extend_notifications_for_pet_healthcare.sql`
2. `20251224153300_extend_family_members_for_pets.sql`
3. `20251224153301_create_pet_vaccine_master_table.sql`
4. `20251224152500_insert_pet_vaccine_master_data.sql`
5. `20251224153302_update_existing_tables_for_pets.sql`

## 주의사항

1. **기존 데이터 보존**: 모든 기존 `family_members` 레코드는 `member_type = 'human'`으로 자동 설정
2. **NULL 값 처리**: 반려동물 관련 필드는 사람일 때 NULL, 사람 관련 필드는 반려동물일 때 NULL
3. **제약조건**: `member_type = 'pet'`일 때만 `pet_type` 필드 사용
4. **하위 호환성**: 기존 코드는 수정 없이 동작 (기본값으로 `member_type = 'human'`)

## 향후 확장 가능성

이 통합 구조를 통해 향후 다른 유형의 구성원(예: 식물, 가상 캐릭터 등)도 쉽게 추가할 수 있습니다:

```sql
-- 향후 확장 예시
ALTER TABLE family_members 
  ADD CONSTRAINT family_members_member_type_check 
  CHECK (member_type IN ('human', 'pet', 'plant', 'virtual'));
```

