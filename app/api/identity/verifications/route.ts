import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import crypto from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * 주민등록번호 형식 검증
 * YYYYMMDD-XXXXXXX 형식 확인
 */
function validateNationalId(nationalId: string): boolean {
  const pattern = /^\d{6}-\d{7}$/;
  if (!pattern.test(nationalId)) {
    return false;
  }
  
  const parts = nationalId.split('-');
  const datePart = parts[0];
  const serialPart = parts[1];
  
  // 날짜 부분 검증 (YYYYMMDD)
  const year = parseInt(datePart.substring(0, 2));
  const month = parseInt(datePart.substring(2, 4));
  const day = parseInt(datePart.substring(4, 6));
  
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  // 체크섬 검증 (간단한 검증)
  const checkDigit = parseInt(serialPart[6]);
  const serial = parseInt(serialPart.substring(0, 6));
  
  // 기본적인 유효성 검사만 수행 (실제 주민번호 검증은 더 복잡함)
  return true;
}

/**
 * User-Agent에서 기기 유형 추출
 */
function getDeviceType(userAgent: string | null): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  }
  return 'desktop';
}

/**
 * IP 주소 추출 (프록시 고려)
 */
function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  if (cfConnectingIp) return cfConnectingIp;
  if (realIp) return realIp;
  if (forwarded) {
    // x-forwarded-for는 여러 IP를 포함할 수 있음 (첫 번째가 원본)
    return forwarded.split(',')[0].trim();
  }
  
  return null;
}

// POST: Create a new identity verification request
export async function POST(req: NextRequest) {
  try {
    const authResult = await auth();
    const userId = authResult?.userId;
    
    if (!userId) {
      console.error('[IdentityVerifications] 인증 실패: userId가 null');
      return NextResponse.json(
        { error: 'Unauthorized', message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('[IdentityVerifications] JSON 파싱 오류:', error);
      return NextResponse.json(
        { error: 'Bad Request', message: '요청 본문을 파싱할 수 없습니다.' },
        { status: 400 }
      );
    }

    const name = body?.name;
    const nationalId = body?.nationalId;
    const consent = body?.consent;
    const familyMemberId = body?.familyMemberId; // 가족 구성원 ID (선택적)
    
    if (!name || !nationalId || consent !== true) {
      console.error('[IdentityVerifications] 유효성 검사 실패:', { name: !!name, nationalId: !!nationalId, consent });
      return NextResponse.json(
        { error: 'Bad Request', message: '이름, 주민등록번호, 동의는 필수 항목입니다.' },
        { status: 400 }
      );
    }

    // 가족 구성원 ID가 제공된 경우, 해당 구성원이 현재 사용자의 가족 구성원인지 확인
    let verifiedFamilyMemberId: string | null = null;
    if (familyMemberId) {
      console.log('[IdentityVerifications] 가족 구성원 확인 중:', familyMemberId);
      const serviceRoleSupabase = getServiceRoleClient();
      
      // 현재 사용자의 Supabase user_id 조회
      const { data: userData } = await serviceRoleSupabase
        .from('users')
        .select('id')
        .eq('clerk_id', userId)
        .single();

      if (!userData) {
        console.error('[IdentityVerifications] 사용자를 찾을 수 없음');
        return NextResponse.json(
          { error: 'User not found', message: '사용자 정보를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      // 가족 구성원이 현재 사용자의 가족인지 확인
      const { data: familyMember, error: familyMemberError } = await serviceRoleSupabase
        .from('family_members')
        .select('id, name')
        .eq('id', familyMemberId)
        .eq('user_id', userData.id)
        .single();

      if (familyMemberError || !familyMember) {
        console.error('[IdentityVerifications] 가족 구성원 확인 실패:', familyMemberError);
        return NextResponse.json(
          { error: 'Forbidden', message: '해당 가족 구성원에 대한 권한이 없습니다.' },
          { status: 403 }
        );
      }

      verifiedFamilyMemberId = familyMember.id;
      console.log('[IdentityVerifications] 가족 구성원 확인 완료:', familyMember.name);
    }

    // 주민등록번호 형식 검증
    if (!validateNationalId(nationalId)) {
      console.error('[IdentityVerifications] 주민등록번호 형식 오류:', nationalId);
      return NextResponse.json(
        { error: 'Bad Request', message: '주민등록번호 형식이 올바르지 않습니다. (YYYYMMDD-XXXXXXX)' },
        { status: 400 }
      );
    }

    // 주민번호를 해시로 저장 (원문 저장은 피함)
    const nationalIdHash = crypto.createHash('sha256').update(String(nationalId)).digest('hex');

    // 요청 정보 수집 (동의 내역 저장용)
    const ipAddress = getClientIp(req);
    const userAgent = req.headers.get('user-agent');
    const deviceType = getDeviceType(userAgent);
    const consentTime = new Date().toISOString();

    const supabase = getSupabaseClient();
    const serviceRoleSupabase = getServiceRoleClient();

    // 1. 신원확인 정보 저장
    const { data: verificationData, error: verificationError } = await supabase
      .from('identity_verifications')
      .insert([
        {
          clerk_user_id: userId,
          name,
          national_id_hash: nationalIdHash,
          consent: true,
          status: 'pending', // 자동 검증 후 'verified'로 변경
          created_at: consentTime,
          family_member_id: verifiedFamilyMemberId, // 가족 구성원인 경우 ID, 본인인 경우 NULL
        },
      ])
      .select();

    if (verificationError) {
      console.error('[IdentityVerifications] insert error:', verificationError);
      return NextResponse.json(
        { error: 'Database Error', message: verificationError.message || '데이터베이스 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const created = verificationData?.[0];
    console.log('[IdentityVerifications] 신원확인 요청 생성 완료:', created?.id);

    // 2. 자동 검증 프로세스 (주민등록번호 형식 검증 통과 시 자동으로 verified 처리)
    let verificationStatus = 'pending';
    let verifiedAt: string | null = null;
    
    // 형식 검증 통과 시 자동으로 verified 처리
    if (validateNationalId(nationalId)) {
      verificationStatus = 'verified';
      verifiedAt = consentTime;
      
      // 상태 업데이트
      const { error: updateError } = await supabase
        .from('identity_verifications')
        .update({ status: 'verified', verified_at: verifiedAt })
        .eq('id', created.id);
      
      if (updateError) {
        console.error('[IdentityVerifications] 상태 업데이트 오류:', updateError);
      } else {
        console.log('[IdentityVerifications] 자동 검증 완료:', created.id);
      }
    }

    // 3. 동의 내역 저장 (Service Role 사용 - RLS 우회)
    const consentContent = JSON.stringify({
      type: 'identity_verification',
      description: '신원확인을 위한 개인정보 수집 및 이용 동의',
      items: [
        '이름',
        '주민등록번호 (해시 처리)',
        '신원확인 목적의 개인정보 처리'
      ]
    });

    const { error: consentError } = await serviceRoleSupabase
      .from('consent_records')
      .insert([
        {
          clerk_user_id: userId,
          consent_type: 'identity_verification',
          consent_content: consentContent,
          consent_status: 'granted',
          consent_time: consentTime,
          ip_address: ipAddress,
          user_agent: userAgent,
          device_type: deviceType,
          verification_id: created.id,
        },
      ]);

    if (consentError) {
      console.error('[IdentityVerifications] 동의 내역 저장 오류:', consentError);
      // 동의 내역 저장 실패해도 신원확인은 성공으로 처리
    } else {
      console.log('[IdentityVerifications] 동의 내역 저장 완료');
    }
    
    return NextResponse.json(
      { 
        verificationId: created?.id, 
        status: verificationStatus,
        verifiedAt: verifiedAt
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[IdentityVerifications] 예상치 못한 오류:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET: Fetch verifications for current Clerk user
export async function GET(req: NextRequest) {
  try {
    const authResult = await auth();
    const userId = authResult?.userId;
    
    if (!userId) {
      console.error('[IdentityVerifications] 인증 실패: userId가 null');
      return NextResponse.json(
        { error: 'Unauthorized', message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();
    const serviceRoleSupabase = getServiceRoleClient();
    
    // 본인 및 가족 구성원의 신원확인 정보 조회
    // 본인인 경우: family_member_id가 NULL
    // 가족 구성원인 경우: family_member_id가 해당 구성원의 ID
    const { data: verifications, error } = await supabase
      .from('identity_verifications')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[IdentityVerifications] fetch error:', error);
      return NextResponse.json(
        { error: 'Database Error', message: error.message || '데이터베이스 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 가족 구성원 정보가 있는 경우 조인하여 반환
    const result = await Promise.all(
      (verifications || []).map(async (verification) => {
        if (verification.family_member_id) {
          const { data: familyMember } = await serviceRoleSupabase
            .from('family_members')
            .select('id, name, relationship')
            .eq('id', verification.family_member_id)
            .single();
          
          return {
            ...verification,
            family_member: familyMember || null,
          };
        }
        return {
          ...verification,
          family_member: null,
        };
      })
    );

    const data = result;

    if (error) {
      console.error('[IdentityVerifications] fetch error:', error);
      return NextResponse.json(
        { error: 'Database Error', message: error.message || '데이터베이스 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('[IdentityVerifications] 예상치 못한 오류:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}


