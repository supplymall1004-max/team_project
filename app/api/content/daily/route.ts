/**
 * @file app/api/content/daily/route.ts
 * @description 오늘의 콘텐츠 API (건강 상식, 인기 레시피, 개인화 추천)
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * 날짜의 일년 중 몇 번째 날인지 계산
 */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export async function GET() {
  try {
    const { userId } = await auth();
    const supabase = await createClerkSupabaseClient();
    const today = new Date();
    const dayOfYear = getDayOfYear(today);

    // 1. 오늘의 건강 상식 (날짜 기반 로테이션)
    const { data: tips } = await supabase
      .from("daily_health_tips")
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    let healthTip = null;
    if (tips && tips.length > 0) {
      const tipIndex = dayOfYear % tips.length;
      const tip = tips[tipIndex];
      healthTip = {
        title: tip.title,
        content: tip.content,
        icon: tip.icon,
        category: tip.category,
      };
    }

    // 2. 인기 레시피 (최근 7일 기준)
    const { data: popularRecipes } = await supabase
      .from("recipes")
      .select("id, title, image, category, calories")
      .order("created_at", { ascending: false })
      .limit(10);

    // 3. 개인화 추천 (로그인 시)
    let personalizedRecipes: any[] = [];
    if (userId) {
      // TODO: 실제 개인화 로직 구현
      // 현재는 임시로 최신 레시피 반환
      const { data: recipes } = await supabase
        .from("recipes")
        .select("id, title, image, category, calories")
        .order("created_at", { ascending: false })
        .limit(6);
      
      personalizedRecipes = recipes || [];
    }

    return NextResponse.json({
      healthTip,
      popularRecipes: popularRecipes || [],
      personalizedRecipes,
    });

  } catch (error) {
    console.error("[DailyContent] 오류:", error);
    return NextResponse.json(
      { 
        healthTip: {
          title: "물 마시기",
          content: "하루 8잔의 물을 마시면 신진대사가 활발해집니다.",
          icon: "💧",
          category: "nutrition"
        },
        popularRecipes: [],
        personalizedRecipes: [],
      },
      { status: 200 }
    );
  }
}

