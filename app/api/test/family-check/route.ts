/**
 * @file app/api/test/family-check/route.ts
 * @description 가족 구성원 데이터 검증 API
 */

import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET() {
  try {
    const supabase = getServiceRoleClient();

    // 가족 구성원 개수 조회
    const { count, error: countError } = await supabase
      .from("family_members")
      .select("*", { count: "exact", head: true });

    if (countError) {
      return NextResponse.json(
        { success: false, error: countError.message },
        { status: 500 }
      );
    }

    // 가족 구성원 목록 조회
    const { data: members, error: dataError } = await supabase
      .from("family_members")
      .select("id, name, relationship, birth_date")
      .limit(10);

    if (dataError) {
      return NextResponse.json(
        { success: false, error: dataError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
      details: members
        ? `구성원: ${members.map((m) => `${m.name}(${m.relationship})`).join(", ")}`
        : "가족 구성원 없음",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


