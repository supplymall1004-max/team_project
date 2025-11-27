/**
 * @file app/test/foodsafety/page.tsx
 * @description 식약처 API 연결 테스트 페이지
 * 
 * 이 페이지에서 식약처 API 연결 상태를 확인할 수 있습니다.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  totalCount?: string;
  sampleRecipes?: Array<{
    name: string;
    calories: string;
    category: string;
  }>;
  details?: string;
  rawData?: any;
}

export default function FoodSafetyTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const handleTest = async () => {
    console.group("🧪 식약처 API 테스트 시작");
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test/foodsafety");
      const data = await response.json();

      console.log("테스트 결과:", data);
      setResult(data);
    } catch (error) {
      console.error("테스트 요청 실패:", error);
      setResult({
        success: false,
        error: "테스트 요청 중 오류가 발생했습니다.",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔍 식약처 API 연결 테스트</h1>
        <p className="text-gray-600">
          .env 파일에 설정된 식약처 API 키가 정상적으로 작동하는지 확인합니다.
        </p>
      </div>

      <Card className="p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">테스트 정보</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>API: 식품안전나라 조리식품 레시피 조회 서비스</li>
            <li>환경 변수: <code className="bg-gray-100 px-2 py-1 rounded">FOOD_SAFETY_RECIPE_API_KEY</code></li>
            <li>엔드포인트: <code className="bg-gray-100 px-2 py-1 rounded">/api/test/foodsafety</code></li>
          </ul>
        </div>

        <Button 
          onClick={handleTest} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              테스트 중...
            </>
          ) : (
            "API 연결 테스트 시작"
          )}
        </Button>
      </Card>

      {result && (
        <Card className="p-6">
          <div className="flex items-center mb-4">
            {result.success ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                <h2 className="text-xl font-semibold text-green-700">
                  ✅ 연결 성공!
                </h2>
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-red-500 mr-2" />
                <h2 className="text-xl font-semibold text-red-700">
                  ❌ 연결 실패
                </h2>
              </>
            )}
          </div>

          {result.message && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">{result.message}</p>
            </div>
          )}

          {result.error && (
            <div className="mb-4 p-4 bg-red-50 rounded-lg">
              <p className="text-red-800 font-medium">오류: {result.error}</p>
              {result.details && (
                <p className="text-red-700 text-sm mt-2">{result.details}</p>
              )}
            </div>
          )}

          {result.success && result.totalCount && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">📊 데이터베이스 정보</h3>
              <p className="text-gray-700">
                전체 레시피 수: <span className="font-bold">{result.totalCount}개</span>
              </p>
            </div>
          )}

          {result.sampleRecipes && result.sampleRecipes.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">🍳 샘플 레시피</h3>
              <div className="space-y-2">
                {result.sampleRecipes.map((recipe, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded">
                    <p className="font-medium">{recipe.name}</p>
                    <div className="text-sm text-gray-600 flex gap-4 mt-1">
                      <span>칼로리: {recipe.calories}</span>
                      <span>종류: {recipe.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.rawData && (
            <div className="mt-4">
              <details className="cursor-pointer">
                <summary className="font-semibold text-sm text-gray-600 mb-2">
                  🔧 원본 응답 데이터 보기
                </summary>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
                  {JSON.stringify(result.rawData, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {!result.success && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-2">💡 해결 방법:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>.env 파일에 <code className="bg-yellow-100 px-1 rounded">FOOD_SAFETY_RECIPE_API_KEY</code>가 설정되어 있는지 확인</li>
                    <li><a href="https://www.foodsafetykorea.go.kr/api/" target="_blank" rel="noopener noreferrer" className="underline">식품안전나라</a>에서 API 키 발급 및 승인 상태 확인</li>
                    <li>개발 서버 재시작 (환경 변수 변경 후)</li>
                    <li>브라우저 개발자 도구(F12) 콘솔에서 상세 로그 확인</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card className="p-6 mt-6 bg-gray-50">
        <h3 className="font-semibold mb-2">📝 환경 설정 가이드</h3>
        <p className="text-sm text-gray-700 mb-2">
          .env 파일에 다음과 같이 설정하세요:
        </p>
        <pre className="bg-gray-800 text-gray-100 p-3 rounded text-sm">
{`# 식약처 API (식품안전나라)
FOOD_SAFETY_RECIPE_API_KEY=your_api_key_here`}
        </pre>
        <p className="text-xs text-gray-600 mt-3">
          * API 키는 <a href="https://www.foodsafetykorea.go.kr/api/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">식품안전나라 공공데이터포털</a>에서 발급받을 수 있습니다.
        </p>
      </Card>
    </div>
  );
}

