# 식약처 API 필터링 로직 개선 계획 (수정본)

## 📋 개요

식약처 API에서 식단을 불러올 때 필터링이 너무 강화되어 있는 문제를 해결하고, 질병별로 섭취량을 조절할 수 있는 음식에 대한 유연한 필터링과 주의사항 표시를 구현합니다.

---

## 🎯 핵심 요구사항

### 1. 당 함유 음식 처리
- **당이 일부 포함된 음식**: 허용하되 주의사항 표시
  - 주의사항: "설탕 또는 당을 조절하여 섭취하시기 바랍니다"
  - 당 함량 표시 (g 단위)
- **당이 주재료인 음식**: 제외 (예: 고구마 맛탕)
- **채소 요리**: 당근볶음 등 채소가 주재료인 요리는 당 함유 음식으로 분류하지 않음

### 2. 질병별 섭취량 조절 음식
- **양 조절 가능한 반찬**: 허용 범위 확대
- **주의사항 표시**: 어떤 영양소를 줄여야 하는지 명시
- **양 표시**: 해당 영양소 함량 표시

### 3. 절대 금지 음식
- 간 질환 환자의 알코올 등 완전히 제외해야 하는 음식은 별도 분류

---

## 🏗️ 시스템 구조

### 1. 데이터베이스 스키마 확장

#### `disease_excluded_foods_extended` 테이블 수정

```sql
-- exclusion_type 컬럼 추가
ALTER TABLE disease_excluded_foods_extended 
ADD COLUMN IF NOT EXISTS exclusion_type TEXT 
CHECK (exclusion_type IN ('absolute', 'moderate', 'limit')) 
DEFAULT 'absolute';

-- 주석 추가
COMMENT ON COLUMN disease_excluded_foods_extended.exclusion_type IS 
'제외 유형: absolute(절대금지), moderate(양조절), limit(일일총량제한)';
```

**제외 유형 설명:**
- `absolute`: 절대 금지 (예: 간 질환 환자의 알코올)
- `moderate`: 양 조절 필요 (예: 당뇨 환자의 당 함유 반찬)
- `limit`: 일일 총량 제한 (예: 당뇨 환자의 당 섭취량)

#### 데이터 업데이트 예시

```sql
-- 당뇨병: 고구마 맛탕 (절대 금지)
UPDATE disease_excluded_foods_extended 
SET exclusion_type = 'absolute' 
WHERE disease_code = 'diabetes_type2' AND food_name = '고구마 맛탕';

-- 당뇨병: 설탕 (양 조절)
UPDATE disease_excluded_foods_extended 
SET exclusion_type = 'moderate' 
WHERE disease_code = 'diabetes_type2' AND food_name = '설탕';
```

---

### 2. 레시피 타입 확장

#### `types/recipe.ts` 수정

```typescript
// 레시피 주의사항 인터페이스
export interface RecipeWarning {
  type: 'sugar' | 'sodium' | 'fat' | 'potassium' | 'phosphorus' | 'purine' | 'other';
  message: string; // 주의사항 메시지
  value: number; // 해당 영양소 함량
  unit: string; // 단위 (g, mg 등)
  severity: 'low' | 'moderate' | 'high'; // 심각도
}

// 영양소 상세 정보
export interface NutritionDetails {
  sugar?: number; // 당 함량 (g)
  sodium?: number; // 나트륨 (mg)
  fat?: number; // 지방 (g)
  potassium?: number; // 칼륨 (mg)
  phosphorus?: number; // 인 (mg)
  purine?: number; // 퓨린 (mg)
}

// RecipeDetailForDiet 확장
export interface RecipeDetailForDiet {
  // ... 기존 필드들
  warnings?: RecipeWarning[]; // 주의사항 배열
  nutritionDetails?: NutritionDetails; // 영양소 상세 정보
  exclusionType?: 'absolute' | 'moderate' | 'limit' | null; // 제외 유형
}
```

---

### 3. 필터링 로직 개선

#### 3.1 반찬 분류 로직 (`lib/diet/recipe-classifier.ts`)

```typescript
/**
 * 반찬 유형 분류
 */
export type SideDishType = 
  | 'high_sugar'      // 고당류 반찬 (제외)
  | 'moderate_sugar'  // 조미료 포함 반찬 (조건부 허용)
  | 'low_sugar'       // 저당 반찬 (허용)
  | 'vegetable'       // 채소 요리 (당 함유 아님)

/**
 * 반찬 유형 분류 함수
 */
export function classifySideDish(recipe: RecipeDetailForDiet): {
  type: SideDishType;
  sugarContent: number;
  isSugarMainIngredient: boolean;
} {
  const title = recipe.title.toLowerCase();
  const ingredients = recipe.ingredients.map(ing => ing.name.toLowerCase()).join(' ');
  
  // 채소 요리 키워드 (당 함유 음식으로 분류하지 않음)
  const vegetableKeywords = ['당근', 'carrot', '시금치', 'spinach', '브로콜리', 'broccoli'];
  const isVegetableDish = vegetableKeywords.some(keyword => 
    title.includes(keyword) || ingredients.includes(keyword)
  );
  
  if (isVegetableDish && !title.includes('맛탕') && !title.includes('당절임')) {
    return { type: 'vegetable', sugarContent: 0, isSugarMainIngredient: false };
  }
  
  // 고당류 반찬 키워드
  const highSugarKeywords = ['맛탕', '당절임', '시럽', '캔디', '사탕'];
  const isHighSugar = highSugarKeywords.some(keyword => title.includes(keyword));
  
  if (isHighSugar) {
    return { type: 'high_sugar', sugarContent: recipe.nutrition.carbs || 0, isSugarMainIngredient: true };
  }
  
  // 조미료로 당 포함 여부 확인
  const sugarIngredients = ['설탕', 'sugar', '물엿', '올리고당', '꿀'];
  const hasSugarAsSeasoning = sugarIngredients.some(ing => ingredients.includes(ing));
  
  if (hasSugarAsSeasoning) {
    // 탄수화물의 일부가 당일 가능성 (정확한 당 함량은 영양 정보에서 가져와야 함)
    const estimatedSugar = (recipe.nutrition.carbs || 0) * 0.1; // 추정치
    return { type: 'moderate_sugar', sugarContent: estimatedSugar, isSugarMainIngredient: false };
  }
  
  return { type: 'low_sugar', sugarContent: 0, isSugarMainIngredient: false };
}
```

#### 3.2 필터링 로직 3단계 구조 (`lib/diet/integrated-filter.ts` 수정)

```typescript
/**
 * 필터링 결과 (확장)
 */
export interface IntegratedFilterResult {
  passed: boolean;
  reasons: string[];
  stages: string[];
  warnings?: RecipeWarning[]; // 주의사항
  exclusionType?: 'absolute' | 'moderate' | 'limit' | null;
}

/**
 * 3단계 필터링 로직
 */
export async function filterRecipe(
  recipe: RecipeDetailForDiet,
  healthProfile: UserHealthProfile,
  excludedFoods?: ExcludedFood[],
  dailyNutrition?: DailyNutritionTracker // 일일 영양소 추적기
): Promise<IntegratedFilterResult> {
  const warnings: RecipeWarning[] = [];
  
  // Step 1: 절대 금지 필터링
  const absoluteExclusion = checkAbsoluteExclusion(recipe, excludedFoods);
  if (absoluteExclusion.excluded) {
    return {
      passed: false,
      reasons: [absoluteExclusion.reason || '절대 금지 음식 포함'],
      stages: ['absolute-exclusion'],
      exclusionType: 'absolute'
    };
  }
  
  // Step 2: 양 조절 필터링
  const moderateResult = checkModerateExclusion(recipe, healthProfile, excludedFoods);
  if (!moderateResult.passed) {
    return {
      passed: false,
      reasons: moderateResult.reasons,
      stages: ['moderate-exclusion'],
      exclusionType: 'moderate'
    };
  }
  
  // 주의사항 수집
  warnings.push(...moderateResult.warnings || []);
  
  // Step 3: 일일 총량 관리
  if (dailyNutrition) {
    const limitResult = checkDailyLimit(recipe, healthProfile, dailyNutrition);
    if (!limitResult.passed) {
      return {
        passed: false,
        reasons: limitResult.reasons,
        stages: ['daily-limit'],
        exclusionType: 'limit'
      };
    }
    warnings.push(...limitResult.warnings || []);
  }
  
  return {
    passed: true,
    reasons: [],
    stages: ['all-passed'],
    warnings,
    exclusionType: moderateResult.exclusionType || null
  };
}

/**
 * 절대 금지 필터링
 */
function checkAbsoluteExclusion(
  recipe: RecipeDetailForDiet,
  excludedFoods?: ExcludedFood[]
): { excluded: boolean; reason?: string } {
  if (!excludedFoods) return { excluded: false };
  
  const absoluteExcluded = excludedFoods.filter(food => 
    food.exclusionType === 'absolute' || food.severity === 'high'
  );
  
  const result = isRecipeExcludedForDisease(recipe, absoluteExcluded);
  return {
    excluded: result.excluded,
    reason: result.reason
  };
}

/**
 * 양 조절 필터링
 */
function checkModerateExclusion(
  recipe: RecipeDetailForDiet,
  healthProfile: UserHealthProfile,
  excludedFoods?: ExcludedFood[]
): {
  passed: boolean;
  reasons: string[];
  warnings?: RecipeWarning[];
  exclusionType?: 'moderate' | null;
} {
  const warnings: RecipeWarning[] = [];
  const reasons: string[] = [];
  
  if (!healthProfile.diseases || healthProfile.diseases.length === 0) {
    return { passed: true, reasons: [] };
  }
  
  // 당뇨병 처리
  if (healthProfile.diseases.includes('diabetes')) {
    const { classifySideDish } = await import('./recipe-classifier');
    const classification = classifySideDish(recipe);
    
    // 고당류 반찬 제외
    if (classification.type === 'high_sugar') {
      return {
        passed: false,
        reasons: ['고당류 반찬으로 제외'],
        exclusionType: 'absolute'
      };
    }
    
    // 조미료 포함 반찬: 주의사항 추가
    if (classification.type === 'moderate_sugar') {
      warnings.push({
        type: 'sugar',
        message: '설탕 또는 당을 조절하여 섭취하시기 바랍니다',
        value: classification.sugarContent,
        unit: 'g',
        severity: 'moderate'
      });
    }
  }
  
  // 다른 질병별 양 조절 로직...
  
  return {
    passed: true,
    reasons: [],
    warnings: warnings.length > 0 ? warnings : undefined,
    exclusionType: warnings.length > 0 ? 'moderate' : null
  };
}
```

---

### 4. 일일 영양소 추적 모듈 (`lib/diet/daily-nutrition-tracker.ts`)

```typescript
/**
 * 일일 영양소 추적기
 */
export class DailyNutritionTracker {
  private nutrition: {
    sugar: number;
    sodium: number;
    fat: number;
    potassium: number;
    phosphorus: number;
  } = {
    sugar: 0,
    sodium: 0,
    fat: 0,
    potassium: 0,
    phosphorus: 0
  };
  
  private limits: {
    sugar?: number;
    sodium?: number;
    fat?: number;
    potassium?: number;
    phosphorus?: number;
  };
  
  constructor(healthProfile: UserHealthProfile) {
    this.limits = this.calculateLimits(healthProfile);
  }
  
  /**
   * 질병별 일일 제한량 계산
   */
  private calculateLimits(profile: UserHealthProfile) {
    const limits: any = {};
    
    if (profile.diseases?.includes('diabetes')) {
      limits.sugar = 50; // 당뇨 환자 일일 당 섭취량 목표 (g)
    }
    
    if (profile.diseases?.includes('hypertension')) {
      limits.sodium = 2000; // 고혈압 환자 일일 나트륨 목표 (mg)
    }
    
    // ... 다른 질병별 제한량
    
    return limits;
  }
  
  /**
   * 레시피 추가 가능 여부 확인
   */
  canAddRecipe(recipe: RecipeDetailForDiet): {
    canAdd: boolean;
    warnings?: RecipeWarning[];
    reasons?: string[];
  } {
    const warnings: RecipeWarning[] = [];
    const reasons: string[] = [];
    
    // 당 함량 체크
    if (this.limits.sugar) {
      const recipeSugar = recipe.nutritionDetails?.sugar || 
                         (recipe.nutrition.carbs || 0) * 0.1; // 추정치
      const newTotal = this.nutrition.sugar + recipeSugar;
      
      if (newTotal > this.limits.sugar) {
        reasons.push(`일일 당 섭취량 초과 (${newTotal.toFixed(1)}g > ${this.limits.sugar}g)`);
        return { canAdd: false, reasons };
      }
      
      if (recipeSugar > 0) {
        warnings.push({
          type: 'sugar',
          message: `설탕 또는 당을 조절하여 섭취하시기 바랍니다 (일일 잔여량: ${(this.limits.sugar - this.nutrition.sugar).toFixed(1)}g)`,
          value: recipeSugar,
          unit: 'g',
          severity: 'moderate'
        });
      }
    }
    
    // 다른 영양소 체크...
    
    return {
      canAdd: true,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }
  
  /**
   * 레시피 추가
   */
  addRecipe(recipe: RecipeDetailForDiet) {
    const sugar = recipe.nutritionDetails?.sugar || (recipe.nutrition.carbs || 0) * 0.1;
    this.nutrition.sugar += sugar;
    // ... 다른 영양소 추가
  }
  
  /**
   * 현재 영양소 상태 조회
   */
  getCurrentNutrition() {
    return { ...this.nutrition };
  }
  
  /**
   * 잔여량 조회
   */
  getRemaining() {
    const remaining: any = {};
    if (this.limits.sugar) {
      remaining.sugar = Math.max(0, this.limits.sugar - this.nutrition.sugar);
    }
    // ... 다른 영양소
    return remaining;
  }
}
```

---

### 5. UI 컴포넌트 수정

#### 5.1 레시피 상세 페이지 (`components/recipes/recipe-detail-client.tsx`)

```typescript
// 주의사항 섹션 추가
{recipe.warnings && recipe.warnings.length > 0 && (
  <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
    <h2 className="text-xl font-bold mb-4 text-yellow-800">⚠️ 주의사항</h2>
    <div className="space-y-3">
      {recipe.warnings.map((warning, index) => (
        <div key={index} className="flex items-start gap-3">
          <span className="text-yellow-600">⚠️</span>
          <div className="flex-1">
            <p className="text-yellow-800 font-medium">{warning.message}</p>
            <p className="text-sm text-yellow-700 mt-1">
              {warning.type === 'sugar' ? '당 함량' : 
               warning.type === 'sodium' ? '나트륨 함량' : 
               warning.type === 'fat' ? '지방 함량' : '영양소 함량'}: 
              {warning.value.toFixed(1)} {warning.unit}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

// 영양소 상세 정보 섹션 추가
{recipe.nutritionDetails && (
  <div className="rounded-2xl border border-border/60 bg-white p-6">
    <h2 className="text-2xl font-bold mb-4">영양소 상세 정보</h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {recipe.nutritionDetails.sugar !== undefined && (
        <div>
          <div className="text-sm text-muted-foreground">당 함량</div>
          <div className="text-lg font-semibold">
            {recipe.nutritionDetails.sugar.toFixed(1)} g
          </div>
        </div>
      )}
      {/* ... 다른 영양소 */}
    </div>
  </div>
)}
```

#### 5.2 식단 카드 컴포넌트 (`components/diet/meal-card.tsx`)

```typescript
// 주의사항 표시 추가
{recipe.warnings && recipe.warnings.length > 0 && (
  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
    <p className="text-xs text-yellow-800 font-medium">⚠️ 주의사항</p>
    {recipe.warnings.map((warning, idx) => (
      <p key={idx} className="text-xs text-yellow-700 mt-1">
        {warning.message} ({warning.value.toFixed(1)}{warning.unit})
      </p>
    ))}
  </div>
)}
```

---

## 📝 구현 단계

### Phase 1: 데이터베이스 및 타입 확장
1. ✅ `disease_excluded_foods_extended` 테이블에 `exclusion_type` 컬럼 추가
2. ✅ 기존 데이터에 `exclusion_type` 값 설정
3. ✅ `RecipeDetailForDiet` 타입에 `warnings`, `nutritionDetails` 필드 추가

### Phase 2: 필터링 로직 구현
4. ✅ `recipe-classifier.ts` 모듈 생성 (반찬 분류)
5. ✅ `daily-nutrition-tracker.ts` 모듈 생성 (일일 영양소 추적)
6. ✅ `integrated-filter.ts` 수정 (3단계 필터링)

### Phase 3: UI 컴포넌트 수정
7. ✅ 레시피 상세 페이지에 주의사항 표시 추가
8. ✅ 식단 카드 컴포넌트에 주의사항 표시 추가

### Phase 4: 테스트 및 검증
9. ✅ 당뇨 환자 식단 생성 테스트
10. ✅ 주의사항 표시 확인
11. ✅ 일일 총량 관리 확인

---

## 🎯 예상 결과

### Before (현재)
- 당이 조미료로 포함된 반찬도 모두 제외
- 사용자에게 이유나 대안 제시 없음
- 식단 선택지가 매우 제한적

### After (개선 후)
- 조미료로 당이 포함된 반찬은 허용하되 주의사항 표시
- "설탕 또는 당을 조절하여 섭취하시기 바랍니다" 메시지와 당 함량 표시
- 일일 총량 내에서 유연하게 식단 구성 가능
- 채소 요리(당근볶음 등)는 당 함유 음식으로 분류하지 않음

---

## 📌 주요 변경 사항 요약

1. **제외 음식 분류 체계**: absolute / moderate / limit 3단계
2. **반찬 분류 로직**: 고당류 / 조미료 포함 / 저당 / 채소 요리 구분
3. **주의사항 시스템**: 레시피별 주의사항 및 영양소 함량 표시
4. **일일 총량 관리**: 질병별 일일 영양소 제한 추적
5. **UI 개선**: 주의사항 및 영양소 정보 시각화

---

이 계획으로 진행하시겠습니까? 승인해 주시면 단계별로 구현하겠습니다.

