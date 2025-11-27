/**
 * @file response-parser.ts
 * @description Gemini API 응답을 파싱하고 이미지 데이터를 WebP로 변환하는 모듈
 */

import type { GeminiImageResponse, GeminiImageData } from "@/lib/gemini/image-client";
import { processGeminiImage } from "./image-processor";

export interface ParsedGeminiImage {
  original: {
    buffer: Buffer;
    width: number;
    height: number;
    fileSize: number;
    mimeType: string;
  };
  thumbnail: {
    buffer: Buffer;
    width: number;
    height: number;
    fileSize: number;
    mimeType: string;
  };
  checksum: string;
  aspectRatio: string;
  geminiMeta: {
    mimeType: string;
    base64Size: number;
  };
}

export interface ParsedGeminiResponse {
  images: ParsedGeminiImage[];
  latencyMs: number;
  rawResponse: unknown;
}

/**
 * Gemini API 응답을 파싱하고 모든 이미지를 WebP로 변환
 */
export async function parseGeminiResponse(response: GeminiImageResponse): Promise<ParsedGeminiResponse> {
  console.groupCollapsed?.("[ResponseParser] parseGeminiResponse");
  console.log?.("inputImages", response.images.length, "latency", response.latencyMs);

  try {
    const parsedImages = await Promise.all(
      response.images.map((imageData, index) =>
        parseSingleImage(imageData, index)
      )
    );

    console.log?.("parsedImages", parsedImages.length);

    return {
      images: parsedImages,
      latencyMs: response.latencyMs,
      rawResponse: response.raw
    };
  } finally {
    console.groupEnd?.();
  }
}

/**
 * 단일 Gemini 이미지 데이터를 WebP로 변환
 */
async function parseSingleImage(imageData: GeminiImageData, index: number): Promise<ParsedGeminiImage> {
  console.groupCollapsed?.(`[ResponseParser] parseSingleImage #${index}`);
  console.log?.("mimeType", imageData.mimeType, "base64Length", imageData.base64Data.length);

  try {
    // Base64 → Buffer → WebP 변환
    const processed = await processGeminiImage(imageData.base64Data);
    const aspectRatio = processed.aspectRatio;

    const result: ParsedGeminiImage = {
      original: processed.original,
      thumbnail: processed.thumbnail,
      checksum: processed.checksum,
      aspectRatio,
      geminiMeta: {
        mimeType: imageData.mimeType,
        base64Size: imageData.base64Data.length
      }
    };

    console.log?.("processed", {
      originalSize: processed.original.fileSize,
      thumbnailSize: processed.thumbnail.fileSize,
      checksum: processed.checksum.substring(0, 8) + "...",
      aspectRatio
    });

    return result;
  } finally {
    console.groupEnd?.();
  }
}

/**
 * 여러 응답 중 첫 번째 이미지만 반환 (단일 이미지 생성 시 사용)
 */
export async function parseSingleGeminiResponse(response: GeminiImageResponse): Promise<ParsedGeminiImage> {
  const parsed = await parseGeminiResponse(response);

  if (parsed.images.length === 0) {
    throw new Error("No images found in Gemini response");
  }

  return parsed.images[0];
}
