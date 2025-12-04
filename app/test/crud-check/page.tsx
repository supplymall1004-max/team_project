/**
 * @file app/test/crud-check/page.tsx
 * @description 기본 CRUD 기능을 테스트하는 페이지
 * 
 * 이 페이지는 다음 CRUD 작업을 테스트합니다:
 * 1. 사용자 정보 조회 (Read)
 * 2. 홈페이지 콘텐츠 조회 (Read)
 * 3. 레시피 조회 (Read)
 * 4. 관리자 콘텐츠 조회 (Read)
 */

"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface TestResult {
  name: string;
  status: "pending" | "success" | "error";
  message: string;
  details?: string;
  duration?: number;
}

export default function CrudCheckPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    const tests: Array<{
      name: string;
      test: () => Promise<{ success: boolean; message: string; details?: string }>;
    }> = [
      {
        name: "사용자 정보 조회 (GET /api/users/ensure)",
        test: async () => {
          try {
            const startTime = Date.now();
            const response = await fetch("/api/users/ensure", {
              method: "POST",
            });
            const duration = Date.now() - startTime;
            const data = await response.json();

            if (response.ok) {
              return {
                success: true,
                message: "사용자 정보 조회 성공",
                details: `응답 시간: ${duration}ms`,
              };
            } else {
              return {
                success: false,
                message: `조회 실패: ${data.message || data.error}`,
                details: `상태 코드: ${response.status}`,
              };
            }
          } catch (error) {
            return {
              success: false,
              message: "API 호출 실패",
              details: error instanceof Error ? error.message : String(error),
            };
          }
        },
      },
      {
        name: "홈페이지 콘텐츠 조회",
        test: async () => {
          try {
            const startTime = Date.now();
            const response = await fetch("/api/admin/copy?slots=hero-title,hero-description", {
              method: "GET",
            });
            const duration = Date.now() - startTime;

            if (response.ok) {
              const data = await response.json();
              return {
                success: true,
                message: "홈페이지 콘텐츠 조회 성공",
                details: `응답 시간: ${duration}ms, 블록 수: ${Object.keys(data).length}`,
              };
            } else {
              return {
                success: false,
                message: `조회 실패: ${response.status}`,
                details: "API 엔드포인트 확인 필요",
              };
            }
          } catch (error) {
            return {
              success: false,
              message: "API 호출 실패",
              details: error instanceof Error ? error.message : String(error),
            };
          }
        },
      },
      {
        name: "레시피 목록 조회",
        test: async () => {
          try {
            const startTime = Date.now();
            // 레시피 조회 API가 있다고 가정 (실제 경로 확인 필요)
            const response = await fetch("/api/recipes?limit=5", {
              method: "GET",
            });
            const duration = Date.now() - startTime;

            if (response.ok) {
              const data = await response.json();
              return {
                success: true,
                message: "레시피 목록 조회 성공",
                details: `응답 시간: ${duration}ms`,
              };
            } else if (response.status === 404) {
              return {
                success: false,
                message: "레시피 API 엔드포인트 없음",
                details: "API 경로 확인 필요",
              };
            } else {
              return {
                success: false,
                message: `조회 실패: ${response.status}`,
              };
            }
          } catch (error) {
            return {
              success: false,
              message: "API 호출 실패",
              details: error instanceof Error ? error.message : String(error),
            };
          }
        },
      },
      {
        name: "데이터베이스 직접 조회 (users 테이블)",
        test: async () => {
          try {
            const startTime = Date.now();
            // Supabase 직접 조회는 서버 사이드에서만 가능하므로
            // 간접적으로 테스트 (사용자 동기화 API 사용)
            const response = await fetch("/api/sync-user", {
              method: "POST",
            });
            const duration = Date.now() - startTime;

            if (response.ok) {
              return {
                success: true,
                message: "데이터베이스 연결 성공",
                details: `응답 시간: ${duration}ms`,
              };
            } else {
              return {
                success: false,
                message: "데이터베이스 연결 실패",
                details: `상태 코드: ${response.status}`,
              };
            }
          } catch (error) {
            return {
              success: false,
              message: "데이터베이스 연결 오류",
              details: error instanceof Error ? error.message : String(error),
            };
          }
        },
      },
    ];

    const newResults: TestResult[] = [];

    for (const test of tests) {
      // 테스트 시작
      newResults.push({
        name: test.name,
        status: "pending",
        message: "테스트 실행 중...",
      });
      setResults([...newResults]);

      // 테스트 실행
      const startTime = Date.now();
      const result = await test.test();
      const duration = Date.now() - startTime;

      newResults[newResults.length - 1] = {
        name: test.name,
        status: result.success ? "success" : "error",
        message: result.message,
        details: result.details,
        duration,
      };
      setResults([...newResults]);
    }

    setIsRunning(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">CRUD 기능 테스트</h1>
        <p className="text-gray-600">
          기본적인 데이터 조회(Read) 기능을 테스트합니다.
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              테스트 실행 중...
            </>
          ) : (
            "테스트 시작"
          )}
        </button>
      </div>

      <div className="space-y-4">
        {results.length === 0 && !isRunning && (
          <div className="text-center py-12 text-gray-500">
            &quot;테스트 시작&quot; 버튼을 클릭하여 CRUD 기능을 테스트하세요.
          </div>
        )}

        {results.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              result.status === "success"
                ? "bg-green-50 border-green-200"
                : result.status === "error"
                  ? "bg-red-50 border-red-200"
                  : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {result.status === "pending" ? (
                <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
              ) : result.status === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">{result.name}</h3>
                <p className="text-sm text-gray-700">{result.message}</p>
                {result.details && (
                  <p className="text-xs text-gray-500 mt-1">{result.details}</p>
                )}
                {result.duration !== undefined && (
                  <p className="text-xs text-gray-500 mt-1">
                    소요 시간: {result.duration}ms
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="font-semibold mb-2">테스트 항목</h2>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>사용자 정보 조회 (Read)</li>
          <li>홈페이지 콘텐츠 조회 (Read)</li>
          <li>레시피 목록 조회 (Read)</li>
          <li>데이터베이스 연결 확인</li>
        </ul>
        <p className="text-xs text-gray-600 mt-2">
          참고: 현재는 Read 작업만 테스트합니다. Create, Update, Delete는 관리자 콘솔에서 테스트하세요.
        </p>
      </div>
    </div>
  );
}


