/**
 * @file actions/health/dashboard.ts
 * @description 통합 건강 대시보드 데이터 집계 Server Actions
 *
 * 건강 대시보드에 필요한 모든 데이터를 집계하여 반환합니다.
 * 기존 /api/health/dashboard/summary API Route를 Server Actions로 마이그레이션했습니다.
 *
 * 주요 기능:
 * 1. 대시보드 데이터 집계 (getDashboardSummary)
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/kcdc/premium-guard: checkPremiumAccess
 * - @/lib/health/dashboard-aggregator: aggregateDashboardData
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import { aggregateDashboardData } from "@/lib/health/dashboard-aggregator";
import type { DashboardSummary } from "@/lib/health/dashboard-aggregator";

/**
 * 대시보드 데이터 조회
 *
 * @returns 대시보드 집계 결과
 * @throws 인증 실패, 프리미엄 접근 거부, 또는 데이터베이스 오류 시 에러 발생
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    console.group("[getDashboardSummary] 대시보드 데이터 조회 시작");

    // 1. 프리미엄 체크
    const premiumCheck = await checkPremiumAccess();
    if (!premiumCheck.isPremium || !premiumCheck.userId) {
      console.log("❌ 프리미엄 접근 거부");
      console.groupEnd();
      throw new Error(
        premiumCheck.error || "이 기능은 프리미엄 전용입니다.",
      );
    }

    // 2. 대시보드 데이터 집계
    const summary = await aggregateDashboardData(premiumCheck.userId);

    console.log("✅ 대시보드 데이터 조회 완료");
    console.groupEnd();

    return summary;
  } catch (error) {
    console.error("❌ [getDashboardSummary] 서버 오류:", error);
    console.groupEnd();
    throw error instanceof Error
      ? error
      : new Error("대시보드 데이터 조회 중 오류가 발생했습니다.");
  }
}
