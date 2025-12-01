/**
 * @file actions/admin/copy/upsert.ts
 * @description 관리자 페이지 문구 블록 생성/수정 Server Action
 *
 * 주요 기능:
 * 1. 새 문구 블록 생성 또는 기존 블록 업데이트
 * 2. 버전 관리 (업데이트 시 version 자동 증가)
 * 3. Clerk 사용자 정보로 updated_by 설정
 */

"use server";

import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { revalidateTag } from "next/cache";

// 입력 스키마
const UpsertCopyBlockSchema = z.object({
  id: z.string().uuid().optional(), // 없으면 새로 생성
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  locale: z.string().default("ko"),
  content: z.record(z.any()).refine(
    (content) => {
      try {
        JSON.stringify(content);
        return true;
      } catch {
        return false;
      }
    },
    { message: "content는 유효한 JSON 객체여야 합니다" }
  ),
});

type UpsertCopyBlockInput = z.infer<typeof UpsertCopyBlockSchema>;

export interface UpsertCopyBlockResponse {
  success: true;
  data: {
    id: string;
    slug: string;
    locale: string;
    content: Record<string, any>;
    version: number;
    updated_by: string;
    updated_at: string;
    created_at: string;
  };
  isNew: boolean;
}

export interface UpsertCopyBlockError {
  success: false;
  error: string;
}

export type UpsertCopyBlockResult = UpsertCopyBlockResponse | UpsertCopyBlockError;

/**
 * 페이지 문구 블록 생성 또는 업데이트
 */
export async function upsertCopyBlock(input: UpsertCopyBlockInput): Promise<UpsertCopyBlockResult> {
  try {
    console.group("[AdminConsole][Copy][Upsert]");
    console.log("event", "start");
    console.log("input_slug", input.slug);
    console.log("input_locale", input.locale);
    console.log("has_id", !!input.id);

    // Clerk 사용자 정보 확인
    const clerkUser = await currentUser();
    if (!clerkUser) {
      console.error("auth_error", "사용자를 찾을 수 없습니다");
      console.groupEnd();
      return {
        success: false,
        error: "인증되지 않은 사용자입니다",
      };
    }

    // 입력 검증
    const validatedInput = UpsertCopyBlockSchema.parse(input);
    const { id, slug, locale, content } = validatedInput;

    // Supabase 클라이언트 생성 (Service Role - RLS 우회)
    const supabase = getServiceRoleClient();

    // 기존 데이터 확인 (업데이트인 경우)
    let existingData = null;
    if (id) {
      const { data, error } = await supabase
        .from("admin_copy_blocks")
        .select("version")
        .eq("id", id)
        .single();

      if (error && error.code !== "PGRST116") { // PGRST116 = not found
        console.error("fetch_existing_error", error);
        console.groupEnd();
        return {
          success: false,
          error: `기존 데이터 조회 오류: ${error.message}`,
        };
      }

      existingData = data;
    }

    // upsert 수행
    const upsertData = {
      slug,
      locale,
      content,
      updated_by: clerkUser.id,
      ...(existingData ? { version: existingData.version + 1 } : { version: 1 }),
      ...(id ? { id } : {}), // 업데이트인 경우 id 포함
    };

    const { data, error } = await supabase
      .from("admin_copy_blocks")
      .upsert(upsertData, {
        onConflict: "slug,locale",
      })
      .select("*")
      .single();

    if (error) {
      console.error("upsert_error", error);
      console.groupEnd();
      return {
        success: false,
        error: `저장 오류: ${error.message}`,
      };
    }

    // 캐시 무효화
    revalidateTag("admin-copy-blocks");

    console.log("result_id", data.id);
    console.log("result_version", data.version);
    console.log("is_new", !existingData);
    console.groupEnd();

    return {
      success: true,
      data: {
        id: data.id,
        slug: data.slug,
        locale: data.locale,
        content: data.content,
        version: data.version,
        updated_by: data.updated_by,
        updated_at: data.updated_at,
        created_at: data.created_at,
      },
      isNew: !existingData,
    };
  } catch (error) {
    console.error("[AdminConsole][Copy][Upsert] unexpected_error", error);
    console.groupEnd();

    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
    };
  }
}
