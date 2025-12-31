/**
 * @file types/api-keys.ts
 * @description API 키 관련 타입 및 상수 정의
 *
 * "use server" 파일에서는 비동기 함수만 export할 수 있으므로,
 * 타입과 상수는 별도 파일로 분리합니다.
 */

// API 타입 정의
export const API_TYPES = [
  "gemini",
  "naver_map",
  "naver_geocoding",
  "naver_search",
  "pharmacy",
  "food_safety",
  "kcdc",
  "weather",
] as const;

export type ApiType = (typeof API_TYPES)[number];

export interface ApiKey {
  id: string;
  user_id: string;
  api_type: ApiType;
  api_key: string;
  metadata: Record<string, any>;
  status: "active" | "inactive";
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GetApiKeysResponse {
  success: true;
  data: ApiKey[];
}

export interface SaveApiKeyResponse {
  success: true;
  data: ApiKey;
}

export interface DeleteApiKeyResponse {
  success: true;
}

export interface ToggleApiKeyStatusResponse {
  success: true;
  data: ApiKey;
}

