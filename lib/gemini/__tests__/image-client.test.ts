import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { generateGeminiImage } from "../image-client";

const originalEnv = process.env.GEMINI_API_KEY;

describe("generateGeminiImage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnv;
    vi.unstubAllGlobals();
  });

  it("throws a descriptive error when GEMINI_API_KEY is missing", async () => {
    process.env.GEMINI_API_KEY = "";

    await expect(
      generateGeminiImage({
        prompt: "Test prompt"
      })
    ).rejects.toThrow(/GEMINI_API_KEY/);
  });

  it("sends a request to Gemini API and returns parsed image data", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: { mimeType: "image/png", data: "BASE64DATA" }
              }
            ]
          }
        }
      ]
    };
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await generateGeminiImage({
      prompt: "A sample prompt",
      negativePrompt: "bad, low quality",
      imageCount: 1,
      size: "1024x1024"
    });

    expect(fetchSpy).toHaveBeenCalled();
    const [, requestInit] = fetchSpy.mock.calls[0];
    expect(requestInit?.body).toContain("A sample prompt");
    expect(result.images).toHaveLength(1);
    expect(result.images[0].base64Data).toBe("BASE64DATA");
  });
});

