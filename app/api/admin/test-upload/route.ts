/**
 * @file app/api/admin/test-upload/route.ts
 * @description 이미지 업로드 테스트용 간단한 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(request: NextRequest) {
  try {
    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucketName = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'uploads';
    
    const imagesDir = join(process.cwd(), 'public', 'images', 'food');
    const testImagePath = join(imagesDir, '무국.png');
    
    return NextResponse.json({
      success: true,
      env: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceRoleKey,
        bucketName,
      },
      paths: {
        imagesDir,
        testImagePath,
        imageExists: existsSync(testImagePath),
      },
      test: {
        canReadFile: existsSync(testImagePath),
        fileSize: existsSync(testImagePath) ? readFileSync(testImagePath).length : 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: 500 }
    );
  }
}

