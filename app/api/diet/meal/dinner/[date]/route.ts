/**
 * @file app/api/diet/meal/dinner/[date]/route.ts
 * @description 저녁 식단 조회 API
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

    // 실제로는 데이터베이스에서 해당 날짜의 저녁 식단을 조회
    // 현재는 샘플 데이터 반환
    const dinnerMeal = generateSampleDinnerMeal(date);

    return NextResponse.json({
      success: true,
      meal: dinnerMeal
    });

  } catch (error) {
    console.error('[Dinner Meal API] 오류:', error);
    return NextResponse.json(
      { error: '저녁 식단 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 샘플 저녁 식단 데이터 생성
 */
function generateSampleDinnerMeal(date: string) {
  const dinnerOptions = [
    {
      id: 'dinner-1',
      name: '미역국과 불고기',
      calories: 534,
      nutrition: {
        calories: 534,
        protein: 35.2,
        carbohydrates: 52.8,
        fat: 19.6,
        fiber: 6.9,
        sugar: 18.7,
        sodium: 1680,
        cholesterol: 76
      },
      ingredients: [
        { name: '소고기', quantity: 100 },
        { name: '미역', quantity: 30 },
        { name: '감자', quantity: 80 },
        { name: '당근', quantity: 40 },
        { name: '양파', quantity: 50 },
        { name: '현미밥', quantity: 180 }
      ]
    },
    {
      id: 'dinner-2',
      name: '연어구이와 야채 볶음',
      calories: 487,
      nutrition: {
        calories: 487,
        protein: 38.9,
        carbohydrates: 29.4,
        fat: 24.7,
        fiber: 8.2,
        sugar: 13.8,
        sodium: 723,
        cholesterol: 102
      },
      ingredients: [
        { name: '연어', quantity: 120 },
        { name: '브로콜리', quantity: 60 },
        { name: '피망', quantity: 40 },
        { name: '양파', quantity: 30 },
        { name: '올리브오일', quantity: 10 },
        { name: '마늘', quantity: 5 }
      ]
    },
    {
      id: 'dinner-3',
      name: '된장찌개와 시금치 나물',
      calories: 398,
      nutrition: {
        calories: 398,
        protein: 28.4,
        carbohydrates: 44.7,
        fat: 14.2,
        fiber: 9.8,
        sugar: 11.3,
        sodium: 1890,
        cholesterol: 12
      },
      ingredients: [
        { name: '두부', quantity: 150 },
        { name: '감자', quantity: 60 },
        { name: '호박', quantity: 50 },
        { name: '시금치', quantity: 60 },
        { name: '된장', quantity: 20 },
        { name: '대파', quantity: 15 }
      ]
    },
    {
      id: 'dinner-4',
      name: '치킨 샐러드',
      calories: 456,
      nutrition: {
        calories: 456,
        protein: 42.1,
        carbohydrates: 25.6,
        fat: 18.3,
        fiber: 7.4,
        sugar: 9.8,
        sodium: 587,
        cholesterol: 89
      },
      ingredients: [
        { name: '닭가슴살', quantity: 130 },
        { name: '양상추', quantity: 80 },
        { name: '토마토', quantity: 60 },
        { name: '올리브오일', quantity: 8 },
        { name: '레몬즙', quantity: 10 },
        { name: '허브', quantity: 3 }
      ]
    }
  ];

  // 날짜에 따른 일관된 선택
  const dateHash = date.split('-').reduce((acc, part) => acc + parseInt(part), 0);
  const selectedMeal = dinnerOptions[dateHash % dinnerOptions.length];

  return {
    ...selectedMeal,
    date,
    type: 'dinner'
  };
}
