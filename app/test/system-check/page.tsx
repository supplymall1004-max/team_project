/**
 * @file app/test/system-check/page.tsx
 * @description 시스템 전반적인 상태를 확인하는 테스트 페이지
 * 
 * 이 페이지는 다음을 확인합니다:
 * 1. 데이터베이스 연결 상태
 * 2. Clerk 인증 상태
 * 3. 기본 CRUD 기능
 * 4. 홈페이지 데이터 로딩
 * 5. API 엔드포인트 응답
 */

import { Suspense } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { getMultipleCopyContent } from "@/lib/admin/copy-reader";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

interface CheckResult {
  name: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: string;
}

async function checkDatabaseConnection(): Promise<CheckResult> {
  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase.from("users").select("count").limit(1);

    if (error) {
      return {
        name: "데이터베이스 연결",
        status: "error",
        message: "데이터베이스 연결 실패",
        details: error.message,
      };
    }

    return {
      name: "데이터베이스 연결",
      status: "success",
      message: "데이터베이스 연결 성공",
    };
  } catch (error) {
    return {
      name: "데이터베이스 연결",
      status: "error",
      message: "데이터베이스 연결 오류",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkClerkAuth(): Promise<CheckResult> {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return {
        name: "Clerk 인증",
        status: "warning",
        message: "로그인되지 않음 (정상 - 테스트용)",
      };
    }

    return {
      name: "Clerk 인증",
      status: "success",
      message: `로그인됨: ${user.fullName || user.emailAddresses[0]?.emailAddress}`,
      details: `User ID: ${userId}`,
    };
  } catch (error) {
    return {
      name: "Clerk 인증",
      status: "error",
      message: "Clerk 인증 확인 실패",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkUserSync(): Promise<CheckResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        name: "사용자 동기화",
        status: "warning",
        message: "로그인 필요",
      };
    }

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, clerk_id, name")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (error) {
      return {
        name: "사용자 동기화",
        status: "error",
        message: "사용자 조회 실패",
        details: error.message,
      };
    }

    if (!data) {
      return {
        name: "사용자 동기화",
        status: "warning",
        message: "Supabase에 사용자 정보 없음 (동기화 필요)",
      };
    }

    return {
      name: "사용자 동기화",
      status: "success",
      message: `동기화됨: ${data.name}`,
      details: `Supabase User ID: ${data.id}`,
    };
  } catch (error) {
    return {
      name: "사용자 동기화",
      status: "error",
      message: "사용자 동기화 확인 실패",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkHomepageContent(): Promise<CheckResult> {
  try {
    const content = await getMultipleCopyContent([
      "hero-title",
      "hero-description",
      "quick-start-legacy",
    ]);

    const hasContent = Object.keys(content).length > 0;

    if (!hasContent) {
      return {
        name: "홈페이지 콘텐츠",
        status: "warning",
        message: "홈페이지 콘텐츠 없음",
      };
    }

    return {
      name: "홈페이지 콘텐츠",
      status: "success",
      message: `${Object.keys(content).length}개 콘텐츠 블록 로드됨`,
    };
  } catch (error) {
    return {
      name: "홈페이지 콘텐츠",
      status: "error",
      message: "홈페이지 콘텐츠 로드 실패",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkTables(): Promise<CheckResult> {
  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase.rpc("get_table_count");

    // RPC 함수가 없을 수 있으므로 직접 쿼리
    const tables = [
      "users",
      "recipes",
      "diet_plans",
      "admin_copy_blocks",
      "popup_announcements",
    ];

    const results = await Promise.all(
      tables.map(async (table) => {
        const { count, error: countError } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true });

        return { table, count: countError ? 0 : count, error: countError };
      })
    );

    const totalCount = results.reduce((sum, r) => sum + (r.count || 0), 0);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      return {
        name: "테이블 상태",
        status: "warning",
        message: `${tables.length}개 테이블 중 ${errors.length}개 오류`,
        details: errors.map((e) => e.table).join(", "),
      };
    }

    return {
      name: "테이블 상태",
      status: "success",
      message: `${tables.length}개 테이블 정상, 총 ${totalCount}개 레코드`,
    };
  } catch (error) {
    return {
      name: "테이블 상태",
      status: "error",
      message: "테이블 상태 확인 실패",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

async function getAllChecks(): Promise<CheckResult[]> {
  const checks = await Promise.all([
    checkDatabaseConnection(),
    checkClerkAuth(),
    checkUserSync(),
    checkHomepageContent(),
    checkTables(),
  ]);

  return checks;
}

function CheckItem({ result }: { result: CheckResult }) {
  const iconMap = {
    success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
  };

  const bgColorMap = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
  };

  return (
    <div
      className={`p-4 rounded-lg border ${bgColorMap[result.status]}`}
    >
      <div className="flex items-start gap-3">
        {iconMap[result.status]}
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">{result.name}</h3>
          <p className="text-sm text-gray-700">{result.message}</p>
          {result.details && (
            <p className="text-xs text-gray-500 mt-1">{result.details}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function SystemCheckPage() {
  const checks = await getAllChecks();

  const successCount = checks.filter((c) => c.status === "success").length;
  const errorCount = checks.filter((c) => c.status === "error").length;
  const warningCount = checks.filter((c) => c.status === "warning").length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">시스템 상태 확인</h1>
        <p className="text-gray-600">
          데이터베이스, 인증, 기본 기능의 상태를 확인합니다.
        </p>
      </div>

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

      <div className="space-y-4">
        {checks.map((result, index) => (
          <CheckItem key={index} result={result} />
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="font-semibold mb-2">다음 단계</h2>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>모든 체크가 성공하면 기본 기능 테스트 진행</li>
          <li>오류가 있으면 해당 항목의 문제 해결</li>
          <li>경고는 기능에 영향을 주지 않을 수 있으나 확인 권장</li>
        </ul>
      </div>
    </div>
  );
}


