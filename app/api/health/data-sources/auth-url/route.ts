/**
 * @file app/api/health/data-sources/auth-url/route.ts
 * @description 데이터 소스 연결 인증 URL 생성 API
 * 
 * POST /api/health/data-sources/auth-url - 인증 URL 생성
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import { checkIdentityVerification } from "@/lib/identity/check-verification";
import { generateConnectionUrl } from "@/lib/health/health-data-sync-service";
import type { DataSourceType } from "@/types/health-data-integration";

/**
 * 지원되는 데이터 소스 유형 (인증 URL 생성용)
 */
type SupportedDataSourceType = "mydata" | "health_highway";

/**
 * POST /api/health/data-sources/auth-url
 * 데이터 소스 연결 인증 URL 생성
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/data-sources/auth-url");

    // 1. 프리미엄 체크
    const premiumCheck = await checkPremiumAccess();
    if (!premiumCheck.isPremium || !premiumCheck.userId) {
      console.log("❌ 프리미엄 접근 거부");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Premium access required",
          message: premiumCheck.error || "이 기능은 프리미엄 전용입니다.",
        },
        { status: 403 }
      );
    }

    // 2. 신원확인 체크
    const isVerified = await checkIdentityVerification();
    if (!isVerified) {
      console.log("❌ 신원확인 미완료");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Identity verification required",
          message: "데이터 소스를 연결하려면 먼저 신원확인이 완료되어야 합니다.",
        },
        { status: 403 }
      );
    }

    // 3. 요청 본문 파싱
    const body = await request.json();
    const { source_type, redirect_uri } = body;

    if (!source_type) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "데이터 소스 유형은 필수 입력 항목입니다.",
        },
        { status: 400 }
      );
    }

    // 4. 환경 변수 확인 (데이터 소스별)
    if (source_type === "health_highway") {
      const hasHealthHighwayConfig = 
        !!process.env.HEALTH_HIGHWAY_CLIENT_ID && 
        !!process.env.HEALTH_HIGHWAY_CLIENT_SECRET;
      
      if (!hasHealthHighwayConfig) {
        console.log("❌ 건강정보고속도로 API 설정 누락");
        console.groupEnd();
        return NextResponse.json(
          {
            error: "Configuration error",
            message: "건강정보고속도로 API 설정이 필요합니다. 환경 변수(HEALTH_HIGHWAY_CLIENT_ID, HEALTH_HIGHWAY_CLIENT_SECRET)를 확인해주세요.",
          },
          { status: 400 }
        );
      }
    } else if (source_type === "mydata") {
      const hasMyDataConfig = 
        !!process.env.MYDATA_CLIENT_ID && 
        !!process.env.MYDATA_CLIENT_SECRET;
      
      if (!hasMyDataConfig) {
        console.log("❌ 마이데이터 API 설정 누락");
        console.groupEnd();
        return NextResponse.json(
          {
            error: "Configuration error",
            message: "마이데이터 API 설정이 필요합니다. 환경 변수(MYDATA_CLIENT_ID, MYDATA_CLIENT_SECRET)를 확인해주세요.",
          },
          { status: 400 }
        );
      }
    }

    // 5. 지원되는 데이터 소스 타입 확인
    if (source_type !== "mydata" && source_type !== "health_highway") {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "지원하지 않는 데이터 소스 유형입니다. 'mydata' 또는 'health_highway'만 지원됩니다.",
        },
        { status: 400 }
      );
    }

    // 6. 인증 URL 생성
    const authUrl = await generateConnectionUrl(
      premiumCheck.userId,
      source_type as SupportedDataSourceType,
      redirect_uri || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/health/data-sources/callback`
    );

    console.log("✅ 인증 URL 생성 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      auth_url: authUrl,
    });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

