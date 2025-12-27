/**
 * @file app/api/games/fridge-defense/save-score/route.ts
 * @description 냉장고 디펜스 게임 점수 저장 API
 * 
 * 서버 사이드에서 점수를 저장하여 RLS 문제를 피합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import type { GameStats } from '@/types/game/fridge-defense';

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { score, stats } = body;

    if (typeof score !== 'number' || score < 0) {
      return NextResponse.json(
        { error: '유효하지 않은 점수입니다.' },
        { status: 400 }
      );
    }

    if (!stats || typeof stats !== 'object') {
      return NextResponse.json(
        { error: '유효하지 않은 통계 데이터입니다.' },
        { status: 400 }
      );
    }

    // Service Role 클라이언트 사용 (RLS 우회)
    const supabase = getServiceRoleClient();

    // 1. Clerk user ID를 Supabase user ID로 변환
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .maybeSingle();

    if (userError || !userData || !userData.id) {
      console.error('[FridgeDefense API] 사용자 조회 실패:', userError);
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const supabaseUserId = userData.id;

    // 2. 점수 저장 (game_type: 'fridge_defense')
    const record = {
      user_id: supabaseUserId,
      score: Math.max(0, score),
      stats: stats as GameStats,
      played_at: new Date().toISOString(),
      game_type: 'fridge_defense',
    };

    console.log('[FridgeDefense API] 점수 저장 시도:', {
      user_id: record.user_id,
      score: record.score,
      game_type: record.game_type,
      stats: JSON.stringify(record.stats),
    });

    const { data, error } = await supabase
      .from('fridge_guardian_scores')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('[FridgeDefense API] 점수 저장 실패:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      // 에러 타입별 메시지
      let errorMessage = error.message || '점수 저장 중 오류가 발생했습니다.';
      if (error.code === '23503') {
        errorMessage = '사용자 정보를 찾을 수 없습니다.';
      } else if (error.code === '23505') {
        errorMessage = '이미 저장된 기록입니다.';
      } else if (error.code === '42501') {
        errorMessage = '권한이 없습니다.';
      }

      return NextResponse.json(
        { error: errorMessage, details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: '점수 저장 후 데이터를 받지 못했습니다.' },
        { status: 500 }
      );
    }

    console.log('[FridgeDefense API] 점수 저장 성공:', data.id);
    return NextResponse.json({ 
      success: true, 
      data: {
        id: data.id,
        user_id: data.user_id,
        score: data.score,
        stats: data.stats,
        played_at: data.played_at,
        created_at: data.created_at,
        game_type: data.game_type,
      }
    });
  } catch (error) {
    console.error('[FridgeDefense API] 점수 저장 예외:', error);
    return NextResponse.json(
      { error: '점수 저장 중 오류가 발생했습니다.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

