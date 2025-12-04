/**
 * @file app/test/final-check/page.tsx
 * @description 최종 종합 검증 페이지
 * 
 * 이 페이지는 모든 Phase의 검증을 종합하여 최종 상태를 확인합니다:
 * 1. Phase 1: 기본 기능 검증
 * 2. Phase 2: 데이터 완성 검증
 * 3. Phase 3: 성능 최적화 검증
 */

"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2, AlertCircle, CheckSquare } from "lucide-react";
import Link from "next/link";

interface FinalCheckResult {
  phase: string;
  name: string;
  status: "pending" | "success" | "error" | "warning";
  message: string;
  details?: string;
  link?: string;
}

export default function FinalCheckPage() {
  const [results, setResults] = useState<FinalCheckResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runFinalChecks = async () => {
    setIsRunning(true);
    setResults([]);

    const checks: FinalCheckResult[] = [];

    // Phase 1: 기본 기능 검증
    checks.push({
      phase: "Phase 1",
      name: "시스템 상태 확인",
      status: "pending",
      message: "검증 중...",
      link: "/test/system-check",
    });
    setResults([...checks]);

    try {
      const systemResponse = await fetch("/test/system-check");
      checks[checks.length - 1] = {
        phase: "Phase 1",
        name: "시스템 상태 확인",
        status: systemResponse.ok ? "success" : "warning",
        message: systemResponse.ok
          ? "시스템 상태 확인 페이지 접근 가능"
          : "페이지 접근 확인 필요",
        link: "/test/system-check",
      };
    } catch {
      checks[checks.length - 1] = {
        phase: "Phase 1",
        name: "시스템 상태 확인",
        status: "error",
        message: "페이지 접근 실패",
        link: "/test/system-check",
      };
    }
    setResults([...checks]);

    checks.push({
      phase: "Phase 1",
      name: "CRUD 기능 테스트",
      status: "pending",
      message: "검증 중...",
      link: "/test/crud-check",
    });
    setResults([...checks]);

    try {
      const crudResponse = await fetch("/test/crud-check");
      checks[checks.length - 1] = {
        phase: "Phase 1",
        name: "CRUD 기능 테스트",
        status: crudResponse.ok ? "success" : "warning",
        message: crudResponse.ok
          ? "CRUD 테스트 페이지 접근 가능"
          : "페이지 접근 확인 필요",
        link: "/test/crud-check",
      };
    } catch {
      checks[checks.length - 1] = {
        phase: "Phase 1",
        name: "CRUD 기능 테스트",
        status: "error",
        message: "페이지 접근 실패",
        link: "/test/crud-check",
      };
    }
    setResults([...checks]);

    checks.push({
      phase: "Phase 1",
      name: "API 엔드포인트 검증",
      status: "pending",
      message: "검증 중...",
      link: "/test/api-check",
    });
    setResults([...checks]);

    try {
      const apiResponse = await fetch("/test/api-check");
      checks[checks.length - 1] = {
        phase: "Phase 1",
        name: "API 엔드포인트 검증",
        status: apiResponse.ok ? "success" : "warning",
        message: apiResponse.ok
          ? "API 검증 페이지 접근 가능"
          : "페이지 접근 확인 필요",
        link: "/test/api-check",
      };
    } catch {
      checks[checks.length - 1] = {
        phase: "Phase 1",
        name: "API 엔드포인트 검증",
        status: "error",
        message: "페이지 접근 실패",
        link: "/test/api-check",
      };
    }
    setResults([...checks]);

    // Phase 2: 데이터 완성 검증
    checks.push({
      phase: "Phase 2",
      name: "테스트 데이터 검증",
      status: "pending",
      message: "검증 중...",
      link: "/test/data-check",
    });
    setResults([...checks]);

    try {
      const dataResponse = await fetch("/api/test/recipes-check");
      if (dataResponse.ok) {
        const data = await dataResponse.json();
        checks[checks.length - 1] = {
          phase: "Phase 2",
          name: "테스트 데이터 검증",
          status: data.count > 0 ? "success" : "warning",
          message: data.count > 0
            ? `테스트 데이터 확인됨 (레시피 ${data.count}개)`
            : "테스트 데이터 없음",
          link: "/test/data-check",
        };
      } else {
        checks[checks.length - 1] = {
          phase: "Phase 2",
          name: "테스트 데이터 검증",
          status: "error",
          message: "데이터 검증 API 실패",
          link: "/test/data-check",
        };
      }
    } catch {
      checks[checks.length - 1] = {
        phase: "Phase 2",
        name: "테스트 데이터 검증",
        status: "error",
        message: "데이터 검증 실패",
        link: "/test/data-check",
      };
    }
    setResults([...checks]);

    // Phase 3: 성능 최적화 검증
    checks.push({
      phase: "Phase 3",
      name: "성능 최적화 인덱스",
      status: "pending",
      message: "검증 중...",
    });
    setResults([...checks]);

    try {
      // 인덱스 확인은 서버 사이드에서만 가능하므로 간접적으로 확인
      const indexResponse = await fetch("/api/test/index-check");
      if (indexResponse.ok) {
        const indexData = await indexResponse.json();
        checks[checks.length - 1] = {
          phase: "Phase 3",
          name: "성능 최적화 인덱스",
          status: indexData.count > 0 ? "success" : "warning",
          message: indexData.count > 0
            ? `인덱스 ${indexData.count}개 확인됨`
            : "인덱스 확인 필요",
          details: indexData.details,
        };
      } else {
        checks[checks.length - 1] = {
          phase: "Phase 3",
          name: "성능 최적화 인덱스",
          status: "warning",
          message: "인덱스 검증 API 없음 (수동 확인 필요)",
          details: "마이그레이션 파일이 실행되었는지 확인하세요",
        };
      }
    } catch {
      checks[checks.length - 1] = {
        phase: "Phase 3",
        name: "성능 최적화 인덱스",
        status: "warning",
        message: "인덱스 검증 실패",
        details: "마이그레이션 파일이 실행되었는지 확인하세요",
      };
    }
    setResults([...checks]);

    // 종합 상태 확인
    checks.push({
      phase: "종합",
      name: "전체 시스템 상태",
      status: "pending",
      message: "종합 중...",
    });
    setResults([...checks]);

    const successCount = checks.filter(
      (c) => c.status === "success" && c.phase !== "종합"
    ).length;
    const totalCount = checks.filter((c) => c.phase !== "종합").length;
    const allSuccess = successCount === totalCount;

    checks[checks.length - 1] = {
      phase: "종합",
      name: "전체 시스템 상태",
      status: allSuccess ? "success" : successCount > totalCount / 2 ? "warning" : "error",
      message: allSuccess
        ? `모든 검증 완료 (${successCount}/${totalCount})`
        : `일부 검증 완료 (${successCount}/${totalCount})`,
      details: allSuccess
        ? "시스템이 정상적으로 작동 중입니다"
        : "일부 항목을 확인하고 수정이 필요합니다",
    };
    setResults([...checks]);

    setIsRunning(false);
  };

  useEffect(() => {
    runFinalChecks();
  }, []);

  const phase1Results = results.filter((r) => r.phase === "Phase 1");
  const phase2Results = results.filter((r) => r.phase === "Phase 2");
  const phase3Results = results.filter((r) => r.phase === "Phase 3");
  const summaryResult = results.find((r) => r.phase === "종합");

  const getPhaseStatus = (phaseResults: FinalCheckResult[]) => {
    if (phaseResults.length === 0) return "pending";
    const successCount = phaseResults.filter((r) => r.status === "success").length;
    if (successCount === phaseResults.length) return "success";
    if (successCount > 0) return "warning";
    return "error";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CheckSquare className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold">최종 종합 검증</h1>
        </div>
        <p className="text-gray-600">
          모든 Phase의 검증을 종합하여 최종 시스템 상태를 확인합니다.
        </p>
      </div>

      {summaryResult && (
        <div
          className={`mb-6 p-6 rounded-lg border ${
            summaryResult.status === "success"
              ? "bg-green-50 border-green-200"
              : summaryResult.status === "warning"
                ? "bg-yellow-50 border-yellow-200"
                : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {summaryResult.status === "success" ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : summaryResult.status === "warning" ? (
              <AlertCircle className="h-6 w-6 text-yellow-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">{summaryResult.name}</h2>
              <p className="text-lg mb-1">{summaryResult.message}</p>
              {summaryResult.details && (
                <p className="text-sm text-gray-600">{summaryResult.details}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={runFinalChecks}
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

      {/* Phase별 결과 */}
      <div className="space-y-6">
        {/* Phase 1 */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Phase 1: 긴급 복구</h2>
            {getPhaseStatus(phase1Results) === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : getPhaseStatus(phase1Results) === "warning" ? (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
          <div className="space-y-2">
            {phase1Results.map((result, index) => (
              <CheckItem key={index} result={result} />
            ))}
          </div>
        </div>

        {/* Phase 2 */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Phase 2: 데이터 완성</h2>
            {getPhaseStatus(phase2Results) === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : getPhaseStatus(phase2Results) === "warning" ? (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
          <div className="space-y-2">
            {phase2Results.map((result, index) => (
              <CheckItem key={index} result={result} />
            ))}
          </div>
        </div>

        {/* Phase 3 */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Phase 3: 검증 및 최적화</h2>
            {getPhaseStatus(phase3Results) === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : getPhaseStatus(phase3Results) === "warning" ? (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
          <div className="space-y-2">
            {phase3Results.map((result, index) => (
              <CheckItem key={index} result={result} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="font-semibold mb-2">검증 항목</h2>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>Phase 1: 기본 기능 테스트 도구 접근 확인</li>
          <li>Phase 2: 테스트 데이터 존재 및 무결성 확인</li>
          <li>Phase 3: 성능 최적화 인덱스 확인</li>
        </ul>
        <p className="text-xs text-gray-600 mt-2">
          각 Phase의 상세 검증은 해당 테스트 페이지에서 확인할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

function CheckItem({ result }: { result: FinalCheckResult }) {
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
    <div className={`p-3 rounded-lg border ${bgColorMap[result.status]}`}>
      <div className="flex items-start gap-3">
        {iconMap[result.status]}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-sm">{result.name}</h3>
            {result.link && (
              <Link
                href={result.link}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                상세 보기
              </Link>
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
}


