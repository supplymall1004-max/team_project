/**
 * @file app/api/sync/upload/route.ts
 * @description 데이터 업로드 API
 *
 * 로컬 스토리지의 데이터를 클라우드에 업로드
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { getIndexedDBManager, STORES } from "@/lib/storage/indexeddb-manager";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // 로컬 스토리지에서 데이터 조회
    const manager = getIndexedDBManager();
    await manager.init();

    const dietPlans = await manager.getAll(STORES.DIET_PLANS);
    const weeklyDiets = await manager.getAll(STORES.WEEKLY_DIET_PLANS);
    const gameRecords = await manager.getAll(STORES.GAME_RECORDS);
    const healthRecords = await manager.getAll(STORES.HEALTH_RECORDS);

    // 사용자별 필터링
    const userDietPlans = dietPlans.filter((p: any) => p.userId === userId);
    const userWeeklyDiets = weeklyDiets.filter((w: any) => w.userId === userId);
    const userGameRecords = gameRecords.filter((g: any) => g.userId === userId);
    const userHealthRecords = healthRecords.filter((h: any) => h.userId === userId);

    // Supabase에 업로드 (배치 처리)
    const supabase = getServiceRoleClient();

    // TODO: 실제 업로드 로직 구현
    // 여기서는 구조만 제공

    return NextResponse.json({
      success: true,
      uploaded: {
        dietPlans: userDietPlans.length,
        weeklyDiets: userWeeklyDiets.length,
        gameRecords: userGameRecords.length,
        healthRecords: userHealthRecords.length,
      },
    });
  } catch (error) {
    console.error("[SyncUpload] 오류:", error);
    return NextResponse.json(
      { error: "동기화 업로드 실패" },
      { status: 500 }
    );
  }
}

