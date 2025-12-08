/**
 * @file run-bulk-upload.ts
 * @description 레시피 일괄 등록 실행 스크립트
 * 
 * 사용법:
 * 1. 환경 변수 설정 확인 (.env 파일에 SUPABASE_SERVICE_ROLE_KEY 등 필요)
 * 2. pnpm tsx scripts/run-bulk-upload.ts
 * 
 * 주의: 이 스크립트는 관리자 권한이 필요하며, 실제 사용자 ID를 입력해야 합니다.
 */

// 환경 변수 로드 (tsx 실행 시 .env 파일 자동 로드)
import { config } from 'dotenv';
import { resolve } from 'path';

// .env 파일 로드
config({ path: resolve(process.cwd(), '.env') });

import { registerRecipe } from './generate-all-recipes';
import { RECIPE_DATASET } from './recipe-data-generator';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * 슬러그 생성 함수 (createRecipe와 동일한 로직)
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * 이미 등록된 레시피 목록 조회
 */
async function getExistingRecipes(): Promise<Set<string>> {
  console.log('[CheckExisting] 이미 등록된 레시피 확인 중...');
  
  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('recipes')
      .select('slug, title');
    
    if (error) {
      console.error('[CheckExisting] 조회 실패:', error);
      return new Set();
    }
    
    const slugs = new Set<string>();
    if (data) {
      for (const recipe of data) {
        slugs.add(recipe.slug);
        // 제목으로도 확인 (슬러그가 다를 수 있음)
        slugs.add(generateSlug(recipe.title));
      }
    }
    
    console.log(`[CheckExisting] ${slugs.size}개의 레시피가 이미 등록되어 있습니다.`);
    return slugs;
  } catch (error) {
    console.error('[CheckExisting] 오류 발생:', error);
    return new Set();
  }
}

/**
 * Supabase users 테이블에서 사용자 ID 가져오기
 */
async function getUserId(): Promise<string | null> {
  try {
    const supabase = getServiceRoleClient();
    
    // 환경 변수에서 사용자 ID 확인
    if (process.env.ADMIN_USER_ID) {
      // Supabase users 테이블에서 해당 ID 확인
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', process.env.ADMIN_USER_ID)
        .maybeSingle();
      
      if (!error && data) {
        return data.id;
      }
    }
    
    // 환경 변수가 없거나 유효하지 않으면 첫 번째 사용자 사용
    const { data, error } = await supabase
      .from('users')
      .select('id, name')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('[GetUserId] 사용자 조회 실패:', error);
      return null;
    }
    
    if (data) {
      console.log(`[GetUserId] 사용자 발견: ${data.name || data.id}`);
      return data.id;
    }
    
    return null;
  } catch (error) {
    console.error('[GetUserId] 오류 발생:', error);
    return null;
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('=== 레시피 일괄 등록 시작 ===\n');
  
  // 사용자 ID 가져오기
  const userId = await getUserId();
  
  if (!userId) {
    console.error('❌ 사용자 ID를 찾을 수 없습니다.');
    console.error('   다음 중 하나를 시도하세요:');
    console.error('   1. .env 파일에 ADMIN_USER_ID=your_user_id 를 추가하세요.');
    console.error('   2. Supabase users 테이블에 사용자가 있는지 확인하세요.');
    process.exit(1);
  }
  
  console.log(`✅ 사용자 ID: ${userId}\n`);
  
  // 이미 등록된 레시피 확인
  const existingSlugs = await getExistingRecipes();
  console.log('');
  
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;
  
  for (const recipeData of RECIPE_DATASET) {
    const slug = generateSlug(recipeData.title);
    
    // 이미 등록된 레시피는 건너뛰기
    if (existingSlugs.has(slug)) {
      console.log(`⏭️  [Skip] ${recipeData.title} (이미 등록됨)`);
      skipCount++;
      continue;
    }
    
    const success = await registerRecipe(recipeData, userId);
    
    if (success) {
      successCount++;
      // 등록 성공 시 슬러그 추가
      existingSlugs.add(slug);
    } else {
      failCount++;
    }
    
    // API 레이트 리밋 방지를 위한 딜레이
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n=== 레시피 일괄 등록 완료 ===');
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

