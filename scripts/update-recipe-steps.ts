/**
 * @file update-recipe-steps.ts
 * @description 기존 레시피의 steps를 업데이트하는 스크립트
 * 
 * 사용법:
 * pnpx tsx scripts/update-recipe-steps.ts
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
  console.log('=== 레시피 Steps 업데이트 시작 ===\n');
  
  const supabase = getServiceRoleClient();
  
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;
  
  for (const recipeData of RECIPE_DATASET) {
    console.groupCollapsed(`[UpdateSteps] ${recipeData.title}`);
    
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
      
      // 2. 기존 steps 확인
      const { data: existingSteps, error: stepsCheckError } = await supabase
        .from('recipe_steps')
        .select('id, step_number, content')
        .eq('recipe_id', recipe.id)
        .order('step_number', { ascending: true });
      
      if (stepsCheckError) {
        console.error(`❌ Steps 조회 실패:`, stepsCheckError);
        failCount++;
        console.groupEnd();
        continue;
      }
      
      // 3. steps가 이미 있고 내용이 있으면 건너뛰기
      if (existingSteps && existingSteps.length > 0 && existingSteps[0].content) {
        console.log(`⏭️  Steps가 이미 존재함 (${existingSteps.length}개)`);
        skipCount++;
        console.groupEnd();
        continue;
      }
      
      // 4. 기존 steps 삭제
      if (existingSteps && existingSteps.length > 0) {
        const { error: deleteError } = await supabase
          .from('recipe_steps')
          .delete()
          .eq('recipe_id', recipe.id);
        
        if (deleteError) {
          console.error(`❌ 기존 Steps 삭제 실패:`, deleteError);
        } else {
          console.log(`🗑️  기존 Steps 삭제 완료 (${existingSteps.length}개)`);
        }
      }
      
      // 5. 새로운 steps 저장
      const stepsToInsert = recipeData.steps.map((step, index) => ({
        recipe_id: recipe.id,
        step_number: index + 1,
        content: step.content.trim(),
        image_url: step.image_url?.trim() || null,
        video_url: null,
        timer_minutes: null,
      }));
      
      console.log(`📝 Steps 저장 중: ${stepsToInsert.length}개`);
      
      const { error: insertError } = await supabase
        .from('recipe_steps')
        .insert(stepsToInsert);
      
      if (insertError) {
        console.error(`❌ Steps 저장 실패:`, insertError);
        failCount++;
      } else {
        console.log(`✅ Steps 저장 성공: ${stepsToInsert.length}개`);
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
  
  console.log('\n=== 레시피 Steps 업데이트 완료 ===');
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

