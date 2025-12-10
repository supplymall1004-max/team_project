/**
 * @file supabase/functions/sync-health-data/index.ts
 * @description 건강 데이터 자동 동기화 Supabase Edge Function
 *
 * 매일 새벽 2시에 실행되어 연결된 모든 사용자의 건강 데이터를 자동으로 동기화합니다.
 * 크론 작업으로 설정하여 정기적으로 실행됩니다.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { HealthDataSyncService } from "../../../lib/health/health-data-sync-service.ts";

interface SyncTarget {
  user_id: string;
  data_sources: Array<{
    id: string;
    source_type: string;
    connection_status: string;
  }>;
}

serve(async (req) => {
  console.log("[Edge Function] 건강 데이터 자동 동기화 시작");

  try {
    // Supabase 클라이언트 초기화
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const syncService = new HealthDataSyncService();
    const results = {
      totalUsers: 0,
      syncedUsers: 0,
      failedUsers: 0,
      totalRecordsSynced: 0,
      errors: [] as string[],
      startTime: new Date().toISOString(),
      endTime: "",
      duration: 0,
    };

    // 프리미엄 사용자 중 데이터 소스가 연결된 사용자 조회
    const { data: syncTargets, error: targetError } = await supabase
      .rpc("get_sync_targets");

    if (targetError) {
      console.error("동기화 대상 조회 실패:", targetError);
      // RPC 함수가 없으면 직접 조회
      const { data: premiumUsers, error: userError } = await supabase
        .from("user_subscriptions")
        .select(`
          user_id,
          subscription_plans(is_premium)
        `)
        .eq("subscription_plans.is_premium", true)
        .eq("status", "active");

      if (userError) {
        throw new Error(`프리미엄 사용자 조회 실패: ${userError.message}`);
      }

      if (!premiumUsers || premiumUsers.length === 0) {
        console.log("동기화할 프리미엄 사용자가 없습니다.");
        return new Response(
          JSON.stringify({
            success: true,
            message: "동기화할 프리미엄 사용자가 없습니다.",
            results,
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      // 각 사용자별 데이터 소스 조회
      const targets: SyncTarget[] = [];
      for (const user of premiumUsers) {
        const { data: dataSources, error: dsError } = await supabase
          .from("health_data_sources")
          .select("id, source_type, connection_status")
          .eq("user_id", user.user_id)
          .eq("connection_status", "connected");

        if (!dsError && dataSources && dataSources.length > 0) {
          targets.push({
            user_id: user.user_id,
            data_sources: dataSources,
          });
        }
      }

      syncTargets = targets;
    }

    if (!syncTargets || syncTargets.length === 0) {
      console.log("동기화할 대상이 없습니다.");
      return new Response(
        JSON.stringify({
          success: true,
          message: "동기화할 대상이 없습니다.",
          results,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    results.totalUsers = syncTargets.length;
    console.log(`${results.totalUsers}명의 사용자 동기화 시작`);

    // 각 사용자별 동기화 실행
    for (const target of syncTargets) {
      try {
        console.log(`사용자 ${target.user_id} 동기화 시작`);

        let userRecordsSynced = 0;
        let userSyncSuccess = false;

        // 각 데이터 소스별 동기화
        for (const dataSource of target.data_sources) {
          try {
            console.log(`  - ${dataSource.source_type} 동기화 시작`);

            let syncResult;
            switch (dataSource.source_type) {
              case "mydata":
                syncResult = await syncService.syncMyData(target.user_id);
                break;
              case "health_highway":
                syncResult = await syncService.syncHealthHighway(target.user_id);
                break;
              default:
                console.log(`  - 지원되지 않는 데이터 소스: ${dataSource.source_type}`);
                continue;
            }

            if (syncResult.success) {
              const recordsCount = syncResult.hospitalRecords + syncResult.medicationRecords +
                                  syncResult.diseaseRecords + syncResult.checkupRecords;
              userRecordsSynced += recordsCount;
              userSyncSuccess = true;
              console.log(`  - ${dataSource.source_type} 동기화 성공: ${recordsCount}개 레코드`);
            } else {
              console.error(`  - ${dataSource.source_type} 동기화 실패:`, syncResult.error);
              results.errors.push(`${target.user_id} - ${dataSource.source_type}: ${syncResult.error}`);
            }

          } catch (error) {
            const errorMessage = `${target.user_id} - ${dataSource.source_type}: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
            console.error(`데이터 소스 동기화 중 오류:`, errorMessage);
            results.errors.push(errorMessage);
          }
        }

        if (userSyncSuccess) {
          results.syncedUsers++;
          results.totalRecordsSynced += userRecordsSynced;
          console.log(`사용자 ${target.user_id} 동기화 완료: ${userRecordsSynced}개 레코드`);
        } else {
          results.failedUsers++;
          console.log(`사용자 ${target.user_id} 동기화 실패`);
        }

        // 동기화 간격을 두어 API 제한을 피함
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        const errorMessage = `사용자 ${target.user_id} 동기화 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
        console.error(errorMessage);
        results.errors.push(errorMessage);
        results.failedUsers++;
      }
    }

    results.endTime = new Date().toISOString();
    results.duration = new Date(results.endTime).getTime() - new Date(results.startTime).getTime();

    console.log(`[Edge Function] 건강 데이터 자동 동기화 완료:`);
    console.log(`  - 총 사용자: ${results.totalUsers}`);
    console.log(`  - 동기화 성공: ${results.syncedUsers}`);
    console.log(`  - 동기화 실패: ${results.failedUsers}`);
    console.log(`  - 총 동기화 레코드: ${results.totalRecordsSynced}`);
    console.log(`  - 소요 시간: ${Math.round(results.duration / 1000)}초`);
    console.log(`  - 오류 수: ${results.errors.length}`);

    // 성공/실패 통계 저장
    await supabase
      .from("system_sync_logs")
      .insert({
        sync_type: "health_data_auto",
        total_targets: results.totalUsers,
        success_count: results.syncedUsers,
        failure_count: results.failedUsers,
        records_processed: results.totalRecordsSynced,
        duration_ms: results.duration,
        errors: results.errors,
        executed_at: results.startTime,
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: "건강 데이터 자동 동기화가 완료되었습니다.",
        results,
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Edge Function] 건강 데이터 자동 동기화 중 오류:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

/**
 * 동기화 대상 조회를 위한 RPC 함수 정의
 * (실제로는 Supabase에서 SQL로 생성해야 함)
 */
const RPC_FUNCTION_SQL = `
CREATE OR REPLACE FUNCTION get_sync_targets()
RETURNS TABLE (
  user_id UUID,
  data_sources JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id as user_id,
    jsonb_agg(
      jsonb_build_object(
        'id', hds.id,
        'source_type', hds.source_type,
        'connection_status', hds.connection_status
      )
    ) as data_sources
  FROM users u
  INNER JOIN user_subscriptions us ON u.id = us.user_id
  INNER JOIN subscription_plans sp ON us.plan_id = sp.id
  INNER JOIN health_data_sources hds ON u.id = hds.user_id
  WHERE sp.is_premium = true
    AND us.status = 'active'
    AND hds.connection_status = 'connected'
    AND hds.last_synced_at < NOW() - INTERVAL '24 hours'  -- 마지막 동기화 후 24시간 지남
  GROUP BY u.id;
END;
$$;
`;

