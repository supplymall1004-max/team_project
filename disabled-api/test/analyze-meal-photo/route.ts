/**
 * @file app/api/test/analyze-meal-photo/route.ts
 * @description 식사 사진 분석 테스트용 API 라우트
 * 
 * 클라이언트에서 식사 사진을 분석하기 위한 서버 사이드 API 라우트입니다.
 * 이미지 URL 또는 Base64 데이터를 받아서 Gemini AI로 분석합니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeMealPhoto } from "@/lib/gemini/food-analyzer";
import { getHybridApiKey } from "@/lib/api-keys/get-user-api-key";

/**
 * GET /api/test/analyze-meal-photo
 * API 사용법 안내
 */
export async function GET() {
  return NextResponse.json({
    message: "식사 사진 분석 테스트 API",
    usage: {
      method: "POST",
      body: {
        imageBase64: "data:image/jpeg;base64,... (선택)",
        imageUrl: "https://example.com/image.jpg (선택)",
      },
      note: "imageBase64 또는 imageUrl 중 하나를 제공해주세요.",
    },
    testUrl: "http://localhost:3000/api/test/analyze-meal-photo",
  });
}

/**
 * POST /api/test/analyze-meal-photo
 * 식사 사진 분석 수행
 */
export async function POST(request: NextRequest) {
  console.group("[TEST] 식사 사진 분석 테스트 시작");
  
  try {
    // 1. API 키 확인
    const apiKey = await getHybridApiKey("gemini", "GEMINI_API_KEY");
    
    if (!apiKey) {
      console.error("❌ Gemini API 키가 설정되지 않았습니다.");
      console.groupEnd();
      return NextResponse.json(
        {
          success: false,
          error: "Gemini API 키가 설정되지 않았습니다.",
          message: ".env 파일에 GEMINI_API_KEY를 설정하거나 설정 페이지에서 API 키를 입력해주세요.",
        },
        { status: 400 }
      );
    }

    console.log("✅ API 키 확인 완료:", {
      키존재: true,
      키길이: apiKey.length,
      키접두사: apiKey.substring(0, 4),
    });

    // 2. 요청 본문에서 이미지 데이터 가져오기
    const body = await request.json();
    const { imageBase64, imageUrl } = body;

    let finalImageBase64 = imageBase64;

    // URL이 제공된 경우 이미지를 다운로드하여 Base64로 변환
    if (imageUrl && !imageBase64) {
      console.log("📥 이미지 URL에서 다운로드 중...", imageUrl);
      try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
        }
        
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";
        finalImageBase64 = `data:${mimeType};base64,${buffer.toString("base64")}`;
        
        console.log("✅ 이미지 다운로드 완료:", {
          크기: `${(buffer.length / 1024).toFixed(2)} KB`,
          타입: mimeType,
        });
      } catch (error) {
        console.error("❌ 이미지 다운로드 실패:", error);
        console.groupEnd();
        return NextResponse.json(
          {
            success: false,
            error: "이미지 다운로드 실패",
            details: error instanceof Error ? error.message : String(error),
          },
          { status: 400 }
        );
      }
    }

    if (!finalImageBase64) {
      console.error("❌ 이미지 데이터가 없습니다");
      console.groupEnd();
      return NextResponse.json(
        {
          success: false,
          error: "이미지 데이터가 필요합니다.",
          message: "imageBase64 또는 imageUrl 중 하나를 제공해주세요.",
        },
        { status: 400 }
      );
    }

    // 3. 이미지 데이터 검증
    const base64Data = finalImageBase64.includes(",")
      ? finalImageBase64.split(",")[1]
      : finalImageBase64;

    if (!base64Data || base64Data.length === 0) {
      console.error("❌ 유효하지 않은 이미지 데이터");
      console.groupEnd();
      return NextResponse.json(
        {
          success: false,
          error: "유효하지 않은 이미지 데이터입니다.",
        },
        { status: 400 }
      );
    }

    const imageSizeMB = (base64Data.length * 3) / 4 / 1024 / 1024;
    console.log("📸 이미지 데이터 검증 완료:", {
      크기: `${imageSizeMB.toFixed(2)} MB`,
      길이: `${base64Data.length} bytes`,
    });

    // 4. Gemini로 분석 수행
    console.log("🤖 Gemini AI 분석 시작...");
    const startTime = Date.now();
    
    const analysisResult = await analyzeMealPhoto(finalImageBase64);
    
    const elapsedTime = Date.now() - startTime;
    console.log(`✅ 분석 완료 (${elapsedTime}ms)`);

    // 5. 결과 반환
    console.log("📊 분석 결과:", {
      음식개수: analysisResult.foods.length,
      총칼로리: analysisResult.totalNutrition.calories,
    });

    console.groupEnd();

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      metadata: {
        elapsedTime,
        imageSizeMB: imageSizeMB.toFixed(2),
        foodsCount: analysisResult.foods.length,
      },
    });
  } catch (error) {
    console.error("[TEST] 분석 실패:", error);
    console.error("오류 상세:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    console.groupEnd();

    return NextResponse.json(
      {
        success: false,
        error: "분석 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

