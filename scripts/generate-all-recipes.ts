/**
 * @file generate-all-recipes.ts
 * @description 모든 한국 전통 음식 레시피 데이터 생성 및 등록 스크립트
 * 
 * 사용법:
 * pnpm tsx scripts/generate-all-recipes.ts
 */

import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { createRecipe, type CreateRecipeInput } from '@/actions/recipe-create';

export interface RecipeData {
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
    preparation_note?: string;
  }>;
  steps: Array<{
    content: string;
  }>;
  imageFilename: string;
}

/**
 * 이미지 파일 경로 생성
 */
function getImagePath(filename: string): string {
  return join(process.cwd(), 'docs', 'picture', filename);
}

/**
 * 이미지를 Supabase Storage에 업로드하고 공개 URL 반환
 */
async function uploadImageToStorage(
  imagePath: string,
  recipeTitle: string
): Promise<string> {
  const supabase = getServiceRoleClient();
  const bucketName = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'uploads';
  
  console.log(`[UploadImage] 업로드 시작: ${imagePath}`);
  
  try {
    if (!existsSync(imagePath)) {
      console.error(`[UploadImage] 파일 없음: ${imagePath}`);
      return '';
    }
    
    const fileBuffer = readFileSync(imagePath);
    const fileName = imagePath.split('/').pop() || imagePath.split('\\').pop() || 'image.jpg';
    
    const slug = recipeTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const storagePath = `recipes/${slug}/${fileName}`;
    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const contentType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
    
    const { data, error } = await supabase.storage
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
    
    console.log(`[UploadImage] 업로드 성공: ${publicUrl}`);
    return publicUrl;
    
  } catch (error) {
    console.error(`[UploadImage] 오류 발생:`, error);
    return '';
  }
}

/**
 * 레시피 등록
 */
async function registerRecipe(
  recipeData: RecipeData,
  userId: string
): Promise<boolean> {
  console.groupCollapsed(`[RegisterRecipe] ${recipeData.title}`);
  
  try {
    // 이미지 업로드
    const imagePath = getImagePath(recipeData.imageFilename);
    console.log(`[RegisterRecipe] 이미지 경로: ${imagePath}`);
    const imageUrl = await uploadImageToStorage(imagePath, recipeData.title);
    
    // 레시피 데이터 준비
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
        preparation_note: ing.preparation_note || undefined,
        display_order: index,
      })),
      steps: recipeData.steps.map((step, index) => ({
        content: step.content,
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
    
    console.log(`[RegisterRecipe] 성공: ${result.slug}`);
    console.groupEnd();
    return true;
    
  } catch (error) {
    console.error(`[RegisterRecipe] 오류:`, error);
    console.groupEnd();
    return false;
  }
}

// 레시피 데이터는 별도 파일에서 import
export { registerRecipe, uploadImageToStorage, getImagePath };
// RecipeData는 이미 위에서 export interface로 정의됨

