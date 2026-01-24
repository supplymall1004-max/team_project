/**
 * @file app/api/admin/seed-modern-recipes/route.ts
 * @description 현대 레시피 마크다운 파일을 파싱하여 데이터베이스에 저장하는 API
 * 
 * POST /api/admin/seed-modern-recipes
 */

import { NextRequest, NextResponse } from 'next/server';
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
  const jsonBlockRegex = /```json\s*\n([\s\S]*?)\n```/g;
  
  let match;
  let matchCount = 0;
  while ((match = jsonBlockRegex.exec(content)) !== null) {
    matchCount++;
    try {
      let jsonContent = match[1].trim();
      if (!jsonContent) {
        continue;
      }
      
      // JSON 주석 제거
      jsonContent = removeJsonComments(jsonContent);
      
      const jsonData = JSON.parse(jsonContent);
      recipes.push(jsonData);
    } catch (error) {
      console.error(`[extractJsonFromMarkdown] JSON 파싱 오류 (${matchCount}번째 블록):`, error);
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
  
  if (name.includes('밥') || name.includes('쌀') || name.includes('잡곡') || name.includes('현미') || name.includes('흰쌀')) {
    return '곡물';
  }
  if (name.includes('나물') || name.includes('채소') || name.includes('가지') || name.includes('고사리') || 
      name.includes('도라지') || name.includes('취') || name.includes('시금치') || name.includes('콩나물') ||
      name.includes('오이') || name.includes('무') || name.includes('감자') || name.includes('고구마') ||
      name.includes('호박') || name.includes('애호박') || name.includes('미역') || name.includes('시래기') ||
      name.includes('쑥갓') || name.includes('참나물') || name.includes('연근') || name.includes('브로콜리')) {
    return '채소';
  }
  if (name.includes('과일') || name.includes('사과') || name.includes('배') || name.includes('포도') ||
      name.includes('딸기') || name.includes('바나나') || name.includes('오렌지') || name.includes('귤') ||
      name.includes('자몽') || name.includes('레몬') || name.includes('키위') || name.includes('망고') ||
      name.includes('복숭아') || name.includes('자두') || name.includes('살구') || name.includes('체리') ||
      name.includes('블루베리') || name.includes('라즈베리') || name.includes('블랙베리') || name.includes('크린베리') ||
      name.includes('수박') || name.includes('멜론') || name.includes('파인애플') || name.includes('옥수수') ||
      name.includes('유자') || name.includes('감') || name.includes('대추') || name.includes('무화과')) {
    return '과일';
  }
  if (name.includes('고기') || name.includes('소고기') || name.includes('돼지고기') || name.includes('닭') ||
      name.includes('계란') || name.includes('달걀')) {
    return '육류';
  }
  if (name.includes('생선') || name.includes('오징어') || name.includes('멸치') || name.includes('진미채') ||
      name.includes('어묵') || name.includes('황태') || name.includes('북어') || name.includes('미역')) {
    return '해산물';
  }
  if (name.includes('우유') || name.includes('치즈') || name.includes('버터') || name.includes('아이스크림')) {
    return '유제품';
  }
  if (name.includes('소금') || name.includes('간장') || name.includes('국간장') || name.includes('고춧가루') ||
      name.includes('설탕') || name.includes('올리고당') || name.includes('참기름') || name.includes('들기름') ||
      name.includes('깨소금') || name.includes('마늘') || name.includes('파') || name.includes('장아찌') ||
      name.includes('김치') || name.includes('된장') || name.includes('고춧잎')) {
    return '조미료';
  }
  
  return '기타';
}

function estimateDifficulty(recipe: ModernRecipeJson): number {
  if (recipe.dishType.includes('side') && recipe.ingredients.length <= 5) {
    return 2;
  }
  if (recipe.dishType.includes('soup') || recipe.dishType.includes('stew')) {
    return 3;
  }
  return 3;
}

function estimateCookingTime(recipe: ModernRecipeJson): number {
  if (recipe.dishType.includes('side')) {
    return 15;
  }
  if (recipe.dishType.includes('soup') || recipe.dishType.includes('stew')) {
    return 35;
  }
  return 30;
}

function getImageUrl(recipe: ModernRecipeJson): string {
  if (recipe.imageUrl && recipe.imageUrl.startsWith('/api/picture/')) {
    return recipe.imageUrl;
  }
  
  const imageFileName = `${recipe.title}.jpg`;
  const imagePath = join(process.cwd(), 'docs', 'recipes', 'modern recipe', 'picture', imageFileName);
  
  if (existsSync(imagePath)) {
    return `/api/picture/${encodeURIComponent(imageFileName)}`;
  }
  
  const pngFileName = `${recipe.title}.png`;
  const pngPath = join(process.cwd(), 'docs', 'recipes', 'modern recipe', 'picture', pngFileName);
  if (existsSync(pngPath)) {
    return `/api/picture/${encodeURIComponent(pngFileName)}`;
  }
  
  return '';
}

function splitInstructions(instructions: string): string[] {
  const steps = instructions
    .split(/[.\n]/)
    .map(step => step.trim())
    .filter(step => step.length > 0);
  
  return steps.length > 0 ? steps : [instructions];
}

export async function POST(request: NextRequest) {
  try {
    console.log('[SeedModernRecipes] 현대 레시피 일괄 등록 시작');
    
    // 마크다운 파일 읽기
    const markdownPath = join(process.cwd(), 'docs', 'recipes', 'modern recipe', 'modern recipe.md');
    
    if (!existsSync(markdownPath)) {
      return NextResponse.json(
        { error: `마크다운 파일을 찾을 수 없습니다: ${markdownPath}` },
        { status: 404 }
      );
    }
    
    const content = readFileSync(markdownPath, 'utf-8');
    const recipes = extractJsonFromMarkdown(content);
    console.log(`[SeedModernRecipes] ${recipes.length}개의 레시피 발견`);
    
    // 시스템 사용자 ID 가져오기
    const supabase = getServiceRoleClient();
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다. 먼저 사용자를 생성해주세요.' },
        { status: 400 }
      );
    }
    
    const userId = users[0].id;
    
    // 기존 레시피 확인
    const { data: existingRecipes } = await supabase
      .from('recipes')
      .select('title');
    
    const existingTitles = new Set(existingRecipes?.map(r => r.title) || []);
    
    // 레시피 등록
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;
    const results: Array<{ title: string; success: boolean; error?: string }> = [];
    
    for (const recipe of recipes) {
      if (existingTitles.has(recipe.title)) {
        console.log(`[SeedModernRecipes] 건너뛰기 (이미 존재): ${recipe.title}`);
        skipCount++;
        results.push({ title: recipe.title, success: false, error: '이미 존재하는 레시피' });
        continue;
      }
      
      try {
        const imageUrl = getImageUrl(recipe);
        const steps = splitInstructions(recipe.instructions);
        
        const recipeInput: CreateRecipeInput = {
          title: recipe.title,
          description: recipe.description || `${recipe.emoji || ''} ${recipe.title}`,
          difficulty: estimateDifficulty(recipe),
          cookingTimeMinutes: estimateCookingTime(recipe),
          servings: 4,
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
        
        const result = await createRecipe(recipeInput);
        
        if (result.success) {
          // 영양 정보 업데이트
          if (recipe.nutrition) {
            await supabase
              .from('recipes')
              .update({
                calories: recipe.nutrition.calories,
                carbohydrates: recipe.nutrition.carbs,
                protein: recipe.nutrition.protein,
                fat: recipe.nutrition.fat,
                sodium: recipe.nutrition.sodium,
              })
              .eq('slug', result.slug);
          }
          
          successCount++;
          results.push({ title: recipe.title, success: true });
        } else {
          failCount++;
          results.push({ title: recipe.title, success: false, error: result.error });
        }
      } catch (error) {
        failCount++;
        results.push({ 
          title: recipe.title, 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      summary: {
        total: recipes.length,
        success: successCount,
        failed: failCount,
        skipped: skipCount,
      },
      results,
    });
    
  } catch (error) {
    console.error('[SeedModernRecipes] 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
}

