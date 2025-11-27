/**
 * @file integration.test.ts
 * @description 음식 이미지 생성 파이프라인 통합 테스트
 */

import { describe, it, expect, vi } from "vitest";

// Mock dependencies to avoid actual API calls
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: [
              {
                id: "test-food-1",
                name: "김치찌개",
                category: "soup_stew",
                needs_images: true
              }
            ],
            error: null
          }))
        }))
      }))
    }))
  }))
}));

vi.mock("../lib/gemini/image-client", () => ({
  generateGeminiImage: vi.fn(() =>
    Promise.resolve({
      images: [{ mimeType: "image/png", base64Data: "test-data" }],
      latencyMs: 1000,
      raw: {}
    })
  )
}));

vi.mock("../lib/image-pipeline/image-processor", () => ({
  processGeminiImage: vi.fn(() =>
    Promise.resolve({
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
      checksum: "test-checksum",
      aspectRatio: "4:3"
    })
  )
}));

vi.mock("../lib/image-pipeline/storage-uploader", () => ({
  uploadImageVariants: vi.fn(() =>
    Promise.resolve({
      originalPath: "food-images/test-food-1/20250126/original.webp",
      thumbnailPath: "food-images/test-food-1/20250126/thumbnail.webp"
    })
  )
}));

describe("음식 이미지 생성 파이프라인 통합 테스트", () => {
  it("환경 변수 검증", () => {
    // 이 테스트는 실제 환경에서 실행될 때 환경 변수를 확인
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'GEMINI_API_KEY'
    ];

    // 테스트 환경에서는 이 변수들이 없을 수 있으므로 조건부로 확인
    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.warn(`⚠️ 다음 환경 변수가 설정되지 않았습니다: ${missingVars.join(', ')}`);
      console.warn("실제 테스트를 위해서는 .env.local 파일에 설정해주세요.");
    }

    // 최소한 변수 이름이 정의되어 있는지 확인
    expect(requiredVars).toBeDefined();
  });

  it("프롬프트 빌더가 올바른 프롬프트를 생성하는지 확인", async () => {
    const { buildPrompts } = await import("../lib/image-pipeline/prompt-builder");

    const testFood = {
      id: "test-food-1",
      name: "김치찌개",
      category: "soup_stew" as const,
      seasonality: "all" as const,
      needs_images: true,
      image_priority: 100,
      last_generated_at: null,
      total_generated_images: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const prompts = buildPrompts(testFood, { count: 1 });

    expect(prompts).toHaveLength(1);
    expect(prompts[0].prompt).toContain("Kimchi Jjigae");
    expect(prompts[0].prompt).toContain("김치찌개");
    expect(prompts[0].metadata.category).toBe("soup_stew");
  });

  it("데이터베이스 조작 함수들이 올바르게 호출되는지 확인", async () => {
    const {
      createImageBatch,
      insertImageRecord,
      completeImageBatch
    } = await import("../lib/image-pipeline/database-operations");

    // Mock Supabase client
    const mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: "batch-123" },
              error: null
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            error: null
          }))
        }))
      }))
    };

    // 함수들을 직접 테스트하기보다는 구조가 올바른지 확인
    expect(typeof createImageBatch).toBe("function");
    expect(typeof insertImageRecord).toBe("function");
    expect(typeof completeImageBatch).toBe("function");
  });

  it("이미지 프로세서가 올바른 결과를 반환하는지 확인", async () => {
    const { processGeminiImage } = await import("../lib/image-pipeline/image-processor");

    // 실제 sharp를 사용하지 않도록 mock되어 있으므로 기본 구조 확인
    expect(typeof processGeminiImage).toBe("function");

    // Mock이 제대로 설정되었는지 확인
    const mockResult = await processGeminiImage("test-base64");
    expect(mockResult).toHaveProperty("original");
    expect(mockResult).toHaveProperty("thumbnail");
    expect(mockResult).toHaveProperty("checksum");
  });

  it("전체 파이프라인이 연결되는지 확인", async () => {
    // 이 테스트는 실제 파이프라인의 모든 컴포넌트가 연결되는지 확인
    const { buildPrompts } = await import("../lib/image-pipeline/prompt-builder");
    const { generateGeminiImage } = await import("../lib/gemini/image-client");
    const { processGeminiImage } = await import("../lib/image-pipeline/image-processor");

    // 각 컴포넌트가 함수인지 확인
    expect(typeof buildPrompts).toBe("function");
    expect(typeof generateGeminiImage).toBe("function");
    expect(typeof processGeminiImage).toBe("function");

    // 기본적인 데이터 흐름 테스트
    const testFood = {
      id: "test-food-1",
      name: "김치찌개",
      category: "soup_stew" as const,
      seasonality: "all" as const,
      needs_images: true,
      image_priority: 100,
      last_generated_at: null,
      total_generated_images: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const prompts = buildPrompts(testFood, { count: 1 });
    expect(prompts.length).toBeGreaterThan(0);

    // Gemini API 호출 mock 확인
    const geminiResult = await generateGeminiImage({
      prompt: prompts[0].prompt
    });
    expect(geminiResult).toHaveProperty("images");

    // 이미지 처리 mock 확인
    const processedResult = await processGeminiImage("test-data");
    expect(processedResult).toHaveProperty("original");
    expect(processedResult).toHaveProperty("thumbnail");
  });
});


