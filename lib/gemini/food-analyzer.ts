/**
 * @file lib/gemini/food-analyzer.ts
 * @description Gemini 멀티모달을 사용한 식사 사진 분석
 *
 * 사용자가 업로드한 식사 사진을 분석하여 음식을 인식하고 영양소를 계산합니다.
 * 거부감 없는 자연스러운 분석 경험을 제공합니다.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getHybridApiKey } from "@/lib/api-keys/get-user-api-key";

export interface FoodAnalysisResult {
  foods: Array<{
    name: string;
    confidence: number; // 0-1
    estimatedQuantity: string; // "1인분", "200g" 등
    calories: number;
    protein: number; // g
    carbs: number; // g
    fat: number; // g
    sodium?: number; // mg
  }>;
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sodium?: number;
  };
  analysisNotes?: string; // 분석 시 주의사항이나 추가 정보
}

/**
 * 식사 사진 분석 (Gemini 멀티모달)
 * 
 * @param imageBase64 Base64 인코딩된 이미지 데이터 (data:image/jpeg;base64,... 형식)
 * @returns 분석 결과
 */
export async function analyzeMealPhoto(
  imageBase64: string
): Promise<FoodAnalysisResult> {
  console.group("[FoodAnalyzer] 식사 사진 분석 시작");

  try {
    // 하이브리드 방식: 사용자 API 키 우선, 없으면 환경 변수
    const apiKey = await getHybridApiKey("gemini", "GEMINI_API_KEY");
    
    if (!apiKey) {
      console.error("❌ Gemini API 키가 설정되지 않았습니다.");
      console.error("💡 설정 페이지에서 API 키를 입력하거나 .env 파일에 GEMINI_API_KEY를 설정해주세요.");
      throw new Error(
        "Gemini API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 입력하거나 .env 파일을 확인해주세요."
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Base64 데이터에서 실제 데이터 부분만 추출
    const base64Data = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    // 프롬프트: 자연스럽고 친근한 톤으로 작성 (거부감 없게)
    const prompt = `이 식사 사진을 보고 음식과 영양소를 분석해주세요. 

사진에 보이는 모든 음식을 식별하고, 각 음식의 영양소 정보를 제공해주세요.

응답 형식 (JSON만 반환):
{
  "foods": [
    {
      "name": "음식 이름 (한글, 예: '된장찌개', '밥', '김치')",
      "confidence": 0.0-1.0,
      "estimatedQuantity": "예상 분량 (예: '1인분', '200g')",
      "calories": 숫자,
      "protein": 숫자,
      "carbs": 숫자,
      "fat": 숫자,
      "sodium": 숫자 (선택)
    }
  ],
  "totalNutrition": {
    "calories": 숫자,
    "protein": 숫자,
    "carbs": 숫자,
    "fat": 숫자,
    "sodium": 숫자 (선택)
  },
  "analysisNotes": "추가 정보 (선택)"
}

가이드:
- 한국 음식 위주로 분석
- 불확실하면 신뢰도 낮게 설정
- 일반적인 1인분 기준 영양소
- JSON만 반환 (설명 없이)`;

    // 이미지 MIME 타입 감지
    const mimeType = detectImageMimeType(imageBase64);

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const text = response.text();

    console.log("[FoodAnalyzer] Gemini 응답:", text);

    // JSON 파싱
    let analysisResult: FoodAnalysisResult;
    try {
      // JSON 코드 블록 제거 (```json ... ```)
      const jsonText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      analysisResult = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("[FoodAnalyzer] JSON 파싱 실패:", parseError);
      // 파싱 실패 시 기본값 반환
      analysisResult = {
        foods: [],
        totalNutrition: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
        analysisNotes: "분석 중 오류가 발생했습니다. 다시 시도해주세요.",
      };
    }

    console.log("[FoodAnalyzer] 분석 완료:", {
      음식개수: analysisResult.foods.length,
      총칼로리: analysisResult.totalNutrition.calories,
    });
    console.groupEnd();

    return analysisResult;
  } catch (error) {
    console.error("[FoodAnalyzer] 분석 실패:", error);
    console.groupEnd();

    // 에러 발생 시 기본값 반환
    return {
      foods: [],
      totalNutrition: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      },
      analysisNotes: "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    };
  }
}

/**
 * 이미지 MIME 타입 감지
 */
export function detectImageMimeType(base64Data: string): string {
  if (base64Data.startsWith("data:image/")) {
    const match = base64Data.match(/data:image\/([^;]+)/);
    return match ? `image/${match[1]}` : "image/jpeg";
  }
  return "image/jpeg"; // 기본값
}

