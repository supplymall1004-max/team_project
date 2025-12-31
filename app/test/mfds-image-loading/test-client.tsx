/**
 * @file app/test/mfds-image-loading/test-client.tsx
 * @description 식약처 이미지 URL 로딩 테스트 클라이언트 컴포넌트
 */

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { loadRecipeBySeq } from "@/lib/mfds/recipe-loader";
import type { MfdsRecipe } from "@/types/mfds-recipe";

interface ImageLoadResult {
  url: string;
  type: string;
  success: boolean;
  error?: string;
  loading: boolean;
}

export function MfdsImageLoadingTestClient() {
  const [recipe, setRecipe] = useState<MfdsRecipe | null>(null);
  const [rcpSeq, setRcpSeq] = useState("201");
  const [loading, setLoading] = useState(false);
  const [imageResults, setImageResults] = useState<ImageLoadResult[]>([]);

  // 레시피 로드
  const loadRecipe = async () => {
    setLoading(true);
    setImageResults([]);
    
    try {
      console.group("[ImageLoadingTest] 레시피 로드");
      console.log("RCP_SEQ:", rcpSeq);
      
      const loadedRecipe = loadRecipeBySeq(rcpSeq);
      
      if (!loadedRecipe) {
        alert(`레시피를 찾을 수 없습니다: ${rcpSeq}`);
        return;
      }
      
      console.log("✅ 레시피 로드 성공:", loadedRecipe.title);
      console.log("대표 이미지 URL:", loadedRecipe.images.mainImageUrl);
      console.log("만드는 법 이미지 URL:", loadedRecipe.images.mkImageUrl);
      
      setRecipe(loadedRecipe);
      
      // 이미지 로딩 테스트
      await testImageLoading(loadedRecipe);
      
      console.groupEnd();
    } catch (error) {
      console.error("❌ 레시피 로드 실패:", error);
      alert(`레시피 로드 실패: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // 이미지 로딩 테스트
  const testImageLoading = async (recipeData: MfdsRecipe) => {
    console.group("[ImageLoadingTest] 이미지 로딩 테스트");
    
    const results: ImageLoadResult[] = [];
    
    // 1. 대표 이미지 테스트
    if (recipeData.images.mainImageUrl) {
      const result = await testSingleImage(
        recipeData.images.mainImageUrl,
        "대표 이미지",
        recipeData.images.mainImageOriginalUrl || undefined
      );
      results.push(result);
    }
    
    // 2. 만드는 법 이미지 테스트
    if (recipeData.images.mkImageUrl) {
      const result = await testSingleImage(
        recipeData.images.mkImageUrl,
        "만드는 법 이미지",
        recipeData.images.mkImageOriginalUrl || undefined
      );
      results.push(result);
    }
    
    // 3. 조리법 이미지 테스트 (최대 5개)
    for (let i = 0; i < Math.min(5, recipeData.steps.length); i++) {
      const step = recipeData.steps[i];
      if (step.imageUrl) {
        const result = await testSingleImage(
          step.imageUrl,
          `조리법 이미지 ${step.step}`,
          step.originalImageUrl || undefined
        );
        results.push(result);
      }
    }
    
    console.log("✅ 이미지 로딩 테스트 완료:", results);
    setImageResults(results);
    console.groupEnd();
  };

  // 단일 이미지 로딩 테스트
  const testSingleImage = async (
    imageUrl: string,
    type: string,
    originalUrl?: string
  ): Promise<ImageLoadResult> => {
    console.log(`[ImageLoadingTest] 이미지 로딩 테스트: ${type} - ${imageUrl}`);
    
    const result: ImageLoadResult = {
      url: imageUrl,
      type,
      success: false,
      loading: true,
    };

    try {
      // 이미지 로드 시도
      const response = await fetch(imageUrl, { method: "HEAD" });
      
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.startsWith("image/")) {
          result.success = true;
          console.log(`✅ 이미지 로드 성공: ${imageUrl}`);
        } else {
          result.error = `이미지가 아닌 파일입니다 (${contentType})`;
          console.warn(`⚠️ 이미지가 아님: ${imageUrl}`);
        }
      } else {
        result.error = `HTTP ${response.status}: ${response.statusText}`;
        console.error(`❌ 이미지 로드 실패: ${imageUrl} - ${result.error}`);
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      console.error(`❌ 이미지 로드 오류: ${imageUrl} - ${result.error}`);
    } finally {
      result.loading = false;
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
            onClick={loadRecipe}
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
            <p><strong>ID:</strong> {recipe.frontmatter.rcp_seq}</p>
            <p><strong>이름:</strong> {recipe.title}</p>
            <p><strong>조리방법:</strong> {recipe.frontmatter.rcp_way2}</p>
            <p><strong>요리종류:</strong> {recipe.frontmatter.rcp_pat2}</p>
          </div>
        </div>
      )}

      {/* 이미지 로딩 결과 */}
      {imageResults.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">이미지 로딩 결과</h2>
          <div className="space-y-4">
            {imageResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${
                  result.success
                    ? "border-green-500 bg-green-50"
                    : result.loading
                      ? "border-yellow-500 bg-yellow-50"
                      : "border-red-500 bg-red-50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="font-semibold">{result.type}</p>
                    <p className="text-sm text-gray-600 break-all mt-1">
                      API URL: {result.url}
                    </p>
                    {result.error && (
                      <p className="text-sm text-red-600 mt-1">
                        오류: {result.error}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {result.loading ? (
                      <span className="text-yellow-600 font-semibold">⏳ 로딩 중</span>
                    ) : result.success ? (
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
                    <div className="relative w-full h-48 border border-gray-300 rounded overflow-hidden bg-gray-100">
                      <Image
                        src={result.url}
                        alt={result.type}
                        fill
                        className="object-contain"
                        unoptimized
                        onError={(e) => {
                          console.error("이미지 렌더링 오류:", result.url);
                          const target = e.target as HTMLImageElement;
                          if (target.parentElement) {
                            target.parentElement.innerHTML = `
                              <div class="flex items-center justify-center h-full text-red-600">
                                이미지 렌더링 실패
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
              실패: {imageResults.filter((r) => !r.success && !r.loading).length} /{" "}
              {imageResults.length}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              💡 로컬 파일이 없어도 이미지 API가 식약처 API에서 자동으로 이미지를 가져옵니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}







