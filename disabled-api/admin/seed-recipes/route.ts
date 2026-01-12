/**
 * @file app/api/admin/seed-recipes/route.ts
 * @description 레시피 일괄 등록 API 라우트
 * 
 * POST /api/admin/seed-recipes
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { createRecipe, type CreateRecipeInput } from '@/actions/recipe-create';

interface RecipeSeedData {
  title: string;
  description: string;
  difficulty: number;
  cookingTimeMinutes: number;
  servings: number;
  ingredients: Array<{
    ingredient_name: string;
    quantity?: string;
    unit?: string;
    category: "곡물" | "채소" | "과일" | "육류" | "해산물" | "유제품" | "조미료" | "기타";
    is_optional?: boolean;
  }>;
  steps: string[];
  imageFileName: string;
}

// 레시피 템플릿 (간단한 버전)
const recipeTemplates: Record<string, Partial<RecipeSeedData>> = {
  '무국': {
    title: '무국',
    description: '시원하고 깔끔한 무국입니다.',
    difficulty: 2,
    cookingTimeMinutes: 30,
    servings: 4,
    ingredients: [
      { ingredient_name: '무', quantity: '300', unit: 'g', category: '채소' },
      { ingredient_name: '다시마', quantity: '10', unit: 'cm', category: '해산물' },
      { ingredient_name: '멸치', quantity: '10', unit: '마리', category: '해산물' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '마늘', quantity: '2', unit: '쪽', category: '조미료' },
      { ingredient_name: '소금', quantity: '1', unit: '작은술', category: '조미료' },
    ],
    steps: [
      '다시마와 멸치로 육수를 만듭니다.',
      '무를 깍둑썰기하여 준비합니다.',
      '육수가 끓으면 무를 넣고 끓입니다.',
      '무가 투명해지면 다진 마늘과 대파를 넣습니다.',
      '소금으로 간을 맞춰 완성합니다.',
    ],
  },
  '감자국': {
    title: '감자국',
    description: '부드럽고 담백한 감자국입니다.',
    difficulty: 2,
    cookingTimeMinutes: 25,
    servings: 4,
    ingredients: [
      { ingredient_name: '감자', quantity: '3', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '멸치', quantity: '10', unit: '마리', category: '해산물' },
      { ingredient_name: '다시마', quantity: '10', unit: 'cm', category: '해산물' },
      { ingredient_name: '소금', quantity: '1', unit: '작은술', category: '조미료' },
    ],
    steps: [
      '감자를 깍둑썰기하여 준비합니다.',
      '다시마와 멸치로 육수를 만듭니다.',
      '육수가 끓으면 감자를 넣고 끓입니다.',
      '감자가 익으면 대파를 넣습니다.',
      '소금으로 간을 맞춰 완성합니다.',
    ],
  },
  '김치국': {
    title: '김치국',
    description: '시원하고 깔끔한 김치국입니다.',
    difficulty: 2,
    cookingTimeMinutes: 20,
    servings: 4,
    ingredients: [
      { ingredient_name: '신김치', quantity: '200', unit: 'g', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '멸치', quantity: '10', unit: '마리', category: '해산물' },
      { ingredient_name: '다시마', quantity: '10', unit: 'cm', category: '해산물' },
      { ingredient_name: '고춧가루', quantity: '1', unit: '작은술', category: '조미료' },
    ],
    steps: [
      '신김치를 적당한 크기로 썹니다.',
      '다시마와 멸치로 육수를 만듭니다.',
      '육수가 끓으면 김치를 넣고 끓입니다.',
      '고춧가루를 넣어 색을 냅니다.',
      '대파를 넣고 한 번 더 끓여 완성합니다.',
    ],
  },
  '김치찌개': {
    title: '김치찌개',
    description: '매콤하고 시원한 김치찌개입니다.',
    difficulty: 3,
    cookingTimeMinutes: 30,
    servings: 4,
    ingredients: [
      { ingredient_name: '신김치', quantity: '300', unit: 'g', category: '채소' },
      { ingredient_name: '돼지고기', quantity: '200', unit: 'g', category: '육류' },
      { ingredient_name: '두부', quantity: '1', unit: '모', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '마늘', quantity: '3', unit: '쪽', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '2', unit: '큰술', category: '조미료' },
    ],
    steps: [
      '돼지고기를 볶아 고소한 맛을 냅니다.',
      '김치를 넣고 볶습니다.',
      '물을 넣고 고춧가루를 넣어 끓입니다.',
      '두부를 넣고 끓입니다.',
      '다진 마늘과 대파를 넣고 완성합니다.',
    ],
  },
  '순두부찌개': {
    title: '순두부찌개',
    description: '부드럽고 매콤한 순두부찌개입니다.',
    difficulty: 2,
    cookingTimeMinutes: 20,
    servings: 4,
    ingredients: [
      { ingredient_name: '순두부', quantity: '1', unit: '팩', category: '채소' },
      { ingredient_name: '달걀', quantity: '1', unit: '개', category: '유제품' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '마늘', quantity: '2', unit: '쪽', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '1', unit: '큰술', category: '조미료' },
    ],
    steps: [
      '순두부를 준비합니다.',
      '물을 넣고 고춧가루를 넣어 끓입니다.',
      '순두부를 넣고 끓입니다.',
      '달걀을 넣고 대파를 넣습니다.',
      '다진 마늘을 넣고 완성합니다.',
    ],
  },
};

function generateRecipeData(imageFileName: string): RecipeSeedData | null {
  const nameWithoutExt = imageFileName.replace(/\.(png|jpg|jpeg)$/i, '');
  const template = recipeTemplates[nameWithoutExt];
  
  if (template) {
    return {
      title: template.title || nameWithoutExt,
      description: template.description || `${nameWithoutExt} 레시피입니다.`,
      difficulty: template.difficulty || 3,
      cookingTimeMinutes: template.cookingTimeMinutes || 30,
      servings: template.servings || 4,
      ingredients: template.ingredients || [],
      steps: template.steps || [],
      imageFileName,
    };
  }
  
  // 기본 템플릿
  return {
    title: nameWithoutExt,
    description: `${nameWithoutExt} 레시피입니다.`,
    difficulty: 3,
    cookingTimeMinutes: 30,
    servings: 4,
    ingredients: [
      { ingredient_name: '재료1', quantity: '200', unit: 'g', category: '기타' },
      { ingredient_name: '재료2', quantity: '100', unit: 'g', category: '기타' },
    ],
    steps: [
      '재료를 준비합니다.',
      '조리합니다.',
      '완성합니다.',
    ],
    imageFileName,
  };
}

async function uploadImageToStorage(imagePath: string, recipeTitle: string): Promise<string> {
  const supabase = getServiceRoleClient();
  const bucketName = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'uploads';
  
  try {
    if (!existsSync(imagePath)) {
      return '';
    }
    
    const fileBuffer = readFileSync(imagePath);
    const fileName = imagePath.split('/').pop() || imagePath.split('\\').pop() || 'image.jpg';
    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    
    const slug = recipeTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const storagePath = `recipes/${slug}/${fileName}`;
    const contentType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
    
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: true,
      });
    
    if (error) {
      console.error(`[UploadImage] 업로드 실패: ${error.message}`);
      return '';
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);
    
    return publicUrl;
  } catch (error) {
    console.error(`[UploadImage] 오류:`, error);
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[SeedRecipes] 레시피 일괄 등록 시작');
    
    // 사용자 ID 가져오기
    const supabase = getServiceRoleClient();
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }
    
    const userId = users[0].id;
    
    // 이미지 파일 목록 가져오기
    const imagesDir = join(process.cwd(), 'public', 'images', 'food');
    const imageFiles = readdirSync(imagesDir).filter(file => 
      /\.(png|jpg|jpeg)$/i.test(file) && !file.startsWith('default') && !file.endsWith('.svg')
    );
    
    console.log(`[SeedRecipes] 발견된 이미지 파일: ${imageFiles.length}개`);
    
    let successCount = 0;
    let failCount = 0;
    const results: Array<{ title: string; success: boolean; error?: string }> = [];
    
    // 각 이미지에 대해 레시피 생성 (최대 10개씩 처리)
    const batchSize = 10;
    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);
      
      for (const imageFile of batch) {
        try {
          const recipeData = generateRecipeData(imageFile);
          if (!recipeData) {
            failCount++;
            results.push({ title: imageFile, success: false, error: '레시피 데이터 생성 실패' });
            continue;
          }
          
          // 이미지 업로드
          const imagePath = join(imagesDir, imageFile);
          const imageUrl = await uploadImageToStorage(imagePath, recipeData.title);
          
          // 레시피 생성
          const recipeInput: CreateRecipeInput = {
            title: recipeData.title,
            description: recipeData.description,
            difficulty: recipeData.difficulty,
            cookingTimeMinutes: recipeData.cookingTimeMinutes,
            servings: recipeData.servings,
            ingredients: recipeData.ingredients.map((ing, index) => ({
              ingredient_name: ing.ingredient_name,
              quantity: ing.quantity || undefined,
              unit: ing.unit || undefined,
              category: ing.category,
              is_optional: ing.is_optional || false,
              display_order: index,
            })),
            steps: recipeData.steps.map((step, index) => ({
              content: step,
              image_url: index === 0 && imageUrl ? imageUrl : undefined,
              video_url: undefined,
              timer_minutes: undefined,
            })),
            userId,
          };
          
          const result = await createRecipe(recipeInput);
          
          if (result.success) {
            successCount++;
            results.push({ title: recipeData.title, success: true });
          } else {
            failCount++;
            results.push({ title: recipeData.title, success: false, error: result.error });
          }
        } catch (error) {
          failCount++;
          results.push({ 
            title: imageFile, 
            success: false, 
            error: error instanceof Error ? error.message : '알 수 없는 오류' 
          });
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `완료: 성공 ${successCount}개, 실패 ${failCount}개`,
      results,
    });
    
  } catch (error) {
    console.error('[SeedRecipes] 오류:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
}

