/**
 * @file app/api/health/data-sources/route.ts
 * @description 건강정보 데이터 소스 연결 관리 API
 * 
 * GET /api/health/data-sources - 연결된 데이터 소스 목록 조회
 * POST /api/health/data-sources/connect - 데이터 소스 연결
 * DELETE /api/health/data-sources/:id - 연결 해제
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import {
  generateConnectionUrl,
  syncHealthData,
  type SyncParams,
} from "@/lib/health/health-data-sync-service";
import {
  getMyDataAccessToken,
  type MyDataToken,
} from "@/lib/health/mydata-client";
import {
  getHealthHighwayAccessToken,
  type HealthHighwayToken,
} from "@/lib/health/health-highway-client";

/**
 * GET /api/health/data-sources
 * 연결된 데이터 소스 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/data-sources");

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

    // 2. 데이터 소스 목록 조회
    const supabase = getServiceRoleClient();
    const { data: sources, error } = await supabase
      .from("health_data_sources")
      .select("*")
      .eq("user_id", premiumCheck.userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ 데이터 소스 조회 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to fetch data sources",
          message: error.message,
        },
        { status: 500 }
      );
    }

    console.log(`✅ 데이터 소스 조회 완료: ${sources?.length || 0}건`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: sources || [],
      count: sources?.length || 0,
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

/**
 * POST /api/health/data-sources/connect
 * 데이터 소스 연결
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/data-sources/connect");

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

    // 2. 요청 본문 파싱
    const body = await request.json();
    const { source_type, source_name, authorization_code, redirect_uri } = body;

    if (!source_type || !source_name) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "데이터 소스 유형과 이름은 필수 입력 항목입니다.",
        },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // 3. 인증 코드를 액세스 토큰으로 교환
    let token: MyDataToken | HealthHighwayToken;
    let connectionMetadata: Record<string, any>;

    if (source_type === "mydata") {
      if (!authorization_code) {
        return NextResponse.json(
          {
            error: "Validation error",
            message: "마이데이터 연결을 위해서는 인증 코드가 필요합니다.",
          },
          { status: 400 }
        );
      }

      token = await getMyDataAccessToken(authorization_code);
      connectionMetadata = {
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_in: token.expires_in,
        token_type: token.token_type,
        expires_at: token.expires_at.toISOString(),
      };
    } else if (source_type === "health_highway") {
      if (!authorization_code || !redirect_uri) {
        return NextResponse.json(
          {
            error: "Validation error",
            message: "건강정보고속도로 연결을 위해서는 인증 코드와 리다이렉트 URI가 필요합니다.",
          },
          { status: 400 }
        );
      }

      token = await getHealthHighwayAccessToken(authorization_code, redirect_uri);
      connectionMetadata = {
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_in: token.expires_in,
        token_type: token.token_type,
        expires_at: token.expires_at.toISOString(),
      };
    } else {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "지원하지 않는 데이터 소스 유형입니다.",
        },
        { status: 400 }
      );
    }

    // 4. 데이터 소스 연결 정보 저장
    const { data: dataSource, error: insertError } = await supabase
      .from("health_data_sources")
      .insert({
        user_id: premiumCheck.userId,
        source_type: source_type,
        source_name: source_name,
        connection_status: "connected",
        connected_at: new Date().toISOString(),
        connection_metadata: connectionMetadata,
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ 데이터 소스 연결 실패:", insertError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to connect data source",
          message: insertError.message,
        },
        { status: 500 }
      );
    }

    console.log("✅ 데이터 소스 연결 완료:", dataSource.id);
    console.groupEnd();

    return NextResponse.json(
      {
        success: true,
        data: dataSource,
      },
      { status: 201 }
    );
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

/**
 * DELETE /api/health/data-sources/:id
 * 데이터 소스 연결 해제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.group("[API] DELETE /api/health/data-sources/:id");

    const { id } = await params;

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

    // 2. 데이터 소스 소유권 확인 및 삭제
    const supabase = getServiceRoleClient();
    const { error: deleteError } = await supabase
      .from("health_data_sources")
      .delete()
      .eq("id", id)
      .eq("user_id", premiumCheck.userId);

    if (deleteError) {
      console.error("❌ 데이터 소스 삭제 실패:", deleteError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to delete data source",
          message: deleteError.message,
        },
        { status: 500 }
      );
    }

    console.log("✅ 데이터 소스 연결 해제 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "데이터 소스 연결이 해제되었습니다.",
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

