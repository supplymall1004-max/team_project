# 찜한 식단을 건강식단에 포함하는 기능 구현 계획

## 📋 개요

찜한 식단을 건강식단 생성 시 포함할 수 있는 기능을 추가합니다. 단, 질병 및 알레르기 필터를 통과한 식단만 포함 가능합니다.

## 🎯 목표

1. 건강식단 생성 시 찜한 식단을 포함할 수 있는 옵션 제공
2. 필터링 로직을 통과한 찜한 식단만 자동으로 포함
3. 사용자가 쉽게 찜한 식단을 건강식단에 활용할 수 있도록 UI 개선

## 📊 현재 상태 분석

### ✅ 이미 구현된 기능
- **찜 기능**: `favorite_meals` 테이블, `FavoriteButton` 컴포넌트
- **건강식단 생성**: `generatePersonalDiet` 함수
- **필터링 로직**: `integrated-filter.ts` (알레르기, 질병별 제외 음식, 영양소 제한 등)

### 📁 관련 파일
- `lib/diet/favorite-meals.ts`: 찜한 식단 CRUD
- `lib/diet/personal-diet-generator.ts`: 건강식단 생성 로직
- `lib/diet/integrated-filter.ts`: 통합 필터링 파이프라인
- `components/health/diet-plan-client.tsx`: 건강식단 UI
- `app/api/diet/personal/route.ts`: 건강식단 생성 API

## 🏗️ 구현 계획

### Phase 1: 데이터베이스 및 타입 확장

#### 1.1 찜한 식단 조회 함수 확장
**파일**: `lib/diet/favorite-meals.ts`

```typescript
/**
 * 필터링 가능한 찜한 식단 조회
 * 레시피 상세 정보와 함께 반환
 */
export async function getFilterableFavoriteMeals(): Promise<{
  success: boolean;
  favorites?: Array<FavoriteMeal & { recipe?: RecipeDetailForDiet }>;
  error?: string;
}>
```

**작업 내용**:
- 찜한 식단 목록 조회
- 각 찜한 식단의 레시피 상세 정보 조회 (`recipe_id`가 있는 경우)
- 레시피 상세 정보가 없는 경우 처리 (스냅샷 데이터만 있는 경우)

#### 1.2 타입 정의 확장
**파일**: `types/diet.ts` 또는 `types/recipe.ts`

```typescript
export interface FavoriteMealWithRecipe extends FavoriteMeal {
  recipe?: RecipeDetailForDiet; // 레시피 상세 정보 (필터링용)
}
```

### Phase 2: 필터링 로직 통합

#### 2.1 찜한 식단 필터링 함수
**파일**: `lib/diet/favorite-meals.ts`

```typescript
/**
 * 찜한 식단을 건강 프로필에 맞게 필터링
 * @param favorites 찜한 식단 목록
 * @param healthProfile 사용자 건강 프로필
 * @param excludedFoods 제외 음식 목록 (선택적)
 * @param dailyNutrition 일일 영양소 추적기 (선택적)
 * @returns 필터링을 통과한 찜한 식단 목록
 */
export async function filterFavoriteMeals(
  favorites: FavoriteMealWithRecipe[],
  healthProfile: UserHealthProfile,
  excludedFoods?: ExcludedFood[],
  dailyNutrition?: DailyNutritionTracker
): Promise<FavoriteMealWithRecipe[]>
```

**작업 내용**:
- 각 찜한 식단의 레시피 정보 확인
- `integrated-filter.ts`의 `filterRecipe` 함수 사용하여 필터링
- 필터링을 통과한 찜한 식단만 반환
- 필터링 실패 이유 로깅 (디버깅용)

### Phase 3: 건강식단 생성 로직 수정

#### 3.1 `generatePersonalDiet` 함수 확장
**파일**: `lib/diet/personal-diet-generator.ts`

**함수 시그니처 변경**:
```typescript
export async function generatePersonalDiet(
  userId: string,
  profile: UserHealthProfile,
  targetDate: string,
  availableRecipes?: Array<...>,
  usedByCategory?: {...},
  preferredRiceType?: string,
  premiumFeatures?: string[],
  includeFavorites?: boolean // 새로 추가: 찜한 식단 포함 여부
): Promise<DailyDietPlan>
```

**작업 내용**:
1. `includeFavorites`가 `true`인 경우:
   - 찜한 식단 조회 (`getFilterableFavoriteMeals`)
   - 필터링 적용 (`filterFavoriteMeals`)
   - 필터링 통과한 찜한 식단을 레시피 후보에 우선 추가
2. 식사별 레시피 선택 시:
   - 찜한 식단이 해당 식사 유형(`meal_type`)과 일치하는 경우 우선 고려
   - 칼로리 및 매크로 목표에 맞는 찜한 식단 우선 선택
3. 찜한 식단 사용 시:
   - `trackRecipeUsage`로 사용 기록 저장
   - 중복 방지 로직에 포함

#### 3.2 식사별 레시피 선택 로직 수정
**파일**: `lib/diet/personal-diet-generator.ts` - `selectDishForMeal` 함수

**작업 내용**:
- 찜한 식단을 후보 레시피 목록의 앞부분에 추가
- 찜한 식단이 있으면 우선적으로 선택하되, 칼로리/매크로 목표는 여전히 고려
- 찜한 식단이 필터링을 통과하지 못한 경우 일반 레시피 선택

### Phase 4: API 수정

#### 4.1 건강식단 생성 API 수정
**파일**: `app/api/diet/personal/route.ts`

**요청 Body 확장**:
```typescript
{
  targetDate: string;
  includeFavorites?: boolean; // 새로 추가
}
```

**작업 내용**:
- 요청에서 `includeFavorites` 파라미터 받기
- `generatePersonalDiet` 호출 시 `includeFavorites` 전달

### Phase 5: UI 구현

#### 5.1 건강식단 페이지에 체크박스 추가
**파일**: `components/health/diet-plan-client.tsx`

**작업 내용**:
1. 상태 추가:
   ```typescript
   const [includeFavorites, setIncludeFavorites] = useState(false);
   ```

2. UI 추가:
   - 식단 생성 버튼 근처에 체크박스 추가
   - 레이블: "찜한 식단 포함 (필터링 통과한 식단만)"
   - 도움말 텍스트: "질병 및 알레르기 필터를 통과한 찜한 식단만 포함됩니다"

3. 식단 생성 시:
   - `includeFavorites` 상태를 API 요청에 포함
   - 로딩 중일 때 체크박스 비활성화

#### 5.2 찜한 식단 포함 상태 표시
**작업 내용**:
- 식단 생성 후 찜한 식단이 포함된 경우 표시
- 예: "찜한 식단 3개가 포함되었습니다" 배지 또는 메시지

#### 5.3 찜한 식단 필터링 실패 안내
**작업 내용**:
- 찜한 식단 중 필터링을 통과하지 못한 식단이 있는 경우 안내
- 예: "찜한 식단 중 2개는 건강 정보와 맞지 않아 제외되었습니다"
- (선택적) 제외된 식단 목록 표시

### Phase 6: 에러 처리 및 로깅

#### 6.1 에러 처리
**작업 내용**:
- 찜한 식단 조회 실패 시: 일반 레시피로 폴백
- 필터링 중 오류 발생 시: 해당 찜한 식단만 제외하고 계속 진행
- 로깅: 각 단계별 상세 로그 추가

#### 6.2 사용자 피드백
**작업 내용**:
- 찜한 식단이 포함된 경우: 토스트 메시지 또는 배지 표시
- 필터링으로 제외된 찜한 식단이 있는 경우: 정보성 메시지 표시

## 📝 구현 순서

1. **Phase 1**: 데이터베이스 및 타입 확장
2. **Phase 2**: 필터링 로직 통합
3. **Phase 3**: 건강식단 생성 로직 수정
4. **Phase 4**: API 수정
5. **Phase 5**: UI 구현
6. **Phase 6**: 에러 처리 및 로깅

## 🔍 주요 고려사항

### 1. 필터링 우선순위
- 찜한 식단이 필터링을 통과하지 못하면 일반 레시피 선택
- 찜한 식단이 필터링을 통과하더라도 칼로리/매크로 목표는 여전히 고려

### 2. 성능
- 찜한 식단 조회는 사용자가 체크박스를 선택한 경우에만 수행
- 필터링은 병렬 처리 가능하도록 구현

### 3. 사용자 경험
- 찜한 식단이 포함된 경우 명확한 피드백 제공
- 필터링으로 제외된 찜한 식단이 있는 경우 이유 안내

### 4. 데이터 일관성
- `recipe_id`가 없는 찜한 식단(스냅샷만 있는 경우) 처리
- 레시피가 삭제된 경우 처리

## 🧪 테스트 시나리오

### 시나리오 1: 정상 케이스
1. 사용자가 찜한 식단이 있고, 모두 필터링 통과
2. "찜한 식단 포함" 체크박스 선택
3. 건강식단 생성
4. 찜한 식단이 식단에 포함됨

### 시나리오 2: 필터링 실패 케이스
1. 사용자가 찜한 식단 중 일부가 알레르기 재료 포함
2. "찜한 식단 포함" 체크박스 선택
3. 건강식단 생성
4. 필터링 통과한 찜한 식단만 포함되고, 실패한 식단은 제외됨

### 시나리오 3: 찜한 식단 없음
1. 사용자가 찜한 식단이 없음
2. "찜한 식단 포함" 체크박스 선택
3. 건강식단 생성
4. 일반 레시피로 식단 생성됨

### 시나리오 4: 체크박스 미선택
1. 사용자가 찜한 식단이 있음
2. "찜한 식단 포함" 체크박스 미선택
3. 건강식단 생성
4. 일반 레시피로 식단 생성됨

## 📚 참고 자료

- `lib/diet/integrated-filter.ts`: 통합 필터링 파이프라인
- `lib/diet/personal-diet-generator.ts`: 건강식단 생성 로직
- `lib/diet/favorite-meals.ts`: 찜한 식단 관리
- `types/recipe.ts`: 레시피 타입 정의
- `types/health.ts`: 건강 프로필 타입 정의

