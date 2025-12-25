/**
 * @file actions/admin/characters/get-character-stats.ts
 * @description 캐릭터 통계 조회 Server Action
 *
 * @dependencies
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/types/admin/character: AdminCharacterStats
 */

"use server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { AdminCharacterStats } from "@/types/admin/character";

/**
 * 캐릭터 통계 조회
 */
export async function getCharacterStats(): Promise<{
  success: boolean;
  error?: string;
  data?: AdminCharacterStats;
}> {
  try {
    console.group("[AdminCharacters][GetStats] 캐릭터 통계 조회 시작");

    const supabase = getServiceRoleClient();

    // 전체 캐릭터 수 (family_members)
    const { count: totalCharacters, error: charactersError } = await supabase
      .from("family_members")
      .select("*", { count: "exact", head: true });

    if (charactersError) {
      console.error("❌ 캐릭터 수 조회 실패:", charactersError);
      throw charactersError;
    }

    // 평균 건강 점수
    const { data: healthScores, error: healthError } = await supabase
      .from("family_members")
      .select("health_score")
      .not("health_score", "is", null);

    if (healthError) {
      console.error("❌ 건강 점수 조회 실패:", healthError);
      throw healthError;
    }

    const averageHealthScore =
      healthScores && healthScores.length > 0
        ? healthScores.reduce((sum, item) => sum + (item.health_score || 0), 0) /
          healthScores.length
        : 0;

    // 평균 레벨
    const { data: levels, error: levelsError } = await supabase
      .from("character_levels")
      .select("level");

    if (levelsError) {
      console.error("❌ 레벨 조회 실패:", levelsError);
      throw levelsError;
    }

    const averageLevel =
      levels && levels.length > 0
        ? levels.reduce((sum, item) => sum + item.level, 0) / levels.length
        : 0;

    // 활성 퀘스트 수
    const { count: activeQuests, error: questsError } = await supabase
      .from("daily_quests")
      .select("*", { count: "exact", head: true })
      .eq("completed", false);

    if (questsError) {
      console.error("❌ 활성 퀘스트 수 조회 실패:", questsError);
      throw questsError;
    }

    // 건강 점수 분포
    const healthScoreRanges = [
      { range: "0-20", min: 0, max: 20 },
      { range: "21-40", min: 21, max: 40 },
      { range: "41-60", min: 41, max: 60 },
      { range: "61-80", min: 61, max: 80 },
      { range: "81-100", min: 81, max: 100 },
    ];

    const healthScoreDistribution = [];
    for (const range of healthScoreRanges) {
      const { count, error } = await supabase
        .from("family_members")
        .select("*", { count: "exact", head: true })
        .gte("health_score", range.min)
        .lte("health_score", range.max);

      if (!error) {
        healthScoreDistribution.push({
          range: range.range,
          count: count || 0,
        });
      }
    }

    // 레벨 분포
    const { data: levelData, error: levelDistError } = await supabase
      .from("character_levels")
      .select("level");

    const levelDistribution: { level: number; count: number }[] = [];
    if (levelData && !levelDistError) {
      const levelCounts = levelData.reduce((acc, item) => {
        acc[item.level] = (acc[item.level] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      Object.entries(levelCounts).forEach(([level, count]) => {
        levelDistribution.push({
          level: parseInt(level),
          count,
        });
      });
    }

    // 일일 활동 통계 (최근 7일)
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const { count: questsCompleted, error: questsErr } = await supabase
        .from("daily_quests")
        .select("*", { count: "exact", head: true })
        .eq("completed", true)
        .gte("completed_at", date.toISOString())
        .lt("completed_at", nextDate.toISOString());

      const { count: levelUps, error: levelUpsErr } = await supabase
        .from("character_levels")
        .select("*", { count: "exact", head: true })
        .gte("last_level_up_at", date.toISOString())
        .lt("last_level_up_at", nextDate.toISOString());

      if (!questsErr && !levelUpsErr) {
        dailyActivity.push({
          date: date.toISOString().split("T")[0],
          questsCompleted: questsCompleted || 0,
          levelUps: levelUps || 0,
        });
      }
    }

    // 주간/월간 활동 통계는 간단히 구현
    const weeklyActivity = [];
    const monthlyActivity = [];

    const stats: AdminCharacterStats = {
      totalCharacters: totalCharacters || 0,
      averageHealthScore: Math.round(averageHealthScore * 10) / 10,
      averageLevel: Math.round(averageLevel * 10) / 10,
      activeQuests: activeQuests || 0,
      healthScoreDistribution,
      levelDistribution: levelDistribution.sort((a, b) => a.level - b.level),
      dailyActivity,
      weeklyActivity,
      monthlyActivity,
    };

    console.log("✅ 캐릭터 통계 조회 완료");
    console.log("📊 통계:", {
      totalCharacters: stats.totalCharacters,
      averageHealthScore: stats.averageHealthScore,
      averageLevel: stats.averageLevel,
    });
    console.groupEnd();

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error("❌ 캐릭터 통계 조회 실패:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

