/**
 * @file app/api/sync/download/route.ts
 * @description 데이터 다운로드 API
 *
 * 클라우드의 데이터를 로컬 스토리지로 다운로드
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

    // Supabase에서 데이터 조회
    const supabase = getServiceRoleClient();

    // TODO: 실제 다운로드 로직 구현
    // 여기서는 구조만 제공

    const manager = getIndexedDBManager();
    await manager.init();

    return NextResponse.json({
      success: true,
      downloaded: {
        dietPlans: 0,
        weeklyDiets: 0,
        gameRecords: 0,
        healthRecords: 0,
      },
    });
  } catch (error) {
    console.error("[SyncDownload] 오류:", error);
    return NextResponse.json(
      { error: "동기화 다운로드 실패" },
      { status: 500 }
    );
  }
}

