/**
 * @file app/test/data-check/page.tsx
 * @description 테스트 데이터 검증 페이지
 * 
 * 이 페이지는 다음을 검증합니다:
 * 1. 레시피 데이터 검증
 * 2. 가족 구성원 데이터 검증
 * 3. 식단 계획 데이터 검증
 * 4. 주간 식단 데이터 검증
 * 5. 데이터 일관성 검증
 */

"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2, AlertCircle, Database } from "lucide-react";

interface DataCheckResult {
  name: string;
  status: "pending" | "success" | "error" | "warning";
  message: string;
  details?: string;
  count?: number;
}

export default function DataCheckPage() {
  const [results, setResults] = useState<DataCheckResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDataChecks = async () => {
    setIsRunning(true);
    setResults([]);

    const checks: DataCheckResult[] = [];

    try {
      // 1. 레시피 데이터 검증
      checks.push({
        name: "레시피 데이터",
        status: "pending",
        message: "검증 중...",
      });
      setResults([...checks]);

      const recipesResponse = await fetch("/api/test/recipes-check");
      if (recipesResponse.ok) {
        const recipesData = await recipesResponse.json();
        checks[checks.length - 1] = {
          name: "레시피 데이터",
          status: "success",
          message: `레시피 ${recipesData.count || 0}개 확인됨`,
          details: recipesData.details,
          count: recipesData.count,
        };
      } else {
        checks[checks.length - 1] = {
          name: "레시피 데이터",
          status: "error",
          message: "레시피 데이터 조회 실패",
          details: `상태 코드: ${recipesResponse.status}`,
        };
      }
      setResults([...checks]);

      // 2. 레시피 재료 데이터 검증
      checks.push({
        name: "레시피 재료 데이터",
        status: "pending",
        message: "검증 중...",
      });
      setResults([...checks]);

      const ingredientsResponse = await fetch("/api/test/ingredients-check");
      if (ingredientsResponse.ok) {
        const ingredientsData = await ingredientsResponse.json();
        checks[checks.length - 1] = {
          name: "레시피 재료 데이터",
          status: "success",
          message: `재료 ${ingredientsData.count || 0}개 확인됨`,
          details: ingredientsData.details,
          count: ingredientsData.count,
        };
      } else {
        checks[checks.length - 1] = {
          name: "레시피 재료 데이터",
          status: "error",
          message: "재료 데이터 조회 실패",
        };
      }
      setResults([...checks]);

      // 3. 가족 구성원 데이터 검증
      checks.push({
        name: "가족 구성원 데이터",
        status: "pending",
        message: "검증 중...",
      });
      setResults([...checks]);

      const familyResponse = await fetch("/api/test/family-check");
      if (familyResponse.ok) {
        const familyData = await familyResponse.json();
        checks[checks.length - 1] = {
          name: "가족 구성원 데이터",
          status: familyData.count > 0 ? "success" : "warning",
          message: `가족 구성원 ${familyData.count || 0}명 확인됨`,
          details: familyData.details,
          count: familyData.count,
        };
      } else {
        checks[checks.length - 1] = {
          name: "가족 구성원 데이터",
          status: "error",
          message: "가족 구성원 데이터 조회 실패",
        };
      }
      setResults([...checks]);

      // 4. 식단 계획 데이터 검증
      checks.push({
        name: "식단 계획 데이터",
        status: "pending",
        message: "검증 중...",
      });
      setResults([...checks]);

      const dietPlansResponse = await fetch("/api/test/diet-plans-check");
      if (dietPlansResponse.ok) {
        const dietPlansData = await dietPlansResponse.json();
        checks[checks.length - 1] = {
          name: "식단 계획 데이터",
          status: dietPlansData.count > 0 ? "success" : "warning",
          message: `식단 계획 ${dietPlansData.count || 0}개 확인됨`,
          details: dietPlansData.details,
          count: dietPlansData.count,
        };
      } else {
        checks[checks.length - 1] = {
          name: "식단 계획 데이터",
          status: "error",
          message: "식단 계획 데이터 조회 실패",
        };
      }
      setResults([...checks]);

      // 5. 주간 식단 데이터 검증
      checks.push({
        name: "주간 식단 데이터",
        status: "pending",
        message: "검증 중...",
      });
      setResults([...checks]);

      const weeklyResponse = await fetch("/api/test/weekly-diet-check");
      if (weeklyResponse.ok) {
        const weeklyData = await weeklyResponse.json();
        checks[checks.length - 1] = {
          name: "주간 식단 데이터",
          status: weeklyData.count > 0 ? "success" : "warning",
          message: `주간 식단 ${weeklyData.count || 0}개 확인됨`,
          details: weeklyData.details,
          count: weeklyData.count,
        };
      } else {
        checks[checks.length - 1] = {
          name: "주간 식단 데이터",
          status: "error",
          message: "주간 식단 데이터 조회 실패",
        };
      }
      setResults([...checks]);

      // 6. 데이터 일관성 검증
      checks.push({
        name: "데이터 일관성",
        status: "pending",
        message: "검증 중...",
      });
      setResults([...checks]);

      const consistencyResponse = await fetch("/api/test/consistency-check");
      if (consistencyResponse.ok) {
        const consistencyData = await consistencyResponse.json();
        checks[checks.length - 1] = {
          name: "데이터 일관성",
          status: consistencyData.isValid ? "success" : "warning",
          message: consistencyData.isValid
            ? "데이터 일관성 확인됨"
            : "일관성 문제 발견",
          details: consistencyData.details,
        };
      } else {
        checks[checks.length - 1] = {
          name: "데이터 일관성",
          status: "error",
          message: "일관성 검증 실패",
        };
      }
      setResults([...checks]);
    } catch (error) {
      console.error("데이터 검증 오류:", error);
    }

    setIsRunning(false);
  };

  useEffect(() => {
    // 자동으로 검증 실행
    runDataChecks();
  }, []);

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const warningCount = results.filter((r) => r.status === "warning").length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Database className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">테스트 데이터 검증</h1>
        </div>
        <p className="text-gray-600">
          Phase 2에서 생성된 테스트 데이터의 무결성과 일관성을 확인합니다.
        </p>
      </div>

      {results.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-700">{successCount}</div>
            <div className="text-sm text-green-600">성공</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-700">{warningCount}</div>
            <div className="text-sm text-yellow-600">경고</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-700">{errorCount}</div>
            <div className="text-sm text-red-600">오류</div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={runDataChecks}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              검증 실행 중...
            </>
          ) : (
            "다시 검증하기"
          )}
        </button>
      </div>

      <div className="space-y-4">
        {results.length === 0 && !isRunning && (
          <div className="text-center py-12 text-gray-500">
            검증이 자동으로 시작됩니다...
          </div>
        )}

        {results.map((result, index) => {
          const iconMap = {
            success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
            error: <XCircle className="h-5 w-5 text-red-500" />,
            warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
            pending: <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />,
          };

          const bgColorMap = {
            success: "bg-green-50 border-green-200",
            error: "bg-red-50 border-red-200",
            warning: "bg-yellow-50 border-yellow-200",
            pending: "bg-gray-50 border-gray-200",
          };

          return (
            <div
              key={index}
              className={`p-4 rounded-lg border ${bgColorMap[result.status]}`}
            >
              <div className="flex items-start gap-3">
                {iconMap[result.status]}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm">{result.name}</h3>
                    {result.count !== undefined && (
                      <span className="text-xs px-2 py-1 bg-gray-200 rounded">
                        {result.count}개
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{result.message}</p>
                  {result.details && (
                    <p className="text-xs text-gray-500 mt-1">{result.details}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="font-semibold mb-2">검증 항목</h2>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>레시피 데이터 존재 및 무결성</li>
          <li>레시피 재료 데이터 존재 및 연결</li>
          <li>가족 구성원 데이터 존재</li>
          <li>식단 계획 데이터 존재 및 날짜 범위</li>
          <li>주간 식단 메타데이터 및 통계</li>
          <li>데이터 간 외래키 일관성</li>
        </ul>
      </div>
    </div>
  );
}


