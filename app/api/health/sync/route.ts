/**
 * @file app/api/health/sync/route.ts
 * @description 건강 데이터 수동 동기화 API
 *
 * 사용자가 수동으로 건강 데이터 동기화를 실행하는 API 엔드포인트입니다.
 * 마이데이터 및 건강정보고속도로에서 최신 데이터를 가져와 동기화합니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import { syncHealthData } from "@/lib/health/health-data-sync-service";

interface SyncRequest {
  dataSources?: string[]; // 동기화할 데이터 소스 (mydata, health_highway)
  forceSync?: boolean; // 강제 동기화 여부 (캐시 무시)
  familyMemberId?: string; // 특정 가족 구성원만 동기화
}

interface SyncResult {
  success: boolean;
  syncId: string;
  dataSources: {
    source: string;
    status: "success" | "failed" | "skipped";
    message: string;
    recordsSynced?: number;
    error?: string;
  }[];
  totalRecordsSynced: number;
  duration: number;
  nextSyncAvailable: Date;
}

/**
 * POST /api/health/sync
 * 건강 데이터 수동 동기화 실행
 */
export async function POST(request: NextRequest) {
  console.group("[API] 건강 데이터 수동 동기화");

  const startTime = Date.now();
  const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // 사용자 인증
    const user = await ensureSupabaseUser();
    if (!user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    console.log(`사용자 ID: ${user.id}, 동기화 ID: ${syncId}`);

    // 프리미엄 체크 (건강 데이터 동기화는 프리미엄 기능)
    const premiumCheck = await checkPremiumAccess();
    if (!premiumCheck.isPremium) {
      return NextResponse.json(
        { error: "프리미엄 회원만 이용할 수 있는 기능입니다." },
        { status: 403 }
      );
    }

    const body: SyncRequest = await request.json();
    const {
      dataSources = ["mydata", "health_highway"],
      forceSync = false,
      familyMemberId
    } = body;

    // 입력 검증
    const validDataSources = ["mydata", "health_highway"];
    const invalidSources = dataSources.filter(source => !validDataSources.includes(source));
    if (invalidSources.length > 0) {
      return NextResponse.json(
        { error: `유효하지 않은 데이터 소스: ${invalidSources.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // 최근 동기화 확인 (1시간 이내 재동기화 방지)
    if (!forceSync) {
      const { data: recentSync } = await supabase
        .from("health_data_sync_logs")
        .select("synced_at")
        .eq("user_id", user.id)
        .eq("sync_status", "success")
        .gte("synced_at", new Date(Date.now() - 60 * 60 * 1000).toISOString()) // 1시간 이내
        .order("synced_at", { ascending: false })
        .limit(1)
        .single();

      if (recentSync) {
        const timeDiff = Date.now() - new Date(recentSync.synced_at).getTime();
        const minutesLeft = Math.ceil((60 * 60 * 1000 - timeDiff) / (60 * 1000));

        return NextResponse.json(
          {
            error: `최근 동기화 후 ${minutesLeft}분 뒤에 다시 시도할 수 있습니다.`,
            nextSyncAvailable: new Date(Date.now() + (60 * 60 * 1000 - timeDiff)),
          },
          { status: 429 }
        );
      }
    }

    const syncResults: SyncResult["dataSources"] = [];
    let totalRecordsSynced = 0;

    // 각 데이터 소스별 동기화 실행
    for (const source of dataSources) {
      console.log(`${source} 데이터 소스 동기화 시작`);

      try {
        // 데이터 소스 연결 상태 확인
        const { data: dataSource } = await supabase
          .from("health_data_sources")
          .select("*")
          .eq("user_id", user.id)
          .eq("source_type", source)
          .eq("connection_status", "connected")
          .single();

        if (!dataSource) {
          syncResults.push({
            source,
            status: "skipped",
            message: `${source} 데이터 소스가 연결되어 있지 않습니다.`,
          });
          continue;
        }

        // 동기화 실행
        const syncResult = await syncHealthData({
          userId: user.id,
          dataSourceId: dataSource.id,
          syncType: "full",
          familyMemberId,
        });

        if (syncResult.success) {
          const recordsCount = syncResult.hospitalRecordsCount + syncResult.medicationRecordsCount +
                              syncResult.diseaseRecordsCount + syncResult.checkupRecordsCount;

          syncResults.push({
            source,
            status: "success",
            message: `${source} 데이터 동기화가 완료되었습니다.`,
            recordsSynced: recordsCount,
          });

          totalRecordsSynced += recordsCount;
        } else {
          syncResults.push({
            source,
            status: "failed",
            message: `${source} 동기화 실패`,
            error: syncResult.error,
          });
        }

      } catch (error) {
        console.error(`${source} 동기화 중 오류:`, error);
        syncResults.push({
          source,
          status: "failed",
          message: `${source} 동기화 중 오류가 발생했습니다.`,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        });
      }
    }

    const duration = Date.now() - startTime;
    const nextSyncAvailable = new Date(Date.now() + 60 * 60 * 1000); // 1시간 후

    const result: SyncResult = {
      success: syncResults.some(r => r.status === "success"),
      syncId,
      dataSources: syncResults,
      totalRecordsSynced,
      duration,
      nextSyncAvailable,
    };

    console.log(`동기화 완료: ${totalRecordsSynced}개 레코드 동기화, 소요시간: ${duration}ms`);
    console.groupEnd();

    return NextResponse.json(result);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("건강 데이터 동기화 중 오류:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        success: false,
        syncId,
        dataSources: [],
        totalRecordsSynced: 0,
        duration,
        nextSyncAvailable: new Date(Date.now() + 60 * 60 * 1000),
        error: "건강 데이터 동기화 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/health/sync/status
 * 현재 동기화 상태 조회
 */
export async function GET(request: NextRequest) {
  console.group("[API] 동기화 상태 조회");

  try {
    // 사용자 인증
    const user = await ensureSupabaseUser();
    if (!user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const supabase = getServiceRoleClient();

    // 최근 동기화 로그 조회
    const { data: recentSync, error: syncError } = await supabase
      .from("health_data_sync_logs")
      .select(`
        id,
        data_source_id,
        sync_status,
        synced_at,
        records_synced,
        error_message,
        health_data_sources(source_type)
      `)
      .eq("user_id", user.id)
      .order("synced_at", { ascending: false })
      .limit(5);

    if (syncError) {
      console.error("동기화 로그 조회 실패:", syncError);
    }

    // 다음 동기화 가능 시간 계산
    const lastSuccessfulSync = recentSync?.find(log => log.sync_status === "success");
    const nextSyncAvailable = lastSuccessfulSync
      ? new Date(new Date(lastSuccessfulSync.synced_at).getTime() + 60 * 60 * 1000) // 1시간 후
      : new Date(); // 즉시 가능

    // 동기화 상태 요약
    const statusSummary = {
      lastSync: lastSuccessfulSync?.synced_at || null,
      nextSyncAvailable,
      canSyncNow: nextSyncAvailable <= new Date(),
      recentSyncs: recentSync || [],
      dataSources: {
        mydata: {
          connected: false,
          lastSync: null,
        },
        health_highway: {
          connected: false,
          lastSync: null,
        },
      },
    };

    // 데이터 소스 연결 상태 및 마지막 동기화 시간 조회
    const { data: dataSources } = await supabase
      .from("health_data_sources")
      .select("source_type, connection_status, last_synced_at")
      .eq("user_id", user.id);

    if (dataSources) {
      dataSources.forEach(ds => {
        if (ds.source_type === "mydata" || ds.source_type === "health_highway") {
          statusSummary.dataSources[ds.source_type] = {
            connected: ds.connection_status === "connected",
            lastSync: ds.last_synced_at,
          };
        }
      });
    }

    console.log("동기화 상태 조회 성공");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      status: statusSummary,
    });

  } catch (error) {
    console.error("동기화 상태 조회 중 오류:", error);
    console.groupEnd();

    return NextResponse.json(
      { error: "동기화 상태 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
