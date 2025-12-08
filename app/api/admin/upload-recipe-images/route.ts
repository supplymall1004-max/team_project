/**
 * @file app/api/admin/upload-recipe-images/route.ts
 * @description 레시피 이미지를 Supabase Storage에 업로드하고 썸네일 URL 업데이트
 * 
 * POST /api/admin/upload-recipe-images
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

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
  'sundubu-jjigae': '순두부찌개.jpg',
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

async function uploadImageToStorage(
  imagePath: string,
  recipeSlug: string,
  fileName: string
): Promise<string | null> {
  try {
    if (!existsSync(imagePath)) {
      console.error(`[UploadImage] 파일 없음: ${imagePath}`);
      return null;
    }
    
    const fileBuffer = readFileSync(imagePath);
    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const storagePath = `recipes/${recipeSlug}/${fileName}`;
    const contentType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
    
    const supabase = getServiceRoleClient();
    
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: true,
      });
    
    if (error) {
      console.error(`[UploadImage] 업로드 실패: ${error.message}`);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);
    
    return publicUrl;
  } catch (error) {
    console.error(`[UploadImage] 오류:`, error);
    return null;
  }
}

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
      console.error(`[UpdateThumbnail] 업데이트 실패:`, error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[UpdateThumbnail] 오류:`, error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[UploadRecipeImages] 이미지 업로드 시작');
    
    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[UploadRecipeImages] 환경 변수 누락:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceRoleKey,
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Supabase 환경 변수가 설정되지 않았습니다.',
          details: {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseServiceRoleKey,
          }
        },
        { status: 500 }
      );
    }
    
    const imagesDir = join(process.cwd(), 'public', 'images', 'food');
    console.log('[UploadRecipeImages] 이미지 디렉토리:', imagesDir);
    
    const results: Array<{ slug: string; success: boolean; url?: string; error?: string }> = [];
    let successCount = 0;
    let failCount = 0;
    
    for (const [slug, fileName] of Object.entries(recipeImageMap)) {
      try {
        console.log(`[UploadRecipeImages] 처리 중: ${slug} - ${fileName}`);
        const imagePath = join(imagesDir, fileName);
        
        if (!existsSync(imagePath)) {
          console.error(`[UploadRecipeImages] 파일 없음: ${imagePath}`);
          failCount++;
          results.push({ slug, success: false, error: `파일 없음: ${fileName}` });
          continue;
        }
        
        const imageUrl = await uploadImageToStorage(imagePath, slug, fileName);
        
        if (imageUrl) {
          const updated = await updateRecipeThumbnail(slug, imageUrl);
          if (updated) {
            successCount++;
            results.push({ slug, success: true, url: imageUrl });
            console.log(`[UploadRecipeImages] 성공: ${slug}`);
          } else {
            failCount++;
            results.push({ slug, success: false, error: '썸네일 URL 업데이트 실패' });
            console.error(`[UploadRecipeImages] 썸네일 업데이트 실패: ${slug}`);
          }
        } else {
          failCount++;
          results.push({ slug, success: false, error: '이미지 업로드 실패' });
          console.error(`[UploadRecipeImages] 이미지 업로드 실패: ${slug}`);
        }
        
        // API 제한을 피하기 위해 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        failCount++;
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        console.error(`[UploadRecipeImages] 오류 발생 (${slug}):`, error);
        results.push({ 
          slug, 
          success: false, 
          error: errorMessage
        });
      }
    }
    
    console.log(`[UploadRecipeImages] 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
    
    return NextResponse.json({
      success: true,
      message: `완료: 성공 ${successCount}개, 실패 ${failCount}개`,
      results,
    });
    
  } catch (error) {
    console.error('[UploadRecipeImages] 예상치 못한 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}

