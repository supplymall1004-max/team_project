/**
 * @file actions/game/get-leaderboard.ts
 * @description 리더보드 데이터 조회 Server Action
 *
 * 주간 리더보드 데이터를 조회하여 반환합니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/lib/game/leaderboard: sortLeaderboardEntries, filterTopEntries, findUserRank
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import {
  sortLeaderboardEntries,
  filterTopEntries,
  findUserRank,
  type LeaderboardType,
  type LeaderboardEntry,
} from "@/lib/game/leaderboard";

interface GetLeaderboardParams {
  type: LeaderboardType;
  topN?: number; // 상위 N명 (기본값: 10)
  includeCurrentUser?: boolean; // 현재 사용자 포함 여부
}

export async function getLeaderboard(
  params: GetLeaderboardParams
): Promise<{
  success: boolean;
  error?: string;
  entries?: LeaderboardEntry[];
  currentUserRank?: LeaderboardEntry | null;
}> {
  try {
    console.group("[GetLeaderboard] 리더보드 데이터 조회 시작");
    console.log("params", params);

    const { userId } = await auth();
    const user = userId ? await ensureSupabaseUser() : null;

    const supabase = getServiceRoleClient();
    const topN = params.topN || 10;

    // 주간 시작일 계산 (월요일)
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(today.setDate(diff));
    const weekStartStr = weekStart.toISOString().split("T")[0];

    let entries: LeaderboardEntry[] = [];

    switch (params.type) {
      case "health_score":
        // 주간 건강 점수 랭킹
        // TODO: 실제 데이터 조회 로직 구현
        // const { data: healthScores } = await supabase
        //   .from("health_indicators")
        //   .select("user_id, health_score")
        //   .gte("date", weekStartStr)
        //   .order("health_score", { ascending: false });
        
        // 임시 데이터
        entries = [
          { userId: "1", userName: "사용자1", score: 95, rank: 1 },
          { userId: "2", userName: "사용자2", score: 90, rank: 2 },
          { userId: "3", userName: "사용자3", score: 85, rank: 3 },
        ];
        break;

      case "activity":
        // 주간 활동량 랭킹
        // TODO: 실제 데이터 조회 로직 구현
        entries = [
          { userId: "1", userName: "사용자1", score: 10000, rank: 1 },
          { userId: "2", userName: "사용자2", score: 8000, rank: 2 },
          { userId: "3", userName: "사용자3", score: 6000, rank: 3 },
        ];
        break;

      case "quest_completion":
        // 주간 퀘스트 완료 랭킹
        // TODO: 실제 데이터 조회 로직 구현
        // const { data: questCompletions } = await supabase
        //   .from("daily_quests")
        //   .select("user_id")
        //   .eq("completed", true)
        //   .gte("quest_date", weekStartStr)
        //   .group("user_id")
        //   .count();
        
        entries = [
          { userId: "1", userName: "사용자1", score: 20, rank: 1 },
          { userId: "2", userName: "사용자2", score: 18, rank: 2 },
          { userId: "3", userName: "사용자3", score: 15, rank: 3 },
        ];
        break;
    }

    // 정렬 및 필터링
    const sortedEntries = sortLeaderboardEntries(entries);
    const topEntries = filterTopEntries(sortedEntries, topN);

    // 현재 사용자 순위 찾기
    let currentUserRank: LeaderboardEntry | null = null;
    if (user && params.includeCurrentUser) {
      currentUserRank = findUserRank(sortedEntries, user.id);
    }

    console.log("✅ 리더보드 데이터 조회 완료");
    console.log("상위 N명:", topN);
    console.log("현재 사용자 순위:", currentUserRank?.rank || "순위 외");
    console.groupEnd();

    return {
      success: true,
      entries: topEntries,
      currentUserRank,
    };
  } catch (error) {
    console.error("❌ 리더보드 데이터 조회 중 오류:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

