# 이미지 로딩 기능 분석 보고서

> Phase 1: 문제 분석 및 현재 상태 파악 결과

## 1. 현재 이미지 로딩 방식 분석

### 1.1 레시피 상세 페이지 (`components/recipes/recipe-detail-client.tsx`)

**현재 구현:**
```76:87:components/recipes/recipe-detail-client.tsx
        {recipe.thumbnail_url && (
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-100">
            <Image
              src={recipe.thumbnail_url}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </div>
        )}
```

**특징:**
- `recipe.thumbnail_url`을 직접 사용
- `thumbnail_url`이 없으면 이미지를 표시하지 않음 (조건부 렌더링)
- 폴백 이미지 처리 없음
- 이미지 관련성 검증 없음

**문제점:**
- `thumbnail_url`이 `null`이거나 빈 문자열이면 이미지가 표시되지 않음
- 사용자가 썸네일을 입력하지 않으면 항상 기본 SVG 이미지로 표시됨

### 1.2 AI 식단 카드 (`components/health/diet-card.tsx`)

**현재 구현:**
```48:52:components/health/diet-card.tsx
  // 이미지 URL 생성 (thumbnail_url이 없으면 자동으로 기본 이미지 생성)
  const imageUrl = getRecipeImageUrlEnhanced(
    recipe.title,
    recipe.thumbnail_url
  );
```

**특징:**
- `getRecipeImageUrlEnhanced()` 함수로 폴백 처리
- `thumbnail_url`이 없어도 카테고리 기반 기본 이미지 사용
- 이미지 관련성 검증 포함

**장점:**
- 항상 이미지가 표시됨
- 레시피 제목 기반으로 적절한 카테고리 이미지 선택

### 1.3 레시피 카드 (`components/recipes/recipe-card.tsx`)

**현재 구현:**
```40:80:components/recipes/recipe-card.tsx
  // 기존 이미지 URL (폴백용)
  const fallbackImageUrl = getRecipeImageUrlEnhanced(
    recipe.title,
    recipe.thumbnail_url
  );

  // 새로운 음식 이미지 검색
  useEffect(() => {
    const loadFoodImage = async () => {
      // 이미 썸네일이 있고 관련성이 높으면 스킵
      if (recipe.thumbnail_url && recipe.thumbnail_url.trim()) {
        const relevanceScore = calculateImageRelevance(recipe.title, recipe.thumbnail_url);
        if (relevanceScore >= 50) {
          console.log(`🍽️ 레시피 "${recipe.title}": 기존 썸네일 사용 (관련성: ${relevanceScore}점)`);
          return;
        }
      }

      setImageLoading(true);
      try {
        console.log(`🍽️ 레시피 "${recipe.title}": 음식 이미지 검색 시작`);
        const searchedImage = await searchFoodImage(recipe.title);

        if (searchedImage) {
          setFoodImage(searchedImage);
          console.log(`🍽️ 레시피 "${recipe.title}": 검색된 이미지 적용 - ${searchedImage.source}`);
        } else {
          console.log(`🍽️ 레시피 "${recipe.title}": 검색된 이미지 없음, 폴백 이미지 사용`);
        }
      } catch (error) {
        console.error(`🍽️ 레시피 "${recipe.title}": 이미지 검색 실패:`, error);
      } finally {
        setImageLoading(false);
      }
    };

    loadFoodImage();
  }, [recipe.title, recipe.thumbnail_url]);

  // 최종 사용할 이미지 URL 결정
  const imageUrl = foodImage?.image_url || fallbackImageUrl;
```

**특징:**
- 클라이언트 사이드에서 실시간 이미지 검색 (`searchFoodImage`)
- 기존 썸네일 관련성 검증 후 필요시 새 이미지 검색
- 폴백 이미지 처리 포함

**장점:**
- 동적 이미지 검색으로 사용자 경험 개선
- 캐시 우선 전략으로 성능 최적화

**문제점:**
- 클라이언트 사이드에서 검색하므로 초기 로딩 시 이미지가 없을 수 있음
- 레시피 생성 시점에 이미지가 할당되지 않음

### 1.4 `getRecipeImageUrlEnhanced()` 함수 (`lib/utils/recipe-image.ts`)

**현재 구현:**
```599:635:lib/utils/recipe-image.ts
export function getRecipeImageUrlEnhanced(
  recipeTitle: string,
  thumbnailUrl?: string | null
): string {
  console.groupCollapsed("[RecipeImage] 이미지 URL 결정");
  console.log("레시피 제목:", recipeTitle);
  console.log("썸네일 URL:", thumbnailUrl);

  // 1. 썸네일 URL이 있고 관련성이 높으면 사용
  if (thumbnailUrl && thumbnailUrl.trim()) {
    const relevanceScore = calculateImageRelevance(recipeTitle, thumbnailUrl);
    console.log("썸네일 이미지 관련성 점수:", relevanceScore);

    if (relevanceScore >= 50) { // 50점 이상이면 관련성 높음으로 판단
      console.log("✅ 썸네일 이미지 사용 (관련성 높음)");
      console.groupEnd();
      return thumbnailUrl;
    } else {
      console.log("⚠️ 썸네일 이미지 관련성 낮음, 대체 이미지 사용");
    }
  }

  // 2. 특정 레시피 이미지 확인
  const specificImageUrl = getSpecificRecipeImageUrl(recipeTitle);
  if (specificImageUrl) {
    console.log("✅ 특정 레시피 이미지 사용:", specificImageUrl);
    console.groupEnd();
    return specificImageUrl;
  }

  // 3. 카테고리 기반 이미지 사용
  const category = getRecipeCategory(recipeTitle);
  const categoryImageUrl = getCategoryImage(category).url;
  console.log("✅ 카테고리 기반 이미지 사용:", category, categoryImageUrl);
  console.groupEnd();
  return categoryImageUrl;
}
```

**이미지 선택 우선순위:**
1. `thumbnail_url` (관련성 점수 50점 이상)
2. 특정 레시피 이미지 (하드코딩된 매핑)
3. 카테고리 기반 기본 이미지 (SVG)

**특징:**
- 이미지 관련성 검증 포함
- 항상 이미지 URL 반환 (폴백 보장)

## 2. 레시피 생성 시 이미지 할당 문제

### 2.1 레시피 업로드 폼 (`components/recipes/recipe-upload-form.tsx`)

**현재 구현:**
```154:168:components/recipes/recipe-upload-form.tsx
      // 레시피 생성
      const { data: recipe, error: recipeError } = await supabase
        .from("recipes")
        .insert({
          user_id: userData.id,
          slug,
          title: title.trim(),
          description: description.trim() || null,
          thumbnail_url: thumbnailUrl.trim() || null,
          difficulty: parseInt(difficulty),
          cooking_time_minutes: parseInt(cookingTimeMinutes),
          servings: parseInt(servings) || 1,
        })
        .select()
        .single();
```

**문제점:**
- 사용자가 `thumbnailUrl`을 입력하지 않으면 `null`로 저장됨
- 레시피 제목 기반 자동 이미지 검색 및 할당 로직 없음
- 레시피 생성 후 이미지 할당 프로세스 없음

**영향:**
- 레시피 상세 페이지에서 이미지가 표시되지 않음
- 레시피 카드에서 클라이언트 사이드 검색이 필요하므로 초기 로딩 시 이미지 없음

## 3. Pixabay 이미지 캐싱 시스템 분석

### 3.1 캐시 테이블 구조 (`supabase/migrations/20251125120000_create_food_images_cache.sql`)

**테이블 스키마:**
- `food_name`: 음식 이름 (검색 키)
- `image_url`: 이미지 URL
- `thumbnail_url`: 썸네일 URL
- `source`: 이미지 소스 (pixabay, local 등)
- `source_id`: 외부 API의 이미지 ID
- `quality_score`: 품질 점수
- `last_accessed_at`: 마지막 접근 시간 (캐시 정리용)

**인덱스:**
- `food_name` 인덱스
- `last_accessed_at` 인덱스
- `quality_score` 인덱스 (DESC)

**캐시 정리 함수:**
- 30일 이상 접근하지 않은 이미지 자동 삭제

### 3.2 이미지 서비스 (`lib/food-image-service.ts`)

**캐시 전략:**
- Cache-first: 캐시에서 먼저 조회
- 캐시 미스 시 Pixabay API 검색 후 캐싱
- 품질 점수 기반 이미지 선택

**설정:**
- `maxCacheAge`: 30일
- `minQualityScore`: 10점
- `maxImagesPerFood`: 5개

### 3.3 서버 액션 (`actions/food-images.ts`)

**구현:**
- `searchFoodImage()`: 단일 음식 이미지 검색
- `searchMultipleFoodImages()`: 다중 음식 이미지 검색

**특징:**
- 서버 사이드에서 실행
- 에러 처리 포함

## 4. 문제 지점 식별

### 4.1 주요 문제점

1. **레시피 생성 시 이미지 미할당**
   - 사용자가 썸네일을 입력하지 않으면 `thumbnail_url`이 `null`로 저장됨
   - 레시피 제목 기반 자동 이미지 검색 로직 없음

2. **레시피 상세 페이지 이미지 표시 문제**
   - `thumbnail_url`이 없으면 이미지가 표시되지 않음
   - 폴백 이미지 처리 없음

3. **일관성 없는 이미지 처리**
   - 레시피 카드: 클라이언트 사이드 동적 검색
   - 레시피 상세: `thumbnail_url` 직접 사용 (폴백 없음)
   - AI 식단 카드: `getRecipeImageUrlEnhanced()` 사용

### 4.2 해결 방안

1. **레시피 생성 시 자동 이미지 할당**
   - 레시피 생성 API/로직에 이미지 검색 및 할당 추가
   - `thumbnail_url`이 없으면 레시피 제목으로 이미지 검색
   - 검색 실패 시 카테고리별 기본 이미지 사용

2. **레시피 상세 페이지 개선**
   - `getRecipeImageUrlEnhanced()` 사용으로 폴백 처리
   - 항상 이미지가 표시되도록 보장

3. **일관성 있는 이미지 처리**
   - 모든 컴포넌트에서 동일한 이미지 로딩 전략 사용
   - 서버 사이드에서 이미지 할당 (클라이언트 사이드 검색 최소화)

## 5. 다음 단계 (Phase 2)

1. 레시피 생성 API 확장
   - 레시피 제목으로 이미지 검색 및 캐싱 로직 추가
   - `thumbnail_url` 필드 자동 설정

2. 레시피 상세 페이지 개선
   - `getRecipeImageUrlEnhanced()` 사용
   - 폴백 이미지 처리 보장

3. 통합 테스트
   - 레시피 생성 → 이미지 할당 → 표시 플로우 테스트
   - 캐시 적중률 확인

