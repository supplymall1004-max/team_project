# 식단 생성 실패 원인 분석

## 에러 상황

- **에러 메시지**: "식단을 생성할 수 없습니다."
- **에러 위치**: `components/health/diet-section-client.tsx:364`
- **호출 경로**: `handleGenerateDiet` → `generateDietPlan` (Server Action) → `generateAndSaveDietPlan`

## 코드 흐름 분석

### 1. 호출 체인

```
diet-section-client.tsx:handleGenerateDiet (line 347)
  ↓
actions/diet/plan.ts:generateDietPlan (line 120)
  ↓
lib/diet/queries.ts:generateAndSaveDietPlan (line 625)
  ↓
lib/diet/queries.ts:generatePersonalDietForAPI (line 448)
  ↓
lib/diet/personal-diet-generator.ts:generatePersonalDiet (line 81)
```

### 2. `generateAndSaveDietPlan` 함수에서 null 반환하는 경우

`lib/diet/queries.ts:generateAndSaveDietPlan` 함수는 다음 경우에 `null`을 반환합니다:

#### 2.1. 날짜 형식 오류 (652-655)
```typescript
if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
  console.error("❌ 잘못된 날짜 형식:", date);
  return null;
}
```

#### 2.2. 기본 건강 프로필 생성 실패 (699-701)
```typescript
if (createError) {
  console.error("❌ 기본 건강 프로필 생성 실패:", createError);
  throw new Error(createError.message);
}
// catch 블록에서 null 반환
```

#### 2.3. 사용 가능한 레시피가 없음 (768-775)
```typescript
if (availableRecipes.length === 0) {
  console.warn("❌ 사용할 수 있는 레시피가 없습니다");
  return null;
}
```

#### 2.4. `generatePersonalDietForAPI` 호출 중 예외 발생 (798-813)
```typescript
try {
  recommendations = await generatePersonalDietForAPI(...);
} catch (error) {
  console.error("❌ 식단 생성 중 오류 발생:", error);
  return null;
}
```

#### 2.5. recommendations가 null인 경우 (815-819)
```typescript
if (!recommendations) {
  console.error("❌ 식단 추천 결과가 null입니다");
  return null;
}
```
**참고**: `generatePersonalDietForAPI`는 항상 객체를 반환하므로 이 경우는 발생하지 않습니다.

#### 2.6. 생성된 식단에 식사가 하나도 없음 (835-842)
```typescript
const hasAnyMeal =
  recommendations.breakfast ||
  recommendations.lunch ||
  recommendations.dinner ||
  recommendations.snack;
if (!hasAnyMeal) {
  console.error("❌ 생성된 식단에 식사가 하나도 없습니다");
  return null;
}
```

#### 2.7. 데이터베이스 저장 중 예외 발생 (1101-1105)
```typescript
try {
  // ... upsert 작업 ...
} catch (saveError) {
  console.error("❌ 저장 중 예외 발생:", saveError);
  throw saveError; // 상위로 전파
}
// 최종 catch 블록에서 null 반환 (1403-1410)
```

#### 2.8. 전체 함수에서 예외 발생 (1403-1410)
```typescript
catch (error) {
  console.error("❌ generateAndSaveDietPlan 오류:", error);
  return null;
}
```

### 3. `generateDietPlan` Server Action의 에러 처리

`actions/diet/plan.ts:generateDietPlan` 함수는 `generateAndSaveDietPlan`이 `null`을 반환했을 때:

1. 건강 정보 재확인 (285-298)
2. 레시피 확인 (301-313)
3. 최종 에러 반환 (316-321)
   ```typescript
   return {
     dietPlan: null,
     error: "식단을 생성할 수 없습니다.",
     details: "식단 생성 과정에서 오류가 발생했습니다. 서버 로그를 확인해주세요. 레시피에 제목이 없거나 저장 중 오류가 발생했을 수 있습니다.",
   };
   ```

## 가능한 실패 원인

현재 에러 메시지 "식단을 생성할 수 없습니다."는 `actions/diet/plan.ts:318`에서 반환되는 것으로, 다음과 같은 경우에 발생할 수 있습니다:

### 가능성이 높은 원인 (우선순위 순)

1. **`generatePersonalDiet` 함수에서 예외 발생**
   - `lib/diet/personal-diet-generator.ts:generatePersonalDiet`에서 예외가 발생하면
   - `generatePersonalDietForAPI`의 catch 블록에서 빈 recommendations 객체 반환 (606-618)
   - `generateAndSaveDietPlan`에서 식사가 하나도 없다고 판단하여 null 반환 (835-842)

2. **데이터베이스 저장 실패**
   - UPSERT 작업 중 제약조건 위반 또는 기타 DB 오류
   - 예외가 발생하여 최종 catch 블록에서 null 반환

3. **레시피 데이터 부족**
   - `getRecipesWithNutrition`이 빈 배열 반환
   - 폴백 레시피도 없는 경우

4. **건강 프로필 생성 실패**
   - 기본 건강 프로필 자동 생성 중 오류 발생

## 디버깅 방법

### 1. 서버 로그 확인

다음 로그들을 확인하여 어느 단계에서 실패했는지 확인:

```
[ServerAction] generateDietPlan
[DietQueries] 식단 추천 생성
🔄 개인 맞춤 식단 생성 시작...
❌ 식단 생성 중 오류 발생:
❌ 생성된 식단에 식사가 하나도 없습니다
❌ generateAndSaveDietPlan 오류:
```

### 2. 클라이언트 콘솔 확인

`diet-section-client.tsx:handleGenerateDiet`에서 다음 로그들을 확인:

```typescript
console.log("[DietSection] Server Action 응답:", result);
console.error("❌ 식단 생성 실패:", errorMessage);
console.error("❌ 에러 상세:", errorDetails);
console.error("❌ 전체 에러 데이터:", result);
```

### 3. 주요 체크포인트

1. **건강 프로필 존재 확인**
   - `user_health_profiles` 테이블에 사용자 데이터가 있는지 확인

2. **레시피 데이터 확인**
   - `recipes` 테이블에 레시피가 있는지 확인
   - `getRecipesWithNutrition` 함수가 레시피를 반환하는지 확인

3. **데이터베이스 제약조건 확인**
   - `diet_plans` 테이블의 UNIQUE 제약조건 확인
   - `recipe_title` 필드가 NOT NULL 제약조건을 위반하지 않는지 확인

4. **예외 스택 트레이스 확인**
   - `generatePersonalDiet` 함수에서 발생하는 예외의 전체 스택 트레이스 확인

## 개선 제안

### 1. 에러 메시지 구체화

현재 "식단을 생성할 수 없습니다."라는 일반적인 메시지 대신, 구체적인 원인을 반환하도록 개선:

```typescript
// actions/diet/plan.ts
if (!dietPlan) {
  // 구체적인 원인 파악을 위한 추가 검증
  const checkSupabase = getServiceRoleClient();
  
  // 건강 정보 확인
  const { data: healthCheck } = await checkSupabase
    .from("user_health_profiles")
    .select("id, daily_calorie_goal")
    .eq("user_id", userRow.id)
    .maybeSingle();
  
  if (!healthCheck) {
    return {
      dietPlan: null,
      error: "건강 정보를 찾을 수 없습니다.",
      details: "건강 정보를 먼저 입력해주세요.",
    };
  }
  
  // 레시피 확인
  const { data: recipeCheck } = await checkSupabase
    .from("recipes")
    .select("id")
    .limit(1);
  
  if (!recipeCheck || recipeCheck.length === 0) {
    return {
      dietPlan: null,
      error: "레시피 데이터가 없습니다.",
      details: "레시피 데이터베이스가 비어있습니다. 관리자에게 문의해주세요.",
    };
  }
  
  // 기타 원인
  return {
    dietPlan: null,
    error: "식단을 생성할 수 없습니다.",
    details: "식단 생성 과정에서 오류가 발생했습니다. 서버 로그를 확인해주세요.",
  };
}
```

### 2. 로깅 강화

각 단계에서 상세한 로그를 남기도록 개선:

```typescript
// lib/diet/queries.ts:generateAndSaveDietPlan
try {
  recommendations = await generatePersonalDietForAPI(...);
  console.log("✅ generatePersonalDietForAPI 성공:", {
    hasBreakfast: !!recommendations.breakfast,
    hasLunch: !!recommendations.lunch,
    hasDinner: !!recommendations.dinner,
    hasSnack: !!recommendations.snack,
  });
} catch (error) {
  console.error("❌ generatePersonalDietForAPI 예외:", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    userId,
    date,
    availableRecipesCount: availableRecipes.length,
  });
  return null;
}
```

### 3. 예외 처리 개선

`generatePersonalDietForAPI`의 catch 블록에서 빈 객체 대신 예외를 상위로 전파:

```typescript
// lib/diet/queries.ts:generatePersonalDietForAPI
catch (error) {
  console.error("❌ 개인 맞춤 식단 생성 실패:", error);
  // 빈 객체 반환 대신 예외를 상위로 전파하여 원인 파악 가능하도록
  throw error;
}
```

### 4. 검증 로직 강화

식단 생성 전에 사전 검증을 추가:

```typescript
// lib/diet/queries.ts:generateAndSaveDietPlan
// 레시피 확인
if (availableRecipes.length === 0) {
  console.error("❌ 사용 가능한 레시피가 없습니다");
  console.groupEnd();
  return null;
}

// 건강 정보 검증
if (!healthProfile.daily_calorie_goal || healthProfile.daily_calorie_goal <= 0) {
  console.warn("⚠️ 일일 칼로리 목표가 유효하지 않음:", healthProfile.daily_calorie_goal);
  healthProfile.daily_calorie_goal = 2000;
}
```

## 발견된 버그 및 수정

### 발견된 문제

`lib/diet/personal-diet-generator.ts:selectMealComposition` 함수에서:

1. **반찬 선택 로직 (930-952)**: 폴백 레시피 사용 ✅
2. **국/찌개 선택 로직 (954-996)**: 폴백 레시피 사용 안 함 ❌

국/찌개 선택이 실패할 경우:
- `selectDishForMeal` 함수가 `undefined`를 반환
- 국/찌개가 없어서 검증 단계 (1031-1033)에서 실패
- `throw new Error("식단 구성 규칙 위배...")` 예외 발생
- `generatePersonalDiet` 함수의 catch 블록에서 예외를 다시 던짐
- `generatePersonalDietForAPI`의 catch 블록에서 빈 recommendations 객체 반환
- `generateAndSaveDietPlan`에서 식사가 하나도 없다고 판단하여 null 반환
- 최종적으로 "식단을 생성할 수 없습니다." 에러 발생

### 수정 내용

국/찌개 선택 실패 시 폴백 레시피를 사용하도록 수정:

```typescript
// 국/찌개가 없으면 폴백 사용 (반찬과 동일한 로직)
if (!soup) {
  console.warn(`⚠️ 국/찌개 선택 실패 → 폴백 레시피 사용`);
  const fallbackSoupsRaw = searchFallbackRecipes({
    dishType: ["soup"],
    mealType,
    excludeNames: [...recentlyUsed],
    limit: 20,
  });
  const fallbackSoups = healthProfile
    ? await integratedFilterRecipes(
        fallbackSoupsRaw,
        healthProfile,
        excludedFoods,
        dailyNutrition,
      )
    : fallbackSoupsRaw;
  if (fallbackSoups.length > 0) {
    soup = fallbackSoups[0];
    console.log(`✅ 폴백 국/찌개 선택: ${soup.title}`);
  }
}
```

## 결론

현재 "식단을 생성할 수 없습니다." 에러는 여러 단계에서 발생할 수 있는 일반적인 메시지입니다. 

**발견된 주요 버그**: 국/찌개 선택 실패 시 폴백 레시피를 사용하지 않아서 식단 구성 검증에서 실패하는 문제가 있었습니다. 이 문제를 수정하여 국/찌개 선택 실패 시에도 폴백 레시피를 사용하도록 개선했습니다.

그 외에 정확한 원인을 파악하기 위해서는:

1. 서버 로그를 확인하여 어느 단계에서 실패했는지 확인
2. 건강 프로필과 레시피 데이터 존재 여부 확인
3. 데이터베이스 제약조건 및 저장 로직 확인
4. `generatePersonalDiet` 함수에서 발생하는 예외 확인

