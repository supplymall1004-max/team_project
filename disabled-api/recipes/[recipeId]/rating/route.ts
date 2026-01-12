/**
 * @file app/api/recipes/[recipeId]/rating/route.ts
 * @description 레시피 평점 저장 API
 *
 * POST /api/recipes/[recipeId]/rating
 * Service Role 클라이언트를 사용하여 RLS를 우회하고 평가 저장
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * POST /api/recipes/[recipeId]/rating
 * 레시피 평점 저장 또는 업데이트
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    console.group("⭐ [RecipeRating][API]");
    
    const { recipeId } = await params;
    
    // 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Clerk User ID:", clerkUserId);
    console.log("Recipe ID:", recipeId);

    // 요청 본문 파싱
    const body = await request.json();
    const { rating } = body;

    if (!rating || typeof rating !== "number" || rating < 0.5 || rating > 5.0) {
      console.error("❌ 잘못된 평점 값:", rating);
      console.groupEnd();
      return NextResponse.json(
        { error: "평점은 0.5에서 5.0 사이의 숫자여야 합니다." },
        { status: 400 }
      );
    }

    // Service Role 클라이언트 사용 (RLS 우회)
    const supabase = getServiceRoleClient();

    // 1. 사용자 ID 조회
    console.log("🔍 사용자 조회 중...");
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .maybeSingle();

    if (userError) {
      console.error("❌ 사용자 조회 오류:", {
        code: userError.code,
        message: userError.message,
        details: userError.details,
      });
      console.groupEnd();
      return NextResponse.json(
        { error: `사용자 조회 실패: ${userError.message}` },
        { status: 500 }
      );
    }

    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없음");
      console.groupEnd();
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다. 먼저 사용자 동기화를 완료해주세요." },
        { status: 404 }
      );
    }

    console.log("✅ 사용자 ID:", userData.id);

    // 2. 레시피 존재 확인
    console.log("🔍 레시피 확인 중...");
    const { data: recipeData, error: recipeError } = await supabase
      .from("recipes")
      .select("id")
      .eq("id", recipeId)
      .maybeSingle();

    if (recipeError) {
      console.error("❌ 레시피 조회 오류:", {
        code: recipeError.code,
        message: recipeError.message,
      });
      console.groupEnd();
      return NextResponse.json(
        { error: `레시피 조회 실패: ${recipeError.message}` },
        { status: 500 }
      );
    }

    if (!recipeData) {
      console.error("❌ 레시피를 찾을 수 없음");
      console.groupEnd();
      return NextResponse.json(
        { error: "레시피를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    console.log("✅ 레시피 확인 완료");

    // 3. 평점 저장 또는 업데이트
    console.log("💾 평점 저장 중...", {
      recipe_id: recipeId,
      user_id: userData.id,
      rating: rating,
    });

    const { data: ratingData, error: ratingError } = await supabase
      .from("recipe_ratings")
      .upsert(
        {
          recipe_id: recipeId,
          user_id: userData.id,
          rating: rating,
        },
        {
          onConflict: "recipe_id,user_id",
        }
      )
      .select()
      .single();

    if (ratingError) {
      console.error("❌ 평점 저장 실패:", {
        code: ratingError.code,
        message: ratingError.message,
        details: ratingError.details,
        hint: ratingError.hint,
      });
      console.groupEnd();
      return NextResponse.json(
        { 
          error: `평점 저장 실패: ${ratingError.message}`,
          details: ratingError.details,
          code: ratingError.code,
        },
        { status: 500 }
      );
    }

    console.log("✅ 평점 저장 성공:", ratingData);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: ratingData,
    });
  } catch (error) {
    console.error("❌ 예상치 못한 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}

