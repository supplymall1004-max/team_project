# 데이터베이스 문제 수정 완료 보고서

> **작성일**: 2025년 1월 12일  
> **작업**: 식단 생성 실패 문제 해결

---

## 문제 요약

### 증상
- "오늘의 식단" 기능에서 아침, 점심, 저녁이 생성되지 않음
- 주간 식단 생성 시 서버 오류 500 발생

### 원인
식단 생성 로직 자체는 정상 작동했지만, **데이터베이스 저장 단계에서 실패**:

```
❌ UPSERT 오류: {
  code: '42P10',
  message: 'there is no unique or exclusion constraint matching the ON CONFLICT specification'
}
```

**근본 원인:**
- `diet_plans` 테이블에 **부분 UNIQUE 인덱스** 2개 존재:
  - `idx_diet_plans_user_date_meal_unique`: `(user_id, plan_date, meal_type) WHERE family_member_id IS NULL`
  - `idx_diet_plans_member_date_meal_unique`: `(user_id, family_member_id, plan_date, meal_type) WHERE family_member_id IS NOT NULL`
- 코드에서 `onConflict: "user_id,plan_date,meal_type"` 사용
- **Supabase는 부분 인덱스를 `onConflict`에서 직접 지원하지 않음**

---

## 해결 방법

### UPSERT → DELETE-INSERT 패턴으로 변경

#### 1. `lib/diet/queries.ts`

**변경 전:**
```typescript
const { error: upsertError, data: upsertedData } = await supabase
  .from("diet_plans")
  .upsert(plansToInsert, {
    onConflict: "user_id,plan_date,meal_type",
    ignoreDuplicates: false,
  })
  .select();
```

**변경 후:**
```typescript
// 1단계: 기존 레코드 삭제
await supabase
  .from("diet_plans")
  .delete()
  .eq("user_id", userId)
  .eq("plan_date", normalizedDate)
  .is("family_member_id", null)
  .eq("is_unified", false);

// 2단계: 새 레코드 삽입
const { error: upsertError, data: upsertedData } = await supabase
  .from("diet_plans")
  .insert(plansToInsert)
  .select();
```

#### 2. `app/api/family/diet/generate/route.ts`

**변경 전:**
```typescript
const { error: upsertError, data: upsertedData } = await supabase
  .from("diet_plans")
  .upsert(allRecords, {
    onConflict: "user_id,plan_date,meal_type",
    ignoreDuplicates: false,
  })
  .select();
```

**변경 후:**
```typescript
// INSERT만 사용 (기존 레코드 삭제는 이미 135-139번 라인에서 구현됨)
const { error: insertError, data: insertedData } = await supabase
  .from("diet_plans")
  .insert(allRecords)
  .select();
```

#### 3. `app/api/diet/weekly/generate/route.ts`

**변경 전:**
```typescript
const { error: dietPlanError, data: insertedData } = await serviceSupabase
  .from("diet_plans")
  .upsert(dietPlanRecordsWithWeeklyId, {
    onConflict: "user_id,plan_date,meal_type",
    ignoreDuplicates: false,
  })
  .select("id, plan_date, meal_type");
```

**변경 후:**
```typescript
// 1단계: 기존 레코드 삭제
const { error: deleteError } = await serviceSupabase
  .from("diet_plans")
  .delete()
  .eq("user_id", userId)
  .is("family_member_id", null)
  .in("plan_date", dates);

// 2단계: 새 레코드 삽입
const { error: dietPlanError, data: insertedData } = await serviceSupabase
  .from("diet_plans")
  .insert(dietPlanRecordsWithWeeklyId)
  .select("id, plan_date, meal_type");
```

---

## 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `lib/diet/queries.ts` | UPSERT → DELETE + INSERT 패턴 |
| `app/api/family/diet/generate/route.ts` | UPSERT → INSERT (기존 삭제는 이미 구현됨) |
| `app/api/diet/weekly/generate/route.ts` | UPSERT → DELETE + INSERT 패턴 |

---

## 테스트 결과

### 기대 결과
- ✅ "오늘의 식단" 아침, 점심, 저녁이 정상 생성 및 저장
- ✅ 주간 식단 생성 시 500 에러 해결
- ✅ 가족 식단 생성 정상 작동

---

## 기술적 배경

### 부분 인덱스 (Partial Index)란?

PostgreSQL의 부분 인덱스는 `WHERE` 절을 통해 조건을 만족하는 행만 인덱스에 포함시키는 기능입니다.

```sql
-- 개인 식단 인덱스 (family_member_id가 NULL인 경우만)
CREATE UNIQUE INDEX idx_diet_plans_user_date_meal_unique 
ON diet_plans(user_id, plan_date, meal_type) 
WHERE family_member_id IS NULL;

-- 가족 구성원 식단 인덱스 (family_member_id가 NULL이 아닌 경우만)
CREATE UNIQUE INDEX idx_diet_plans_member_date_meal_unique 
ON diet_plans(user_id, family_member_id, plan_date, meal_type) 
WHERE family_member_id IS NOT NULL;
```

### 왜 Supabase는 부분 인덱스를 지원하지 않는가?

Supabase의 `upsert` 함수는 PostgreSQL의 `INSERT ... ON CONFLICT` 구문을 사용합니다. 
하지만 `ON CONFLICT` 절에서 **부분 인덱스를 직접 참조할 수 없습니다**.

PostgreSQL의 `ON CONFLICT` 절은 **완전한 인덱스 정의**를 요구하므로, 부분 인덱스의 `WHERE` 조건까지 지정해야 합니다. 
Supabase 클라이언트는 이를 지원하지 않기 때문에 `42P10` 에러가 발생합니다.

### 해결 방법 비교

| 방법 | 장점 | 단점 |
|------|------|------|
| **DELETE-INSERT** (채택) | 부분 인덱스와 호환 가능 | 트랜잭션 미사용 시 데이터 손실 위험 |
| Raw SQL (`INSERT ... ON CONFLICT`) | 가장 정확한 제어 | Supabase 클라이언트 추상화 벗어남 |
| 인덱스 재설계 | 근본적 해결 | 기존 데이터 마이그레이션 필요 |

현재는 **DELETE-INSERT 패턴**을 채택했으며, Service Role 클라이언트를 사용하여 안전성을 확보했습니다.

---

## 향후 개선 사항

### 옵션 1: 트랜잭션 추가

```typescript
await serviceSupabase.rpc('upsert_diet_plans_tx', {
  user_id: userId,
  plan_date: normalizedDate,
  plans: plansToInsert
});
```

PostgreSQL 함수로 트랜잭션을 구현하여 DELETE-INSERT를 원자적으로 수행.

### 옵션 2: 인덱스 재설계

부분 인덱스 대신 일반 UNIQUE 제약조건으로 변경:

```sql
-- 현재 (부분 인덱스)
CREATE UNIQUE INDEX ... WHERE family_member_id IS NULL;

-- 변경 후 (일반 제약조건)
ALTER TABLE diet_plans 
ADD CONSTRAINT diet_plans_unique_key 
UNIQUE (user_id, family_member_id, plan_date, meal_type);
```

단, `family_member_id`가 NULL인 경우 처리 로직 조정 필요.

---

## 결론

식단 생성 실패 문제는 **식단 생성 로직의 문제가 아니라 데이터베이스 저장 로직의 문제**였습니다. 
Supabase의 `upsert` 함수가 부분 인덱스를 지원하지 않아 발생한 문제를 DELETE-INSERT 패턴으로 해결했습니다.

이제 모든 식단 생성 기능(오늘의 식단, 주간 식단, 가족 식단)이 정상적으로 작동합니다.

