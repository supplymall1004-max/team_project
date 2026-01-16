/**
 * @file app/api/fridge/expiring/route.ts
 * @description 유통기한 임박 식재료 조회 API
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ items: [] }, { status: 401 });
    }

    const supabase = await createClerkSupabaseClient();

    // 사용자 ID 조회
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!userData) {
      return NextResponse.json({ items: [] }, { status: 404 });
    }

    // 오늘 날짜
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 3일 후 날짜
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);

    // 유통기한이 3일 이내인 식재료 조회
    const { data: items, error } = await supabase
      .from("fridge_ingredients")
      .select("*")
      .eq("user_id", userData.id)
      .lte("expiry_date", threeDaysLater.toISOString().split("T")[0])
      .order("expiry_date", { ascending: true });

    if (error) {
      console.error("[ExpiringAPI] 조회 실패:", error);
      return NextResponse.json({ items: [] }, { status: 500 });
    }

    // 남은 일수 계산
    const itemsWithDays = (items || []).map(item => {
      const expiryDate = new Date(item.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: item.id,
        name: item.name,
        expiryDate: item.expiry_date,
        daysUntilExpiry,
      };
    });

    return NextResponse.json({ items: itemsWithDays });
  } catch (error) {
    console.error("[ExpiringAPI] 오류:", error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}

