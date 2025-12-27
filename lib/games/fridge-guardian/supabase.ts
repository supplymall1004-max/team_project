/**
 * @file lib/games/fridge-guardian/supabase.ts
 * @description 냉장고 파수꾼 게임 Supabase 연동
 * 
 * 게임 점수 저장, 랭킹 조회, 가족 프로필 연동 등의 기능을 제공합니다.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { GameScoreRecord, GameStats, AllergyInfo } from '@/types/game/fridge-guardian';

/**
 * Clerk user ID를 Supabase user ID로 변환하는 헬퍼 함수
 * API를 통해 조회하여 RLS 문제를 피합니다.
 * 실패 시 Supabase 클라이언트로 직접 조회를 시도합니다 (fallback).
 */
async function getSupabaseUserId(
  clerkUserId: string,
  supabase?: SupabaseClient
): Promise<string | null> {
  try {
    console.log('[FridgeGuardian] getSupabaseUserId 시작:', clerkUserId);
    
    // 방법 1: API를 통해 조회 (우선)
    try {
      // 사용자 동기화 API 호출 (없으면 생성)
      const syncResponse = await fetch('/api/sync-user', {
        method: 'POST',
      });
      
      if (!syncResponse.ok) {
        const syncError = await syncResponse.json().catch(() => ({}));
        console.warn('[FridgeGuardian] 사용자 동기화 실패:', syncError);
      } else {
        const syncData = await syncResponse.json().catch(() => ({}));
        console.log('[FridgeGuardian] 사용자 동기화 성공:', syncData);
      }
      
      // Supabase user ID 조회 API 호출
      const userResponse = await fetch('/api/users/current');
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('[FridgeGuardian] API로 Supabase user ID 조회 성공:', userData);
        
        if (userData.userId) {
          return userData.userId;
        }
      } else {
        const errorData = await userResponse.json().catch(() => ({}));
        console.warn('[FridgeGuardian] API 조회 실패, fallback 시도:', {
          status: userResponse.status,
          error: errorData
        });
      }
    } catch (apiError) {
      console.warn('[FridgeGuardian] API 호출 예외, fallback 시도:', apiError);
    }
    
    // 방법 2: Supabase 클라이언트로 직접 조회 (fallback)
    if (supabase) {
      try {
        console.log('[FridgeGuardian] Supabase 클라이언트로 직접 조회 시도');
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', clerkUserId)
          .maybeSingle();
        
        if (userError) {
          console.error('[FridgeGuardian] Supabase 직접 조회 실패:', {
            code: userError.code,
            message: userError.message,
            details: userError.details,
            hint: userError.hint
          });
          return null;
        }
        
        if (userData && userData.id) {
          console.log('[FridgeGuardian] Supabase 직접 조회 성공:', userData.id);
          return userData.id;
        }
        
        console.warn('[FridgeGuardian] 사용자를 찾을 수 없음 (clerk_id:', clerkUserId, ')');
        return null;
      } catch (supabaseError) {
        console.error('[FridgeGuardian] Supabase 직접 조회 예외:', supabaseError);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[FridgeGuardian] getSupabaseUserId 전체 예외:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}

/**
 * 게임 점수 저장
 * @param supabase Supabase 클라이언트
 * @param clerkUserId Clerk 사용자 ID (문자열)
 * @param score 게임 점수
 * @param stats 게임 통계
 */
export async function saveGameScore(
  supabase: SupabaseClient,
  clerkUserId: string,
  score: number,
  stats: GameStats
): Promise<{ success: boolean; error?: string; data?: GameScoreRecord }> {
  try {
    console.log('[FridgeGuardian] 점수 저장 시작:', { clerkUserId, score, stats });
    
    // API를 통해 서버 사이드에서 점수 저장 (RLS 문제 회피)
    const response = await fetch('/api/games/fridge-guardian/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        score,
        stats,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[FridgeGuardian] 점수 저장 API 호출 실패:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      // Fallback: 직접 쿼리 시도
      return await saveGameScoreFallback(supabase, clerkUserId, score, stats);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('[FridgeGuardian] 점수 저장 성공 (API):', result.data);
      return {
        success: true,
        data: {
          id: result.data.id,
          user_id: result.data.user_id,
          score: result.data.score,
          stats: result.data.stats || stats,
          played_at: result.data.played_at,
          created_at: result.data.created_at || result.data.played_at,
        } as GameScoreRecord
      };
    } else {
      console.error('[FridgeGuardian] 점수 저장 API 응답 오류:', result);
      return {
        success: false,
        error: result.error || '점수 저장에 실패했습니다.'
      };
    }
  } catch (error) {
    console.error('[FridgeGuardian] 점수 저장 예외:', error);
    
    // Fallback: 직접 쿼리 시도
    return await saveGameScoreFallback(supabase, clerkUserId, score, stats);
  }
}

/**
 * 점수 저장 Fallback (직접 쿼리)
 */
async function saveGameScoreFallback(
  supabase: SupabaseClient,
  clerkUserId: string,
  score: number,
  stats: GameStats
): Promise<{ success: boolean; error?: string; data?: GameScoreRecord }> {
  try {
    console.log('[FridgeGuardian] Fallback: 직접 쿼리로 점수 저장');
    
    // Clerk user ID를 Supabase user ID로 변환
    const supabaseUserId = await getSupabaseUserId(clerkUserId, supabase);
    
    if (!supabaseUserId) {
      return { 
        success: false, 
        error: '사용자 정보를 찾을 수 없습니다. 로그인 상태를 확인해주세요.' 
      };
    }
    
    const record: Omit<GameScoreRecord, 'id' | 'created_at'> = {
      user_id: supabaseUserId,
      score: Math.max(0, score),
      stats: stats,
      played_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('fridge_guardian_scores')
      .insert(record)
      .select()
      .single();
    
    if (error) {
      console.error('[FridgeGuardian] Fallback 점수 저장 실패:', {
        code: error.code,
        message: error.message,
        details: error.details
      });
      return { 
        success: false, 
        error: error.message || '점수 저장 중 오류가 발생했습니다.' 
      };
    }
    
    if (!data) {
      return { 
        success: false, 
        error: '점수 저장 후 데이터를 받지 못했습니다.' 
      };
    }
    
    console.log('[FridgeGuardian] Fallback 점수 저장 성공:', data);
    return { success: true, data: data as GameScoreRecord };
  } catch (error) {
    console.error('[FridgeGuardian] Fallback 점수 저장 예외:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류' 
    };
  }
}

/**
 * 사용자의 최고 점수 조회
 * @param supabase Supabase 클라이언트
 * @param clerkUserId Clerk 사용자 ID (문자열)
 */
export async function getUserHighScore(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<{ score: number; playedAt: string | null }> {
  try {
    // Clerk user ID를 Supabase user ID로 변환 (API 사용, 실패 시 fallback)
    const supabaseUserId = await getSupabaseUserId(clerkUserId, supabase);
    
    if (!supabaseUserId) {
      return { score: 0, playedAt: null };
    }
    
    const { data, error } = await supabase
      .from('fridge_guardian_scores')
      .select('score, played_at')
      .eq('user_id', supabaseUserId)
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error || !data) {
      return { score: 0, playedAt: null };
    }
    
    return {
      score: data.score || 0,
      playedAt: data.played_at || null,
    };
  } catch (error) {
    console.error('[FridgeGuardian] 최고 점수 조회 실패:', error);
    return { score: 0, playedAt: null };
  }
}

/**
 * 가족 랭킹 조회 (상위 N명)
 * @param supabase Supabase 클라이언트 (사용하지 않지만 호환성을 위해 유지)
 * @param clerkUserId Clerk 사용자 ID (문자열) - 현재 사용자 강조용
 * @param limit 조회할 랭킹 수
 */
export async function getFamilyRanking(
  supabase: SupabaseClient,
  clerkUserId: string,
  limit: number = 10
): Promise<Array<{
  userId: string;
  userName: string;
  score: number;
  playedAt: string;
  rank: number;
  isCurrentUser: boolean;
}>> {
  try {
    console.log('[FridgeGuardian] 가족 랭킹 조회 시작:', { clerkUserId, limit });
    
    // API를 통해 서버 사이드에서 랭킹 조회 (RLS 문제 회피)
    const response = await fetch(`/api/games/fridge-guardian/ranking?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[FridgeGuardian] 랭킹 API 호출 실패:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      // Fallback: 직접 쿼리 시도
      return await getFamilyRankingFallback(supabase, clerkUserId, limit);
    }

    const data = await response.json();
    const rankings = data.rankings || [];
    
    console.log('[FridgeGuardian] 가족 랭킹 조회 성공 (API):', rankings);
    return rankings;
  } catch (error) {
    console.error('[FridgeGuardian] 가족 랭킹 조회 예외:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Fallback: 직접 쿼리 시도
    return await getFamilyRankingFallback(supabase, clerkUserId, limit);
  }
}

/**
 * 가족 랭킹 조회 Fallback (직접 쿼리)
 */
async function getFamilyRankingFallback(
  supabase: SupabaseClient,
  clerkUserId: string,
  limit: number
): Promise<Array<{
  userId: string;
  userName: string;
  score: number;
  playedAt: string;
  rank: number;
  isCurrentUser: boolean;
}>> {
  try {
    console.log('[FridgeGuardian] Fallback: 직접 쿼리로 랭킹 조회');
    
    // 현재 사용자의 Supabase ID 조회
    const currentSupabaseUserId = await getSupabaseUserId(clerkUserId, supabase);
    
    // 간단한 쿼리: 점수만 가져오기
    const { data: rankingData, error: rankingError } = await supabase
      .from('fridge_guardian_scores')
      .select('user_id, score, played_at')
      .order('score', { ascending: false })
      .limit(limit * 5);

    if (rankingError) {
      console.error('[FridgeGuardian] Fallback 쿼리 실패:', {
        code: rankingError.code,
        message: rankingError.message,
        details: rankingError.details
      });
      return [];
    }

    if (!rankingData || rankingData.length === 0) {
      return [];
    }

    // 사용자별 최고 점수만 추출
    const userBestScores = new Map<string, {
      userId: string;
      score: number;
      playedAt: string;
    }>();

    for (const row of rankingData) {
      const userId = row.user_id;
      const score = row.score;
      const playedAt = row.played_at;

      if (userBestScores.has(userId)) {
        const existing = userBestScores.get(userId)!;
        if (score > existing.score) {
          userBestScores.set(userId, { userId, score, playedAt });
        }
      } else {
        userBestScores.set(userId, { userId, score, playedAt });
      }
    }

    // 사용자 정보 조회
    const userIds = Array.from(userBestScores.keys());
    const { data: usersData } = await supabase
      .from('users')
      .select('id, name')
      .in('id', userIds);

    const userNameMap = new Map<string, string>();
    if (usersData) {
      for (const user of usersData) {
        userNameMap.set(user.id, user.name || '알 수 없음');
      }
    }

    // 정렬 및 랭킹 부여
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

    console.log('[FridgeGuardian] Fallback 랭킹 조회 성공:', sortedRanking);
    return sortedRanking;
  } catch (error) {
    console.error('[FridgeGuardian] Fallback 랭킹 조회 예외:', error);
    return [];
  }
}

/**
 * 사용자 알레르기 정보 조회 (게임 연동용)
 * @param supabase Supabase 클라이언트
 * @param clerkUserId Clerk 사용자 ID (문자열)
 */
export async function getUserAllergyInfo(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<{ allergies: string[] }> {
  try {
    // Clerk user ID를 Supabase user ID로 변환 (API 사용, 실패 시 fallback)
    const supabaseUserId = await getSupabaseUserId(clerkUserId, supabase);
    
    if (!supabaseUserId) {
      console.warn(`[FridgeGuardian] 사용자 ${clerkUserId}의 Supabase ID를 찾을 수 없음`);
      return { allergies: [] };
    }
    
    // 사용자 본인의 알레르기 정보
    const { data: userProfile, error: profileError } = await supabase
      .from('user_health_profiles')
      .select('allergies')
      .eq('user_id', supabaseUserId)
      .maybeSingle();
    
    if (profileError) {
      console.warn(`[FridgeGuardian] 사용자 ${supabaseUserId}의 알레르기 정보 조회 실패:`, profileError.message);
      return { allergies: [] };
    }
    
    // JSONB 배열에서 string[]으로 변환
    const allergies = (userProfile?.allergies as string[]) || [];
    return { allergies };
  } catch (error) {
    console.error('[FridgeGuardian] 알레르기 정보 조회 예외:', error);
    return { allergies: [] };
  }
}

/**
 * 오늘의 게임 플레이 횟수 조회
 * @param supabase Supabase 클라이언트
 * @param clerkUserId Clerk 사용자 ID (문자열)
 */
export async function getTodayPlayCount(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<number> {
  try {
    // Clerk user ID를 Supabase user ID로 변환 (API 사용, 실패 시 fallback)
    const supabaseUserId = await getSupabaseUserId(clerkUserId, supabase);
    
    if (!supabaseUserId) {
      return 0;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count, error } = await supabase
      .from('fridge_guardian_scores')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', supabaseUserId)
      .gte('played_at', today.toISOString());
    
    if (error) {
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('[FridgeGuardian] 오늘 플레이 횟수 조회 실패:', error);
    return 0;
  }
}

