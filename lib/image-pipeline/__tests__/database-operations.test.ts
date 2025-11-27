import { describe, expect, it, vi } from "vitest";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

// Mock Supabase client
vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: vi.fn()
}));

// Import after mocking
import {
  createImageBatch,
  insertImageRecord,
  completeImageBatch,
  checkExistingBatch
} from "../database-operations";

const mockSupabaseClient = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn()
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        limit: vi.fn()
      }))
    }))
  }))
};

describe("createImageBatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getServiceRoleClient as any).mockReturnValue(mockSupabaseClient);
  });

  it("creates a batch with correct parameters", async () => {
    const mockInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: {
            id: "batch-123",
            batch_date: "2025-01-26",
            status: "pending"
          },
          error: null
        }))
      }))
    }));

    mockSupabaseClient.from.mockReturnValue({ insert: mockInsert });

    const result = await createImageBatch({
      foodId: "food-123",
      promptCount: 3
    });

    expect(result.batchId).toBe("batch-123");
    expect(result.batchDate).toBe("2025-01-26");
    expect(result.status).toBe("pending");
  });

  it("throws error when database operation fails", async () => {
    const mockInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: null,
          error: { message: "Database error" }
        }))
      }))
    }));

    mockSupabaseClient.from.mockReturnValue({ insert: mockInsert });

    await expect(createImageBatch({
      foodId: "food-123",
      promptCount: 1
    })).rejects.toThrow("Failed to create image batch: Database error");
  });
});

describe("insertImageRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getServiceRoleClient as any).mockReturnValue(mockSupabaseClient);
  });

  it("inserts image record with all required fields", async () => {
    const mockInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: { id: "image-456" },
          error: null
        }))
      }))
    }));

    mockSupabaseClient.from.mockReturnValue({ insert: mockInsert });

    const mockImage = {
      original: { buffer: Buffer.from(""), width: 1024, height: 768, fileSize: 50000, mimeType: "image/webp" },
      thumbnail: { buffer: Buffer.from(""), width: 256, height: 192, fileSize: 8000, mimeType: "image/webp" },
      checksum: "checksum123",
      aspectRatio: "4:3",
      geminiMeta: { mimeType: "image/png", base64Size: 1000 }
    };

    const result = await insertImageRecord({
      batchId: "batch-123",
      foodId: "food-123",
      prompt: "Test prompt",
      parsedImage: mockImage,
      uploadedPaths: {
        originalPath: "path/to/original.webp",
        thumbnailPath: "path/to/thumbnail.webp"
      }
    });

    expect(result).toBe("image-456");
  });
});

describe("completeImageBatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getServiceRoleClient as any).mockReturnValue(mockSupabaseClient);
  });

  it("updates batch with success status", async () => {
    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({
        error: null
      }))
    }));

    mockSupabaseClient.from.mockReturnValue({ update: mockUpdate });

    await completeImageBatch({
      batchId: "batch-123",
      status: "success",
      promptCount: 3,
      imageCount: 3
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      status: "success",
      completed_at: expect.any(String),
      prompt_count: 3,
      image_count: 3
    });
  });

  it("includes error reason for failed batches", async () => {
    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({
        error: null
      }))
    }));

    mockSupabaseClient.from.mockReturnValue({ update: mockUpdate });

    await completeImageBatch({
      batchId: "batch-123",
      status: "failed",
      errorReason: "Gemini API error",
      promptCount: 1,
      imageCount: 0
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      status: "failed",
      completed_at: expect.any(String),
      error_reason: "Gemini API error",
      prompt_count: 1,
      image_count: 0
    });
  });
});

describe("checkExistingBatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getServiceRoleClient as any).mockReturnValue(mockSupabaseClient);
  });

  it("returns true when batch exists for today", async () => {
    const resultPayload = { data: [{ id: "existing-batch" }], error: null };
    const builder: any = {
      eq: vi.fn(() => builder),
      limit: vi.fn(() => resultPayload)
    };
    const mockSelect = vi.fn(() => builder);

    mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

    const result = await checkExistingBatch("food-123");

    expect(result).toBe(true);
    expect(builder.eq).toHaveBeenCalledTimes(2);
    expect(builder.limit).toHaveBeenCalledWith(1);
  });

  it("returns false when no batch exists", async () => {
    const resultPayload = { data: [], error: null };
    const builder: any = {
      eq: vi.fn(() => builder),
      limit: vi.fn(() => resultPayload)
    };
    const mockSelect = vi.fn(() => builder);

    mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

    const result = await checkExistingBatch("food-123");

    expect(result).toBe(false);
    expect(builder.eq).toHaveBeenCalledTimes(2);
    expect(builder.limit).toHaveBeenCalledWith(1);
  });
});
