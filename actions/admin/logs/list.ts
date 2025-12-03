/**
 * @file actions/admin/logs/list.ts
 * @description 관리자 알림 로그 목록 조회 Server Action
 *
 * 주요 기능:
 * 1. notification_logs 테이블에서 로그 조회
 * 2. 타입/상태/날짜 범위/사용자 필터링 지원
 * 3. 페이징 처리
 */

"use server";

import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

// 입력 스키마
const ListLogsSchema = z.object({
  type: z.enum(["kcdc", "diet-popup", "system", "all"]).optional(),
  status: z.enum(["success", "failed", "pending", "all"]).optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

type ListLogsInput = z.infer<typeof ListLogsSchema>;

export interface NotificationLog {
  id: string;
  type: "kcdc" | "diet-popup" | "system";
  status: "success" | "failed" | "pending";
  payload: Record<string, any>;
  triggered_at: string;
  actor: string | null;
  error_message: string | null;
  created_at: string;
}

export interface ListLogsResponse {
  success: true;
  data: NotificationLog[];
  total: number;
  hasMore: boolean;
}

export interface ListLogsError {
  success: false;
  error: string;
}

export type ListLogsResult = ListLogsResponse | ListLogsError;

/**
 * 알림 로그 목록 조회
 */
export async function listLogs(input?: ListLogsInput): Promise<ListLogsResult> {
  try {
    console.group("[AdminConsole][Logs][List]");
    console.log("event", "start");
    console.log("input", input);

    // 입력 검증
    const validatedInput = ListLogsSchema.parse(input || {});
    const { type, status, userId, startDate, endDate, limit, offset } = validatedInput;

    // Supabase 클라이언트 생성 (Service Role - RLS 우회)
    const supabase = getServiceRoleClient();

    // 쿼리 빌드
    let query = supabase
      .from("notification_logs")
      .select("*", { count: "exact" })
      .order("triggered_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // 필터 적용 ("all"은 필터링하지 않음)
    if (type && type !== "all") {
      query = query.eq("type", type);
    }
    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (userId) {
      query = query.eq("actor", userId);
    }
    if (startDate) {
      query = query.gte("triggered_at", startDate);
    }
    if (endDate) {
      query = query.lte("triggered_at", endDate);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("database_error", error);
      console.groupEnd();
      return {
        success: false,
        error: `데이터베이스 오류: ${error.message}`,
      };
    }

    console.log("result_count", data?.length || 0);
    console.log("total_count", count);
    console.groupEnd();

    return {
      success: true,
      data: data || [],
      total: count || 0,
      hasMore: (count || 0) > offset + (data?.length || 0),
    };
  } catch (error) {
    console.error("[AdminConsole][Logs][List] unexpected_error", error);
    console.groupEnd();

    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
    };
  }
}
