/**
 * @file database-operations.ts
 * @description 음식 이미지 배치 및 이미지 데이터베이스 조작 함수들
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { FoodRecord } from "@/types/food-image-pipeline";
import type { ParsedGeminiImage } from "./response-parser";
import type { UploadedPaths } from "./storage-uploader";

export interface BatchCreationParams {
  foodId: string;
  promptCount: number;
  batchDate?: Date;
}

export interface BatchCreationResult {
  batchId: string;
  batchDate: string;
  status: "pending";
}

export interface ImageRecordParams {
  batchId: string;
  foodId: string;
  prompt: string;
  promptHash?: string;
  parsedImage: ParsedGeminiImage;
  uploadedPaths: UploadedPaths;
  promptLocale?: string;
  qualityScore?: number;
}

export interface BatchCompletionParams {
  batchId: string;
  status: "success" | "failed";
  errorReason?: string;
  geminiLatencyMs?: number;
  promptCount?: number;
  imageCount?: number;
}

/**
 * 음식 이미지 생성 배치를 생성
 */
export async function createImageBatch(params: BatchCreationParams): Promise<BatchCreationResult> {
  const supabase = getServiceRoleClient();
  const batchDate = params.batchDate ?? new Date();
  const batchDateStr = batchDate.toISOString().split('T')[0]; // YYYY-MM-DD

  console.groupCollapsed?.("[DatabaseOps] createImageBatch");
  console.log?.("foodId", params.foodId, "promptCount", params.promptCount, "batchDate", batchDateStr);

  try {
    const { data, error } = await supabase
      .from("food_image_batches")
      .insert({
        food_id: params.foodId,
        batch_date: batchDateStr,
        status: "pending",
        prompt_count: params.promptCount,
        started_at: new Date().toISOString()
      })
      .select("id, batch_date, status")
      .single();

    if (error) {
      console.error?.("batch creation failed", error);
      throw new Error(`Failed to create image batch: ${error.message}`);
    }

    const result: BatchCreationResult = {
      batchId: data.id,
      batchDate: data.batch_date,
      status: data.status
    };

    console.log?.("batch created", result);
    return result;
  } finally {
    console.groupEnd?.();
  }
}

/**
 * 생성된 이미지를 데이터베이스에 기록
 */
export async function insertImageRecord(params: ImageRecordParams): Promise<string> {
  const supabase = getServiceRoleClient();

  console.groupCollapsed?.("[DatabaseOps] insertImageRecord");
  console.log?.("batchId", params.batchId, "foodId", params.foodId, "qualityScore", params.qualityScore);

  try {
    // 프롬프트 해시 생성 (중복 검출용)
    const promptHash = params.promptHash ?? await generatePromptHash(params.prompt);

    const { data, error } = await supabase
      .from("food_images")
      .insert({
        food_id: params.foodId,
        batch_id: params.batchId,
        prompt: params.prompt,
        prompt_locale: params.promptLocale ?? "ko-en",
        prompt_hash: promptHash,
        gemini_response_meta: {
          mime_type: params.parsedImage.geminiMeta.mimeType,
          base64_size: params.parsedImage.geminiMeta.base64Size,
          aspect_ratio: params.parsedImage.aspectRatio,
          checksum: params.parsedImage.checksum
        },
        storage_path_original: params.uploadedPaths.originalPath,
        storage_path_thumbnail: params.uploadedPaths.thumbnailPath,
        width: params.parsedImage.original.width,
        height: params.parsedImage.original.height,
        aspect_ratio: params.parsedImage.aspectRatio,
        file_size_bytes: params.parsedImage.original.fileSize,
        quality_score: params.qualityScore ?? 0,
        checksum: params.parsedImage.checksum
      })
      .select("id")
      .single();

    if (error) {
      console.error?.("image record insertion failed", error);
      throw new Error(`Failed to insert image record: ${error.message}`);
    }

    console.log?.("image record inserted", data.id);
    return data.id;
  } finally {
    console.groupEnd?.();
  }
}

/**
 * 배치 완료 상태 업데이트
 */
export async function completeImageBatch(params: BatchCompletionParams): Promise<void> {
  const supabase = getServiceRoleClient();

  console.groupCollapsed?.("[DatabaseOps] completeImageBatch");
  console.log?.("batchId", params.batchId, "status", params.status, "latency", params.geminiLatencyMs);

  try {
    const updateData: Record<string, any> = {
      status: params.status,
      completed_at: new Date().toISOString()
    };

    if (params.errorReason) {
      updateData.error_reason = params.errorReason;
    }

    if (params.geminiLatencyMs !== undefined) {
      updateData.gemini_latency_ms = params.geminiLatencyMs;
    }

    if (params.promptCount !== undefined) {
      updateData.prompt_count = params.promptCount;
    }

    if (params.imageCount !== undefined) {
      updateData.image_count = params.imageCount;
    }

    const { error } = await supabase
      .from("food_image_batches")
      .update(updateData)
      .eq("id", params.batchId);

    if (error) {
      console.error?.("batch completion failed", error);
      throw new Error(`Failed to complete image batch: ${error.message}`);
    }

    console.log?.("batch completed", params.status);
  } finally {
    console.groupEnd?.();
  }
}

/**
 * 배치 상태를 '진행 중'으로 업데이트
 */
export async function markBatchInProgress(batchId: string): Promise<void> {
  const supabase = getServiceRoleClient();

  console.groupCollapsed?.("[DatabaseOps] markBatchInProgress");
  console.log?.("batchId", batchId);

  try {
    const { error } = await supabase
      .from("food_image_batches")
      .update({
        status: "pending", // 현재 스키마상 'in_progress' 상태가 없으므로 'pending' 사용
        started_at: new Date().toISOString()
      })
      .eq("id", batchId);

    if (error) {
      console.error?.("batch status update failed", error);
      throw new Error(`Failed to mark batch in progress: ${error.message}`);
    }

    console.log?.("batch marked as in progress");
  } finally {
    console.groupEnd?.();
  }
}

/**
 * 오늘 이미 배치가 존재하는지 확인
 */
export async function checkExistingBatch(foodId: string, batchDate?: Date): Promise<boolean> {
  const supabase = getServiceRoleClient();
  const targetDate = batchDate ?? new Date();
  const dateStr = targetDate.toISOString().split('T')[0];

  console.groupCollapsed?.("[DatabaseOps] checkExistingBatch");
  console.log?.("foodId", foodId, "date", dateStr);

  try {
    const { data, error } = await supabase
      .from("food_image_batches")
      .select("id")
      .eq("food_id", foodId)
      .eq("batch_date", dateStr)
      .limit(1);

    if (error) {
      console.error?.("batch check failed", error);
      throw new Error(`Failed to check existing batch: ${error.message}`);
    }

    const exists = data && data.length > 0;
    console.log?.("existing batch", exists);
    return exists;
  } finally {
    console.groupEnd?.();
  }
}

/**
 * 프롬프트의 해시 생성 (중복 검출용)
 */
async function generatePromptHash(prompt: string): Promise<string> {
  const crypto = await import("node:crypto");
  return crypto.createHash("sha256").update(prompt, "utf8").digest("hex");
}

/**
 * 음식의 마지막 생성 시간 업데이트
 */
export async function updateFoodLastGenerated(foodId: string): Promise<void> {
  const supabase = getServiceRoleClient();

  console.groupCollapsed?.("[DatabaseOps] updateFoodLastGenerated");
  console.log?.("foodId", foodId);

  try {
    // 먼저 현재 값을 가져옴
    const { data: currentFood, error: fetchError } = await supabase
      .from("foods")
      .select("total_generated_images")
      .eq("id", foodId)
      .single();

    if (fetchError) {
      console.error?.("food fetch failed", fetchError);
      throw new Error(`Failed to fetch food: ${fetchError.message}`);
    }

    // 현재 값에 +1을 해서 업데이트
    const { error } = await supabase
      .from("foods")
      .update({
        last_generated_at: new Date().toISOString(),
        total_generated_images: (currentFood?.total_generated_images || 0) + 1
      })
      .eq("id", foodId);

    if (error) {
      console.error?.("food update failed", error);
      throw new Error(`Failed to update food last generated: ${error.message}`);
    }

    console.log?.("food last generated updated");
  } finally {
    console.groupEnd?.();
  }
}
