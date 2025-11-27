/**
 * @file storage-uploader.ts
 * @description Handles Supabase Storage uploads for food image variants with retry/backoff logic.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { ProcessedImageResult } from "./image-processor";

export interface UploadFoodImageParams {
  foodId: string;
  variant: "original" | "thumbnail";
  buffer: Buffer;
  contentType: string;
  extension?: string;
}

export interface UploadFoodImageOptions {
  bucketName?: string;
  storageBucket?: StorageBucket;
  maxRetries?: number;
  now?: () => Date;
}

export interface UploadFoodImageResult {
  bucket: string;
  path: string;
  size: number;
  attempts: number;
}

export interface StorageUploadResponse {
  data: { path: string } | null;
  error: StorageError | null;
}

export interface StorageError {
  message: string;
  statusCode?: number;
}

export interface StorageBucket {
  upload(
    path: string,
    fileBody: Blob | Buffer | ArrayBuffer | string,
    options?: { cacheControl?: string; contentType?: string; upsert?: boolean }
  ): Promise<StorageUploadResponse>;
}

const DEFAULT_BUCKET_ENV = "NEXT_PUBLIC_STORAGE_BUCKET";
const DEFAULT_BUCKET_FALLBACK = "uploads";

export async function uploadFoodImageVariant(
  params: UploadFoodImageParams,
  options?: UploadFoodImageOptions
): Promise<UploadFoodImageResult> {
  const bucketName = resolveBucketName(options?.bucketName);
  const bucket = options?.storageBucket ?? getStorageBucket(bucketName);
  const maxRetries = Math.max(1, options?.maxRetries ?? 3);
  const now = options?.now ?? (() => new Date());
  const basePath = buildBasePath(params.foodId, now());
  const extension = params.extension ?? "webp";

  console.groupCollapsed?.("[image-uploader] uploadFoodImageVariant");

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${attempt}`;
    const path = `${basePath}/${params.variant}${suffix}.${extension}`;
    console.log?.(`[image-uploader] attempt ${attempt + 1}: ${path}`);
    const response = await bucket.upload(path, params.buffer, {
      contentType: params.contentType,
      upsert: false
    });

    if (!response.error) {
      console.log?.("[image-uploader] upload success", path);
      console.groupEnd?.();
      return {
        bucket: bucketName,
        path: response.data?.path ?? path,
        size: params.buffer.length,
        attempts: attempt + 1
      };
    }

    if (attempt === maxRetries - 1 || !shouldRetry(response.error)) {
      console.groupEnd?.();
      throw new Error(`[image-uploader] Upload failed: ${response.error.message}`);
    }

    await wait(backoffDelay(attempt));
  }

  console.groupEnd?.();
  throw new Error("[image-uploader] Upload failed: exceeded retry attempts");
}

function resolveBucketName(explicit?: string): string {
  if (explicit) return explicit;
  return process.env[DEFAULT_BUCKET_ENV] ?? DEFAULT_BUCKET_FALLBACK;
}

function getStorageBucket(bucketName: string): StorageBucket {
  const supabase = getServiceRoleClient();
  return supabase.storage.from(bucketName) as unknown as StorageBucket;
}

function buildBasePath(foodId: string, current: Date): string {
  const pad = (num: number) => num.toString().padStart(2, "0");
  const year = current.getUTCFullYear();
  const month = pad(current.getUTCMonth() + 1);
  const day = pad(current.getUTCDate());
  return `food-images/${foodId}/${year}${month}${day}`;
}

function shouldRetry(error: StorageError | null): boolean {
  if (!error) return false;
  if (error.statusCode && error.statusCode >= 500) return true;
  const message = error.message.toLowerCase();
  return /timeout|network|too many|temporarily|retry/i.test(message);
}

function backoffDelay(attempt: number): number {
  const base = 200;
  return base * 2 ** attempt;
}

function wait(durationMs: number): Promise<void> {
  if (process.env.NODE_ENV === "test") {
    return Promise.resolve();
  }
  return new Promise(resolve => {
    setTimeout(resolve, durationMs);
  });
}

export interface UploadImageVariantsParams {
  foodId: string;
  processed: ProcessedImageResult;
  date?: Date;
  bucketName?: string;
  client?: SupabaseClient;
}

export interface UploadedPaths {
  originalPath: string;
  thumbnailPath: string;
}

const STORAGE_ROOT = "food-images";
const MAX_RETRIES = 3;

export async function uploadImageVariants(params: UploadImageVariantsParams): Promise<UploadedPaths> {
  const supabase = params.client ?? getServiceRoleClient();
  const bucket = params.bucketName ?? process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? "uploads";
  const dateKey = formatDateKey(params.date ?? new Date());
  const folder = `${STORAGE_ROOT}/${params.foodId}/${dateKey}`;
  const originalPath = `${folder}/original.webp`;
  const thumbnailPath = `${folder}/thumbnail.webp`;

  console.groupCollapsed?.("[ImagePipeline] uploadImageVariants");
  console.log?.("bucket", bucket, "foodId", params.foodId);

  try {
    await Promise.all([
      uploadWithRetry(supabase, bucket, originalPath, params.processed.original.buffer),
      uploadWithRetry(supabase, bucket, thumbnailPath, params.processed.thumbnail.buffer)
    ]);

    return { originalPath, thumbnailPath };
  } finally {
    console.groupEnd?.();
  }
}

async function uploadWithRetry(
  client: SupabaseClient,
  bucket: string,
  path: string,
  buffer: Buffer,
  attempt: number = 1
): Promise<void> {
  const { error } = await client.storage.from(bucket).upload(path, buffer, {
    cacheControl: "31536000",
    contentType: "image/webp",
    upsert: true
  });

  if (!error) {
    return;
  }

  if (attempt >= MAX_RETRIES) {
    console.error?.("[ImagePipeline] upload failed", path, error.message);
    throw new Error(`Failed to upload ${path}: ${error.message}`);
  }

  const delay = attempt * 250;
  console.warn?.(`[ImagePipeline] upload retry ${attempt} for ${path}`, error.message);
  await wait(delay);
  return uploadWithRetry(client, bucket, path, buffer, attempt + 1);
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

