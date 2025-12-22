/**
 * @file app/api/shopping/frequent-items/route.ts
 * @description 자주 구매하는 식자재 조회 API
 * 
 * 사용자의 주간 식단 기반으로 자주 구매하는 식자재를 조회합니다.
 * 
 * 로직:
 * 1. 최근 4주간의 주간 식단 조회
 * 2. 재료 목록 집계 (빈도순)
 * 3. 상위 8개 항목 반환
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";

interface FrequentItem {
  id: string;
  name: string;
  imageUrl?: string;
  price?: number;
  category: string;
  frequency: number; // 사용 빈도
}

export async function GET(request: NextRequest) {
  try {
    console.groupCollapsed("[API] GET /api/shopping/frequent-items");

    // 1. 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ 인증 완료:", clerkUserId);

    // 2. 사용자 ID 조회 (없으면 자동 동기화)
    console.log("🔍 사용자 확인 및 동기화 시도...");
    const userData = await ensureSupabaseUser();

    if (!userData) {
      console.error("❌ 사용자 동기화 실패");
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "사용자 정보를 동기화할 수 없습니다",
          message: "Clerk 사용자 정보를 Supabase에 동기화하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        },
        { status: 500 }
      );
    }

    console.log("✅ 사용자 확인 완료:", userData.id);
    const userId = userData.id;
    
    const supabase = getServiceRoleClient();

    // 3. 최근 4주간의 주간 식단 조회
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28); // 4주 전

    const { data: weeklyPlans, error: plansError } = await supabase
      .from("weekly_diet_plans")
      .select("id, week_start_date")
      .eq("user_id", userId)
      .gte("week_start_date", fourWeeksAgo.toISOString().split("T")[0])
      .order("week_start_date", { ascending: false })
      .limit(4);

    if (plansError) {
      console.error("❌ 주간 식단 조회 실패:", plansError);
      console.groupEnd();
      return NextResponse.json(
        { error: "주간 식단을 불러오는데 실패했습니다" },
        { status: 500 }
      );
    }

    if (!weeklyPlans || weeklyPlans.length === 0) {
      console.log("⚠️ 주간 식단 없음");
      console.groupEnd();
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    console.log(`✅ 주간 식단 ${weeklyPlans.length}개 조회 완료`);

    // 4. 각 주간 식단의 장보기 리스트 조회
    const weeklyPlanIds = weeklyPlans.map((plan) => plan.id);

    const { data: shoppingLists, error: shoppingError } = await supabase
      .from("weekly_shopping_lists")
      .select("ingredient_name, category, total_quantity, unit")
      .in("weekly_diet_plan_id", weeklyPlanIds);

    if (shoppingError) {
      console.error("❌ 장보기 리스트 조회 실패:", shoppingError);
      console.groupEnd();
      return NextResponse.json(
        { error: "장보기 리스트를 불러오는데 실패했습니다" },
        { status: 500 }
      );
    }

    if (!shoppingLists || shoppingLists.length === 0) {
      console.log("⚠️ 장보기 리스트 없음");
      console.groupEnd();
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    console.log(`✅ 장보기 리스트 ${shoppingLists.length}개 조회 완료`);

    // 5. 재료별 빈도 집계
    const ingredientMap = new Map<
      string,
      {
        name: string;
        category: string;
        frequency: number;
        totalQuantity: number;
        unit: string;
      }
    >();

    for (const item of shoppingLists) {
      const key = item.ingredient_name.toLowerCase().trim();
      const existing = ingredientMap.get(key);

      if (existing) {
        existing.frequency += 1;
        existing.totalQuantity += Number(item.total_quantity) || 0;
      } else {
        ingredientMap.set(key, {
          name: item.ingredient_name,
          category: item.category || "기타",
          frequency: 1,
          totalQuantity: Number(item.total_quantity) || 0,
          unit: item.unit || "",
        });
      }
    }

    // 6. 빈도순으로 정렬하고 상위 8개 선택
    const sortedItems = Array.from(ingredientMap.values())
      .sort((a, b) => {
        // 빈도가 같으면 총 수량으로 정렬
        if (b.frequency === a.frequency) {
          return b.totalQuantity - a.totalQuantity;
        }
        return b.frequency - a.frequency;
      })
      .slice(0, 8)
      .map((item, index) => ({
        id: `item-${index + 1}`,
        name: item.name,
        category: item.category,
        frequency: item.frequency,
        // 이미지 URL과 가격은 추후 외부 API 연동 시 추가
        imageUrl: undefined,
        price: undefined,
      }));

    console.log(`✅ 상위 ${sortedItems.length}개 재료 반환`);
    console.groupEnd();

    return NextResponse.json({ items: sortedItems }, { status: 200 });
  } catch (error) {
    console.error("❌ 자주 구매하는 식자재 조회 실패:", error);
    console.error(
      "❌ 오류 상세:",
      error instanceof Error ? error.message : String(error)
    );
    console.groupEnd();
    return NextResponse.json(
      {
        error: "자주 구매하는 식자재를 불러오는데 실패했습니다",
        details: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}
















