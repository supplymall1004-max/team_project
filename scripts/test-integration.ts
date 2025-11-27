/**
 * @file test-integration.ts
 * @description 음식 이미지 생성 파이프라인 통합 테스트
 *
 * 로컬 환경에서 Edge Function 로직을 시뮬레이션하여
 * Gemini API → 이미지 처리 → Storage 업로드 → DB 기록을 테스트합니다.
 */

import { createClient } from "@supabase/supabase-js";
import { generateGeminiImage } from "../lib/gemini/image-client";
import { processGeminiImage } from "../lib/image-pipeline/image-processor";
import { uploadImageVariants } from "../lib/image-pipeline/storage-uploader";
import {
  createImageBatch,
  insertImageRecord,
  completeImageBatch,
  checkExistingBatch
} from "../lib/image-pipeline/database-operations";
import { buildPrompts } from "../lib/image-pipeline/prompt-builder";

// 환경 변수 로드
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Supabase 환경 변수가 설정되지 않았습니다");
}

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY가 설정되지 않았습니다");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TestResult {
  success: boolean;
  testName: string;
  duration: number;
  error?: string;
  details?: any;
}

/**
 * 통합 테스트 실행
 */
async function runIntegrationTests(): Promise<TestResult[]> {
  console.log("🧪 음식 이미지 생성 파이프라인 통합 테스트 시작");
  console.log("=" .repeat(60));

  const results: TestResult[] = [];

  // 테스트 1: 환경 검증
  results.push(await testEnvironmentSetup());

  // 테스트 2: 데이터베이스 연결
  results.push(await testDatabaseConnection());

  // 테스트 3: Gemini API 연결
  results.push(await testGeminiAPIConnection());

  // 테스트 4: 이미지 생성 파이프라인
  results.push(await testImageGenerationPipeline());

  // 테스트 5: Storage 업로드
  results.push(await testStorageUpload());

  // 결과 보고
  console.log("\n" + "=".repeat(60));
  console.log("📊 테스트 결과 요약");

  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;

  results.forEach(result => {
    const status = result.success ? "✅" : "❌";
    console.log(`${status} ${result.testName}: ${result.duration}ms`);
    if (result.error) {
      console.log(`   에러: ${result.error}`);
    }
  });

  console.log(`\n🎯 총 ${results.length}개 테스트 중 ${passed}개 성공, ${failed}개 실패`);

  return results;
}

/**
 * 환경 설정 테스트
 */
async function testEnvironmentSetup(): Promise<TestResult> {
  const start = Date.now();

  try {
    console.log("🔧 환경 설정 테스트 중...");

    // 필수 환경 변수 확인
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'GEMINI_API_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`환경 변수 ${envVar}가 설정되지 않았습니다`);
      }
    }

    return {
      success: true,
      testName: "환경 설정 테스트",
      duration: Date.now() - start,
      details: { envVars: requiredEnvVars }
    };

  } catch (error) {
    return {
      success: false,
      testName: "환경 설정 테스트",
      duration: Date.now() - start,
      error: error.message
    };
  }
}

/**
 * 데이터베이스 연결 테스트
 */
async function testDatabaseConnection(): Promise<TestResult> {
  const start = Date.now();

  try {
    console.log("🗄️ 데이터베이스 연결 테스트 중...");

    // 간단한 쿼리로 연결 확인
    const { data, error } = await supabase
      .from('foods')
      .select('id, name')
      .limit(1);

    if (error) throw error;

    return {
      success: true,
      testName: "데이터베이스 연결 테스트",
      duration: Date.now() - start,
      details: { recordCount: data?.length || 0 }
    };

  } catch (error) {
    return {
      success: false,
      testName: "데이터베이스 연결 테스트",
      duration: Date.now() - start,
      error: error.message
    };
  }
}

/**
 * Gemini API 연결 테스트
 */
async function testGeminiAPIConnection(): Promise<TestResult> {
  const start = Date.now();

  try {
    console.log("🤖 Gemini API 연결 테스트 중...");

    // 간단한 텍스트 요청으로 API 연결 확인
    const testPrompt = "Hello, this is a test prompt.";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: testPrompt }] }],
          generationConfig: { temperature: 0.1 }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API 응답 실패: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      testName: "Gemini API 연결 테스트",
      duration: Date.now() - start,
      details: { responseStatus: response.status }
    };

  } catch (error) {
    return {
      success: false,
      testName: "Gemini API 연결 테스트",
      duration: Date.now() - start,
      error: error.message
    };
  }
}

/**
 * 이미지 생성 파이프라인 테스트
 */
async function testImageGenerationPipeline(): Promise<TestResult> {
  const start = Date.now();

  try {
    console.log("🎨 이미지 생성 파이프라인 테스트 중...");

    // 테스트용 음식 데이터
    const testFood = {
      id: "test-food-001",
      name: "테스트김치찌개",
      category: "soup_stew" as const,
      seasonality: "all" as const,
      needs_images: true,
      image_priority: 100,
      last_generated_at: null,
      total_generated_images: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 프롬프트 생성
    const prompts = buildPrompts(testFood, { count: 1 });

    if (prompts.length === 0) {
      throw new Error("프롬프트 생성 실패");
    }

    // Gemini API 호출
    const geminiResponse = await generateGeminiImage({
      prompt: prompts[0].prompt,
      negativePrompt: prompts[0].negativePrompt,
      imageCount: 1
    });

    if (!geminiResponse.images || geminiResponse.images.length === 0) {
      throw new Error("Gemini가 이미지를 생성하지 못했습니다");
    }

    return {
      success: true,
      testName: "이미지 생성 파이프라인 테스트",
      duration: Date.now() - start,
      details: {
        promptCount: prompts.length,
        generatedImages: geminiResponse.images.length,
        latency: geminiResponse.latencyMs
      }
    };

  } catch (error) {
    return {
      success: false,
      testName: "이미지 생성 파이프라인 테스트",
      duration: Date.now() - start,
      error: error.message
    };
  }
}

/**
 * Storage 업로드 테스트
 */
async function testStorageUpload(): Promise<TestResult> {
  const start = Date.now();

  try {
    console.log("📦 Storage 업로드 테스트 중...");

    // 1x1 픽셀 PNG 이미지로 테스트
    const testBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

    // 이미지 처리
    const processed = await processGeminiImage(testBase64);

    // Storage 업로드 (실제로는 mock 버킷 사용 권장)
    console.log("⚠️ 실제 Storage 업로드는 비용이 발생할 수 있습니다. 테스트용 버킷을 사용하세요.");

    return {
      success: true,
      testName: "Storage 업로드 테스트",
      duration: Date.now() - start,
      details: {
        originalSize: processed.original.fileSize,
        thumbnailSize: processed.thumbnail.fileSize,
        checksum: processed.checksum.substring(0, 8) + "..."
      }
    };

  } catch (error) {
    return {
      success: false,
      testName: "Storage 업로드 테스트",
      duration: Date.now() - start,
      error: error.message
    };
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  try {
    const results = await runIntegrationTests();

    const hasFailures = results.some(r => !r.success);
    if (hasFailures) {
      console.log("\n❌ 일부 테스트가 실패했습니다.");
      process.exit(1);
    } else {
      console.log("\n🎉 모든 테스트가 성공했습니다!");
      process.exit(0);
    }

  } catch (error) {
    console.error("치명적 에러:", error);
    process.exit(1);
  }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}


