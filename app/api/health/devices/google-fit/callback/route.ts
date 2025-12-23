/**
 * @file app/api/health/devices/google-fit/callback/route.ts
 * @description Google Fit OAuth 콜백 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ensureSupabaseUser } from '@/lib/supabase/ensure-user';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(request: NextRequest) {
  try {
    console.group('[API] GET /api/health/devices/google-fit/callback');

    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.error('❌ 인증 실패');
      console.groupEnd();
      return NextResponse.redirect(
        new URL('/health/profile?error=auth_failed', request.url)
      );
    }

    // 사용자 확인
    const userData = await ensureSupabaseUser();
    if (!userData) {
      console.error('❌ 사용자 동기화 실패');
      console.groupEnd();
      return NextResponse.redirect(
        new URL('/health/profile?error=user_not_found', request.url)
      );
    }

    // OAuth 콜백 파라미터 확인
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('❌ OAuth 오류:', error);
      console.groupEnd();
      return NextResponse.redirect(
        new URL(`/health/profile?error=${error}`, request.url)
      );
    }

    if (!code || !state) {
      console.error('❌ 필수 파라미터 누락');
      console.groupEnd();
      return NextResponse.redirect(
        new URL('/health/profile?error=missing_params', request.url)
      );
    }

    // 상태 토큰 검증
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      if (stateData.userId !== userData.id) {
        throw new Error('상태 토큰 불일치');
      }
    } catch (err) {
      console.error('❌ 상태 토큰 검증 실패:', err);
      console.groupEnd();
      return NextResponse.redirect(
        new URL('/health/profile?error=invalid_state', request.url)
      );
    }

    // Access Token 교환
    const clientId = process.env.GOOGLE_FIT_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_FIT_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_FIT_REDIRECT_URI || 
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/health/devices/google-fit/callback`;

    if (!clientId || !clientSecret) {
      console.error('❌ Google Fit 설정이 완료되지 않았습니다');
      console.groupEnd();
      return NextResponse.redirect(
        new URL('/health/profile?error=config_missing', request.url)
      );
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('❌ 토큰 교환 실패:', errorData);
      console.groupEnd();
      return NextResponse.redirect(
        new URL('/health/profile?error=token_exchange_failed', request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // 사용자 정보 가져오기 (선택사항)
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    let googleUserId = 'unknown';
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      googleUserId = userInfo.id || userInfo.email || 'unknown';
    }

    // 데이터 소스 저장
    const supabase = getServiceRoleClient();
    const { data: dataSource, error: insertError } = await supabase
      .from('health_data_sources')
      .upsert({
        user_id: userData.id,
        source_type: 'google_fit',
        source_name: 'Google Fit',
        connection_status: 'connected',
        connected_at: new Date().toISOString(),
        sync_frequency: 'daily',
        connection_metadata: {
          access_token,
          refresh_token,
          expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
          user_id: googleUserId,
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
      return NextResponse.redirect(
        new URL('/health/profile?error=save_failed', request.url)
      );
    }

    console.log('✅ Google Fit 연동 완료:', dataSource.id);
    console.groupEnd();

    // 성공 페이지로 리다이렉트
    return NextResponse.redirect(
      new URL('/health/profile?tab=devices&connected=google_fit', request.url)
    );
  } catch (error) {
    console.error('❌ Google Fit 콜백 처리 실패:', error);
    console.groupEnd();
    return NextResponse.redirect(
      new URL('/health/profile?error=callback_failed', request.url)
    );
  }
}
