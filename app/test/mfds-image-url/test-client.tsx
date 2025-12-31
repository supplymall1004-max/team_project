/**
 * @file app/test/mfds-image-url/test-client.tsx
 * @description 식약처 이미지 URL 테스트 클라이언트 컴포넌트
 */

"use client";

import { useState } from "react";
import type { FoodSafetyRecipeRow } from "@/lib/recipes/foodsafety-api";
import Image from "next/image";

interface ImageTestResult {
  url: string;
  type: "main" | "mk" | "manual";
  stepNumber?: number;
  success: boolean;
  error?: string;
  loaded: boolean;
}

export function MfdsImageUrlTestClient() {
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<FoodSafetyRecipeRow | null>(null);
  const [imageResults, setImageResults] = useState<ImageTestResult[]>([]);
  const [rcpSeq, setRcpSeq] = useState("201");

  // 레시피 데이터 가져오기
  const fetchRecipe = async () => {
    setLoading(true);
    setImageResults([]);
    
    try {
      console.group("[ImageUrlTest] 레시피 데이터 가져오기");
      console.log("RCP_SEQ:", rcpSeq);
      
      // API 라우트를 통해 서버 사이드에서 식약처 API 호출
      const apiUrl = `/api/test/mfds-recipe?rcpSeq=${encodeURIComponent(rcpSeq)}&startIdx=1&endIdx=1000`;
      console.log("API URL:", apiUrl);
      
      const response = await fetch(apiUrl);
      const result = await response.json();

      console.log("API 응답:", result);

      if (result.success && result.data && result.data.length > 0) {
        const foundRecipe = result.data[0] as FoodSafetyRecipeRow;
        console.log("✅ 레시피 데이터 가져오기 성공:", foundRecipe.RCP_NM);
        console.log("대표 이미지 URL:", foundRecipe.ATT_FILE_NO_MAIN);
        console.log("만드는 법 이미지 URL:", foundRecipe.ATT_FILE_NO_MK);
        
        setRecipe(foundRecipe);
        
        // 이미지 URL 테스트 시작
        await testImageUrls(foundRecipe);
      } else {
        console.error("❌ 레시피를 찾을 수 없습니다:", result.error);
        alert(`레시피를 찾을 수 없습니다: ${rcpSeq}\n오류: ${result.error || "알 수 없는 오류"}`);
      }
      
      console.groupEnd();
    } catch (error) {
      console.error("❌ 레시피 가져오기 실패:", error);
      alert(`레시피 가져오기 실패: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // 이미지 URL 테스트
  const testImageUrls = async (recipeData: FoodSafetyRecipeRow) => {
    console.group("[ImageUrlTest] 이미지 URL 테스트 시작");
    
    const results: ImageTestResult[] = [];
    
    // 1. 대표 이미지 테스트
    if (recipeData.ATT_FILE_NO_MAIN) {
      const result = await testSingleImage(
        recipeData.ATT_FILE_NO_MAIN,
        "main"
      );
      results.push(result);
    }
    
    // 2. 만드는 법 이미지 테스트
    if (recipeData.ATT_FILE_NO_MK) {
      const result = await testSingleImage(
        recipeData.ATT_FILE_NO_MK,
        "mk"
      );
      results.push(result);
    }
    
    // 3. 조리법 이미지 테스트 (최대 5개만)
    for (let i = 1; i <= 5; i++) {
      const manualImgKey = `MANUAL_IMG${String(i).padStart(2, "0")}` as keyof FoodSafetyRecipeRow;
      const manualImg = recipeData[manualImgKey] as string | null;
      
      if (manualImg && manualImg.trim() !== "") {
        const result = await testSingleImage(
          manualImg,
          "manual",
          i
        );
        results.push(result);
      }
    }
    
    console.log("✅ 이미지 테스트 완료:", results);
    setImageResults(results);
    console.groupEnd();
  };

  // 단일 이미지 테스트
  const testSingleImage = async (
    url: string,
    type: "main" | "mk" | "manual",
    stepNumber?: number
  ): Promise<ImageTestResult> => {
    console.log(`[ImageUrlTest] 이미지 테스트: ${type} ${stepNumber || ""} - ${url}`);
    
    const result: ImageTestResult = {
      url,
      type,
      stepNumber,
      success: false,
      loaded: false,
    };

    try {
      // CORS 문제를 피하기 위해 프록시 API 사용
      const proxyUrl = `/api/test/image-proxy?url=${encodeURIComponent(url)}`;
      
      const response = await fetch(proxyUrl);
      
      if (response.ok) {
        const blob = await response.blob();
        if (blob.type.startsWith("image/")) {
          result.success = true;
          result.loaded = true;
          console.log(`✅ 이미지 로드 성공: ${url}`);
        } else {
          result.error = "이미지가 아닌 파일입니다";
          console.warn(`⚠️ 이미지가 아님: ${url}`);
        }
      } else {
        result.error = `HTTP ${response.status}: ${response.statusText}`;
        console.error(`❌ 이미지 로드 실패: ${url} - ${result.error}`);
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      console.error(`❌ 이미지 로드 오류: ${url} - ${result.error}`);
    }

    return result;
  };

  return (
    <div className="space-y-6">
      {/* 입력 폼 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">레시피 선택</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={rcpSeq}
            onChange={(e) => setRcpSeq(e.target.value)}
            placeholder="레시피 ID (예: 201)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={fetchRecipe}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? "로딩 중..." : "테스트 시작"}
          </button>
        </div>
      </div>

      {/* 레시피 정보 */}
      {recipe && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">레시피 정보</h2>
          <div className="space-y-2">
            <p><strong>ID:</strong> {recipe.RCP_SEQ}</p>
            <p><strong>이름:</strong> {recipe.RCP_NM}</p>
            <p><strong>조리방법:</strong> {recipe.RCP_WAY2}</p>
            <p><strong>요리종류:</strong> {recipe.RCP_PAT2}</p>
          </div>
        </div>
      )}

      {/* 이미지 테스트 결과 */}
      {imageResults.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">이미지 테스트 결과</h2>
          <div className="space-y-4">
            {imageResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${
                  result.success
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="font-semibold">
                      {result.type === "main"
                        ? "대표 이미지"
                        : result.type === "mk"
                          ? "만드는 법 이미지"
                          : `조리법 이미지 ${result.stepNumber}`}
                    </p>
                    <p className="text-sm text-gray-600 break-all mt-1">
                      {result.url}
                    </p>
                    {result.error && (
                      <p className="text-sm text-red-600 mt-1">
                        오류: {result.error}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {result.success ? (
                      <span className="text-green-600 font-semibold">✅ 성공</span>
                    ) : (
                      <span className="text-red-600 font-semibold">❌ 실패</span>
                    )}
                  </div>
                </div>
                
                {/* 이미지 미리보기 */}
                {result.success && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold mb-2">이미지 미리보기:</p>
                    <div className="relative w-full h-48 border border-gray-300 rounded overflow-hidden">
                      <Image
                        src={result.url}
                        alt={`${result.type} ${result.stepNumber || ""}`}
                        fill
                        className="object-contain"
                        unoptimized
                        onError={(e) => {
                          console.error("이미지 렌더링 오류:", result.url);
                          const target = e.target as HTMLImageElement;
                          if (target.parentElement) {
                            target.parentElement.innerHTML = `
                              <div class="flex items-center justify-center h-full text-red-600">
                                이미지 로드 실패
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* 요약 */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <p className="font-semibold">테스트 요약:</p>
            <p>
              성공: {imageResults.filter((r) => r.success).length} /{" "}
              {imageResults.length}
            </p>
            <p>
              실패: {imageResults.filter((r) => !r.success).length} /{" "}
              {imageResults.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

