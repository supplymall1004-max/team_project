/**
 * @file app/api/health/devices/upload/route.ts
 * @description Apple Health / Samsung Health 파일 업로드 API
 *
 * 사용자가 내보낸 건강 데이터 파일(CSV/JSON)을 업로드하여 파싱하고 저장합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ensureSupabaseUser } from '@/lib/supabase/ensure-user';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: NextRequest) {
  try {
    console.group('[API] POST /api/health/devices/upload');

    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.error('❌ 인증 실패');
      console.groupEnd();
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 사용자 확인
    const userData = await ensureSupabaseUser();
    if (!userData) {
      console.error('❌ 사용자 동기화 실패');
      console.groupEnd();
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // FormData 파싱
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sourceType = formData.get('source_type') as string;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!sourceType || (sourceType !== 'apple_health' && sourceType !== 'samsung_health')) {
      return NextResponse.json(
        { error: '올바른 소스 타입을 지정해주세요 (apple_health 또는 samsung_health).' },
        { status: 400 }
      );
    }

    // 파일 내용 읽기
    const fileContent = await file.text();
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    let parsedData: any[] = [];

    // 파일 형식에 따라 파싱
    if (fileExtension === 'json') {
      parsedData = JSON.parse(fileContent);
    } else if (fileExtension === 'csv') {
      // CSV 파싱 (간단한 구현)
      const lines = fileContent.split('\n');
      const headers = lines[0].split(',');
      parsedData = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header.trim()] = values[index]?.trim();
        });
        return obj;
      }).filter(obj => Object.keys(obj).length > 0);
    } else {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다. (CSV 또는 JSON만 지원)' },
        { status: 400 }
      );
    }

    // 데이터 소스 저장
    const supabase = getServiceRoleClient();
    const { data: dataSource, error: insertError } = await supabase
      .from('health_data_sources')
      .upsert({
        user_id: userData.id,
        source_type: sourceType,
        source_name: sourceType === 'apple_health' ? 'Apple Health' : 'Samsung Health',
        connection_status: 'connected',
        connected_at: new Date().toISOString(),
        sync_frequency: 'manual',
        connection_metadata: {
          upload_date: new Date().toISOString(),
          file_name: file.name,
        },
        error_message: null,
      }, {
        onConflict: 'user_id,source_type',
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ 데이터 소스 저장 실패:', insertError);
      console.groupEnd();
      return NextResponse.json(
        { error: '데이터 소스 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 데이터 매핑 및 저장 (기본 구현)
    // 실제로는 파일 형식에 따라 더 정교한 파싱이 필요합니다
    let savedCount = 0;

    // 여기서는 간단한 예시만 제공하고, 실제 구현 시 파일 형식에 맞는 파서를 작성해야 합니다
    console.log(`📄 파일 파싱 완료: ${parsedData.length}건`);
    console.log('⚠️ 실제 데이터 매핑 및 저장 로직은 파일 형식에 맞게 구현해야 합니다');

    console.log('✅ 파일 업로드 완료');
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: '파일이 업로드되었습니다. 데이터 파싱 및 저장 기능은 곧 제공될 예정입니다.',
      recordsParsed: parsedData.length,
      dataSourceId: dataSource.id,
    });
  } catch (error) {
    console.error('❌ 파일 업로드 실패:', error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: '파일 업로드에 실패했습니다.',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
