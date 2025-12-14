/**
 * @file app/api/health/sync/logs/route.ts
 * @description 건강 데이터 동기화 로그 조회 API
 *
 * 사용자의 건강 데이터 동기화 이력을 조회하는 API 엔드포인트입니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";

interface SyncLogFilters {
  dataSource?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

interface SyncLog {
  id: string;
  data_source_id: string;
  sync_status: string;
  synced_at: string;
  records_synced: number;
  error_message?: string;
  data_source: {
    source_type: string;
    source_name?: string;
  };
}

/**
 * GET /api/health/sync/logs
 * 건강 데이터 동기화 로그 조회
 */
export async function GET(request: NextRequest) {
  console.group("[API] 동기화 로그 조회");

  try {
    // 사용자 인증
    const user = await ensureSupabaseUser();
    if (!user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    console.log(`사용자 ID: ${user.id}`);

    // 프리미엄 체크
    const premiumCheck = await checkPremiumAccess();
    if (!premiumCheck.isPremium) {
      return NextResponse.json(
        { error: "프리미엄 회원만 이용할 수 있는 기능입니다." },
        { status: 403 }
      );
    }

    const supabase = getServiceRoleClient();

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const filters: SyncLogFilters = {
      dataSource: searchParams.get("dataSource") || undefined,
      status: searchParams.get("status") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0,
    };

    // 입력 검증
    if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
      return NextResponse.json(
        { error: "limit은 1에서 100 사이의 값이어야 합니다." },
        { status: 400 }
      );
    }

    if (filters.offset && filters.offset < 0) {
      return NextResponse.json(
        { error: "offset은 0 이상의 값이어야 합니다." },
        { status: 400 }
      );
    }

    // 날짜 형식 검증
    if (filters.startDate && !isValidDateString(filters.startDate)) {
      return NextResponse.json(
        { error: "startDate는 유효한 날짜 형식이어야 합니다 (YYYY-MM-DD)." },
        { status: 400 }
      );
    }

    if (filters.endDate && !isValidDateString(filters.endDate)) {
      return NextResponse.json(
        { error: "endDate는 유효한 날짜 형식이어야 합니다 (YYYY-MM-DD)." },
        { status: 400 }
      );
    }

    // 쿼리 빌드
    let query = supabase
      .from("health_data_sync_logs")
      .select(`
        id,
        data_source_id,
        sync_status,
        synced_at,
        records_synced,
        error_message,
        health_data_sources!inner(
          source_type,
          connection_metadata
        )
      `, { count: "exact" })
      .eq("user_id", user.id)
      .order("synced_at", { ascending: false });

    // 필터 적용
    if (filters.dataSource) {
      query = query.eq("health_data_sources.source_type", filters.dataSource);
    }

    if (filters.status) {
      query = query.eq("sync_status", filters.status);
    }

    if (filters.startDate) {
      query = query.gte("synced_at", `${filters.startDate}T00:00:00.000Z`);
    }

    if (filters.endDate) {
      query = query.lte("synced_at", `${filters.endDate}T23:59:59.999Z`);
    }

    // 페이지네이션 적용
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
    }

    const { data: logs, error, count } = await query;

    if (error) {
      console.error("동기화 로그 조회 실패:", error);
      return NextResponse.json(
        { error: "동기화 로그를 조회하는데 실패했습니다." },
        { status: 500 }
      );
    }

    // 데이터 포맷팅
    const formattedLogs: SyncLog[] = (logs || []).map(log => {
      // health_data_sources는 inner join으로 단일 객체이지만, 타입 추론상 배열로 인식될 수 있음
      const dataSource = Array.isArray(log.health_data_sources) 
        ? log.health_data_sources[0] 
        : log.health_data_sources;
      
      return {
        id: log.id,
        data_source_id: log.data_source_id,
        sync_status: log.sync_status,
        synced_at: log.synced_at,
        records_synced: log.records_synced || 0,
        error_message: log.error_message,
        data_source: {
          source_type: dataSource?.source_type,
          source_name: getDataSourceName(dataSource?.source_type),
        },
      };
    });

    // 통계 정보 계산
    const stats = {
      total: count || 0,
      success: formattedLogs.filter(log => log.sync_status === "success").length,
      failed: formattedLogs.filter(log => log.sync_status === "failed").length,
      byDataSource: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      totalRecordsSynced: formattedLogs.reduce((sum, log) => sum + log.records_synced, 0),
    };

    // 데이터 소스별 통계
    formattedLogs.forEach(log => {
      const source = log.data_source.source_type;
      stats.byDataSource[source] = (stats.byDataSource[source] || 0) + 1;
    });

    // 상태별 통계
    formattedLogs.forEach(log => {
      stats.byStatus[log.sync_status] = (stats.byStatus[log.sync_status] || 0) + 1;
    });

    console.log(`동기화 로그 ${formattedLogs.length}개 조회 성공`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      stats,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: count,
        hasMore: count ? (filters.offset || 0) + (filters.limit || 50) < count : false,
      },
    });

  } catch (error) {
    console.error("동기화 로그 조회 중 오류:", error);
    console.groupEnd();

    return NextResponse.json(
      { error: "동기화 로그 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 데이터 소스 타입을 사용자 친화적인 이름으로 변환
 */
function getDataSourceName(sourceType: string): string {
  const nameMap: Record<string, string> = {
    mydata: "마이데이터",
    health_highway: "건강정보고속도로",
  };

  return nameMap[sourceType] || sourceType;
}

/**
 * 날짜 문자열 유효성 검증 (YYYY-MM-DD 형식)
 */
function isValidDateString(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * POST /api/health/sync/logs/cleanup
 * 오래된 동기화 로그 정리 (관리자용)
 */
export async function POST(request: NextRequest) {
  console.group("[API] 동기화 로그 정리");

  try {
    // 사용자 인증 및 관리자 권한 확인
    const user = await ensureSupabaseUser();
    if (!user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    // 관리자 권한 확인 (실제로는 별도의 권한 체크 로직 필요)
    const supabase = getServiceRoleClient();
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userData || userData.role !== "admin") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { olderThanDays = 90 } = body; // 기본 90일

    if (olderThanDays < 30) {
      return NextResponse.json(
        { error: "30일 미만의 로그는 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // 오래된 로그 삭제
    const { data, error } = await supabase
      .from("health_data_sync_logs")
      .delete()
      .eq("user_id", user.id) // 현재는 자기 로그만 삭제 가능하도록 제한
      .lt("synced_at", cutoffDate.toISOString());

    if (error) {
      console.error("동기화 로그 정리 실패:", error);
      return NextResponse.json(
        { error: "동기화 로그 정리 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    console.log(`${olderThanDays}일 이전 동기화 로그 정리 완료`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: `${olderThanDays}일 이전 동기화 로그가 정리되었습니다.`,
      cutoffDate: cutoffDate.toISOString(),
    });

  } catch (error) {
    console.error("동기화 로그 정리 중 오류:", error);
    console.groupEnd();

    return NextResponse.json(
      { error: "동기화 로그 정리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
