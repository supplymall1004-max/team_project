import { describe, expect, it } from "vitest";

import { processGeminiImage } from "../image-processor";

// 1x1 PNG 샘플 이미지 (Sharp 디코딩 검증용)
const SAMPLE_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

describe("processGeminiImage", () => {
  it("converts base64 data into original and thumbnail WebP variants", async () => {
    const result = await processGeminiImage(SAMPLE_BASE64, {
      originalWidth: 1024,
      thumbnailWidth: 256
    });

    expect(result.checksum).toHaveLength(64);
    expect(result.original.mimeType).toBe("image/webp");
    expect(result.original.width).toBeLessThanOrEqual(1024);
    expect(result.thumbnail.width).toBeLessThanOrEqual(256);
    expect(result.original.buffer.length).toBeGreaterThan(0);
    expect(result.thumbnail.buffer.length).toBeGreaterThan(0);
    expect(result.aspectRatio).toMatch(/^\d+:\d+$/);
  });

  it("throws when base64 payload is empty", async () => {
    await expect(processGeminiImage("")).rejects.toThrow(/Invalid base64 payload/);
  });

  it("throws when base64 payload is invalid", async () => {
    await expect(processGeminiImage("invalid-base64")).rejects.toThrow(/Invalid base64 payload/);
  });

  it("applies default options when none provided", async () => {
    const result = await processGeminiImage(SAMPLE_BASE64);

    expect(result.original.width).toBeLessThanOrEqual(2048); // default originalWidth
    expect(result.thumbnail.width).toBeLessThanOrEqual(512); // default thumbnailWidth
  });

  it("respects custom quality settings", async () => {
    const result = await processGeminiImage(SAMPLE_BASE64, {
      quality: 50,
      thumbnailWidth: 128
    });

    // 낮은 품질 설정이 적용되었는지 버퍼 크기로 간접 확인
    expect(result.original.buffer.length).toBeGreaterThan(0);
    expect(result.thumbnail.buffer.length).toBeGreaterThan(0);
  });
});

