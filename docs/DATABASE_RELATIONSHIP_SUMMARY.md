# 데이터베이스 관계성 재설계 요약

> **작성일**: 2025-01-29  
> **목적**: 비개발자 초보자를 위한 쉬운 요약

---

## 📊 변경 사항 요약

### 1. 데이터베이스 변경 사항

| 테이블 | 변경 내용 | 이유 |
|--------|----------|------|
| `diet_plans` | `weekly_diet_plan_id` 컬럼 추가 | 주간 식단과 일일 식단을 연결하여 관리 |
| `recipe_usage_history` | `recipe_id` 컬럼 추가 | 레시피 제목 대신 ID로 직접 참조 |
| `favorite_meals` | `recipe_id` 외래 키 제약조건 추가 | 데이터 무결성 보장 |
| `meal_kits` | `created_by` 외래 키 제약조건 추가 | 관리자 추적 가능 |

---

## 🔗 추가된 관계

### 1. `diet_plans` ↔ `weekly_diet_plans`

**관계**: 일일 식단이 주간 식단에 속할 수 있음 (선택적)

**이유**:
- 주간 식단 생성 시 일일 식단들을 그룹화하여 관리
- 주간 식단 삭제 시 관련 일일 식단도 함께 관리 가능

**예시**:
```
주간 식단 (2025-01-27 ~ 2025-02-02)
├── 일일 식단 (2025-01-27) → weekly_diet_plan_id 연결
├── 일일 식단 (2025-01-28) → weekly_diet_plan_id 연결
└── 일일 식단 (2025-01-29) → weekly_diet_plan_id 연결
```

---

### 2. `recipe_usage_history` ↔ `recipes`

**관계**: 레시피 사용 이력이 레시피를 직접 참조 (선택적)

**이유**:
- 레시피 제목 대신 레시피 ID로 직접 참조 가능
- 레시피 삭제 시 사용 이력도 함께 관리 가능

**예시**:
```
레시피 사용 이력
├── recipe_id: "123e4567-e89b-12d3-a456-426614174000" (레시피 ID)
└── recipe_title: "김치찌개" (레시피 제목, 백업용)
```

---

### 3. `favorite_meals` ↔ `recipes`

**관계**: 즐겨찾기한 레시피 참조 (필수)

**이유**:
- 레시피 삭제 시 즐겨찾기도 함께 삭제 (데이터 정리)
- 존재하지 않는 레시피를 즐겨찾기할 수 없음 (데이터 무결성)

---

### 4. `meal_kits` ↔ `users`

**관계**: 밀키트 생성자 참조 (선택적)

**이유**:
- 관리자가 생성한 밀키트를 추적 가능
- 사용자 삭제 시 생성자 정보는 유지 (SET NULL)

---

## 📝 실행 방법

### 1단계: SQL 마이그레이션 실행

Supabase SQL Editor에서 다음 파일을 실행하세요:

```
supabase/migrations/20250129000000_improve_database_relationships.sql
```

**실행 방법**:
1. Supabase Dashboard 접속
2. SQL Editor 열기
3. 위 파일의 내용을 복사하여 붙여넣기
4. 실행 버튼 클릭

**확인 방법**:
- 마이그레이션 실행 후 검증 쿼리 결과 확인
- 외래 키 제약조건이 올바르게 추가되었는지 확인

---

### 2단계: 코드 변경 확인

다음 파일들이 자동으로 수정되었습니다:

1. **`lib/diet/recipe-history.ts`**
   - 레시피 사용 이력 저장 시 `recipe_id`도 함께 저장
   - 레시피 제목으로 레시피 ID 자동 조회

2. **`app/api/diet/personal/route.ts`**
   - 식단 저장 시 에러 핸들링 개선
   - 사용자 친화적인 에러 메시지 제공
   - `weekly_diet_plan_id` 저장 지원 (향후 주간 식단 기능에서 사용)

---

## ✅ 검증 방법

### 1. 데이터베이스 검증

다음 SQL 쿼리로 외래 키 제약조건 확인:

```sql
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('diet_plans', 'favorite_meals', 'recipe_usage_history', 'meal_kits')
ORDER BY tc.table_name, kcu.column_name;
```

**예상 결과**:
- `diet_plans.weekly_diet_plan_id` → `weekly_diet_plans.id` (SET NULL)
- `favorite_meals.recipe_id` → `recipes.id` (CASCADE)
- `recipe_usage_history.recipe_id` → `recipes.id` (SET NULL)
- `meal_kits.created_by` → `users.id` (SET NULL)

---

### 2. 기능 테스트

다음 기능들을 테스트하세요:

1. **식단 생성**
   - 개인 식단 생성 시 정상 저장되는지 확인
   - 에러 발생 시 사용자 친화적인 메시지 표시되는지 확인

2. **레시피 사용 이력**
   - 레시피 사용 시 `recipe_id`가 함께 저장되는지 확인
   - 레시피 제목만 있는 경우에도 정상 작동하는지 확인

3. **즐겨찾기**
   - 레시피 즐겨찾기 시 정상 저장되는지 확인
   - 존재하지 않는 레시피 즐겨찾기 시도 시 에러 발생하는지 확인

---

## 🎯 주요 개선 사항

### 1. 데이터 무결성 향상

**이전**:
- 레시피 제목만으로 참조 → 레시피 삭제 시 고아 데이터 발생 가능
- 외래 키 제약조건 없음 → 존재하지 않는 데이터 참조 가능

**이후**:
- 레시피 ID로 직접 참조 → 데이터 무결성 보장
- 외래 키 제약조건 추가 → 존재하지 않는 데이터 참조 불가

---

### 2. 에러 메시지 개선

**이전**:
```json
{
  "error": "Failed to save diet plan",
  "details": "insert or update on table \"diet_plans\" violates foreign key constraint"
}
```

**이후**:
```json
{
  "error": "식단 저장 실패",
  "message": "선택한 레시피를 찾을 수 없습니다. 레시피가 삭제되었을 수 있습니다.",
  "details": "레시피를 찾을 수 없습니다. 레시피가 삭제되었거나 존재하지 않습니다."
}
```

---

### 3. 데이터 관리 개선

**이전**:
- 주간 식단과 일일 식단 간의 명시적인 관계 없음
- 주간 식단 삭제 시 관련 일일 식단 관리 어려움

**이후**:
- `weekly_diet_plan_id`로 주간 식단과 일일 식단 연결
- 주간 식단 삭제 시 관련 일일 식단도 함께 관리 가능

---

## 📚 참고 자료

### 관련 문서

1. **상세 분석 문서**: `docs/DATABASE_RELATIONSHIP_REDESIGN.md`
   - 전체 데이터 흐름 분석
   - 각 관계의 상세 설명
   - 코드 수정 사항

2. **SQL 마이그레이션**: `supabase/migrations/20250129000000_improve_database_relationships.sql`
   - 실행 가능한 SQL 쿼리
   - 검증 쿼리 포함

---

## ❓ 자주 묻는 질문

### Q1: 마이그레이션 실행 시 기존 데이터에 영향을 주나요?

**A**: 기존 데이터가 제약조건을 위반하지 않는 한 문제없습니다. 
- `diet_plans.weekly_diet_plan_id`: NULL 허용이므로 기존 데이터에 영향 없음
- `recipe_usage_history.recipe_id`: NULL 허용이므로 기존 데이터에 영향 없음
- `favorite_meals.recipe_id`: 기존에 존재하지 않는 레시피를 참조하는 경우만 문제 발생 가능

**해결 방법**: 마이그레이션 전에 다음 쿼리로 문제 데이터 확인:

```sql
-- 존재하지 않는 레시피를 참조하는 즐겨찾기 확인
SELECT fm.* 
FROM favorite_meals fm
LEFT JOIN recipes r ON fm.recipe_id = r.id
WHERE fm.recipe_id IS NOT NULL AND r.id IS NULL;
```

---

### Q2: `weekly_diet_plan_id`가 NULL인 경우가 있나요?

**A**: 네, 정상입니다. 
- 일일 식단은 주간 식단 없이도 생성할 수 있어야 합니다
- 주간 식단 생성 시에만 `weekly_diet_plan_id`가 설정됩니다
- 개인 식단 생성 시에는 NULL로 저장됩니다

---

### Q3: 레시피 삭제 시 어떤 일이 발생하나요?

**A**: 삭제 정책에 따라 다릅니다:

1. **CASCADE (즐겨찾기)**
   - 레시피 삭제 시 즐겨찾기도 함께 삭제됨

2. **SET NULL (식단, 사용 이력)**
   - 레시피 삭제 시 `recipe_id`는 NULL로 설정됨
   - `recipe_title`은 유지되어 백업 정보로 사용됨

---

## 🎉 완료!

모든 변경 사항이 완료되었습니다. 다음 단계:

1. ✅ SQL 마이그레이션 실행
2. ✅ 코드 변경 확인
3. ✅ 기능 테스트
4. ✅ 검증 쿼리 실행

문제가 발생하면 `docs/DATABASE_RELATIONSHIP_REDESIGN.md` 문서를 참고하세요.

---

**문서 작성일**: 2025-01-29  
**마지막 업데이트**: 2025-01-29

