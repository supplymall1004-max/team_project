/**
 * @file app/api/games/fridge-guardian/ranking/route.ts
 * @description 냉장고 파수꾼 게임 랭킹 API
 * 
 * 서버 사이드에서 랭킹을 조회하여 RLS 문제를 피합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const searchParams = await request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Service Role 클라이언트 사용 (RLS 우회)
    const supabase = getServiceRoleClient();

    // 1. 현재 사용자의 Supabase ID 조회
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .maybeSingle();

    const currentSupabaseUserId = currentUser?.id;

    // 2. 점수 데이터만 먼저 조회
    const { data: rankingData, error: rankingError } = await supabase
      .from('fridge_guardian_scores')
      .select('user_id, score, played_at')
      .order('score', { ascending: false })
      .limit(limit * 5); // 중복 제거를 위해 더 많이 가져옴

    if (rankingError) {
      console.error('[FridgeGuardian API] 랭킹 조회 실패:', rankingError);
      return NextResponse.json(
        { error: '랭킹 조회 실패', details: rankingError.message },
        { status: 500 }
      );
    }

    if (!rankingData || rankingData.length === 0) {
      return NextResponse.json({ rankings: [] });
    }

    // 3. 사용자별 최고 점수만 추출 (중복 제거)
    const userBestScores = new Map<string, {
      userId: string;
      score: number;
      playedAt: string;
    }>();

    for (const row of rankingData) {
      const userId = row.user_id;
      const score = row.score;
      const playedAt = row.played_at;

      // 이미 해당 사용자의 점수가 있고, 현재 점수가 더 낮으면 스킵
      if (userBestScores.has(userId)) {
        const existing = userBestScores.get(userId)!;
        if (score > existing.score) {
          userBestScores.set(userId, { userId, score, playedAt });
        }
      } else {
        userBestScores.set(userId, { userId, score, playedAt });
      }
    }

    // 4. 사용자 정보 조회 (별도로)
    const userIds = Array.from(userBestScores.keys());
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name')
      .in('id', userIds);

    if (usersError) {
      console.warn('[FridgeGuardian API] 사용자 정보 조회 실패:', usersError);
    }

    // 사용자 이름 매핑
    const userNameMap = new Map<string, string>();
    if (usersData) {
      for (const user of usersData) {
        userNameMap.set(user.id, user.name || '알 수 없음');
      }
    }

    // 5. 점수 순으로 정렬하고 랭킹 부여
    const sortedRanking = Array.from(userBestScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry, index) => ({
        userId: entry.userId,
        userName: userNameMap.get(entry.userId) || '알 수 없음',
        score: entry.score,
        playedAt: entry.playedAt,
        rank: index + 1,
        isCurrentUser: currentSupabaseUserId ? entry.userId === currentSupabaseUserId : false,
      }));

    return NextResponse.json({ rankings: sortedRanking });
  } catch (error) {
    console.error('[FridgeGuardian API] 랭킹 조회 예외:', error);
    return NextResponse.json(
      { error: '랭킹 조회 중 오류가 발생했습니다.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

