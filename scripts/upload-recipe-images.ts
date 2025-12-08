/**
 * @file upload-recipe-images.ts
 * @description 레시피 이미지를 Supabase Storage에 업로드하고 썸네일 URL 업데이트
 * 
 * 사용법:
 * pnpm ts-node --esm scripts/upload-recipe-images.ts
 */

import { config } from 'dotenv';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { getServiceRoleClient } from '../lib/supabase/service-role.js';

// 환경 변수 로드
config({ path: join(process.cwd(), '.env.local') });
config({ path: join(process.cwd(), '.env') });

const bucketName = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'uploads';

// 레시피 slug와 이미지 파일명 매핑
const recipeImageMap: Record<string, string> = {
  'muguk': '무국.png',
  'gamjaguk': '감자국.png',
  'kimchiguk': '김치국.png',
  'dalgyalguk': '달걀국.png',
  'beoseotguk': '버섯국.png',
  'gosariguk': '고사리국.png',
  'toranguk': '토란국.png',
  'manduguk': '만두국.png',
  'tteokguk': '떡국.png',
  'hwangtaeguk': '황태국.png',
  'siraegiguk': '시래기국.png',
  'ppyeohaejangguk': '뼈해장국.png',
  'sogogi-muguk': '소고기무국.png',
  'bugeoguk': '북어국.png',
  'kongnamulguk': '콩나물국.png',
  'miyeokguk': '미역국.png',
  'doenjangguk': '된장국.png',
  'kimchi-jjigae': '김치찌개.png',
  'sundubu-jjigae': '순두부찌개.png',
  'doenjang-jjigae': '된장찌개.png',
  'yukgaejang': '육개장.png',
  'kongbijijjigae': '콩비지찌개.png',
  'sogogi-jjigae': '소고기찌개.png',
  'dwaejigogi-jjigae': '돼지고기찌개.png',
  'budae-jjigae': '부대찌개.png',
  'cheonggukjang-jjigae': '청국장찌개.png',
  'gamjatang': '감자탕.png',
  'sigeumchi-namul': '시금치나물.jpg',
  'myeolchi-bokkeum': '멸치볶음.jpg',
  'kimchi': '김치.jpg',
};

/**
 * 이미지를 Supabase Storage에 업로드하고 공개 URL 반환
 */
async function uploadImageToStorage(
  imagePath: string,
  recipeSlug: string,
  fileName: string
): Promise<string | null> {
  console.log(`[UploadImage] 업로드 시작: ${fileName} (${recipeSlug})`);
  
  try {
    if (!existsSync(imagePath)) {
      console.error(`[UploadImage] 파일 없음: ${imagePath}`);
      return null;
    }
    
    const fileBuffer = readFileSync(imagePath);
    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    
    // Storage 경로: recipes/{recipe-slug}/{filename}
    const storagePath = `recipes/${recipeSlug}/${fileName}`;
    
    // MIME 타입 결정
    const contentType = fileExt === 'png' ? 'image/png' : 
                       fileExt === 'jpg' || fileExt === 'jpeg' ? 'image/jpeg' : 
                       'image/jpeg';
    
    const supabase = getServiceRoleClient();
    
    // Storage에 업로드
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: true, // 이미 있으면 덮어쓰기
      });
    
    if (error) {
      console.error(`[UploadImage] 업로드 실패: ${error.message}`);
      return null;
    }
    
    // 공개 URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);
    
    console.log(`[UploadImage] 업로드 성공: ${publicUrl}`);
    return publicUrl;
    
  } catch (error) {
    console.error(`[UploadImage] 오류 발생:`, error);
    return null;
  }
}

/**
 * 레시피 썸네일 URL 업데이트
 */
async function updateRecipeThumbnail(
  recipeSlug: string,
  thumbnailUrl: string
): Promise<boolean> {
  try {
    const supabase = getServiceRoleClient();
    const { error } = await supabase
      .from('recipes')
      .update({ thumbnail_url: thumbnailUrl })
      .eq('slug', recipeSlug);
    
    if (error) {
      console.error(`[UpdateThumbnail] 업데이트 실패 (${recipeSlug}):`, error.message);
      return false;
    }
    
    console.log(`[UpdateThumbnail] 업데이트 성공: ${recipeSlug}`);
    return true;
    
  } catch (error) {
    console.error(`[UpdateThumbnail] 오류 발생:`, error);
    return false;
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('[UploadRecipeImages] 이미지 업로드 시작');
  
  const imagesDir = join(process.cwd(), 'public', 'images', 'food');
  
  let successCount = 0;
  let failCount = 0;
  
  // 각 레시피에 대해 이미지 업로드
  for (const [slug, fileName] of Object.entries(recipeImageMap)) {
    const imagePath = join(imagesDir, fileName);
    
    // 이미지 업로드
    const imageUrl = await uploadImageToStorage(imagePath, slug, fileName);
    
    if (imageUrl) {
      // 썸네일 URL 업데이트
      const updated = await updateRecipeThumbnail(slug, imageUrl);
      if (updated) {
        successCount++;
      } else {
        failCount++;
      }
    } else {
      failCount++;
    }
    
    // API 제한을 피하기 위해 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`[UploadRecipeImages] 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
}

// 스크립트 실행
main().catch((error) => {
  console.error('[UploadRecipeImages] 실행 오류:', error);
  process.exit(1);
});

export { uploadImageToStorage, updateRecipeThumbnail };

