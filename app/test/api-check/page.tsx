/**
 * @file app/test/api-check/page.tsx
 * @description API 엔드포인트 검증 테스트 페이지
 * 
 * 이 페이지는 다음 API 엔드포인트들을 테스트합니다:
 * 1. 사용자 관련 API
 * 2. 건강 정보 API
 * 3. 식단 관련 API
 * 4. 관리자 API
 * 5. 기타 API
 */

"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";

interface ApiTestResult {
  name: string;
  endpoint: string;
  method: string;
  status: "pending" | "success" | "error" | "warning";
  message: string;
  details?: string;
  duration?: number;
  statusCode?: number;
}

export default function ApiCheckPage() {
  const [results, setResults] = useState<ApiTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runApiTests = async () => {
    setIsRunning(true);
    setResults([]);

    const tests: Array<{
      name: string;
      endpoint: string;
      method: string;
      test: () => Promise<{
        success: boolean;
        message: string;
        details?: string;
        statusCode?: number;
      }>;
    }> = [
      {
        name: "사용자 정보 확인",
        endpoint: "/api/users/ensure",
        method: "POST",
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
                message: "사용자 정보 확인 성공",
                details: `응답 시간: ${duration}ms`,
                statusCode: response.status,
              };
            } else if (response.status === 401) {
              return {
                success: false,
                message: "인증 필요 (정상 - 로그인 필요)",
                details: `상태 코드: ${response.status}`,
                statusCode: response.status,
              };
            } else {
              return {
                success: false,
                message: `실패: ${data.message || data.error}`,
                details: `상태 코드: ${response.status}`,
                statusCode: response.status,
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
        name: "질병 목록 조회",
        endpoint: "/api/health/diseases",
        method: "GET",
        test: async () => {
          try {
            const startTime = Date.now();
            const response = await fetch("/api/health/diseases", {
              method: "GET",
            });
            const duration = Date.now() - startTime;
            const data = await response.json();

            if (response.ok && data.success) {
              return {
                success: true,
                message: `질병 목록 조회 성공 (${data.data?.length || 0}개)`,
                details: `응답 시간: ${duration}ms`,
                statusCode: response.status,
              };
            } else {
              return {
                success: false,
                message: `조회 실패: ${data.error || "알 수 없는 오류"}`,
                details: `상태 코드: ${response.status}`,
                statusCode: response.status,
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
        name: "알레르기 목록 조회",
        endpoint: "/api/health/allergies",
        method: "GET",
        test: async () => {
          try {
            const startTime = Date.now();
            const response = await fetch("/api/health/allergies", {
              method: "GET",
            });
            const duration = Date.now() - startTime;
            const data = await response.json();

            if (response.ok && data.success) {
              return {
                success: true,
                message: `알레르기 목록 조회 성공 (${data.data?.length || 0}개)`,
                details: `응답 시간: ${duration}ms`,
                statusCode: response.status,
              };
            } else {
              return {
                success: false,
                message: `조회 실패: ${data.error || "알 수 없는 오류"}`,
                details: `상태 코드: ${response.status}`,
                statusCode: response.status,
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
        name: "사용자 동기화",
        endpoint: "/api/sync-user",
        method: "POST",
        test: async () => {
          try {
            const startTime = Date.now();
            const response = await fetch("/api/sync-user", {
              method: "POST",
            });
            const duration = Date.now() - startTime;
            const data = await response.json();

            if (response.ok) {
              return {
                success: true,
                message: "사용자 동기화 성공",
                details: `응답 시간: ${duration}ms`,
                statusCode: response.status,
              };
            } else if (response.status === 401) {
              return {
                success: false,
                message: "인증 필요 (정상 - 로그인 필요)",
                details: `상태 코드: ${response.status}`,
                statusCode: response.status,
              };
            } else {
              return {
                success: false,
                message: `동기화 실패: ${data.message || data.error}`,
                details: `상태 코드: ${response.status}`,
                statusCode: response.status,
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
        name: "건강 프로필 조회",
        endpoint: "/api/health/profile",
        method: "GET",
        test: async () => {
          try {
            const startTime = Date.now();
            const response = await fetch("/api/health/profile", {
              method: "GET",
            });
            const duration = Date.now() - startTime;
            const data = await response.json();

            if (response.ok) {
              return {
                success: true,
                message: "건강 프로필 조회 성공",
                details: `응답 시간: ${duration}ms`,
                statusCode: response.status,
              };
            } else if (response.status === 401) {
              return {
                success: false,
                message: "인증 필요 (정상 - 로그인 필요)",
                details: `상태 코드: ${response.status}`,
                statusCode: response.status,
              };
            } else {
              return {
                success: false,
                message: `조회 실패: ${data.error || "알 수 없는 오류"}`,
                details: `상태 코드: ${response.status}`,
                statusCode: response.status,
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
        name: "KCDC 알림 조회",
        endpoint: "/api/health/kcdc/alerts",
        method: "GET",
        test: async () => {
          try {
            const startTime = Date.now();
            const response = await fetch("/api/health/kcdc/alerts", {
              method: "GET",
            });
            const duration = Date.now() - startTime;
            const data = await response.json();

            if (response.ok) {
              return {
                success: true,
                message: "KCDC 알림 조회 성공",
                details: `응답 시간: ${duration}ms`,
                statusCode: response.status,
              };
            } else {
              return {
                success: false,
                message: `조회 실패: ${data.error || "알 수 없는 오류"}`,
                details: `상태 코드: ${response.status}`,
                statusCode: response.status,
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
    ];

    const newResults: ApiTestResult[] = [];

    for (const test of tests) {
      // 테스트 시작
      newResults.push({
        name: test.name,
        endpoint: test.endpoint,
        method: test.method,
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
        endpoint: test.endpoint,
        method: test.method,
        status: result.success ? "success" : result.statusCode === 401 ? "warning" : "error",
        message: result.message,
        details: result.details,
        duration,
        statusCode: result.statusCode,
      };
      setResults([...newResults]);
    }

    setIsRunning(false);
  };

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const warningCount = results.filter((r) => r.status === "warning").length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API 엔드포인트 검증</h1>
        <p className="text-gray-600">
          주요 API 엔드포인트의 응답 상태와 성능을 확인합니다.
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
          onClick={runApiTests}
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
            &quot;테스트 시작&quot; 버튼을 클릭하여 API 엔드포인트를 검증하세요.
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
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{result.name}</h3>
                    <span className="text-xs px-2 py-0.5 bg-gray-200 rounded">
                      {result.method}
                    </span>
                    {result.statusCode && (
                      <span className="text-xs px-2 py-0.5 bg-gray-200 rounded">
                        {result.statusCode}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-1 font-mono">
                    {result.endpoint}
                  </p>
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
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="font-semibold mb-2">테스트 항목</h2>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>사용자 정보 확인 API</li>
          <li>건강 정보 API (질병, 알레르기)</li>
          <li>사용자 동기화 API</li>
          <li>건강 프로필 API</li>
          <li>KCDC 알림 API</li>
        </ul>
        <p className="text-xs text-gray-600 mt-2">
          참고: 인증이 필요한 API는 로그인 상태에서만 정상 작동합니다.
        </p>
      </div>
    </div>
  );
}


