/**
 * @file actions/settings/api-keys.ts
 * @description API 키 관리 Server Actions
 *
 * 주요 기능:
 * 1. 사용자 API 키 조회
 * 2. API 키 저장/수정
 * 3. API 키 삭제
 * 4. API 키 상태 토글
 *
 * 참고: 타입과 상수는 types/api-keys.ts에서 import합니다.
 */

"use server";

import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { API_TYPES, type ApiKey, type GetApiKeysResponse, type SaveApiKeyResponse, type DeleteApiKeyResponse, type ToggleApiKeyStatusResponse } from "@/types/api-keys";

// 입력 스키마
const SaveApiKeySchema = z.object({
  api_type: z.enum(API_TYPES),
  api_key: z.string().min(1, "API 키를 입력해주세요"),
  metadata: z.record(z.any()).optional(),
});

const DeleteApiKeySchema = z.object({
  api_type: z.enum(API_TYPES),
});

const ToggleApiKeyStatusSchema = z.object({
  api_type: z.enum(API_TYPES),
  status: z.enum(["active", "inactive"]),
});

type SaveApiKeyInput = z.infer<typeof SaveApiKeySchema>;
type DeleteApiKeyInput = z.infer<typeof DeleteApiKeySchema>;
type ToggleApiKeyStatusInput = z.infer<typeof ToggleApiKeyStatusSchema>;

/**
 * 사용자의 모든 API 키 조회
 */
export async function getApiKeys(): Promise<GetApiKeysResponse> {
  console.group("[getApiKeys] API 키 조회 시작");

  try {
    const user = await currentUser();
    if (!user) {
      console.error("❌ 인증되지 않은 사용자");
      console.groupEnd();
      throw new Error("인증이 필요합니다.");
    }

    // 사용자 동기화 확인 (없으면 자동으로 동기화)
    const supabaseUser = await ensureSupabaseUser();
    if (!supabaseUser) {
      console.error("❌ 사용자 동기화 실패");
      console.groupEnd();
      throw new Error("사용자 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.");
    }

    const supabase = await createClerkSupabaseClient();

    // API 키 조회
    console.log("🔍 API 키 조회 시도:", { user_id: supabaseUser.id });
    const { data, error } = await supabase
      .from("user_api_keys")
      .select("*")
      .eq("user_id", supabaseUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ API 키 조회 실패:");
      console.error("  - 에러 코드:", error.code);
      console.error("  - 에러 메시지:", error.message);
      console.error("  - 에러 상세:", error.details);
      console.error("  - 에러 힌트:", error.hint);
      console.error("  - 전체 에러 객체:", JSON.stringify(error, null, 2));
      console.groupEnd();
      throw new Error(`API 키를 조회하는 중 오류가 발생했습니다: ${error.message || "알 수 없는 오류"}`);
    }

    console.log(`✅ API 키 조회 완료: ${data?.length || 0}개`);
    console.groupEnd();

    return {
      success: true,
      data: (data || []) as ApiKey[],
    };
  } catch (error) {
    console.error("❌ 예상치 못한 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * API 키 저장/수정
 */
export async function saveApiKey(
  input: SaveApiKeyInput
): Promise<SaveApiKeyResponse> {
  console.group("[saveApiKey] API 키 저장 시작");
  console.log("📝 입력:", { api_type: input.api_type, has_key: !!input.api_key });

  try {
    const user = await currentUser();
    if (!user) {
      console.error("❌ 인증되지 않은 사용자");
      console.groupEnd();
      throw new Error("인증이 필요합니다.");
    }

    // 입력 검증
    const validated = SaveApiKeySchema.parse(input);

    // 사용자 동기화 확인 (없으면 자동으로 동기화)
    const supabaseUser = await ensureSupabaseUser();
    if (!supabaseUser) {
      console.error("❌ 사용자 동기화 실패");
      console.groupEnd();
      throw new Error("사용자 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.");
    }

    const supabase = await createClerkSupabaseClient();

    // 기존 키 확인
    const { data: existing, error: checkError } = await supabase
      .from("user_api_keys")
      .select("id")
      .eq("user_id", supabaseUser.id)
      .eq("api_type", validated.api_type)
      .maybeSingle();

    if (checkError) {
      console.error("❌ 기존 키 확인 실패:", checkError);
      console.error("  - 에러 코드:", checkError.code);
      console.error("  - 에러 메시지:", checkError.message);
      console.groupEnd();
      throw new Error("기존 API 키를 확인하는 중 오류가 발생했습니다.");
    }

    let result;
    if (existing) {
      // 업데이트
      console.log("🔄 기존 키 업데이트");
      const { data, error } = await supabase
        .from("user_api_keys")
        .update({
          api_key: validated.api_key,
          metadata: validated.metadata || {},
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        console.error("❌ API 키 업데이트 실패:");
        console.error("  - 에러 코드:", error.code);
        console.error("  - 에러 메시지:", error.message);
        console.error("  - 에러 상세:", error.details);
        console.error("  - 에러 힌트:", error.hint);
        console.groupEnd();
        throw new Error(`API 키를 업데이트하는 중 오류가 발생했습니다: ${error.message || "알 수 없는 오류"}`);
      }

      result = data;
    } else {
      // 새로 생성
      console.log("✨ 새 키 생성");
      const { data, error } = await supabase
        .from("user_api_keys")
        .insert({
          user_id: supabaseUser.id,
          api_type: validated.api_type,
          api_key: validated.api_key,
          metadata: validated.metadata || {},
          status: "active",
        })
        .select()
        .single();

      if (error) {
        console.error("❌ API 키 생성 실패:");
        console.error("  - 에러 코드:", error.code);
        console.error("  - 에러 메시지:", error.message);
        console.error("  - 에러 상세:", error.details);
        console.error("  - 에러 힌트:", error.hint);
        console.groupEnd();
        throw new Error(`API 키를 저장하는 중 오류가 발생했습니다: ${error.message || "알 수 없는 오류"}`);
      }

      result = data;
    }

    console.log("✅ API 키 저장 완료");
    console.groupEnd();

    return {
      success: true,
      data: result as ApiKey,
    };
  } catch (error) {
    console.error("❌ 예상치 못한 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * API 키 삭제
 */
export async function deleteApiKey(
  input: DeleteApiKeyInput
): Promise<DeleteApiKeyResponse> {
  console.group("[deleteApiKey] API 키 삭제 시작");
  console.log("📝 입력:", input);

  try {
    const user = await currentUser();
    if (!user) {
      console.error("❌ 인증되지 않은 사용자");
      console.groupEnd();
      throw new Error("인증이 필요합니다.");
    }

    // 입력 검증
    const validated = DeleteApiKeySchema.parse(input);

    // 사용자 동기화 확인 (없으면 자동으로 동기화)
    const supabaseUser = await ensureSupabaseUser();
    if (!supabaseUser) {
      console.error("❌ 사용자 동기화 실패");
      console.groupEnd();
      throw new Error("사용자 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.");
    }

    const supabase = await createClerkSupabaseClient();

    // API 키 삭제
    const { error } = await supabase
      .from("user_api_keys")
      .delete()
      .eq("user_id", supabaseUser.id)
      .eq("api_type", validated.api_type);

    if (error) {
      console.error("❌ API 키 삭제 실패:");
      console.error("  - 에러 코드:", error.code);
      console.error("  - 에러 메시지:", error.message);
      console.error("  - 에러 상세:", error.details);
      console.error("  - 에러 힌트:", error.hint);
      console.groupEnd();
      throw new Error(`API 키를 삭제하는 중 오류가 발생했습니다: ${error.message || "알 수 없는 오류"}`);
    }

    console.log("✅ API 키 삭제 완료");
    console.groupEnd();

    return {
      success: true,
    };
  } catch (error) {
    console.error("❌ 예상치 못한 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * API 키 상태 토글 (활성/비활성)
 */
export async function toggleApiKeyStatus(
  input: ToggleApiKeyStatusInput
): Promise<ToggleApiKeyStatusResponse> {
  console.group("[toggleApiKeyStatus] API 키 상태 변경 시작");
  console.log("📝 입력:", input);

  try {
    const user = await currentUser();
    if (!user) {
      console.error("❌ 인증되지 않은 사용자");
      console.groupEnd();
      throw new Error("인증이 필요합니다.");
    }

    // 입력 검증
    const validated = ToggleApiKeyStatusSchema.parse(input);

    // 사용자 동기화 확인 (없으면 자동으로 동기화)
    const supabaseUser = await ensureSupabaseUser();
    if (!supabaseUser) {
      console.error("❌ 사용자 동기화 실패");
      console.groupEnd();
      throw new Error("사용자 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.");
    }

    const supabase = await createClerkSupabaseClient();

    // API 키 상태 업데이트
    const { data, error } = await supabase
      .from("user_api_keys")
      .update({
        status: validated.status,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", supabaseUser.id)
      .eq("api_type", validated.api_type)
      .select()
      .single();

    if (error) {
      console.error("❌ API 키 상태 변경 실패:");
      console.error("  - 에러 코드:", error.code);
      console.error("  - 에러 메시지:", error.message);
      console.error("  - 에러 상세:", error.details);
      console.error("  - 에러 힌트:", error.hint);
      console.groupEnd();
      throw new Error(`API 키 상태를 변경하는 중 오류가 발생했습니다: ${error.message || "알 수 없는 오류"}`);
    }

    console.log("✅ API 키 상태 변경 완료");
    console.groupEnd();

    return {
      success: true,
      data: data as ApiKey,
    };
  } catch (error) {
    console.error("❌ 예상치 못한 오류:", error);
    console.groupEnd();
    throw error;
  }
}

