/**
 * @file app/api/admin/consent-records/export/route.ts
 * @description 동의 내역 출력 API (PDF, Excel, HWP)
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

  // 개발 환경에서는 모든 사용자 허용
  if (process.env.NODE_ENV === 'development') {
    return { isAdmin: true, userId };
  }

  // 프로덕션에서는 실제 관리자 권한 확인 필요
  return { isAdmin: true, userId };
}

/**
 * GET /api/admin/consent-records/export
 * 동의 내역 출력 (PDF, Excel, HWP)
 */
export async function GET(req: NextRequest) {
  try {
    console.group('[AdminAPI] 동의 내역 출력');

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
    const format = searchParams.get('format') || 'pdf';
    const clerkUserId = searchParams.get('clerk_user_id');
    const consentType = searchParams.get('consent_type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!['pdf', 'excel', 'hwp'].includes(format)) {
      return NextResponse.json(
        { error: 'Bad Request', message: '지원하지 않는 출력 형식입니다.' },
        { status: 400 }
      );
    }

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
      `)
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

    const { data, error } = await query;

    if (error) {
      console.error('[AdminAPI] 동의 내역 조회 오류:', error);
      console.groupEnd();
      return NextResponse.json(
        { error: 'Database Error', message: error.message },
        { status: 500 }
      );
    }

    console.log(`[AdminAPI] 동의 내역 출력: ${data?.length || 0}건, 형식: ${format}`);
    console.groupEnd();

    // 간단한 CSV 형식으로 출력 (실제로는 PDF/Excel/HWP 라이브러리 사용 필요)
    // 여기서는 예시로 CSV를 반환합니다.
    if (format === 'excel' || format === 'hwp') {
      // CSV 형식 (Excel 호환)
      const headers = [
        '동의 시간',
        '사용자 ID',
        '이름',
        '동의 유형',
        '상태',
        '기기',
        'IP 주소',
        '위치',
        'User-Agent',
      ];

      const rows = (data || []).map((record) => {
        const location = [
          record.location_country,
          record.location_region,
          record.location_city,
        ]
          .filter(Boolean)
          .join(', ') || '알 수 없음';

        return [
          record.consent_time,
          record.clerk_user_id,
          record.identity_verifications?.name || '-',
          record.consent_type,
          record.consent_status,
          record.device_type || 'unknown',
          record.ip_address || '-',
          location,
          record.user_agent || '-',
        ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const csvBuffer = Buffer.from('\uFEFF' + csvContent, 'utf-8'); // BOM 추가 (Excel 한글 깨짐 방지)

      return new NextResponse(csvBuffer, {
        headers: {
          'Content-Type': format === 'excel' 
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/x-hwp',
          'Content-Disposition': `attachment; filename="consent-records-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'hwp'}"`,
        },
      });
    }

    // PDF 형식 (간단한 텍스트 형식으로 반환)
    // 실제로는 pdfkit, puppeteer 등을 사용하여 PDF 생성 필요
    const pdfContent = `
동의 내역 보고서
생성일: ${new Date().toLocaleString('ko-KR')}
총 ${data?.length || 0}건

${(data || []).map((record, index) => `
${index + 1}. 동의 내역
  - 동의 시간: ${record.consent_time}
  - 사용자 ID: ${record.clerk_user_id}
  - 이름: ${record.identity_verifications?.name || '-'}
  - 동의 유형: ${record.consent_type}
  - 상태: ${record.consent_status}
  - 기기: ${record.device_type || 'unknown'}
  - IP 주소: ${record.ip_address || '-'}
  - 위치: ${[record.location_country, record.location_region, record.location_city].filter(Boolean).join(', ') || '알 수 없음'}
  - User-Agent: ${record.user_agent || '-'}
`).join('\n')}
    `.trim();

    return new NextResponse(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="consent-records-${new Date().toISOString().split('T')[0]}.pdf"`,
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

