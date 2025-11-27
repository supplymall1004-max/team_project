import { describe, expect, it, vi } from "vitest";

import { parseGeminiResponse, parseSingleGeminiResponse } from "../response-parser";
import { processGeminiImage } from "../image-processor";

// Mock processGeminiImage
vi.mock("../image-processor", () => ({
  processGeminiImage: vi.fn()
}));

const mockGeminiResponse = {
  images: [
    {
      mimeType: "image/png",
      base64Data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    }
  ],
  latencyMs: 1500,
  raw: { candidates: [] }
};

const mockProcessedImage = {
  original: {
    buffer: Buffer.from("original"),
    width: 1024,
    height: 768,
    fileSize: 50000,
    mimeType: "image/webp"
  },
  thumbnail: {
    buffer: Buffer.from("thumbnail"),
    width: 256,
    height: 192,
    fileSize: 8000,
    mimeType: "image/webp"
  },
  checksum: "abc123def456",
  aspectRatio: "4:3"
};

describe("parseGeminiResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (processGeminiImage as any).mockResolvedValue(mockProcessedImage);
  });

  it("parses multiple images from Gemini response", async () => {
    const multiImageResponse = {
      ...mockGeminiResponse,
      images: [mockGeminiResponse.images[0], mockGeminiResponse.images[0]]
    };

    const result = await parseGeminiResponse(multiImageResponse);

    expect(result.images).toHaveLength(2);
    expect(result.latencyMs).toBe(1500);
    expect(result.rawResponse).toBe(multiImageResponse.raw);
    expect(processGeminiImage).toHaveBeenCalledTimes(2);
  });

  it("returns empty array when no images in response", async () => {
    const emptyResponse = {
      ...mockGeminiResponse,
      images: []
    };

    const result = await parseGeminiResponse(emptyResponse);

    expect(result.images).toHaveLength(0);
    expect(processGeminiImage).not.toHaveBeenCalled();
  });

  it("handles image processing errors gracefully", async () => {
    (processGeminiImage as any).mockRejectedValue(new Error("Processing failed"));

    await expect(parseGeminiResponse(mockGeminiResponse)).rejects.toThrow("Processing failed");
  });

  it("passes base64 data to image processor", async () => {
    await parseGeminiResponse(mockGeminiResponse);

    expect(processGeminiImage).toHaveBeenCalledWith(mockGeminiResponse.images[0].base64Data);
  });

  it("includes gemini metadata in parsed result", async () => {
    const result = await parseGeminiResponse(mockGeminiResponse);

    expect(result.images[0].geminiMeta.mimeType).toBe("image/png");
    expect(result.images[0].geminiMeta.base64Size).toBe(mockGeminiResponse.images[0].base64Data.length);
  });
});

describe("parseSingleGeminiResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (processGeminiImage as any).mockResolvedValue(mockProcessedImage);
  });

  it("returns the first parsed image from response", async () => {
    const result = await parseSingleGeminiResponse(mockGeminiResponse);

    expect(result).toMatchObject({
      original: mockProcessedImage.original,
      thumbnail: mockProcessedImage.thumbnail,
      checksum: mockProcessedImage.checksum,
      aspectRatio: mockProcessedImage.aspectRatio,
      geminiMeta: {
        mimeType: "image/png",
        base64Size: mockGeminiResponse.images[0].base64Data.length
      }
    });
    expect(processGeminiImage).toHaveBeenCalledTimes(1);
  });

  it("throws error when no images in response", async () => {
    const emptyResponse = {
      ...mockGeminiResponse,
      images: []
    };

    await expect(parseSingleGeminiResponse(emptyResponse)).rejects.toThrow("No images found in Gemini response");
  });
});
