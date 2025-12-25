/**
 * @file lib/game/leaderboard.ts
 * @description 리더보드 관리 로직
 *
 * 주간 리더보드를 통해 사용자 간 경쟁 요소를 추가하는 로직입니다.
 *
 * 주요 기능:
 * 1. 주간 건강 점수 랭킹 계산
 * 2. 주간 활동량 랭킹 계산
 * 3. 주간 퀘스트 완료 랭킹 계산
 * 4. 랭킹 정렬 및 필터링
 *
 * @dependencies
 * - @/types/game/leaderboard: LeaderboardEntry 타입 정의
 */

export type LeaderboardType = "health_score" | "activity" | "quest_completion";

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  score: number;
  rank: number;
  change?: number; // 순위 변동 (양수: 상승, 음수: 하락)
}

/**
 * 랭킹 타입별 점수 계산
 */
export function calculateLeaderboardScore(
  type: LeaderboardType,
  healthScore?: number,
  activityScore?: number,
  questCompletionCount?: number
): number {
  switch (type) {
    case "health_score":
      return healthScore || 0;
    case "activity":
      return activityScore || 0;
    case "quest_completion":
      return questCompletionCount || 0;
    default:
      return 0;
  }
}

/**
 * 리더보드 엔트리 정렬
 */
export function sortLeaderboardEntries(
  entries: LeaderboardEntry[]
): LeaderboardEntry[] {
  return [...entries]
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

/**
 * 리더보드 필터링 (상위 N명)
 */
export function filterTopEntries(
  entries: LeaderboardEntry[],
  topN: number = 10
): LeaderboardEntry[] {
  return entries.slice(0, topN);
}

/**
 * 사용자 순위 찾기
 */
export function findUserRank(
  entries: LeaderboardEntry[],
  userId: string
): LeaderboardEntry | null {
  return entries.find((e) => e.userId === userId) || null;
}

/**
 * 순위 변동 계산
 */
export function calculateRankChange(
  currentRank: number,
  previousRank?: number
): number | undefined {
  if (previousRank === undefined) return undefined;
  return previousRank - currentRank; // 양수: 상승, 음수: 하락
}

