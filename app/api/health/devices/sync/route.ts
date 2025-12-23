/**
 * @file app/api/health/devices/sync/route.ts
 * @description 통합 기기 데이터 동기화 API
 *
 * 모든 연결된 기기의 데이터를 동기화하거나 특정 기기만 동기화할 수 있습니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ensureSupabaseUser } from '@/lib/supabase/ensure-user';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: NextRequest) {
  try {
    console.group('[API] POST /api/health/devices/sync');

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

    // 요청 본문 파싱
    const body = await request.json();
    const { data_source_id } = body;

    if (!data_source_id) {
      return NextResponse.json(
        { error: 'data_source_id가 필요합니다.' },
        { status: 400 }
      );
    }

    // 데이터 소스 조회
    const supabase = getServiceRoleClient();
    const { data: dataSource, error: sourceError } = await supabase
      .from('health_data_sources')
      .select('*')
      .eq('id', data_source_id)
      .eq('user_id', userData.id)
      .single();

    if (sourceError || !dataSource) {
      console.error('❌ 데이터 소스 조회 실패:', sourceError);
      console.groupEnd();
      return NextResponse.json(
        { error: '연결된 기기를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 기기 타입에 따라 적절한 동기화 엔드포인트 호출
    let syncResponse;
    if (dataSource.source_type === 'google_fit') {
      syncResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/health/devices/google-fit/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_source_id }),
      });
    } else if (dataSource.source_type === 'fitbit') {
      syncResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/health/devices/fitbit/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_source_id }),
      });
    } else {
      return NextResponse.json(
        { error: '지원하지 않는 기기 타입입니다.' },
        { status: 400 }
      );
    }

    if (!syncResponse.ok) {
      const errorData = await syncResponse.json();
      throw new Error(errorData.message || '동기화 실패');
    }

    const result = await syncResponse.json();

    console.log('✅ 기기 동기화 완료');
    console.groupEnd();

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ 기기 동기화 실패:', error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: '동기화에 실패했습니다.',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
