/**
 * @file app/api/health/kcdc-premium/risk-scores/route.ts
 * @description 감염병 위험 지수 API
 * 
 * GET /api/health/kcdc-premium/risk-scores - 위험 지수 조회
 * POST /api/health/kcdc-premium/risk-scores/calculate - 위험 지수 계산
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import {
  calculateInfectionRiskScore,
  saveRiskScore,
  getLatestRiskScore,
} from "@/lib/kcdc/risk-calculator";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";

/**
 * GET /api/health/kcdc-premium/risk-scores
 * 최근 위험 지수 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/kcdc-premium/risk-scores");

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

    // 2. 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const familyMemberId = searchParams.get("family_member_id") || undefined;

    // 3. 최근 위험 지수 조회
    const riskScore = await getLatestRiskScore(
      premiumCheck.userId,
      familyMemberId
    );

    if (!riskScore) {
      console.log("⚠️ 저장된 위험 지수가 없습니다.");
      console.groupEnd();
      return NextResponse.json(
        {
          riskScore: null,
          message: "저장된 위험 지수가 없습니다. 계산을 먼저 수행해주세요.",
        },
        { status: 200 }
      );
    }

    console.log("✅ 위험 지수 조회 완료:", riskScore.id);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: riskScore,
    });
  } catch (error) {
    console.error("❌ 위험 지수 조회 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Failed to fetch risk score",
        message:
          error instanceof Error ? error.message : "위험 지수 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/kcdc-premium/risk-scores/calculate
 * 위험 지수 계산 및 저장
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/kcdc-premium/risk-scores/calculate");

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
    const { family_member_id, region } = body;

    // 3. 위험 지수 계산
    const result = await calculateInfectionRiskScore({
      userId: premiumCheck.userId,
      familyMemberId: family_member_id,
      region,
    });

    // 4. 독감 정보 조회 (저장용)
    const { getServiceRoleClient } = await import("@/lib/supabase/service-role");
    const supabase = getServiceRoleClient();
    const { data: fluInfo } = await supabase
      .from("kcdc_alerts")
      .select("flu_stage, flu_week")
      .eq("alert_type", "flu")
      .eq("is_active", true)
      .order("published_at", { ascending: false })
      .limit(1)
      .single();

    // 5. 위험 지수 저장
    const savedRiskScore = await saveRiskScore(
      premiumCheck.userId,
      family_member_id,
      result,
      fluInfo?.flu_stage || undefined,
      fluInfo?.flu_week || undefined,
      region
    );

    console.log("✅ 위험 지수 계산 및 저장 완료:", savedRiskScore.id);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: savedRiskScore,
    });
  } catch (error) {
    console.error("❌ 위험 지수 계산 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Failed to calculate risk score",
        message:
          error instanceof Error
            ? error.message
            : "위험 지수 계산에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

