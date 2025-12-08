/**
 * @file update-recipe-ingredients.ts
 * @description 기존 레시피의 ingredients를 업데이트하는 스크립트
 * 
 * 사용법:
 * pnpx tsx scripts/update-recipe-ingredients.ts
 */

// 환경 변수 로드
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env') });

import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { RECIPE_DATASET } from './recipe-data-generator';

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('=== 레시피 Ingredients 업데이트 시작 ===\n');
  
  const supabase = getServiceRoleClient();
  
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;
  
  for (const recipeData of RECIPE_DATASET) {
    console.groupCollapsed(`[UpdateIngredients] ${recipeData.title}`);
    
    try {
      // 1. 레시피 찾기 (제목으로 직접 매칭)
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .select('id, slug, title')
        .eq('title', recipeData.title)
        .maybeSingle();
      
      if (recipeError || !recipe) {
        console.log(`⏭️  레시피를 찾을 수 없음: ${recipeData.title}`);
        skipCount++;
        console.groupEnd();
        continue;
      }
      
      console.log(`✅ 레시피 찾음: ${recipe.title} (ID: ${recipe.id})`);
      
      // 2. 기존 ingredients 확인
      const { data: existingIngredients, error: ingredientsCheckError } = await supabase
        .from('recipe_ingredients')
        .select('id, ingredient_name, quantity, unit')
        .eq('recipe_id', recipe.id)
        .order('display_order', { ascending: true });
      
      if (ingredientsCheckError) {
        console.error(`❌ Ingredients 조회 실패:`, ingredientsCheckError);
        failCount++;
        console.groupEnd();
        continue;
      }
      
      // 3. ingredients가 이미 있고 내용이 있으면 건너뛰기
      if (existingIngredients && existingIngredients.length > 0 && existingIngredients[0].ingredient_name) {
        console.log(`⏭️  Ingredients가 이미 존재함 (${existingIngredients.length}개)`);
        skipCount++;
        console.groupEnd();
        continue;
      }
      
      // 4. 기존 ingredients 삭제
      if (existingIngredients && existingIngredients.length > 0) {
        const { error: deleteError } = await supabase
          .from('recipe_ingredients')
          .delete()
          .eq('recipe_id', recipe.id);
        
        if (deleteError) {
          console.error(`❌ 기존 Ingredients 삭제 실패:`, deleteError);
        } else {
          console.log(`🗑️  기존 Ingredients 삭제 완료 (${existingIngredients.length}개)`);
        }
      }
      
      // 5. 새로운 ingredients 저장
      const ingredientsToInsert = recipeData.ingredients.map((ing, index) => ({
        recipe_id: recipe.id,
        name: ing.ingredient_name.trim(), // name 필드 필수
        ingredient_name: ing.ingredient_name.trim(),
        quantity: ing.quantity ? parseFloat(ing.quantity.toString()) : null,
        unit: ing.unit?.trim() || null,
        category: (ing.category || "기타") as "곡물" | "채소" | "과일" | "육류" | "해산물" | "유제품" | "조미료" | "기타",
        is_optional: ing.is_optional ?? false,
        preparation_note: ing.preparation_note?.trim() || null,
        display_order: index,
      }));
      
      console.log(`📝 Ingredients 저장 중: ${ingredientsToInsert.length}개`);
      
      const { error: insertError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsToInsert);
      
      if (insertError) {
        console.error(`❌ Ingredients 저장 실패:`, insertError);
        failCount++;
      } else {
        console.log(`✅ Ingredients 저장 성공: ${ingredientsToInsert.length}개`);
        successCount++;
      }
      
    } catch (error) {
      console.error(`❌ 오류 발생:`, error);
      failCount++;
    }
    
    console.groupEnd();
    
    // API 레이트 리밋 방지를 위한 딜레이
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n=== 레시피 Ingredients 업데이트 완료 ===');
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`⏭️  건너뜀: ${skipCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`📊 총계: ${RECIPE_DATASET.length}개`);
}

// 스크립트 실행
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ 스크립트 실행 중 오류 발생:', error);
    process.exit(1);
  });
}

export { main };

