/**
 * @file app/api/test/seed-sample-data/route.ts
 * @description 샘플 레시피 데이터를 데이터베이스에 삽입하는 API
 */

import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

export async function POST() {
  try {
    const supabase = getServiceRoleClient();

    // 기존 샘플 데이터 삭제 (개발 환경 전용)
    console.log("기존 샘플 데이터 삭제 중...");
    await supabase.from("recipes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("recipe_ingredients").delete().neq("recipe_id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("recipe_steps").delete().neq("recipe_id", "00000000-0000-0000-0000-000000000000");

    // 샘플 레시피 데이터 삽입
    console.log("샘플 레시피 데이터 삽입 중...");
    const { data: recipes, error: recipeError } = await supabase
      .from("recipes")
      .insert([
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          slug: 'white-rice',
          title: '흰쌀밥',
          description: '기본 흰쌀밥 한 공기',
          difficulty: 1,
          cooking_time_minutes: 25,
          servings: 1,
          calories: 310,
          carbohydrates: 68.0,
          protein: 5.5,
          fat: 0.5,
          sodium: 2,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          slug: 'brown-rice',
          title: '현미밥',
          description: '건강한 현미밥 한 공기',
          difficulty: 1,
          cooking_time_minutes: 40,
          servings: 1,
          calories: 330,
          carbohydrates: 72.0,
          protein: 6.8,
          fat: 2.3,
          sodium: 2,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          slug: 'spinach-namul',
          title: '시금치나물',
          description: '건강한 시금치 무침',
          difficulty: 2,
          cooking_time_minutes: 10,
          servings: 1,
          calories: 45,
          carbohydrates: 4.0,
          protein: 2.5,
          fat: 2.5,
          sodium: 15,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          slug: 'doenjang-soup',
          title: '된장국',
          description: '구수한 된장국',
          difficulty: 2,
          cooking_time_minutes: 15,
          servings: 1,
          calories: 60,
          carbohydrates: 6.0,
          protein: 4.0,
          fat: 2.0,
          sodium: 650,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440005',
          slug: 'bulgogi',
          title: '불고기',
          description: '한국의 대표적인 고기 요리로, 얇게 썬 쇠고기를 양념에 재워 구운 요리입니다.',
          difficulty: 3,
          cooking_time_minutes: 30,
          servings: 4,
          calories: 350,
          carbohydrates: 15.0,
          protein: 25.0,
          fat: 20.0,
          sodium: 1200,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440006',
          slug: 'bibimbap',
          title: '비빔밥',
          description: '밥 위에 여러 나물과 고기를 올리고 고추장을 넣어 비벼 먹는 한국의 대표 음식입니다.',
          difficulty: 2,
          cooking_time_minutes: 20,
          servings: 2,
          calories: 450,
          carbohydrates: 60.0,
          protein: 15.0,
          fat: 12.0,
          sodium: 800,
        },
      ])
      .select();

    if (recipeError) {
      console.error("레시피 삽입 에러:", recipeError);
      return NextResponse.json(
        { success: false, error: recipeError.message },
        { status: 500 }
      );
    }

    // 샘플 재료 데이터 삽입
    console.log("샘플 재료 데이터 삽입 중...");
    const { error: ingredientError } = await supabase
      .from("recipe_ingredients")
      .insert([
        // 된장국 재료
        {
          recipe_id: '550e8400-e29b-41d4-a716-446655440004',
          name: '된장',
          ingredient_name: '된장',
          quantity: 1,
          unit: '큰술',
          category: '조미료',
          display_order: 1,
        },
        {
          recipe_id: '550e8400-e29b-41d4-a716-446655440004',
          name: '애호박',
          ingredient_name: '애호박',
          quantity: 0.5,
          unit: '개',
          category: '채소',
          display_order: 2,
        },
        // 시금치나물 재료
        {
          recipe_id: '550e8400-e29b-41d4-a716-446655440003',
          name: '시금치',
          ingredient_name: '시금치',
          quantity: 200,
          unit: 'g',
          category: '채소',
          display_order: 1,
        },
        {
          recipe_id: '550e8400-e29b-41d4-a716-446655440003',
          name: '참기름',
          ingredient_name: '참기름',
          quantity: 1,
          unit: '큰술',
          category: '조미료',
          display_order: 2,
        },
        // 불고기 재료
        {
          recipe_id: '550e8400-e29b-41d4-a716-446655440005',
          name: '쇠고기',
          ingredient_name: '쇠고기',
          quantity: 500,
          unit: 'g',
          category: '육류',
          display_order: 1,
        },
        {
          recipe_id: '550e8400-e29b-41d4-a716-446655440005',
          name: '양파',
          ingredient_name: '양파',
          quantity: 1,
          unit: '개',
          category: '채소',
          display_order: 2,
        },
        // 비빔밥 재료
        {
          recipe_id: '550e8400-e29b-41d4-a716-446655440006',
          name: '밥',
          ingredient_name: '밥',
          quantity: 2,
          unit: '공기',
          category: '곡물',
          display_order: 1,
        },
        {
          recipe_id: '550e8400-e29b-41d4-a716-446655440006',
          name: '시금치',
          ingredient_name: '시금치',
          quantity: 100,
          unit: 'g',
          category: '채소',
          display_order: 2,
        },
      ]);

    if (ingredientError) {
      console.error("재료 삽입 에러:", ingredientError);
      return NextResponse.json(
        { success: false, error: ingredientError.message },
        { status: 500 }
      );
    }

    // 샘플 단계 데이터 삽입
    console.log("샘플 단계 데이터 삽입 중...");
    const { error: stepError } = await supabase
      .from("recipe_steps")
      .insert([
        // 된장국 단계
        {
          recipe_id: '550e8400-e29b-41d4-a716-446655440004',
          step_number: 1,
          content: '냄비에 멸치육수를 넣고 끓입니다.',
        },
        {
          recipe_id: '550e8400-e29b-41d4-a716-446655440004',
          step_number: 2,
          content: '애호박과 두부를 먹기 좋은 크기로 썰어 넣습니다.',
        },
        {
          recipe_id: '550e8400-e29b-41d4-a716-446655440004',
          step_number: 3,
          content: '된장을 풀어 넣고 끓입니다.',
        },
        // 시금치나물 단계
        {
          recipe_id: '550e8400-e29b-41d4-a716-446655440003',
          step_number: 1,
          content: '시금치를 깨끗이 씻어 데칩니다.',
        },
        {
          recipe_id: '550e8400-e29b-41d4-a716-446655440003',
          step_number: 2,
          content: '찬물에 헹구어 물기를 짜줍니다.',
        },
        {
          recipe_id: '550e8400-e29b-41d4-a716-446655440003',
          step_number: 3,
          content: '참기름, 다진 마늘, 깨소금을 넣고 무칩니다.',
        },
        // 불고기 단계
        {
          recipe_id: '550e8400-e29b-41d4-a716-446655440005',
          step_number: 1,
          content: '쇠고기를 얇게 썰어 준비합니다.',
        },
        {
          recipe_id: '550e8400-e29b-41d4-a716-446655440005',
          step_number: 2,
          content: '양파와 대파를 썰어 준비합니다.',
        },
        {
          recipe_id: '550e8400-e29b-41d4-a716-446655440005',
          step_number: 3,
          content: '간장, 설탕, 다진 마늘, 생강즙을 섞어 양념장을 만듭니다.',
        },
      ]);

    if (stepError) {
      console.error("단계 삽입 에러:", stepError);
      return NextResponse.json(
        { success: false, error: stepError.message },
        { status: 500 }
      );
    }

    console.log("샘플 데이터 삽입 완료");
    return NextResponse.json({
      success: true,
      message: "샘플 데이터가 성공적으로 삽입되었습니다.",
      insertedRecipes: recipes?.length || 0
    });

  } catch (error) {
    console.error("샘플 데이터 삽입 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
