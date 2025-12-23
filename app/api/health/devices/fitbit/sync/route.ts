/**
 * @file app/api/health/devices/fitbit/sync/route.ts
 * @description Fitbit 데이터 동기화
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ensureSupabaseUser } from '@/lib/supabase/ensure-user';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { FitbitClient } from '@/lib/health/devices/fitbit-client';

export async function POST(request: NextRequest) {
  try {
    console.group('[API] POST /api/health/devices/fitbit/sync');

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
    const { data_source_id, start_date, end_date } = body;

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
      .eq('source_type', 'fitbit')
      .single();

    if (sourceError || !dataSource) {
      console.error('❌ 데이터 소스 조회 실패:', sourceError);
      console.groupEnd();
      return NextResponse.json(
        { error: '연결된 Fitbit 기기를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 날짜 범위 설정
    const endDate = end_date || new Date().toISOString().split('T')[0];
    const startDate = start_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fitbit 클라이언트 생성
    const token = dataSource.connection_metadata as any;
    const client = new FitbitClient({
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: token.expires_at,
      user_id: token.user_id,
    });

    // 데이터 동기화
    const [activityData, sleepData, heartRateData, weightData] = await Promise.all([
      client.getActivityData(startDate, endDate).catch(() => []),
      client.getSleepData(startDate, endDate).catch(() => []),
      client.getHeartRateData(startDate, endDate).catch(() => []),
      client.getWeightData(startDate, endDate).catch(() => []),
    ]);

    // 데이터베이스에 저장
    let savedCount = 0;

    // 활동량 데이터 저장
    for (const activity of activityData) {
      const { error } = await supabase
        .from('activity_logs')
        .upsert({
          user_id: userData.id,
          family_member_id: null,
          date: activity.date,
          steps: activity.steps,
          exercise_minutes: activity.activeMinutes,
          calories_burned: activity.calories,
          source: 'fitbit',
        }, {
          onConflict: 'user_id,family_member_id,date',
        });

      if (!error) savedCount++;
    }

    // 수면 데이터 저장
    for (const sleep of sleepData) {
      const { error } = await supabase
        .from('sleep_logs')
        .upsert({
          user_id: userData.id,
          family_member_id: null,
          date: sleep.date,
          sleep_duration_minutes: sleep.duration,
          deep_sleep_minutes: sleep.deepSleep,
          light_sleep_minutes: sleep.lightSleep,
          rem_sleep_minutes: sleep.remSleep,
          source: 'fitbit',
        }, {
          onConflict: 'user_id,family_member_id,date',
        });

      if (!error) savedCount++;
    }

    // 심박수 데이터 저장
    for (const hr of heartRateData) {
      const { error } = await supabase
        .from('vital_signs')
        .insert({
          user_id: userData.id,
          family_member_id: null,
          measured_at: hr.timestamp,
          heart_rate: hr.heartRate,
          source: 'fitbit',
        });

      if (!error) savedCount++;
    }

    // 체중 데이터 저장
    for (const weight of weightData) {
      const date = new Date(weight.timestamp).toISOString().split('T')[0];
      const { error } = await supabase
        .from('weight_logs')
        .upsert({
          user_id: userData.id,
          family_member_id: null,
          date,
          weight_kg: weight.weight,
          source: 'fitbit',
        }, {
          onConflict: 'user_id,family_member_id,date',
        });

      if (!error) savedCount++;
    }

    // 마지막 동기화 시간 업데이트
    await supabase
      .from('health_data_sources')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', data_source_id);

    console.log(`✅ Fitbit 동기화 완료: ${savedCount}건 저장`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      recordsSynced: savedCount,
      activityCount: activityData.length,
      sleepCount: sleepData.length,
      heartRateCount: heartRateData.length,
      weightCount: weightData.length,
    });
  } catch (error) {
    console.error('❌ Fitbit 동기화 실패:', error);
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
