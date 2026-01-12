/**
 * @file scripts/generate-mfds-recipes-json.ts
 * @description 식약처 레시피 마크다운 파일을 JSON으로 변환하는 스크립트
 *
 * 사용 방법:
 *   pnpm tsx scripts/generate-mfds-recipes-json.ts
 *
 * 출력:
 *   lib/recipes/static-data/mfds-recipes.json
 */

import fs from "fs";
import path from "path";
import { parseRecipeMarkdown } from "@/lib/mfds/recipe-parser";
import type { MfdsRecipe } from "@/types/mfds-recipe";
import { getMainImageUrl } from "@/lib/mfds/recipe-image-utils";

const RECIPES_DIR = path.join(process.cwd(), "docs", "recipes", "mfds recipes", "recipes");
const OUTPUT_FILE = path.join(process.cwd(), "lib", "recipes", "static-data", "mfds-recipes.json");

interface MfdsRecipeListItem {
  frontmatter: {
    rcp_seq: string;
    rcp_nm: string;
    rcp_way2: string;
    rcp_pat2: string;
  };
  title: string;
  description: string;
  mainImageUrl: string | null;
  nutrition: {
    calories: number | null;
    sodium: number | null;
    carbohydrates: number | null;
    protein: number | null;
    fat: number | null;
    fiber: number | null;
  };
}

/**
 * 마크다운 파일에서 레시피 목록을 위한 간소화된 데이터 추출
 */
function convertToListItem(recipe: MfdsRecipe): MfdsRecipeListItem {
  const mainImageUrl = getMainImageUrl(
    recipe.images.mainImageOriginalUrl,
    recipe.images.mainImageLocalPath,
    recipe.frontmatter.rcp_seq
  );

  return {
    frontmatter: recipe.frontmatter,
    title: recipe.title,
    description: recipe.description,
    mainImageUrl,
    nutrition: recipe.nutrition,
  };
}

/**
 * 모든 마크다운 파일을 읽어서 JSON으로 변환
 */
function generateMfdsRecipesJson(): void {
  console.log("🔍 식약처 레시피 마크다운 파일 스캔 중...");
  
  if (!fs.existsSync(RECIPES_DIR)) {
    console.error(`❌ 레시피 디렉토리를 찾을 수 없습니다: ${RECIPES_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(RECIPES_DIR).filter(file => file.endsWith(".md"));
  console.log(`📄 ${files.length}개의 마크다운 파일 발견`);

  const recipes: MfdsRecipeListItem[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filePath = path.join(RECIPES_DIR, file);
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const rcpSeq = file.replace(".md", "");
      const recipe = parseRecipeMarkdown(content, rcpSeq);

      if (recipe) {
        const listItem = convertToListItem(recipe);
        recipes.push(listItem);
        successCount++;
      } else {
        console.warn(`⚠️ 레시피 파싱 실패: ${file}`);
        errorCount++;
      }
    } catch (error) {
      console.error(`❌ 파일 읽기 오류 (${file}):`, error);
      errorCount++;
    }
  }

  // rcp_seq 기준으로 정렬
  recipes.sort((a, b) => {
    const seqA = parseInt(a.frontmatter.rcp_seq, 10);
    const seqB = parseInt(b.frontmatter.rcp_seq, 10);
    return seqA - seqB;
  });

  // 출력 디렉토리 생성
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // JSON 파일로 저장
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(recipes, null, 2), "utf-8");

  console.log(`\n✅ JSON 생성 완료!`);
  console.log(`   - 성공: ${successCount}개`);
  console.log(`   - 실패: ${errorCount}개`);
  console.log(`   - 총: ${recipes.length}개`);
  console.log(`   - 출력 파일: ${OUTPUT_FILE}`);
}

// 스크립트 실행
generateMfdsRecipesJson();

