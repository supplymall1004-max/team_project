/**
 * @file scripts/filter-modern-recipes.ts
 * @description 현대 레시피 JSON 필터링 스크립트
 * 
 * 1. picture 폴더의 파일명과 레시피 제목을 비교해서 일치하지 않는 레시피 제거
 * 2. modern-recipes.json 파일을 업데이트
 */

import fs from "fs";
import path from "path";

const PICTURE_DIR = path.join(process.cwd(), "docs", "recipes", "modern recipe", "picture");
const MODERN_RECIPES_FILE = path.join(process.cwd(), "lib", "recipes", "static-data", "modern-recipes.json");

interface ModernRecipe {
  id: string;
  title: string;
  [key: string]: any;
}

/**
 * 재료 카테고리 분류 (과일/채소 감지용)
 */
function categorizeIngredient(ingredientName: string): "과일" | "채소" | "기타" {
  const name = ingredientName.toLowerCase();

  // 채소
  if (
    name.includes("나물") ||
    name.includes("시금치") ||
    name.includes("콩나물") ||
    name.includes("배추") ||
    name.includes("양배추") ||
    name.includes("상추") ||
    name.includes("당근") ||
    name.includes("양파") ||
    name.includes("마늘") ||
    name.includes("생강") ||
    name.includes("대파") ||
    name.includes("부추") ||
    name.includes("미나리") ||
    name.includes("고사리") ||
    name.includes("도라지") ||
    name.includes("우엉") ||
    name.includes("오이") ||
    name.includes("가지") ||
    name.includes("애호박") ||
    name.includes("무") ||
    name.includes("감자") ||
    name.includes("고구마")
  ) {
    return "채소";
  }

  // 과일
  if (
    name.includes("과일") ||
    name.includes("사과") ||
    name.includes("배") ||
    name.includes("귤") ||
    name.includes("오렌지") ||
    name.includes("포도") ||
    name.includes("딸기") ||
    name.includes("바나나") ||
    name.includes("수박") ||
    name.includes("참외") ||
    name.includes("복숭아")
  ) {
    return "과일";
  }

  return "기타";
}

/**
 * 메인 실행 함수
 */
function main() {
  console.log("🔍 현대 레시피 필터링 시작...\n");

  // 1. picture 폴더의 파일명 목록 가져오기
  if (!fs.existsSync(PICTURE_DIR)) {
    console.error(`❌ picture 디렉토리를 찾을 수 없습니다: ${PICTURE_DIR}`);
    process.exit(1);
  }

  const pictureFiles = fs.readdirSync(PICTURE_DIR);
  const pictureNames = new Set(
    pictureFiles.map((file) => {
      const parsed = path.parse(file);
      return parsed.name; // 확장자 제거
    })
  );

  console.log(`📸 picture 폴더 파일 개수: ${pictureNames.size}`);

  // 2. modern-recipes.json 읽기
  if (!fs.existsSync(MODERN_RECIPES_FILE)) {
    console.error(`❌ modern-recipes.json 파일을 찾을 수 없습니다: ${MODERN_RECIPES_FILE}`);
    process.exit(1);
  }

  const recipesData = JSON.parse(
    fs.readFileSync(MODERN_RECIPES_FILE, "utf-8")
  ) as ModernRecipe[];

  console.log(`📝 원본 레시피 개수: ${recipesData.length}`);

  // 3. 레시피 필터링 (picture 파일명과 일치하는 것만 유지)
  const filteredRecipes = recipesData.filter((recipe) => {
    const title = recipe.title.trim();
    return pictureNames.has(title);
  });

  console.log(`✅ 필터링 후 레시피 개수: ${filteredRecipes.length}`);
  console.log(`🗑️  제거된 레시피 개수: ${recipesData.length - filteredRecipes.length}`);

  // 4. 제거된 레시피 목록 출력
  const removedRecipes = recipesData.filter(
    (recipe) => !pictureNames.has(recipe.title.trim())
  );
  if (removedRecipes.length > 0) {
    console.log("\n🗑️  제거된 레시피 목록:");
    removedRecipes.forEach((recipe) => {
      console.log(`  - ${recipe.title}`);
    });
  }

  // 5. JSON 파일 업데이트
  fs.writeFileSync(
    MODERN_RECIPES_FILE,
    JSON.stringify(filteredRecipes, null, 2),
    "utf-8"
  );

  console.log(`\n✅ modern-recipes.json 파일이 업데이트되었습니다.`);
  console.log(`📁 파일 경로: ${MODERN_RECIPES_FILE}`);
}

main();

