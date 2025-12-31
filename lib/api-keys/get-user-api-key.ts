/**
 * @file lib/api-keys/get-user-api-key.ts
 * @description 사용자 API 키 조회 유틸리티
 *
 * 하이브리드 방식: 사용자 API 키 우선, 없으면 서버 환경 변수 사용
 */

import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type { ApiType } from "@/types/api-keys";

/**
 * 사용자 API 키 조회 (하이브리드 방식)
 *
 * @param apiType API 타입
 * @returns 사용자 API 키 정보 또는 null
 */
export async function getUserApiKey(apiType: ApiType): Promise<{
  api_key: string;
  metadata?: Record<string, any>;
} | null> {
  try {
    const { userId } = await auth();
    if (!userId) {
      // 인증되지 않은 사용자는 null 반환 (환경 변수 사용)
      return null;
    }

    const supabase = await createClerkSupabaseClient();

    // 사용자 ID 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !userData) {
      console.log("[getUserApiKey] 사용자 조회 실패, 환경 변수 사용");
      return null;
    }

    // 활성화된 API 키 조회
    const { data, error } = await supabase
      .from("user_api_keys")
      .select("api_key, metadata, status")
      .eq("user_id", userData.id)
      .eq("api_type", apiType)
      .eq("status", "active")
      .single();

    if (error || !data) {
      console.log(`[getUserApiKey] 사용자 API 키 없음 (${apiType}), 환경 변수 사용`);
      return null;
    }

    console.log(`[getUserApiKey] 사용자 API 키 사용 (${apiType})`);
    return {
      api_key: data.api_key,
      metadata: data.metadata || {},
    };
  } catch (error) {
    console.error("[getUserApiKey] 오류:", error);
    return null;
  }
}

/**
 * 하이브리드 API 키 조회 (사용자 키 우선, 없으면 환경 변수)
 *
 * @param apiType API 타입
 * @param envKey 환경 변수 키 이름
 * @returns API 키 값
 */
export async function getHybridApiKey(
  apiType: ApiType,
  envKey: string
): Promise<string | null> {
  const userKey = await getUserApiKey(apiType);
  if (userKey?.api_key) {
    return userKey.api_key;
  }

  // 환경 변수에서 조회
  const envKeyValue = process.env[envKey];
  return envKeyValue?.trim() || null;
}

/**
 * 하이브리드 Client ID/Secret 조회 (네이버 API용)
 *
 * @param apiType API 타입
 * @param envClientIdKey 환경 변수 Client ID 키
 * @param envClientSecretKey 환경 변수 Client Secret 키
 * @returns Client ID와 Secret
 */
export async function getHybridNaverCredentials(
  apiType: ApiType,
  envClientIdKey: string,
  envClientSecretKey: string
): Promise<{ clientId: string | null; clientSecret: string | null }> {
  const userKey = await getUserApiKey(apiType);
  
  if (userKey?.metadata?.client_id && userKey?.metadata?.client_secret) {
    return {
      clientId: userKey.metadata.client_id,
      clientSecret: userKey.metadata.client_secret,
    };
  }

  // 환경 변수에서 조회
  return {
    clientId: process.env[envClientIdKey]?.trim() || null,
    clientSecret: process.env[envClientSecretKey]?.trim() || null,
  };
}

