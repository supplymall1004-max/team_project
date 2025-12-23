/**
 * @file app/api/health/devices/fitbit/auth/route.ts
 * @description Fitbit OAuth 인증 시작
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ensureSupabaseUser } from '@/lib/supabase/ensure-user';

export async function POST(request: NextRequest) {
  try {
    console.group('[API] POST /api/health/devices/fitbit/auth');

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

    // Fitbit OAuth URL 생성
    const clientId = process.env.FITBIT_CLIENT_ID;
    const redirectUri = process.env.FITBIT_REDIRECT_URI || 
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/health/devices/fitbit/callback`;
    
    if (!clientId) {
      console.error('❌ Fitbit Client ID가 설정되지 않았습니다');
      console.groupEnd();
      return NextResponse.json(
        { error: 'Fitbit 연동이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // OAuth 스코프 (필요한 권한)
    const scopes = [
      'activity',
      'heartrate',
      'sleep',
      'weight',
    ].join(' ');

    // 상태 토큰 생성 (CSRF 방지)
    const state = Buffer.from(JSON.stringify({ userId: userData.id })).toString('base64');

    // OAuth 인증 URL 생성
    const authUrl = new URL('https://www.fitbit.com/oauth2/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);

    console.log('✅ Fitbit OAuth URL 생성 완료');
    console.groupEnd();

    return NextResponse.json({
      success: true,
      authUrl: authUrl.toString(),
    });
  } catch (error) {
    console.error('❌ Fitbit OAuth 시작 실패:', error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: 'OAuth 인증 시작에 실패했습니다.',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
