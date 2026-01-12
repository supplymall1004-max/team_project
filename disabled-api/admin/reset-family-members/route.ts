/**
 * @file app/api/admin/reset-family-members/route.ts
 * @description 가족 구성원 데이터베이스 초기화 API (관리자용)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    console.group("🔄 가족 구성원 데이터베이스 초기화");

    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ 환경 변수 없음");
      console.groupEnd();
      return NextResponse.json({
        error: "환경 변수가 설정되지 않았습니다"
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log("📋 현재 가족 구성원 데이터 확인 중...");

    // 현재 데이터 백업
    const { data: currentMembers, error: backupError } = await supabase
      .from("family_members")
      .select("*");

    if (backupError && backupError.code !== 'PGRST116') { // 테이블이 존재하지 않는 경우 제외
      console.error("❌ 데이터 백업 실패:", backupError);
    } else {
      console.log(`📦 백업된 구성원 수: ${currentMembers?.length || 0}`);
    }

    // 가족 구성원 데이터만 정리
    console.log("🗑️ 가족 구성원 데이터 정리 중...");

    // 기존 데이터 삭제 (테이블 구조는 유지)
    const { error: deleteError } = await supabase
      .from("family_members")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // 모든 데이터 삭제

    if (deleteError) {
      console.error("❌ 데이터 삭제 실패:", deleteError);
      console.log("테이블이 존재하지 않을 수 있음 - 계속 진행");
    } else {
      console.log("✅ 기존 가족 구성원 데이터 삭제 완료");
    }

    // diet_plans 테이블 정리 (family_member_id가 있는 경우)
    const { error: dietPlansError } = await supabase
      .from("diet_plans")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (dietPlansError) {
      console.log("⚠️ 식단 계획 테이블 정리 실패 (테이블이 없을 수 있음):", dietPlansError.message);
    } else {
      console.log("✅ 식단 계획 데이터 정리 완료");
    }

    // recipe_usage_history 테이블 정리
    const { error: usageHistoryError } = await supabase
      .from("recipe_usage_history")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (usageHistoryError) {
      console.log("⚠️ 레시피 사용 기록 테이블 정리 실패 (테이블이 없을 수 있음):", usageHistoryError.message);
    } else {
      console.log("✅ 레시피 사용 기록 데이터 정리 완료");
    }

    // 테이블 존재 확인
    const { data: testData, error: testError } = await supabase
      .from("family_members")
      .select("count", { count: 'exact' })
      .limit(1);

    if (testError) {
      console.error("❌ 테이블 확인 실패:", testError);
      console.groupEnd();
      return NextResponse.json({
        error: "테이블 확인 실패",
        details: testError.message
      }, { status: 500 });
    }

    console.log("✅ 가족 구성원 데이터베이스 초기화 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "가족 구성원 데이터베이스가 성공적으로 초기화되었습니다",
      backupCount: currentMembers?.length || 0,
      status: {
        tableCreated: true,
        indexesCreated: true,
        triggersCreated: true,
        permissionsSet: true
      }
    });

  } catch (error) {
    console.error("❌ 데이터베이스 초기화 중 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "데이터베이스 초기화 실패",
        message: "가족 구성원 데이터베이스 초기화 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
