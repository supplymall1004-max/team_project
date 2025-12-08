/**
 * @file actions/popups/get-active-popups.ts
 * @description 현재 활성화된 팝업 조회 Server Action
 *
 * 주요 기능:
 * 1. 현재 시간 기준 활성화된 팝업만 조회
 * 2. published 상태만 조회
 * 3. 우선순위 높은 순으로 정렬
 */

"use server";

import { supabase } from "@/lib/supabase/client";

export interface ActivePopup {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  link_url: string | null;
  priority: number;
  display_type: "modal" | "checkpoint";
}

export interface GetActivePopupsResponse {
  success: true;
  data: ActivePopup[];
}

export interface GetActivePopupsError {
  success: false;
  error: string;
}

export type GetActivePopupsResult =
  | GetActivePopupsResponse
  | GetActivePopupsError;

/**
 * 현재 활성화된 팝업 조회
 */
export async function getActivePopups(): Promise<GetActivePopupsResult> {
  try {
    console.group("[Popups][GetActive]");
    console.log("event", "start");

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("popup_announcements")
      .select(
        `
        id,
        title,
        body,
        image_url,
        link_url,
        priority,
        display_type
        `
      )
      .eq("status", "published")
      .lte("active_from", now)
      .or(`active_until.is.null,active_until.gte.${now}`)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("query_error", error);
      console.groupEnd();
      return {
        success: false,
        error: `팝업 조회 오류: ${error.message}`,
      };
    }

    console.log("active_popups_count", data?.length || 0);
    console.groupEnd();

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error("[Popups][GetActive] unexpected_error", error);
    console.groupEnd();

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
    };
  }
}

