import { describe, expect, it, vi } from "vitest";

import type { StorageBucket } from "../storage-uploader";
import { uploadFoodImageVariant } from "../storage-uploader";

const buffer = Buffer.from("sample");

function createMockBucket(successAfter = 1) {
  let attempts = 0;
  const upload = vi.fn(async (path: string) => {
    attempts += 1;
    if (attempts < successAfter) {
      return {
        data: null,
        error: { message: "network timeout", statusCode: 503 }
      };
    }

    return {
      data: { path },
      error: null
    };
  });

  return { upload } as unknown as StorageBucket;
}

describe("uploadFoodImageVariant", () => {
  it("generates deterministic path and uploads on first try", async () => {
    const bucket = createMockBucket(1);
    const now = () => new Date("2025-01-01T00:00:00Z");

    const result = await uploadFoodImageVariant(
      {
        foodId: "food-1",
        variant: "original",
        buffer,
        contentType: "image/webp"
      },
      { storageBucket: bucket, bucketName: "uploads", now }
    );

    expect(result.path).toBe("food-images/food-1/20250101/original.webp");
  });

  it("retries with suffix when upload fails", async () => {
    const bucket = createMockBucket(3);
    const now = () => new Date("2025-01-01T00:00:00Z");

    const result = await uploadFoodImageVariant(
      {
        foodId: "food-2",
        variant: "thumbnail",
        buffer,
        contentType: "image/webp"
      },
      { storageBucket: bucket, bucketName: "uploads", now, maxRetries: 3 }
    );

    expect(bucket.upload).toHaveBeenCalledTimes(3);
    expect(result.path).toMatch(/thumbnail-2\.webp$/);
  });
});
import { describe, expect, it } from "vitest";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProcessedImageResult } from "../image-processor";
import { uploadImageVariants } from "../storage-uploader";

const mockProcessed: ProcessedImageResult = {
  checksum: "abc",
  original: {
    buffer: Buffer.from("original"),
    width: 100,
    height: 100,
    fileSize: 9,
    mimeType: "image/webp"
  },
  thumbnail: {
    buffer: Buffer.from("thumbnail"),
    width: 50,
    height: 50,
    fileSize: 9,
    mimeType: "image/webp"
  }
};

describe("uploadImageVariants", () => {
  it("uploads both variants to Supabase Storage paths", async () => {
    const calls: string[] = [];
    const client = createMockClient(path => {
      calls.push(path);
      return { error: null };
    });

    const result = await uploadImageVariants({
      foodId: "food-123",
      processed: mockProcessed,
      client,
      date: new Date("2025-01-01")
    });

    expect(result.originalPath).toMatch(/food-123\/20250101\/original\.webp$/);
    expect(result.thumbnailPath).toMatch(/food-123\/20250101\/thumbnail\.webp$/);
    expect(calls).toContain(result.originalPath);
    expect(calls).toContain(result.thumbnailPath);
  });

  it("retries failed uploads and eventually succeeds", async () => {
    let attempts = 0;
    const client = createMockClient(path => {
      if (path.includes("original") && attempts++ === 0) {
        return { error: { message: "temporary failure" } };
      }
      return { error: null };
    });

    const result = await uploadImageVariants({
      foodId: "food-456",
      processed: mockProcessed,
      client,
      date: new Date("2025-01-02")
    });

    expect(result.originalPath).toContain("food-456/20250102");
    expect(attempts).toBe(2);
  });
});

function createMockClient(
  resolver: (path: string) => { error: { message: string } | null }
): SupabaseClient {
  return {
    storage: {
      from: () => ({
        upload: async (path: string) => resolver(path)
      })
    }
  } as unknown as SupabaseClient;
}

