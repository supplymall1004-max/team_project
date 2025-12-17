/**
 * @file nutrition-normalizer.ts
 * @description 식단/영양 저장 시 DB 타입에 맞게 값을 정규화하는 유틸
 *
 * 배경:
 * - Supabase(Postgres)에서 INTEGER 컬럼에 "109.7" 같은 값이 들어오면 22P02 에러가 발생합니다.
 * - 레시피 영양값은 소수(또는 문자열)로 들어올 수 있으므로, 저장 직전에 안전하게 정수 변환이 필요합니다.
 */

/**
 * @description 주어진 값을 안전하게 정수로 변환합니다. (반올림)
 */
export function toInt(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  const num = typeof value === "string" ? Number(value) : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.round(num);
}

/**
 * @description 주어진 값을 안전하게 정수 또는 null로 변환합니다. (반올림)
 */
export function toIntOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const num = typeof value === "string" ? Number(value) : Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.round(num);
}
