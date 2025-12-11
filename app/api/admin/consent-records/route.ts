/**
 * @file app/api/admin/consent-records/route.ts
 * @description 관리자용 동의 내역 조회 API
 * 
 * 관리자가 개인정보 처리 동의 내역을 조회할 수 있는 API입니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * 관리자 권한 확인
 */
async function checkAdminAccess(): Promise<{ isAdmin: boolean; userId: string | null }> {
  const authResult = await auth();
  const userId = authResult?.userId;
  
  if (!userId) {
    return { isAdmin: false, userId: null };
  }

  // TODO: 실제 관리자 권한 확인 로직 구현
  // 현재는 개발 환경에서는 모든 사용자 허용
  if (process.env.NODE_ENV === 'development') {
    return { isAdmin: true, userId };
  }

  // 프로덕션에서는 실제 관리자 권한 확인 필요
  return { isAdmin: true, userId };
}

/**
 * GET /api/admin/consent-records
 * 동의 내역 조회
 */
export async function GET(req: NextRequest) {
  try {
    console.group('[AdminAPI] 동의 내역 조회');

    // 관리자 권한 확인
    const { isAdmin, userId } = await checkAdminAccess();
    if (!isAdmin || !userId) {
      console.error('[AdminAPI] 관리자 권한 없음');
      console.groupEnd();
      return NextResponse.json(
        { error: 'Unauthorized', message: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const clerkUserId = searchParams.get('clerk_user_id');
    const consentType = searchParams.get('consent_type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const supabase = getServiceRoleClient();
    let query = supabase
      .from('consent_records')
      .select(`
        *,
        identity_verifications (
          id,
          name,
          status,
          created_at
        )
      `, { count: 'exact' })
      .order('consent_time', { ascending: false });

    // 필터 적용
    if (clerkUserId) {
      query = query.eq('clerk_user_id', clerkUserId);
    }
    if (consentType) {
      query = query.eq('consent_type', consentType);
    }
    if (startDate) {
      query = query.gte('consent_time', startDate);
    }
    if (endDate) {
      query = query.lte('consent_time', endDate);
    }

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('[AdminAPI] 동의 내역 조회 오류:', error);
      console.groupEnd();
      return NextResponse.json(
        { error: 'Database Error', message: error.message },
        { status: 500 }
      );
    }

    console.log(`[AdminAPI] 동의 내역 조회 성공: ${data?.length || 0}건`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('[AdminAPI] 예상치 못한 오류:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

