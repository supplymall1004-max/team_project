/**
 * @file lib/recipes/recipe-fetcher/parser.ts
 * @description 레시피 데이터 파서 - 원본 데이터를 구조화된 형식으로 변환
 *
 * 주요 기능:
 * 1. HTML/텍스트에서 레시피 정보 추출
 * 2. 재료 정보 파싱
 * 3. 조리법 정보 파싱
 * 4. 영양소 정보 추출 (가능한 경우)
 */

import type { RawRecipeData } from "./web-scraper";
import type { StandardizedRecipe } from "./index";

/**
 * 원본 레시피 데이터를 파싱하여 구조화된 형식으로 변환
 * 
 * @param rawData 원본 레시피 데이터
 * @returns 파싱된 레시피
 */
export async function parseRecipe(
  rawData: RawRecipeData
): Promise<Partial<StandardizedRecipe>> {
  console.group(`📄 레시피 파싱: ${rawData.title}`);

  try {
    const parsed: Partial<StandardizedRecipe> = {
      title: rawData.title,
      description: rawData.description || "",
      source: rawData.source,
      source_url: rawData.url,
      main_ingredients: [],
      cooking_method: null,
      category: "side", // 기본값
      nutrition: {
        calories: null,
        protein: null,
        carbohydrates: null,
        fat: null,
        sodium: null,
      },
      steps: [],
      ingredients: [],
    };

    // 1. 제목에서 카테고리 추론
    parsed.category = inferCategory(rawData.title);

    // 2. 제목/설명에서 메인 재료 추출
    parsed.main_ingredients = extractMainIngredients(rawData.title, rawData.description || "");

    // 3. 제목/설명에서 조리법 추출
    parsed.cooking_method = extractCookingMethod(rawData.title, rawData.description || "");

    // 4. 내용에서 재료 정보 파싱
    if (rawData.content) {
      parsed.ingredients = parseIngredients(rawData.content);
    }

    // 5. 내용에서 조리 단계 파싱
    if (rawData.content) {
      parsed.steps = parseSteps(rawData.content);
    }

    console.log(`✅ 파싱 완료: ${parsed.main_ingredients.length}개 재료, ${parsed.steps.length}개 단계`);
    console.groupEnd();

    return parsed;
  } catch (error) {
    console.error("❌ 레시피 파싱 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 제목에서 카테고리 추론
 */
function inferCategory(title: string): StandardizedRecipe['category'] {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("밥") || lowerTitle.includes("rice")) {
    return "rice";
  }
  if (lowerTitle.includes("국") || lowerTitle.includes("찌개") || lowerTitle.includes("탕")) {
    return "soup";
  }
  if (lowerTitle.includes("간식") || lowerTitle.includes("디저트")) {
    return "snack";
  }

  return "side"; // 기본값
}

/**
 * 제목/설명에서 메인 재료 추출
 */
function extractMainIngredients(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const ingredients: string[] = [];

  // 일반적인 메인 재료 패턴
  const commonIngredients = [
    "닭고기", "돼지고기", "소고기", "양고기",
    "고등어", "연어", "참치", "새우", "오징어",
    "두부", "콩", "계란",
    "김치", "된장", "고추장",
  ];

  for (const ingredient of commonIngredients) {
    if (text.includes(ingredient.toLowerCase())) {
      ingredients.push(ingredient);
    }
  }

  // 제목에서 첫 번째 명사 추출 (간단한 휴리스틱)
  const titleWords = title.split(/\s+/);
  if (titleWords.length > 0 && ingredients.length === 0) {
    // 첫 번째 단어가 재료일 가능성이 높음
    const firstWord = titleWords[0].replace(/[^가-힣a-zA-Z]/g, "");
    if (firstWord.length > 1) {
      ingredients.push(firstWord);
    }
  }

  return ingredients.slice(0, 3); // 최대 3개
}

/**
 * 제목/설명에서 조리법 추출
 */
function extractCookingMethod(title: string, description: string): string | null {
  const text = `${title} ${description}`.toLowerCase();

  const cookingMethods = [
    { keyword: "볶음", method: "볶음" },
    { keyword: "조림", method: "조림" },
    { keyword: "구이", method: "구이" },
    { keyword: "찜", method: "찜" },
    { keyword: "튀김", method: "튀김" },
    { keyword: "무침", method: "무침" },
    { keyword: "나물", method: "나물" },
    { keyword: "국", method: "끓이기" },
    { keyword: "찌개", method: "끓이기" },
  ];

  for (const { keyword, method } of cookingMethods) {
    if (text.includes(keyword)) {
      return method;
    }
  }

  return null;
}

/**
 * 내용에서 재료 정보 파싱
 */
function parseIngredients(content: string): Array<{
  name: string;
  quantity: number | null;
  unit: string | null;
}> {
  const ingredients: Array<{ name: string; quantity: number | null; unit: string | null }> = [];

  // 간단한 패턴 매칭 (예: "닭고기 200g", "양파 1개")
  const patterns = [
    /([가-힣a-zA-Z]+)\s*(\d+(?:\.\d+)?)\s*(g|kg|ml|l|개|줌|큰술|작은술)/g,
    /(\d+(?:\.\d+)?)\s*(g|kg|ml|l|개|줌|큰술|작은술)\s*([가-힣a-zA-Z]+)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const name = match[1] || match[3];
      const quantity = parseFloat(match[2] || match[1]);
      const unit = match[3] || match[2];

      if (name && !isNaN(quantity)) {
        ingredients.push({
          name: name.trim(),
          quantity,
          unit: unit.trim(),
        });
      }
    }
  }

  return ingredients.slice(0, 20); // 최대 20개
}

/**
 * 내용에서 조리 단계 파싱
 */
function parseSteps(content: string): Array<{
  step_number: number;
  content: string;
  image_url?: string | null;
}> {
  const steps: Array<{ step_number: number; content: string; image_url?: string | null }> = [];

  // 번호 패턴 (예: "1.", "①", "STEP 1")
  const stepPatterns = [
    /(\d+)\.\s*([^\n]+)/g,
    /[①-⑳]\s*([^\n]+)/g,
    /STEP\s*(\d+)[:.\s]+([^\n]+)/gi,
  ];

  let stepNumber = 1;
  for (const pattern of stepPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const stepContent = (match[2] || match[1]).trim();
      if (stepContent.length > 10) { // 최소 길이 체크
        steps.push({
          step_number: stepNumber++,
          content: stepContent,
          image_url: null,
        });
      }
    }

    if (steps.length > 0) {
      break; // 첫 번째 패턴에서 찾으면 중단
    }
  }

  // 패턴 매칭 실패 시 문단 단위로 분할
  if (steps.length === 0) {
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 20);
    paragraphs.forEach((para, index) => {
      steps.push({
        step_number: index + 1,
        content: para.trim(),
        image_url: null,
      });
    });
  }

  return steps.slice(0, 20); // 최대 20단계
}

