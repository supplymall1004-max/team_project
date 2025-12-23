/**
 * @file app/api/health/devices/bluetooth/data/route.ts
 * @description 블루투스 기기에서 가져온 건강 데이터 저장 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ensureSupabaseUser } from '@/lib/supabase/ensure-user';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: NextRequest) {
  try {
    console.group('[API] POST /api/health/devices/bluetooth/data');

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
    const { type, value, timestamp, device_name } = body;

    if (!type || value === undefined || !timestamp) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();
    const date = new Date(timestamp).toISOString().split('T')[0];

    // 데이터 타입에 따라 적절한 테이블에 저장
    let result;

    switch (type) {
      case 'heart_rate': {
        const { data, error } = await supabase
          .from('vital_signs')
          .insert({
            user_id: userData.id,
            family_member_id: null,
            measured_at: timestamp,
            heart_rate: Math.round(value),
            source: 'bluetooth',
            notes: device_name ? `기기: ${device_name}` : null,
          });

        if (error) throw error;
        result = data;
        break;
      }

      case 'steps': {
        // 기존 활동량 데이터가 있으면 업데이트, 없으면 생성
        const { data: existing } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('user_id', userData.id)
          .eq('date', date)
          .maybeSingle();

        const { data, error } = await supabase
          .from('activity_logs')
          .upsert({
            user_id: userData.id,
            family_member_id: null,
            date,
            steps: Math.round(value),
            exercise_minutes: existing?.exercise_minutes || 0,
            calories_burned: existing?.calories_burned || 0,
            source: 'bluetooth',
            notes: device_name ? `기기: ${device_name}` : null,
          }, {
            onConflict: 'user_id,family_member_id,date',
          });

        if (error) throw error;
        result = data;
        break;
      }

      case 'weight': {
        const { data, error } = await supabase
          .from('weight_logs')
          .upsert({
            user_id: userData.id,
            family_member_id: null,
            date,
            weight_kg: value,
            source: 'bluetooth',
            notes: device_name ? `기기: ${device_name}` : null,
          }, {
            onConflict: 'user_id,family_member_id,date',
          });

        if (error) throw error;
        result = data;
        break;
      }

      default:
        return NextResponse.json(
          { error: '지원하지 않는 데이터 타입입니다.' },
          { status: 400 }
        );
    }

    console.log(`✅ 블루투스 데이터 저장 완료: ${type} = ${value}`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('❌ 블루투스 데이터 저장 실패:', error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: '데이터 저장에 실패했습니다.',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
