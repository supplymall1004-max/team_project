/**
 * @file app/api/diet/meal/breakfast/[date]/route.ts
 * @description 아침 식단 조회 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const supabase = await createClerkSupabaseClient();

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 날짜 파싱
    const date = params.date;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: '올바른 날짜 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 실제로는 데이터베이스에서 해당 날짜의 아침 식단을 조회
    // 현재는 샘플 데이터 반환
    const breakfastMeal = generateSampleBreakfastMeal(date);

    return NextResponse.json({
      success: true,
      meal: breakfastMeal
    });

  } catch (error) {
    console.error('[Breakfast Meal API] 오류:', error);
    return NextResponse.json(
      { error: '아침 식단 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 샘플 아침 식단 데이터 생성
 */
function generateSampleBreakfastMeal(date: string) {
  const breakfastOptions = [
    {
      id: 'breakfast-1',
      name: '현미밥과 채소 계란찜',
      calories: 485,
      nutrition: {
        calories: 485,
        protein: 22.5,
        carbohydrates: 58.2,
        fat: 18.3,
        fiber: 8.4,
        sugar: 12.1,
        sodium: 892,
        cholesterol: 245
      },
      ingredients: [
        { name: '현미밥', quantity: 210 },
        { name: '계란', quantity: 100 },
        { name: '시금치', quantity: 50 },
        { name: '양파', quantity: 30 },
        { name: '당근', quantity: 20 },
        { name: '두부', quantity: 50 }
      ]
    },
    {
      id: 'breakfast-2',
      name: '통곡물 토스트와 아보카도',
      calories: 412,
      nutrition: {
        calories: 412,
        protein: 15.8,
        carbohydrates: 45.6,
        fat: 16.7,
        fiber: 12.3,
        sugar: 8.9,
        sodium: 634,
        cholesterol: 12
      },
      ingredients: [
        { name: '통곡물빵', quantity: 100 },
        { name: '아보카도', quantity: 80 },
        { name: '토마토', quantity: 50 },
        { name: '양상추', quantity: 30 },
        { name: '훈제연어', quantity: 50 },
        { name: '레몬', quantity: 20 }
      ]
    },
    {
      id: 'breakfast-3',
      name: '오트밀과 베리 스무디',
      calories: 378,
      nutrition: {
        calories: 378,
        protein: 18.4,
        carbohydrates: 52.1,
        fat: 9.2,
        fiber: 11.8,
        sugar: 22.4,
        sodium: 156,
        cholesterol: 8
      },
      ingredients: [
        { name: '오트밀', quantity: 50 },
        { name: '블루베리', quantity: 50 },
        { name: '바나나', quantity: 80 },
        { name: '그릭요거트', quantity: 150 },
        { name: '아몬드', quantity: 20 },
        { name: '꿀', quantity: 10 }
      ]
    }
  ];

  // 날짜에 따른 일관된 선택
  const dateHash = date.split('-').reduce((acc, part) => acc + parseInt(part), 0);
  const selectedMeal = breakfastOptions[dateHash % breakfastOptions.length];

  return {
    ...selectedMeal,
    date,
    type: 'breakfast'
  };
}
