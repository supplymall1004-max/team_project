/**
 * @file scripts/seed-modern-recipes.ts
 * @description 현대 레시피 마크다운 파일을 파싱하여 데이터베이스에 저장하는 스크립트
 * 
 * 사용법:
 * pnpm tsx scripts/seed-modern-recipes.ts
 */

// 환경변수 로드 (dotenv 사용)
import { config } from 'dotenv';
import { resolve } from 'path';

// .env.local 파일 로드
config({ path: resolve(process.cwd(), '.env.local') });
// .env 파일도 시도 (없으면 무시)
config({ path: resolve(process.cwd(), '.env') });

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRecipe, type CreateRecipeInput } from '@/actions/recipe-create';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

interface ModernRecipeJson {
  title: string;
  description: string;
  source: string;
  dishType: string[];
  mealType: string[];
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
  }>;
  instructions: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sodium: number;
    fiber: number;
  };
  imageUrl: string;
  emoji?: string;
}

/**
 * JSON 문자열에서 주석 제거
 */
function removeJsonComments(jsonString: string): string {
  // 한 줄 주석 제거 (// 로 시작하는 주석)
  // 문자열 내부의 // 는 제거하지 않도록 주의
  let result = jsonString;
  let inString = false;
  let escapeNext = false;
  let cleaned = '';
  
  for (let i = 0; i < result.length; i++) {
    const char = result[i];
    const nextChar = result[i + 1];
    
    if (escapeNext) {
      cleaned += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      cleaned += char;
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      cleaned += char;
      continue;
    }
    
    if (!inString && char === '/' && nextChar === '/') {
      // 주석 시작: 줄 끝까지 건너뛰기
      while (i < result.length && result[i] !== '\n') {
        i++;
      }
      if (i < result.length) {
        cleaned += '\n';
      }
      continue;
    }
    
    cleaned += char;
  }
  
  return cleaned;
}

/**
 * 마크다운 파일에서 JSON 블록 추출
 */
function extractJsonFromMarkdown(content: string): ModernRecipeJson[] {
  const recipes: ModernRecipeJson[] = [];
  // 다양한 형식의 JSON 블록 지원
  // ```json\n...\n``` 또는 ```json\r\n...\r\n``` 또는 ```json\n...\n``` (마지막 줄바꿈 없음)
  const jsonBlockRegex = /```json\s*\n([\s\S]*?)\n```/g;
  
  let match;
  let matchCount = 0;
  while ((match = jsonBlockRegex.exec(content)) !== null) {
    matchCount++;
    try {
      let jsonContent = match[1].trim();
      if (!jsonContent) {
        console.warn(`[extractJsonFromMarkdown] 빈 JSON 블록 발견 (${matchCount}번째)`);
        continue;
      }
      
      // JSON 주석 제거
      jsonContent = removeJsonComments(jsonContent);
      
      const jsonData = JSON.parse(jsonContent);
      recipes.push(jsonData);
    } catch (error) {
      console.error(`[extractJsonFromMarkdown] JSON 파싱 오류 (${matchCount}번째 블록):`, error);
      if (error instanceof Error && error.message.includes('position')) {
        // 위치 정보가 있으면 해당 부분만 표시
        const posMatch = error.message.match(/position (\d+)/);
        if (posMatch) {
          const pos = parseInt(posMatch[1]);
          const start = Math.max(0, pos - 50);
          const end = Math.min(match[1].length, pos + 50);
          console.error('[extractJsonFromMarkdown] 문제가 있는 부분:', match[1].substring(start, end));
        }
      } else {
        console.error('[extractJsonFromMarkdown] 문제가 있는 JSON (처음 200자):', match[1].substring(0, 200));
      }
    }
  }
  
  console.log(`[extractJsonFromMarkdown] 총 ${matchCount}개의 JSON 블록 발견, ${recipes.length}개 파싱 성공`);
  
  return recipes;
}

/**
 * 재료 카테고리 추정
 */
function guessIngredientCategory(ingredientName: string): "곡물" | "채소" | "과일" | "육류" | "해산물" | "유제품" | "조미료" | "기타" {
  const name = ingredientName.toLowerCase();
  
  // 곡물
  if (name.includes('밥') || name.includes('쌀') || name.includes('잡곡') || name.includes('현미') || name.includes('흰쌀')) {
    return '곡물';
  }
  
  // 채소
  if (name.includes('나물') || name.includes('채소') || name.includes('가지') || name.includes('고사리') || 
      name.includes('도라지') || name.includes('취') || name.includes('시금치') || name.includes('콩나물') ||
      name.includes('오이') || name.includes('무') || name.includes('감자') || name.includes('고구마') ||
      name.includes('호박') || name.includes('애호박') || name.includes('미역') || name.includes('시래기') ||
      name.includes('쑥갓') || name.includes('참나물') || name.includes('연근') || name.includes('브로콜리')) {
    return '채소';
  }
  
  // 과일
  if (name.includes('과일') || name.includes('사과') || name.includes('배') || name.includes('포도') ||
      name.includes('딸기') || name.includes('바나나') || name.includes('오렌지') || name.includes('귤') ||
      name.includes('자몽') || name.includes('레몬') || name.includes('키위') || name.includes('망고') ||
      name.includes('복숭아') || name.includes('자두') || name.includes('살구') || name.includes('체리') ||
      name.includes('블루베리') || name.includes('라즈베리') || name.includes('블랙베리') || name.includes('크린베리') ||
      name.includes('수박') || name.includes('멜론') || name.includes('파인애플') || name.includes('옥수수') ||
      name.includes('유자') || name.includes('감') || name.includes('대추') || name.includes('무화과')) {
    return '과일';
  }
  
  // 육류
  if (name.includes('고기') || name.includes('소고기') || name.includes('돼지고기') || name.includes('닭') ||
      name.includes('계란') || name.includes('달걀')) {
    return '육류';
  }
  
  // 해산물
  if (name.includes('생선') || name.includes('오징어') || name.includes('멸치') || name.includes('진미채') ||
      name.includes('어묵') || name.includes('황태') || name.includes('북어') || name.includes('미역')) {
    return '해산물';
  }
  
  // 유제품
  if (name.includes('우유') || name.includes('치즈') || name.includes('버터') || name.includes('아이스크림')) {
    return '유제품';
  }
  
  // 조미료
  if (name.includes('소금') || name.includes('간장') || name.includes('국간장') || name.includes('고춧가루') ||
      name.includes('설탕') || name.includes('올리고당') || name.includes('참기름') || name.includes('들기름') ||
      name.includes('깨소금') || name.includes('마늘') || name.includes('파') || name.includes('장아찌') ||
      name.includes('김치') || name.includes('된장') || name.includes('고춧잎')) {
    return '조미료';
  }
  
  return '기타';
}

/**
 * 난이도 추정 (기본값: 3)
 */
function estimateDifficulty(recipe: ModernRecipeJson): number {
  // 간단한 나물류는 1-2, 조림/볶음은 2-3, 찌개/국은 3-4
  if (recipe.dishType.includes('side') && recipe.ingredients.length <= 5) {
    return 2;
  }
  if (recipe.dishType.includes('soup') || recipe.dishType.includes('stew')) {
    return 3;
  }
  return 3;
}

/**
 * 조리 시간 추정 (기본값: 30분)
 */
function estimateCookingTime(recipe: ModernRecipeJson): number {
  // 나물류는 10-15분, 조림은 20-30분, 찌개/국은 30-40분
  if (recipe.dishType.includes('side')) {
    return 15;
  }
  if (recipe.dishType.includes('soup') || recipe.dishType.includes('stew')) {
    return 35;
  }
  return 30;
}

/**
 * 이미지 URL 생성
 */
function getImageUrl(recipe: ModernRecipeJson): string {
  if (recipe.imageUrl && recipe.imageUrl.startsWith('/api/picture/')) {
    return recipe.imageUrl;
  }
  
  // 이미지 파일명 생성 (레시피 제목 기반)
  const imageFileName = `${recipe.title}.jpg`;
  const imagePath = join('docs', 'recipes', 'modern recipe', 'picture', imageFileName);
  
  // 파일 존재 확인
  if (existsSync(join(process.cwd(), imagePath))) {
    return `/api/picture/${encodeURIComponent(imageFileName)}`;
  }
  
  // PNG 파일 확인
  const pngFileName = `${recipe.title}.png`;
  const pngPath = join(process.cwd(), 'docs', 'recipes', 'modern recipe', 'picture', pngFileName);
  if (existsSync(pngPath)) {
    return `/api/picture/${encodeURIComponent(pngFileName)}`;
  }
  
  return '';
}

/**
 * 조리 방법을 단계로 분리
 */
function splitInstructions(instructions: string): string[] {
  // 문장 단위로 분리 (마침표, 줄바꿈 기준)
  const steps = instructions
    .split(/[.\n]/)
    .map(step => step.trim())
    .filter(step => step.length > 0);
  
  return steps.length > 0 ? steps : [instructions];
}

/**
 * 레시피 등록
 */
async function registerRecipe(
  recipe: ModernRecipeJson,
  userId: string
): Promise<boolean> {
  console.group(`[RegisterRecipe] ${recipe.title}`);
  
  try {
    const imageUrl = getImageUrl(recipe);
    const steps = splitInstructions(recipe.instructions);
    
    // 레시피 데이터 준비
    const recipeInput: CreateRecipeInput = {
      title: recipe.title,
      description: recipe.description || `${recipe.emoji || ''} ${recipe.title}`,
      difficulty: estimateDifficulty(recipe),
      cookingTimeMinutes: estimateCookingTime(recipe),
      servings: 4, // 기본값
      ingredients: recipe.ingredients.map((ing, index) => ({
        ingredient_name: ing.name,
        quantity: ing.amount || undefined,
        unit: ing.unit || undefined,
        category: guessIngredientCategory(ing.name),
        is_optional: false,
        display_order: index,
      })),
      steps: steps.map((step, index) => ({
        content: step,
        image_url: index === 0 && imageUrl ? imageUrl : undefined,
        video_url: undefined,
        timer_minutes: undefined,
      })),
      userId,
    };
    
    // 레시피 생성
    const result = await createRecipe(recipeInput);
    
    if (!result.success) {
      console.error(`[RegisterRecipe] 실패: ${result.error}`);
      console.groupEnd();
      return false;
    }
    
    // 영양 정보 업데이트
    if (recipe.nutrition) {
      const supabase = getServiceRoleClient();
      const { error } = await supabase
        .from('recipes')
        .update({
          calories: recipe.nutrition.calories,
          carbohydrates: recipe.nutrition.carbs,
          protein: recipe.nutrition.protein,
          fat: recipe.nutrition.fat,
          sodium: recipe.nutrition.sodium,
        })
        .eq('slug', result.slug);
      
      if (error) {
        console.warn(`[RegisterRecipe] 영양 정보 업데이트 실패:`, error);
      }
    }
    
    console.log(`[RegisterRecipe] 성공: ${result.slug}`);
    console.groupEnd();
    return true;
    
  } catch (error) {
    console.error(`[RegisterRecipe] 오류:`, error);
    console.groupEnd();
    return false;
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('[SeedModernRecipes] 현대 레시피 일괄 등록 시작');
  
  try {
    // 마크다운 파일 읽기
    const markdownPath = join(process.cwd(), 'docs', 'recipes', 'modern recipe', 'modern recipe.md');
    
    if (!existsSync(markdownPath)) {
      console.error(`[SeedModernRecipes] 마크다운 파일을 찾을 수 없습니다: ${markdownPath}`);
      process.exit(1);
    }
    
    console.log(`[SeedModernRecipes] 마크다운 파일 읽기: ${markdownPath}`);
    const content = readFileSync(markdownPath, 'utf-8');
    
    // JSON 블록 추출
    const recipes = extractJsonFromMarkdown(content);
    console.log(`[SeedModernRecipes] ${recipes.length}개의 레시피 발견`);
    
    // 시스템 사용자 ID 가져오기 (또는 관리자 사용자)
    const supabase = getServiceRoleClient();
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      console.error('[SeedModernRecipes] 사용자를 찾을 수 없습니다. 먼저 사용자를 생성해주세요.');
      process.exit(1);
    }
    
    const userId = users[0].id;
    console.log(`[SeedModernRecipes] 사용자 ID: ${userId}`);
    
    // 기존 레시피 확인 (중복 방지)
    const { data: existingRecipes } = await supabase
      .from('recipes')
      .select('title');
    
    const existingTitles = new Set(existingRecipes?.map(r => r.title) || []);
    
    // 레시피 등록
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;
    
    for (const recipe of recipes) {
      if (existingTitles.has(recipe.title)) {
        console.log(`[SeedModernRecipes] 건너뛰기 (이미 존재): ${recipe.title}`);
        skipCount++;
        continue;
      }
      
      const success = await registerRecipe(recipe, userId);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // API 제한 방지를 위한 딜레이
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n[SeedModernRecipes] 완료');
    console.log(`  성공: ${successCount}개`);
    console.log(`  실패: ${failCount}개`);
    console.log(`  건너뛰기: ${skipCount}개`);
    console.log(`  전체: ${recipes.length}개`);
    
  } catch (error) {
    console.error('[SeedModernRecipes] 오류:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

