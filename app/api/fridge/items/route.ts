/**
 * @file app/api/fridge/items/route.ts
 * @description 냉장고 식재료 목록 조회 API
 */

import { NextResponse } from "next/server";
import { getFridgeItems } from "@/actions/fridge/manage-ingredients";

export async function GET() {
  const result = await getFridgeItems();
  
  if (result.success) {
    return NextResponse.json({ items: result.items });
  } else {
    return NextResponse.json(
      { error: result.error, items: [] },
      { status: result.error === "로그인이 필요합니다" ? 401 : 500 }
    );
  }
}

