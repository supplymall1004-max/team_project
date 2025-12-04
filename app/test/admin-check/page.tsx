/**
 * @file app/test/admin-check/page.tsx
 * @description 관리자 콘솔 기능별 테스트 페이지
 * 
 * 이 페이지는 다음 관리자 기능들을 테스트합니다:
 * 1. 관리자 권한 확인
 * 2. 관리자 콘솔 접근
 * 3. 관리자 API 엔드포인트
 * 4. 관리자 콘텐츠 관리 기능
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Loader2, AlertCircle, Shield } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

interface AdminTestResult {
  name: string;
  status: "pending" | "success" | "error" | "warning";
  message: string;
  details?: string;
  action?: {
    label: string;
    href: string;
  };
}

export default function AdminCheckPage() {
  const { user, isLoaded } = useUser();
  const [results, setResults] = useState<AdminTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      // 자동으로 기본 체크 실행
      runBasicChecks();
    }
  }, [isLoaded, user, runBasicChecks]);

  const runBasicChecks = useCallback(async () => {
    setIsRunning(true);
    setResults([]);

    const checks: AdminTestResult[] = [];

    // 1. 로그인 상태 확인
    checks.push({
      name: "로그인 상태",
      status: user ? "success" : "warning",
      message: user
        ? `로그인됨: ${user.fullName || user.emailAddresses[0]?.emailAddress}`
        : "로그인되지 않음",
      details: user ? `User ID: ${user.id}` : "관리자 기능 테스트를 위해 로그인이 필요합니다.",
    });

    // 2. 관리자 권한 확인
    if (user) {
      const publicRole = (user.publicMetadata?.role as string) || "";
      const publicRoles = (user.publicMetadata?.roles as string[]) || [];
      const privateRole = (user.privateMetadata?.role as string) || "";
      const privateRoles = (user.privateMetadata?.roles as string[]) || [];

      const isAdmin =
        publicRole === "admin" ||
        publicRoles.includes("admin") ||
        privateRole === "admin" ||
        privateRoles.includes("admin");

      checks.push({
        name: "관리자 권한",
        status: isAdmin ? "success" : "error",
        message: isAdmin
          ? "관리자 권한이 확인되었습니다"
          : "관리자 권한이 없습니다",
        details: isAdmin
          ? "관리자 콘솔에 접근할 수 있습니다"
          : "Clerk 대시보드에서 관리자 역할을 부여해야 합니다",
        action: !isAdmin
          ? {
              label: "관리자 설정 가이드 보기",
              href: "/docs/admin-setup-guide.md",
            }
          : undefined,
      });
    } else {
      checks.push({
        name: "관리자 권한",
        status: "warning",
        message: "로그인 후 확인 가능",
        details: "로그인 상태에서만 관리자 권한을 확인할 수 있습니다",
      });
    }

    // 3. 관리자 콘솔 접근 테스트
    checks.push({
      name: "관리자 콘솔 접근",
      status: "pending",
      message: "접근 테스트 중...",
      action: {
        label: "관리자 콘솔 열기",
        href: "/admin",
      },
    });

    setResults(checks);

    // 관리자 콘솔 접근 테스트
    if (user) {
      try {
        const response = await fetch("/admin", {
          method: "HEAD",
          redirect: "manual",
        });

        const finalStatus =
          response.status === 200 || response.status === 0
            ? "success"
            : response.status === 401 || response.status === 403
              ? "error"
              : "warning";

        checks[checks.length - 1] = {
          name: "관리자 콘솔 접근",
          status: finalStatus,
          message:
            response.status === 200 || response.status === 0
              ? "관리자 콘솔 접근 가능"
              : response.status === 401 || response.status === 403
                ? "접근 거부됨 (권한 없음)"
                : `예상치 못한 응답: ${response.status}`,
          details:
            response.status === 401 || response.status === 403
              ? "관리자 권한이 필요합니다"
              : undefined,
          action: {
            label: "관리자 콘솔 열기",
            href: "/admin",
          },
        };
      } catch (error) {
        checks[checks.length - 1] = {
          name: "관리자 콘솔 접근",
          status: "warning",
          message: "접근 테스트 실패",
          details: error instanceof Error ? error.message : String(error),
          action: {
            label: "관리자 콘솔 열기",
            href: "/admin",
          },
        };
      }
    } else {
      checks[checks.length - 1] = {
        name: "관리자 콘솔 접근",
        status: "warning",
        message: "로그인 후 테스트 가능",
        details: "로그인 상태에서만 관리자 콘솔 접근을 테스트할 수 있습니다",
        action: {
          label: "로그인 페이지로 이동",
          href: "/sign-in",
        },
      };
    }

    setResults([...checks]);
    setIsRunning(false);
  }, [user]);

  const runApiTests = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    setIsRunning(true);
    const apiResults: AdminTestResult[] = [];

    // 관리자 API 테스트
    const apiTests = [
      {
        name: "관리자 콘텐츠 조회 (공개)",
        endpoint: "/api/admin/copy",
        method: "GET",
      },
    ];

    for (const test of apiTests) {
      apiResults.push({
        name: test.name,
        status: "pending",
        message: "테스트 실행 중...",
      });
      setResults([...results, ...apiResults]);

      try {
        const startTime = Date.now();
        const response = await fetch(`${test.endpoint}?slots=hero-title`, {
          method: test.method,
        });
        const duration = Date.now() - startTime;
        const data = await response.json();

        apiResults[apiResults.length - 1] = {
          name: test.name,
          status: response.ok ? "success" : "error",
          message: response.ok
            ? "API 호출 성공"
            : `API 호출 실패: ${data.error || response.status}`,
          details: `응답 시간: ${duration}ms, 상태 코드: ${response.status}`,
        };
      } catch (error) {
        apiResults[apiResults.length - 1] = {
          name: test.name,
          status: "error",
          message: "API 호출 실패",
          details: error instanceof Error ? error.message : String(error),
        };
      }

      setResults([...results, ...apiResults]);
    }

    setIsRunning(false);
  };

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const warningCount = results.filter((r) => r.status === "warning").length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">관리자 콘솔 기능 테스트</h1>
        </div>
        <p className="text-gray-600">
          관리자 권한 및 관리자 콘솔 기능을 확인합니다.
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

      <div className="mb-6 flex gap-2">
        <button
          onClick={runBasicChecks}
          disabled={isRunning || !isLoaded}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              테스트 실행 중...
            </>
          ) : (
            "기본 체크 다시 실행"
          )}
        </button>
        {user && (
          <button
            onClick={runApiTests}
            disabled={isRunning}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            API 테스트 실행
          </button>
        )}
      </div>

      <div className="space-y-4">
        {results.length === 0 && !isRunning && (
          <div className="text-center py-12 text-gray-500">
            {!isLoaded ? (
              "사용자 정보를 불러오는 중..."
            ) : (
              "기본 체크가 자동으로 실행됩니다."
            )}
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
                    {result.action && (
                      <Link
                        href={result.action.href}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        {result.action.label}
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
        })}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="font-semibold mb-2">테스트 항목</h2>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>로그인 상태 확인</li>
          <li>관리자 권한 확인 (Clerk 메타데이터)</li>
          <li>관리자 콘솔 접근 테스트</li>
          <li>관리자 API 엔드포인트 테스트</li>
        </ul>
        <p className="text-xs text-gray-600 mt-2">
          참고: 관리자 권한이 없으면 관리자 콘솔에 접근할 수 없습니다.{" "}
          <Link href="/docs/admin-setup-guide.md" className="text-blue-600 underline">
            관리자 설정 가이드
          </Link>
          를 참고하세요.
        </p>
      </div>
    </div>
  );
}


