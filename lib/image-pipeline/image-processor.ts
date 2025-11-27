/**
 * @file image-processor.ts
 * @description Converts Gemini base64 images into optimized WebP variants.
 *
 * 주요 책임:
 * 1. Base64 페이로드 유효성 검사 및 해시 생성
 * 2. Sharp를 사용해 원본/썸네일 WebP 버전 생성
 * 3. 각 처리 단계에 대한 로깅으로 장애 추적 용이화
 */

import crypto from "node:crypto";
import sharp from "sharp";

export interface ImageProcessorOptions {
  originalWidth?: number;
  thumbnailWidth?: number;
  quality?: number;
  thumbnailQuality?: number;
}

export interface ProcessedImageVariant {
  buffer: Buffer;
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
}

export interface ProcessedImageResult {
  original: ProcessedImageVariant;
  thumbnail: ProcessedImageVariant;
  checksum: string;
  aspectRatio: string;
}

const DEFAULT_OPTIONS: Required<Omit<ImageProcessorOptions, "thumbnailQuality">> & {
  thumbnailQuality: number;
} = {
  originalWidth: 2048,
  thumbnailWidth: 512,
  quality: 90,
  thumbnailQuality: 80
};

export async function processGeminiImage(
  base64: string,
  options?: ImageProcessorOptions
): Promise<ProcessedImageResult> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const payload = base64?.trim() ?? "";

  if (!payload) {
    throw new Error("Invalid base64 payload: empty string");
  }

  let inputBuffer: Buffer;

  try {
    inputBuffer = Buffer.from(payload, "base64");
  } catch (error) {
    console.error?.("[ImagePipeline] base64 decode failed", (error as Error)?.message);
    throw new Error("Invalid base64 payload: decode failed");
  }

  if (inputBuffer.length === 0) {
    throw new Error("Invalid base64 payload: decoded buffer is empty");
  }

  const checksum = crypto.createHash("sha256").update(inputBuffer).digest("hex");

  console.groupCollapsed?.("[ImagePipeline] processGeminiImage");
  console.log?.("inputBytes", inputBuffer.length);

  try {
    const [original, thumbnail] = await Promise.all([
      resizeToWebp(inputBuffer, mergedOptions.originalWidth, mergedOptions.quality),
      resizeToWebp(inputBuffer, mergedOptions.thumbnailWidth, mergedOptions.thumbnailQuality)
    ]);

    const aspectRatio = formatAspectRatio(original.width, original.height);

    console.log?.("original", { width: original.width, height: original.height, fileSize: original.fileSize });
    console.log?.("thumbnail", {
      width: thumbnail.width,
      height: thumbnail.height,
      fileSize: thumbnail.fileSize
    });

    return {
      original,
      thumbnail,
      checksum,
      aspectRatio
    };
  } catch (error) {
    console.error?.("[ImagePipeline] image processing failed", (error as Error)?.message);
    throw new Error("Invalid base64 payload: Sharp could not decode image");
  } finally {
    console.groupEnd?.();
  }
}

async function resizeToWebp(buffer: Buffer, width: number, quality: number): Promise<ProcessedImageVariant> {
  const pipeline = sharp(buffer).resize({
    width,
    fit: "inside",
    withoutEnlargement: true
  });

  const { data, info } = await pipeline.webp({ quality }).toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    width: info.width ?? width,
    height: info.height ?? info.width ?? width,
    fileSize: data.length,
    mimeType: "image/webp"
  };
}

function formatAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const safeDivisor = divisor === 0 ? 1 : divisor;
  return `${Math.round(width / safeDivisor)}:${Math.round(height / safeDivisor)}`;
}

