/**
 * @file food-image-pipeline.ts
 * @description Shared TypeScript 모델 정의.
 *
 * 이 파일은 Gemini 기반 음식 이미지 파이프라인에서 사용하는
 * Supabase 테이블(`foods`, `food_image_batches`, `food_images`)의 필드 구조를
 * 프론트엔드와 서버 액션 모두가 재사용할 수 있도록 명세합니다.
 *
 * 주요 목적:
 * 1. 음식 메타데이터(카테고리, 우선순위, 상태)를 타입 안전하게 취급
 * 2. 일일 배치 로그/이미지 레코드의 공통 필드를 통일해 후속 모듈(크론, 관리자 UI) 구현을 단순화
 * 3. 시즌/카테고리 확장을 고려한 enum-like 유효 값 집합 제공
 *
 * @see docs/TODO.md - "Gemini 기반 음식 이미지 아카이브 파이프라인"
 * @see supabase/migrations/20251125133000_create_food_image_pipeline_tables.sql
 */

export const FOOD_CATEGORIES = [
  "soup_stew",
  "side_dish",
  "main",
  "dessert",
  "drink",
  "snack",
  "other",
] as const;

export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

export interface FoodRecord {
  id: string;
  name: string;
  category: FoodCategory;
  seasonality: string | null;
  needs_images: boolean;
  image_priority: number;
  last_generated_at: string | null;
  total_generated_images: number;
  created_at: string;
  updated_at: string;
}

export type FoodImageBatchStatus = "pending" | "success" | "failed" | "skipped";

export interface FoodImageBatchRecord {
  id: string;
  food_id: string;
  batch_date: string; // ISO date (YYYY-MM-DD)
  status: FoodImageBatchStatus;
  prompt_count: number;
  image_count: number;
  gemini_model: string | null;
  gemini_latency_ms: number | null;
  error_reason: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FoodImageRecord {
  id: string;
  food_id: string;
  batch_id: string | null;
  prompt: string;
  prompt_locale: string | null;
  prompt_hash: string | null;
  gemini_response_meta: Record<string, unknown> | null;
  storage_path_original: string;
  storage_path_thumbnail: string | null;
  width: number | null;
  height: number | null;
  aspect_ratio: string | null;
  file_size_bytes: number | null;
  quality_score: number;
  checksum: string | null;
  created_at: string;
}

