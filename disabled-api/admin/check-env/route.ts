/**
 * @file app/api/admin/check-env/route.ts
 * @description 관리자용 환경변수 확인 API
 * 
 * 서버 사이드 환경변수의 존재 여부를 확인합니다.
 * 키 값은 반환하지 않고, 존재 여부와 형식만 확인합니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

interface EnvCheckResponse {
  success: boolean;
  environment: string;
  variables: {
    NEXT_PUBLIC_SUPABASE_URL: {
      exists: boolean;
      isValid: boolean;
      preview?: string;
    };
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      exists: boolean;
      isValid: boolean;
      preview?: string;
    };
    SUPABASE_SERVICE_ROLE_KEY: {
      exists: boolean;
      isValid: boolean;
      preview?: string;
    };
  };
  issues: string[];
}

/**
 * GET /api/admin/check-env
 * 환경변수 확인 (관리자 전용)
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 환경변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const issues: string[] = [];

    // SUPABASE_SERVICE_ROLE_KEY 확인
    if (!supabaseServiceRoleKey) {
      issues.push("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
    } else {
      // Service Role Key 형식 검증 (eyJ로 시작하는 JWT 토큰)
      if (!supabaseServiceRoleKey.startsWith("eyJ")) {
        issues.push(
          "SUPABASE_SERVICE_ROLE_KEY가 올바른 형식이 아닙니다. " +
          "Service Role Key는 'eyJ'로 시작하는 JWT 토큰이어야 합니다."
        );
      }
      // Anon Key와 같은지 확인 (실수 방지)
      if (supabaseAnonKey && supabaseServiceRoleKey === supabaseAnonKey) {
        issues.push(
          "SUPABASE_SERVICE_ROLE_KEY가 Anon Key와 동일합니다. " +
          "Service Role Key를 사용해야 합니다."
        );
      }
    }

    // NEXT_PUBLIC_SUPABASE_URL 확인
    if (!supabaseUrl) {
      issues.push("NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.");
    } else {
      try {
        const url = new URL(supabaseUrl);
        if (!url.hostname.includes("supabase.co")) {
          issues.push("NEXT_PUBLIC_SUPABASE_URL이 올바른 Supabase URL 형식이 아닙니다.");
        }
      } catch {
        issues.push("NEXT_PUBLIC_SUPABASE_URL이 유효한 URL 형식이 아닙니다.");
      }
    }

    // NEXT_PUBLIC_SUPABASE_ANON_KEY 확인
    if (!supabaseAnonKey) {
      issues.push("NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.");
    } else if (!supabaseAnonKey.startsWith("eyJ")) {
      issues.push("NEXT_PUBLIC_SUPABASE_ANON_KEY가 올바른 형식이 아닙니다.");
    }

    // 값의 길이와 형식 상세 확인
    const serviceRoleKeyLength = supabaseServiceRoleKey?.length || 0;
    const serviceRoleKeyFirstChars = supabaseServiceRoleKey?.substring(0, 10) || "";
    const serviceRoleKeyLastChars = supabaseServiceRoleKey?.substring(Math.max(0, serviceRoleKeyLength - 10)) || "";
    
    // 값에 공백이나 줄바꿈이 있는지 확인
    if (supabaseServiceRoleKey) {
      if (supabaseServiceRoleKey.includes("\n") || supabaseServiceRoleKey.includes("\r")) {
        issues.push("SUPABASE_SERVICE_ROLE_KEY 값에 줄바꿈이 포함되어 있습니다. 줄바꿈을 제거하세요.");
      }
      if (supabaseServiceRoleKey.trim() !== supabaseServiceRoleKey) {
        issues.push("SUPABASE_SERVICE_ROLE_KEY 값의 앞뒤에 공백이 있습니다. 공백을 제거하세요.");
      }
      // 예상 길이 확인 (JWT 토큰은 보통 200자 이상)
      if (serviceRoleKeyLength < 100) {
        issues.push(`SUPABASE_SERVICE_ROLE_KEY 값이 너무 짧습니다 (${serviceRoleKeyLength}자). 전체 키가 복사되었는지 확인하세요.`);
      }
    }

    const response: EnvCheckResponse = {
      success: issues.length === 0,
      environment: process.env.NODE_ENV || "unknown",
      variables: {
        NEXT_PUBLIC_SUPABASE_URL: {
          exists: Boolean(supabaseUrl),
          isValid: Boolean(supabaseUrl) && supabaseUrl.includes("supabase.co"),
          preview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : undefined,
        },
        NEXT_PUBLIC_SUPABASE_ANON_KEY: {
          exists: Boolean(supabaseAnonKey),
          isValid: Boolean(supabaseAnonKey) && supabaseAnonKey.startsWith("eyJ"),
          preview: supabaseAnonKey
            ? `${supabaseAnonKey.substring(0, 20)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 4)}`
            : undefined,
        },
        SUPABASE_SERVICE_ROLE_KEY: {
          exists: Boolean(supabaseServiceRoleKey),
          isValid: Boolean(supabaseServiceRoleKey) && supabaseServiceRoleKey.startsWith("eyJ"),
          preview: supabaseServiceRoleKey
            ? `${supabaseServiceRoleKey.substring(0, 20)}...${supabaseServiceRoleKey.substring(supabaseServiceRoleKey.length - 4)}`
            : undefined,
        },
      },
      issues,
    };
    
    // 상세 디버깅 정보 추가
    console.log("🔍 [CheckEnv] 환경변수 확인 결과:");
    console.log("   - NODE_ENV:", process.env.NODE_ENV);
    console.log("   - SUPABASE_SERVICE_ROLE_KEY 존재:", Boolean(supabaseServiceRoleKey));
    console.log("   - SUPABASE_SERVICE_ROLE_KEY 길이:", serviceRoleKeyLength);
    console.log("   - SUPABASE_SERVICE_ROLE_KEY 시작:", serviceRoleKeyFirstChars);
    console.log("   - SUPABASE_SERVICE_ROLE_KEY 끝:", serviceRoleKeyLastChars);
    console.log("   - 문제 개수:", issues.length);
    if (issues.length > 0) {
      console.log("   - 문제 목록:", issues);
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("❌ 환경변수 확인 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

