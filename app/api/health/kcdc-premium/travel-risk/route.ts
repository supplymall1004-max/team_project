/**
 * @file app/api/health/kcdc-premium/travel-risk/route.ts
 * @description 여행 위험도 평가 API
 * 
 * POST /api/health/kcdc-premium/travel-risk/assess - 여행 위험도 평가
 * GET /api/health/kcdc-premium/travel-risk - 평가 이력 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import {
  assessTravelRisk,
  saveTravelRiskAssessment,
  getTravelRiskAssessments,
  type AssessTravelRiskParams,
} from "@/lib/kcdc/travel-risk-assessor";

/**
 * POST /api/health/kcdc-premium/travel-risk/assess
 * 여행 위험도 평가
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/kcdc-premium/travel-risk/assess");

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
    const {
      destination_country,
      destination_region,
      travel_start_date,
      travel_end_date,
    } = body;

    // 3. 필수 필드 검증
    if (!destination_country || !travel_start_date || !travel_end_date) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "목적지 국가, 여행 시작일, 여행 종료일은 필수 입력 항목입니다.",
        },
        { status: 400 }
      );
    }

    // 4. 여행 위험도 평가
    const result = await assessTravelRisk({
      userId: premiumCheck.userId,
      destinationCountry: destination_country,
      destinationRegion: destination_region,
      travelStartDate: travel_start_date,
      travelEndDate: travel_end_date,
    });

    // 5. 평가 결과 저장
    const savedAssessment = await saveTravelRiskAssessment(
      premiumCheck.userId,
      {
        userId: premiumCheck.userId,
        destinationCountry: destination_country,
        destinationRegion: destination_region,
        travelStartDate: travel_start_date,
        travelEndDate: travel_end_date,
      },
      result
    );

    console.log("✅ 여행 위험도 평가 완료:", savedAssessment.id);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: savedAssessment,
    });
  } catch (error) {
    console.error("❌ 여행 위험도 평가 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Failed to assess travel risk",
        message:
          error instanceof Error
            ? error.message
            : "여행 위험도 평가에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/health/kcdc-premium/travel-risk
 * 여행 위험도 평가 이력 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/kcdc-premium/travel-risk");

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

    // 2. 평가 이력 조회
    const assessments = await getTravelRiskAssessments(premiumCheck.userId);

    console.log(`✅ 여행 위험도 평가 이력 조회 완료: ${assessments.length}건`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: assessments,
      count: assessments.length,
    });
  } catch (error) {
    console.error("❌ 여행 위험도 평가 이력 조회 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Failed to fetch travel risk assessments",
        message:
          error instanceof Error
            ? error.message
            : "여행 위험도 평가 이력 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

