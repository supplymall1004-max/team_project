/**
 * @file actions/admin/copy/history.ts
 * @description 관리자 페이지 문구 블록 버전 히스토리 조회 Server Action
 *
 * 주요 기능:
 * 1. 특정 문구 블록의 버전 히스토리 조회
 * 2. 최근 5개 버전까지 조회 (최적화를 위해)
 * 3. 버전 간 diff 계산을 위한 이전 버전 데이터 제공
 */

"use server";

import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

// 입력 스키마
const GetCopyBlockHistorySchema = z.object({
  slug: z.string().min(1),
  locale: z.string().default("ko"),
});

type GetCopyBlockHistoryInput = z.infer<typeof GetCopyBlockHistorySchema>;

export interface CopyBlockVersion {
  id: string;
  slug: string;
  locale: string;
  content: Record<string, any>;
  version: number;
  updated_by: string;
  updated_at: string;
  created_at: string;
}

export interface GetCopyBlockHistoryResponse {
  success: true;
  data: CopyBlockVersion[];
  total: number;
  currentVersion: number;
}

export interface GetCopyBlockHistoryError {
  success: false;
  error: string;
}

export type GetCopyBlockHistoryResult = GetCopyBlockHistoryResponse | GetCopyBlockHistoryError;

/**
 * 페이지 문구 블록 버전 히스토리 조회
 */
export async function getCopyBlockHistory(input: GetCopyBlockHistoryInput): Promise<GetCopyBlockHistoryResult> {
  try {
    console.group("[AdminConsole][Copy][History]");
    console.log("event", "start");
    console.log("slug", input.slug);
    console.log("locale", input.locale);

    // 입력 검증
    const validatedInput = GetCopyBlockHistorySchema.parse(input);
    const { slug, locale } = validatedInput;

    // Supabase 클라이언트 생성 (Clerk 인증 사용)
    const supabase = getServiceRoleClient();

    // 현재 버전 조회
    const { data: currentData, error: currentError } = await supabase
      .from("admin_copy_blocks")
      .select("version")
      .eq("slug", slug)
      .eq("locale", locale)
      .single();

    if (currentError) {
      console.error("current_version_error", currentError);
      console.groupEnd();
      return {
        success: false,
        error: `현재 버전 조회 오류: ${currentError.message}`,
      };
    }

    // 버전 히스토리 조회 (최근 5개로 제한)
    const { data, error } = await supabase
      .from("admin_copy_blocks")
      .select("*")
      .eq("slug", slug)
      .eq("locale", locale)
      .order("version", { ascending: false })
      .limit(5);

    if (error) {
      console.error("history_error", error);
      console.groupEnd();
      return {
        success: false,
        error: `히스토리 조회 오류: ${error.message}`,
      };
    }

    console.log("history_count", data?.length || 0);
    console.log("current_version", currentData.version);
    console.groupEnd();

    return {
      success: true,
      data: data || [],
      total: data?.length || 0,
      currentVersion: currentData.version,
    };
  } catch (error) {
    console.error("[AdminConsole][Copy][History] unexpected_error", error);
    console.groupEnd();

    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
    };
  }
}

/**
 * 버전 간 diff 계산 헬퍼 함수
 */
export async function calculateContentDiff(oldContent: Record<string, any>, newContent: Record<string, any>) {
  const changes: Array<{
    key: string;
    type: 'added' | 'removed' | 'modified';
    oldValue?: any;
    newValue?: any;
  }> = [];

  // 모든 키를 Set으로 모음
  const allKeys = new Set([...Object.keys(oldContent), ...Object.keys(newContent)]);

  for (const key of allKeys) {
    const oldValue = oldContent[key];
    const newValue = newContent[key];

    if (!(key in oldContent)) {
      // 새로 추가된 키
      changes.push({
        key,
        type: 'added',
        newValue,
      });
    } else if (!(key in newContent)) {
      // 제거된 키
      changes.push({
        key,
        type: 'removed',
        oldValue,
      });
    } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      // 수정된 키
      changes.push({
        key,
        type: 'modified',
        oldValue,
        newValue,
      });
    }
  }

  return changes;
}
