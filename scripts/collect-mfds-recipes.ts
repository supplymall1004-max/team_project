/**
 * @file scripts/collect-mfds-recipes.ts
 * @description 식약처 API에서 모든 레시피 데이터를 수집하여 마크다운 파일로 변환하는 스크립트
 *
 * 사용 방법:
 *   pnpm tsx scripts/collect-mfds-recipes.ts
 *
 * 환경 변수:
 *   FOOD_SAFETY_RECIPE_API_KEY - 식약처 API 키
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { fetchFoodSafetyRecipes, type FoodSafetyRecipeRow } from "@/lib/recipes/foodsafety-api";

const RECIPES_DIR = path.join(process.cwd(), "docs/mfds-recipes/recipes");
const CATEGORIES_DIR = path.join(process.cwd(), "docs/mfds-recipes/categories");
const NUTRITION_DIR = path.join(process.cwd(), "docs/mfds-recipes/nutrition");
const IMAGES_DIR = path.join(process.cwd(), "docs/mfds-recipes/images");

/**
 * 레시피를 카테고리로 분류합니다.
 */
function categorizeRecipe(recipe: FoodSafetyRecipeRow): string {
  const pat2 = recipe.RCP_PAT2?.toLowerCase() || "";
  const way2 = recipe.RCP_WAY2?.toLowerCase() || "";

  if (pat2.includes("밥") || pat2.includes("죽")) {
    return "rice";
  }
  if (pat2.includes("국") || pat2.includes("찌개") || pat2.includes("탕")) {
    return "soup";
  }
  if (pat2.includes("반찬") || pat2.includes("나물") || pat2.includes("무침")) {
    return "side";
  }
  if (pat2.includes("간식") || pat2.includes("디저트") || pat2.includes("과자")) {
    return "snack";
  }
  if (way2.includes("볶음")) {
    return "stir-fry";
  }

  return "other";
}

/**
 * 조리 방법 텍스트를 생성합니다.
 */
function generateCookingSteps(recipe: FoodSafetyRecipeRow): string[] {
  const steps: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const manual = (recipe as any)[`MANUAL${String(i).padStart(2, "0")}`];
    if (manual && manual.trim() && manual.trim() !== "") {
      steps.push(manual.trim());
    }
  }
  return steps;
}

/**
 * 재료 정보를 파싱합니다.
 */
function parseIngredients(rcpPartsDtls: string): string[] {
  if (!rcpPartsDtls || rcpPartsDtls.trim() === "") {
    return [];
  }

  // 쉼표, 줄바꿈, 공백으로 분리
  return rcpPartsDtls
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * 이미지를 다운로드하고 저장합니다.
 */
async function downloadImage(
  imageUrl: string,
  savePath: string,
  maxRetries: number = 3
): Promise<boolean> {
  if (!imageUrl || imageUrl.trim() === "") {
    return false;
  }

  // 이미 파일이 존재하면 건너뛰기
  if (fs.existsSync(savePath)) {
    return true;
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`  📥 이미지 다운로드 시도 ${attempt + 1}/${maxRetries}: ${imageUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`  ⚠️ 이미지 다운로드 실패: ${response.status} ${response.statusText}`);
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        return false;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 디렉토리가 없으면 생성
      const dir = path.dirname(savePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(savePath, buffer);
      console.log(`  ✅ 이미지 저장 완료: ${path.basename(savePath)}`);
      return true;
    } catch (error) {
      console.warn(`  ⚠️ 이미지 다운로드 오류 (시도 ${attempt + 1}/${maxRetries}):`, error instanceof Error ? error.message : error);
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  return false;
}

/**
 * 레시피의 모든 이미지를 다운로드합니다.
 */
async function downloadRecipeImages(
  recipe: FoodSafetyRecipeRow
): Promise<{
  mainImagePath: string | null;
  mkImagePath: string | null;
  manualImagePaths: Record<number, string | null>;
}> {
  const rcpSeq = recipe.RCP_SEQ;
  const result = {
    mainImagePath: null as string | null,
    mkImagePath: null as string | null,
    manualImagePaths: {} as Record<number, string | null>,
  };

  // 대표 이미지 다운로드
  if (recipe.ATT_FILE_NO_MAIN) {
    const mainImagePath = path.join(IMAGES_DIR, `${rcpSeq}_main.jpg`);
    const success = await downloadImage(recipe.ATT_FILE_NO_MAIN, mainImagePath);
    if (success) {
      result.mainImagePath = `/images/${rcpSeq}_main.jpg`;
    }
    // 이미지 다운로드 간 짧은 대기 (서버 부하 방지)
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  // 만드는 법 이미지 다운로드
  if (recipe.ATT_FILE_NO_MK) {
    const mkImagePath = path.join(IMAGES_DIR, `${rcpSeq}_mk.jpg`);
    const success = await downloadImage(recipe.ATT_FILE_NO_MK, mkImagePath);
    if (success) {
      result.mkImagePath = `/images/${rcpSeq}_mk.jpg`;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  // 조리법 이미지 다운로드
  for (let i = 1; i <= 20; i++) {
    const manualImg = (recipe as any)[`MANUAL_IMG${String(i).padStart(2, "0")}`];
    if (manualImg && manualImg.trim() !== "") {
      const manualImagePath = path.join(IMAGES_DIR, `${rcpSeq}_manual_${String(i).padStart(2, "0")}.jpg`);
      const success = await downloadImage(manualImg, manualImagePath);
      if (success) {
        result.manualImagePaths[i] = `/images/${rcpSeq}_manual_${String(i).padStart(2, "0")}.jpg`;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  return result;
}

/**
 * 레시피를 마크다운 형식으로 변환합니다.
 */
function convertToMarkdown(
  recipe: FoodSafetyRecipeRow,
  imagePaths?: {
    mainImagePath: string | null;
    mkImagePath: string | null;
    manualImagePaths: Record<number, string | null>;
  }
): string {
  const cookingSteps = generateCookingSteps(recipe);
  const ingredients = parseIngredients(recipe.RCP_PARTS_DTLS || "");

  // 프론트매터
  const frontmatter = `---
rcp_seq: "${recipe.RCP_SEQ}"
rcp_nm: "${recipe.RCP_NM.replace(/"/g, '\\"')}"
rcp_way2: "${recipe.RCP_WAY2 || ""}"
rcp_pat2: "${recipe.RCP_PAT2 || ""}"
---

`;

  // 본문 시작
  let markdown = `# ${recipe.RCP_NM}\n\n`;
  markdown += `${recipe.RCP_NM}은(는) ${recipe.RCP_PAT2 || "한식"} 요리로, ${recipe.RCP_WAY2 || "기본"} 조리법을 사용합니다.\n\n`;

  // 재료 섹션
  if (ingredients.length > 0) {
    markdown += `## 재료\n\n`;
    for (const ingredient of ingredients) {
      markdown += `- ${ingredient}\n`;
    }
    markdown += `\n`;
  }

  // 조리 방법 섹션
  if (cookingSteps.length > 0) {
    markdown += `## 조리 방법\n\n`;
    cookingSteps.forEach((step, index) => {
      markdown += `${index + 1}. ${step}\n`;
    });
    markdown += `\n`;
  }

  // 영양 정보 섹션
  markdown += `## 영양 정보\n\n`;
  if (recipe.INFO_ENG) markdown += `- 칼로리: ${recipe.INFO_ENG} kcal\n`;
  if (recipe.INFO_CAR) markdown += `- 탄수화물: ${recipe.INFO_CAR}g\n`;
  if (recipe.INFO_PRO) markdown += `- 단백질: ${recipe.INFO_PRO}g\n`;
  if (recipe.INFO_FAT) markdown += `- 지방: ${recipe.INFO_FAT}g\n`;
  if (recipe.INFO_NA) markdown += `- 나트륨: ${recipe.INFO_NA}mg\n`;
  if (recipe.INFO_FIBER) markdown += `- 식이섬유: ${recipe.INFO_FIBER}g\n`;
  markdown += `\n`;

  // 참고사항 섹션
  markdown += `---\n\n`;
  markdown += `## 참고사항\n\n`;
  markdown += `이 레시피는 식품의약품안전처에서 제공하는 공식 레시피 데이터입니다. 아래는 시스템에서 사용하는 모든 필드 값입니다.\n\n`;

  // 기본 정보
  markdown += `### 기본 정보\n`;
  markdown += `- **레시피 순번 (RCP_SEQ)**: ${recipe.RCP_SEQ}\n`;
  markdown += `- **레시피명 (RCP_NM)**: ${recipe.RCP_NM}\n`;
  markdown += `- **조리방법 (RCP_WAY2)**: ${recipe.RCP_WAY2 || "-"}\n`;
  markdown += `- **요리종류 (RCP_PAT2)**: ${recipe.RCP_PAT2 || "-"}\n`;
  markdown += `\n`;

  // 영양 정보
  markdown += `### 영양 정보\n`;
  markdown += `- **칼로리 (INFO_ENG)**: ${recipe.INFO_ENG || "-"}\n`;
  markdown += `- **탄수화물 (INFO_CAR)**: ${recipe.INFO_CAR || "-"}\n`;
  markdown += `- **단백질 (INFO_PRO)**: ${recipe.INFO_PRO || "-"}\n`;
  markdown += `- **지방 (INFO_FAT)**: ${recipe.INFO_FAT || "-"}\n`;
  markdown += `- **나트륨 (INFO_NA)**: ${recipe.INFO_NA || "-"}\n`;
  markdown += `- **식이섬유 (INFO_FIBER)**: ${recipe.INFO_FIBER || "-"}\n`;
  if ((recipe as any).INFO_K) markdown += `- **칼륨 (INFO_K)**: ${(recipe as any).INFO_K}\n`;
  if ((recipe as any).INFO_P) markdown += `- **인 (INFO_P)**: ${(recipe as any).INFO_P}\n`;
  if ((recipe as any).INFO_GI) markdown += `- **GI 지수 (INFO_GI)**: ${(recipe as any).INFO_GI}\n`;
  markdown += `\n`;

  // 재료 정보
  markdown += `### 재료 정보\n`;
  markdown += `- **재료 상세 (RCP_PARTS_DTLS)**: ${recipe.RCP_PARTS_DTLS || "-"}\n`;
  markdown += `\n`;

  // 조리 방법 상세
  markdown += `### 조리 방법 상세\n`;
  for (let i = 1; i <= 20; i++) {
    const manual = (recipe as any)[`MANUAL${String(i).padStart(2, "0")}`];
    const manualImg = (recipe as any)[`MANUAL_IMG${String(i).padStart(2, "0")}`];
    if (manual && manual.trim() && manual.trim() !== "") {
      markdown += `- **조리법 ${i} (MANUAL${String(i).padStart(2, "0")})**: ${manual}\n`;
      if (imagePaths?.manualImagePaths[i]) {
        markdown += `- **조리법 이미지 ${i} (MANUAL_IMG${String(i).padStart(2, "0")})**: ${imagePaths.manualImagePaths[i]}\n`;
        if (manualImg) {
          markdown += `- **조리법 이미지 ${i} 원본 URL**: ${manualImg}\n`;
        }
      } else if (manualImg) {
        markdown += `- **조리법 이미지 ${i} (MANUAL_IMG${String(i).padStart(2, "0")})**: ${manualImg}\n`;
      }
    }
  }
  markdown += `\n`;

  // 이미지
  markdown += `### 이미지\n`;
  if (imagePaths?.mainImagePath) {
    markdown += `- **대표 이미지 (ATT_FILE_NO_MAIN)**: ${imagePaths.mainImagePath}\n`;
    markdown += `- **대표 이미지 원본 URL**: ${recipe.ATT_FILE_NO_MAIN}\n`;
  } else if (recipe.ATT_FILE_NO_MAIN) {
    markdown += `- **대표 이미지 (ATT_FILE_NO_MAIN)**: ${recipe.ATT_FILE_NO_MAIN}\n`;
  }
  if (imagePaths?.mkImagePath) {
    markdown += `- **만드는 법 이미지 (ATT_FILE_NO_MK)**: ${imagePaths.mkImagePath}\n`;
    markdown += `- **만드는 법 이미지 원본 URL**: ${recipe.ATT_FILE_NO_MK}\n`;
  } else if (recipe.ATT_FILE_NO_MK) {
    markdown += `- **만드는 법 이미지 (ATT_FILE_NO_MK)**: ${recipe.ATT_FILE_NO_MK}\n`;
  }

  return frontmatter + markdown;
}

/**
 * 메인 함수
 */
async function main() {
  console.group("📥 식약처 레시피 데이터 수집 시작");

  // 디렉토리 생성
  [RECIPES_DIR, CATEGORIES_DIR, NUTRITION_DIR, IMAGES_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ 디렉토리 생성: ${dir}`);
    }
  });

  // 진행 상황 디렉토리도 생성
  const progressDir = path.dirname(path.join(process.cwd(), "docs/mfds-recipes/.progress.json"));
  if (!fs.existsSync(progressDir)) {
    fs.mkdirSync(progressDir, { recursive: true });
  }

  const allRecipes: FoodSafetyRecipeRow[] = [];
  const categoryMap: Record<string, string[]> = {
    rice: [],
    soup: [],
    side: [],
    snack: [],
    "stir-fry": [],
    other: [],
  };

  let startIdx = 1;
  const batchSize = 10; // 배치 크기를 10으로 줄임 (타임아웃 방지)
  let hasMore = true;
  let totalCollected = 0;
  const maxRecipes = 500; // 최대 수집 개수 제한 (테스트용)

  // 진행 상황 저장 파일
  const progressFile = path.join(process.cwd(), "docs/mfds-recipes/.progress.json");

  // 이전 진행 상황 복원
  let savedProgress: { lastStartIdx: number; collectedSeqs: string[] } | null = null;
  if (fs.existsSync(progressFile)) {
    try {
      savedProgress = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
      if (savedProgress && savedProgress.lastStartIdx) {
        startIdx = savedProgress.lastStartIdx;
        console.log(`📂 이전 진행 상황 복원: ${startIdx}번째부터 시작`);
      }
    } catch (e) {
      console.warn("⚠️ 진행 상황 파일 읽기 실패, 처음부터 시작");
    }
  }

  const collectedSeqs = new Set<string>(savedProgress?.collectedSeqs || []);

  try {
    while (hasMore && totalCollected < maxRecipes) {
      const endIdx = Math.min(startIdx + batchSize - 1, startIdx + maxRecipes - totalCollected - 1);
      console.log(`📥 [${startIdx}~${endIdx}] 범위 레시피 기본 정보 조회 중...`);

      // 1단계: 레시피 기본 정보만 먼저 조회 (작은 배치)
      const result = await fetchFoodSafetyRecipes({
        startIdx,
        endIdx,
        maxRetries: 3,
        retryDelay: 2000,
      });

      if (!result.success || !result.data || result.data.length === 0) {
        console.log("📍 더 이상 조회할 레시피가 없습니다.");
        hasMore = false;
        break;
      }

      console.log(`✅ ${result.data.length}개 레시피 기본 정보 조회됨`);

      // 2단계: 각 레시피를 개별적으로 처리 (상세 정보 포함)
      for (const recipe of result.data) {
        // 이미 수집한 레시피는 건너뛰기
        if (collectedSeqs.has(recipe.RCP_SEQ)) {
          console.log(`⏭️  레시피 ${recipe.RCP_SEQ}는 이미 수집됨, 건너뜀`);
          continue;
        }

        try {
          // 이미지 다운로드
          console.log(`  📸 레시피 ${recipe.RCP_SEQ} 이미지 다운로드 시작...`);
          const imagePaths = await downloadRecipeImages(recipe);
          console.log(`  ✅ 레시피 ${recipe.RCP_SEQ} 이미지 다운로드 완료`);

          // 레시피를 마크다운 파일로 저장
          const markdown = convertToMarkdown(recipe, imagePaths);
          const filePath = path.join(RECIPES_DIR, `${recipe.RCP_SEQ}.md`);
          fs.writeFileSync(filePath, markdown, "utf-8");

          // 카테고리별 분류
          const category = categorizeRecipe(recipe);
          categoryMap[category].push(recipe.RCP_SEQ);

          allRecipes.push(recipe);
          collectedSeqs.add(recipe.RCP_SEQ);
          totalCollected++;

          console.log(`  ✅ 레시피 ${recipe.RCP_SEQ} (${recipe.RCP_NM}) 저장 완료`);

          // 각 레시피 처리 후 짧은 대기 (API 부하 방지)
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`  ❌ 레시피 ${recipe.RCP_SEQ} 저장 실패:`, error);
          // 개별 레시피 실패해도 계속 진행
        }
      }

      startIdx = endIdx + 1;

      // 진행 상황 저장
      try {
        fs.writeFileSync(
          progressFile,
          JSON.stringify({
            lastStartIdx: startIdx,
            collectedSeqs: Array.from(collectedSeqs),
            totalCollected,
          }),
          "utf-8"
        );
      } catch (e) {
        console.warn("⚠️ 진행 상황 저장 실패:", e);
      }

      // 배치 간 대기 시간 증가 (API 부하 방지)
      console.log(`⏳ 다음 배치까지 대기 중... (2초)`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // 카테고리별 목록 파일 생성
    for (const [category, rcpSeqs] of Object.entries(categoryMap)) {
      const categoryFilePath = path.join(CATEGORIES_DIR, `${category}.md`);
      const content = `# ${category}\n\n${rcpSeqs.map((seq) => `- [${seq}](./recipes/${seq}.md)`).join("\n")}\n`;
      fs.writeFileSync(categoryFilePath, content, "utf-8");
    }

    // 영양 정보 인덱스 생성
    const nutritionIndex: Record<string, any> = {};
    for (const recipe of allRecipes) {
      nutritionIndex[recipe.RCP_SEQ] = {
        rcp_seq: recipe.RCP_SEQ,
        rcp_nm: recipe.RCP_NM,
        calories: parseFloat(recipe.INFO_ENG || "0"),
        carbohydrate: parseFloat(recipe.INFO_CAR || "0"),
        protein: parseFloat(recipe.INFO_PRO || "0"),
        fat: parseFloat(recipe.INFO_FAT || "0"),
        sodium: parseFloat(recipe.INFO_NA || "0"),
        fiber: parseFloat(recipe.INFO_FIBER || "0"),
      };
    }

    const nutritionIndexPath = path.join(NUTRITION_DIR, "nutrition-index.json");
    fs.writeFileSync(nutritionIndexPath, JSON.stringify(nutritionIndex, null, 2), "utf-8");

    // 진행 상황 파일 삭제 (수집 완료)
    if (fs.existsSync(progressFile)) {
      fs.unlinkSync(progressFile);
      console.log("✅ 진행 상황 파일 삭제됨");
    }

    console.log(`\n✅ 총 ${allRecipes.length}개의 레시피 수집 완료`);
    console.log(`📁 레시피 파일: ${RECIPES_DIR}`);
    console.log(`📁 카테고리 파일: ${CATEGORIES_DIR}`);
    console.log(`📁 영양 정보 인덱스: ${nutritionIndexPath}`);
  } catch (error) {
    console.error("❌ 레시피 수집 실패:", error);
    process.exit(1);
  } finally {
    console.groupEnd();
  }
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

export { main as collectMfdsRecipes };

