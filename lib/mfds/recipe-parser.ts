/**
 * @file lib/mfds/recipe-parser.ts
 * @description 식약처 레시피 마크다운 파일 파서
 *
 * 주요 기능:
 * 1. Frontmatter 파싱
 * 2. 재료 리스트 추출
 * 3. 조리 단계 추출 (번호 중복 제거)
 * 4. 영양 정보 추출
 * 5. 참고사항 섹션에서 이미지 URL 추출
 */

import {
  MfdsRecipe,
  MfdsRecipeFrontmatter,
  MfdsIngredient,
  MfdsRecipeStep,
  MfdsNutritionInfo,
  MfdsRecipeImages,
} from "@/types/mfds-recipe";

/**
 * Frontmatter 파싱
 */
function parseFrontmatter(content: string): MfdsRecipeFrontmatter | null {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!frontmatterMatch) {
    return null;
  }

  const frontmatterText = frontmatterMatch[1];
  const frontmatter: Partial<MfdsRecipeFrontmatter> = {};

  // YAML 형식 파싱 (간단한 key: value 형식)
  const lines = frontmatterText.split("\n");
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*"?(.+?)"?\s*$/);
    if (match) {
      const [, key, value] = match;
      const cleanValue = value.replace(/^"|"$/g, "");
      if (key === "rcp_seq") frontmatter.rcp_seq = cleanValue;
      if (key === "rcp_nm") frontmatter.rcp_nm = cleanValue;
      if (key === "rcp_way2") frontmatter.rcp_way2 = cleanValue;
      if (key === "rcp_pat2") frontmatter.rcp_pat2 = cleanValue;
    }
  }

  if (
    !frontmatter.rcp_seq ||
    !frontmatter.rcp_nm ||
    !frontmatter.rcp_way2 ||
    !frontmatter.rcp_pat2
  ) {
    return null;
  }

  return frontmatter as MfdsRecipeFrontmatter;
}

/**
 * 제목과 설명 추출
 */
function parseTitleAndDescription(content: string): {
  title: string;
  description: string;
} {
  // Frontmatter 제거
  const withoutFrontmatter = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "");

  // 제목 추출 (# 제목)
  const titleMatch = withoutFrontmatter.match(/^#\s+(.+?)\s*$/m);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // 설명 추출 (제목 다음 줄부터 다음 ## 섹션 전까지)
  const descriptionMatch = withoutFrontmatter.match(
    /^#\s+.+?\s*\n\n(.+?)\n\n##/s
  );
  const description = descriptionMatch
    ? descriptionMatch[1].trim()
    : "";

  return { title, description };
}

/**
 * 재료 리스트 추출
 */
function parseIngredients(content: string): MfdsIngredient[] {
  const ingredients: MfdsIngredient[] = [];
  const ingredientsMatch = content.match(/##\s+재료\s*\n\n([\s\S]*?)\n\n##/);
  if (!ingredientsMatch) {
    return ingredients;
  }

  const ingredientsText = ingredientsMatch[1];
  const lines = ingredientsText.split("\n");

  let currentCategory: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith("-")) {
      continue;
    }

    // "양념장 :" 같은 구분자 확인
    if (trimmed.includes(":")) {
      const categoryMatch = trimmed.match(/^-\s*(.+?)\s*:/);
      if (categoryMatch) {
        currentCategory = categoryMatch[1].trim();
        continue;
      }
    }

    // 재료명 추출 (앞의 "- " 제거)
    const ingredientName = trimmed.replace(/^-\s*/, "").trim();
    if (ingredientName) {
      ingredients.push({
        name: ingredientName,
        category: currentCategory,
      });
    }
  }

  return ingredients;
}

/**
 * 조리 단계 추출 (번호 중복 제거)
 */
function parseCookingSteps(content: string): MfdsRecipeStep[] {
  const steps: MfdsRecipeStep[] = [];
  
  // 조리 방법 섹션 추출 (더 견고한 패턴)
  const stepsMatch = content.match(/##\s+조리\s+방법\s*\n\n([\s\S]*?)(?=\n\n##|\n*$)/);
  if (!stepsMatch) {
    console.warn("[RecipeParser] 조리 방법 섹션을 찾을 수 없습니다");
    return steps;
  }

  const stepsText = stepsMatch[1];
  const lines = stepsText.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    // "1. 1. 가지는..." 형태에서 번호 중복 제거
    const stepMatch = trimmed.match(/^(\d+)\.\s*(\d+)\.\s*(.+)$/);
    if (stepMatch) {
      const stepNumber = parseInt(stepMatch[1], 10);
      const description = stepMatch[3].trim();
      if (description) {
        steps.push({
          step: stepNumber,
          description,
          imageUrl: null,
          originalImageUrl: null,
          localImagePath: null,
        });
      }
    } else {
      // 일반적인 "1. 설명" 형태
      const normalMatch = trimmed.match(/^(\d+)\.\s*(.+)$/);
      if (normalMatch) {
        const stepNumber = parseInt(normalMatch[1], 10);
        const description = normalMatch[2].trim();
        if (description) {
          steps.push({
            step: stepNumber,
            description,
            imageUrl: null,
            originalImageUrl: null,
            localImagePath: null,
          });
        }
      }
    }
  }

  console.log(`[RecipeParser] 조리 단계 파싱 완료: ${steps.length}개`);
  return steps;
}

/**
 * 영양 정보 추출
 */
function parseNutritionInfo(content: string): MfdsNutritionInfo {
  const nutrition: Partial<MfdsNutritionInfo> = {
    calories: null,
    sodium: null,
    carbohydrates: null,
    protein: null,
    fat: null,
    fiber: null,
  };

  const nutritionMatch = content.match(/##\s+영양\s+정보\s*\n\n([\s\S]*?)\n\n---/);
  if (!nutritionMatch) {
    return nutrition as MfdsNutritionInfo;
  }

  const nutritionText = nutritionMatch[1];
  const lines = nutritionText.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith("-")) {
      continue;
    }

    // "칼로리: 109.1 kcal" 형태 파싱
    const calorieMatch = trimmed.match(/칼로리:\s*([\d.]+)\s*kcal/);
    if (calorieMatch) {
      nutrition.calories = parseFloat(calorieMatch[1]);
      continue;
    }

    // "나트륨: 344.3mg" 형태 파싱
    const sodiumMatch = trimmed.match(/나트륨:\s*([\d.]+)\s*mg/);
    if (sodiumMatch) {
      nutrition.sodium = parseFloat(sodiumMatch[1]);
      continue;
    }

    // "탄수화물: 16.2g" 형태 파싱
    const carbMatch = trimmed.match(/탄수화물:\s*([\d.]+)\s*g/);
    if (carbMatch) {
      nutrition.carbohydrates = parseFloat(carbMatch[1]);
      continue;
    }

    // "단백질: 3.8g" 형태 파싱
    const proteinMatch = trimmed.match(/단백질:\s*([\d.]+)\s*g/);
    if (proteinMatch) {
      nutrition.protein = parseFloat(proteinMatch[1]);
      continue;
    }

    // "지방: 3.2g" 형태 파싱
    const fatMatch = trimmed.match(/지방:\s*([\d.]+)\s*g/);
    if (fatMatch) {
      nutrition.fat = parseFloat(fatMatch[1]);
      continue;
    }

    // "식이섬유: 5.0g" 형태 파싱 (선택적)
    const fiberMatch = trimmed.match(/식이섬유:\s*([\d.]+)\s*g/);
    if (fiberMatch) {
      nutrition.fiber = parseFloat(fiberMatch[1]);
      continue;
    }
  }

  return nutrition as MfdsNutritionInfo;
}

/**
 * 참고사항 섹션에서 이미지 URL 추출
 */
function parseImageUrls(
  content: string,
  rcpSeq: string
): MfdsRecipeImages & { steps: MfdsRecipeStep[] } {
  const images: MfdsRecipeImages = {
    mainImageUrl: null,
    mainImageOriginalUrl: null,
    mainImageLocalPath: null,
    mkImageUrl: null,
    mkImageOriginalUrl: null,
    mkImageLocalPath: null,
  };

  const steps: MfdsRecipeStep[] = [];

  // 참고사항 섹션 추출
  const referenceMatch = content.match(/##\s+참고사항\s*\n\n([\s\S]*)$/);
  if (!referenceMatch) {
    return { ...images, steps };
  }

  const referenceText = referenceMatch[1];

  // 대표 이미지 URL 추출 (기존 형식과 새 형식 모두 지원)
  // 새 형식: **대표 이미지 (ATT_FILE_NO_MAIN) 원본 URL**: http://...
  // 기존 형식: **대표 이미지 원본 URL**: http://...
  let mainImageUrlMatch = referenceText.match(
    /\*\*대표\s+이미지\s+\(ATT_FILE_NO_MAIN\)\s+원본\s+URL\*\*:\s*(.+?)\s*\n/
  );
  if (!mainImageUrlMatch) {
    // 기존 형식 지원
    mainImageUrlMatch = referenceText.match(
      /\*\*대표\s+이미지\s+원본\s+URL\*\*:\s*(.+?)\s*\n/
    );
  }
  if (mainImageUrlMatch) {
    images.mainImageOriginalUrl = mainImageUrlMatch[1].trim();
    // API 경로 사용 (로컬 파일이 없으면 식약처 API에서 가져옴)
    images.mainImageUrl = `/api/mfds-recipes/images/${rcpSeq}_main.jpg`;
  } else {
    // 원본 URL이 없어도 기본 패턴으로 생성
    images.mainImageUrl = `/api/mfds-recipes/images/${rcpSeq}_main.jpg`;
  }

  // 만드는 법 이미지 URL 추출 (기존 형식과 새 형식 모두 지원)
  // 새 형식: **만드는 법 이미지 (ATT_FILE_NO_MK) 원본 URL**: http://...
  // 기존 형식: **만드는 법 이미지 원본 URL**: http://...
  let mkImageUrlMatch = referenceText.match(
    /\*\*만드는\s+법\s+이미지\s+\(ATT_FILE_NO_MK\)\s+원본\s+URL\*\*:\s*(.+?)\s*\n/
  );
  if (!mkImageUrlMatch) {
    // 기존 형식 지원
    mkImageUrlMatch = referenceText.match(
      /\*\*만드는\s+법\s+이미지\s+원본\s+URL\*\*:\s*(.+?)\s*\n/
    );
  }
  if (mkImageUrlMatch) {
    images.mkImageOriginalUrl = mkImageUrlMatch[1].trim();
    // API 경로 사용 (로컬 파일이 없으면 식약처 API에서 가져옴)
    images.mkImageUrl = `/api/mfds-recipes/images/${rcpSeq}_mk.jpg`;
  } else {
    // 원본 URL이 없어도 기본 패턴으로 생성
    images.mkImageUrl = `/api/mfds-recipes/images/${rcpSeq}_mk.jpg`;
  }

  // 조리 단계별 이미지 URL 추출 (기존 형식과 새 형식 모두 지원)
  // 새 형식: **조리법 이미지 1 (MANUAL_IMG01) 원본 URL**: http://...
  // 기존 형식: **조리법 이미지 1 원본 URL**: http://...
  for (let i = 1; i <= 20; i++) {
    const stepNum = i.toString().padStart(2, "0");
    let imageUrlMatch = referenceText.match(
      new RegExp(
        `\\*\\*조리법\\s+이미지\\s+${i}\\s+\\(MANUAL_IMG${stepNum}\\)\\s+원본\\s+URL\\*\\*:\\s*(.+?)\\s*\\n`
      )
    );
    
    if (!imageUrlMatch) {
      // 기존 형식 지원
      imageUrlMatch = referenceText.match(
        new RegExp(
          `\\*\\*조리법\\s+이미지\\s+${i}\\s+원본\\s+URL\\*\\*:\\s*(.+?)\\s*\\n`
        )
      );
    }

    if (imageUrlMatch) {
      const originalUrl = imageUrlMatch[1].trim();

      steps.push({
        step: i,
        description: "", // 조리법 설명은 parseCookingSteps에서 추출
        // API 경로 사용 (로컬 파일이 없으면 식약처 API에서 가져옴)
        imageUrl: `/api/mfds-recipes/images/${rcpSeq}_manual_${stepNum}.jpg`,
        originalImageUrl: originalUrl,
        localImagePath: null,
      });
    }
  }

  return { ...images, steps };
}

/**
 * 마크다운 파일을 파싱하여 MfdsRecipe 객체로 변환
 */
export function parseRecipeMarkdown(
  content: string,
  rcpSeq: string
): MfdsRecipe | null {
  console.group(`[RecipeParser] 레시피 파싱 시작: ${rcpSeq}`);

  // Frontmatter 파싱
  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) {
    console.error("[RecipeParser] Frontmatter 파싱 실패");
    console.groupEnd();
    return null;
  }
  console.log("[RecipeParser] Frontmatter 파싱 완료:", frontmatter);

  // 제목과 설명 추출
  const { title, description } = parseTitleAndDescription(content);
  console.log("[RecipeParser] 제목:", title);
  console.log("[RecipeParser] 설명:", description);

  // 재료 추출
  const ingredients = parseIngredients(content);
  console.log("[RecipeParser] 재료 개수:", ingredients.length);

  // 조리 단계 추출
  const cookingSteps = parseCookingSteps(content);
  console.log("[RecipeParser] 조리 단계 개수:", cookingSteps.length);

  // 영양 정보 추출
  const nutrition = parseNutritionInfo(content);
  console.log("[RecipeParser] 영양 정보:", nutrition);

  // 이미지 URL 추출
  const imageData = parseImageUrls(content, rcpSeq);
  console.log("[RecipeParser] 이미지 정보:", imageData);

  // 조리 단계에 이미지 정보 병합
  // 이미지 정보의 steps와 조리 단계를 병합
  const stepsWithImages: MfdsRecipeStep[] = cookingSteps.map((step) => {
    const imageStep = imageData.steps.find((s) => s.step === step.step);
    if (imageStep) {
      return {
        ...step,
        imageUrl: imageStep.imageUrl,
        originalImageUrl: imageStep.originalImageUrl,
        localImagePath: imageStep.localImagePath,
      };
    }
    return step;
  });

  // 이미지 정보에만 있고 조리 단계에 없는 경우 추가 (참고사항에만 있는 경우)
  imageData.steps.forEach((imageStep) => {
    if (!stepsWithImages.find((s) => s.step === imageStep.step)) {
      stepsWithImages.push(imageStep);
    }
  });

  // 단계 번호로 정렬
  stepsWithImages.sort((a, b) => a.step - b.step);

  console.log(`[RecipeParser] 조리 단계 병합 완료: ${stepsWithImages.length}개`);

  // 이미지 정보에서 steps 제거
  const { steps: _, ...images } = imageData;

  const recipe: MfdsRecipe = {
    frontmatter,
    title,
    description,
    ingredients,
    steps: stepsWithImages,
    nutrition,
    images,
    rawContent: content,
  };

  console.log("[RecipeParser] 레시피 파싱 완료");
  console.groupEnd();

  return recipe;
}

