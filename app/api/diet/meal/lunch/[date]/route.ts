/**
 * @file app/api/diet/meal/lunch/[date]/route.ts
 * @description 점심 식단 조회 API
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

    // 실제로는 데이터베이스에서 해당 날짜의 점심 식단을 조회
    // 현재는 샘플 데이터 반환
    const lunchMeal = generateSampleLunchMeal(date);

    return NextResponse.json({
      success: true,
      meal: lunchMeal
    });

  } catch (error) {
    console.error('[Lunch Meal API] 오류:', error);
    return NextResponse.json(
      { error: '점심 식단 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 샘플 점심 식단 데이터 생성
 */
function generateSampleLunchMeal(date: string) {
  const lunchOptions = [
    {
      id: 'lunch-1',
      name: '제육볶음과 콩나물 무침',
      calories: 612,
      nutrition: {
        calories: 612,
        protein: 38.7,
        carbohydrates: 68.4,
        fat: 22.8,
        fiber: 9.2,
        sugar: 15.3,
        sodium: 1420,
        cholesterol: 89
      },
      ingredients: [
        { name: '돼지고기', quantity: 120 },
        { name: '콩나물', quantity: 100 },
        { name: '양파', quantity: 50 },
        { name: '당근', quantity: 40 },
        { name: '대파', quantity: 30 },
        { name: '현미밥', quantity: 210 }
      ]
    },
    {
      id: 'lunch-2',
      name: '연어 스테이크와 채소',
      calories: 548,
      nutrition: {
        calories: 548,
        protein: 42.3,
        carbohydrates: 35.7,
        fat: 28.6,
        fiber: 7.8,
        sugar: 11.2,
        sodium: 856,
        cholesterol: 124
      },
      ingredients: [
        { name: '연어', quantity: 150 },
        { name: '브로콜리', quantity: 80 },
        { name: '감자', quantity: 100 },
        { name: '올리브오일', quantity: 15 },
        { name: '레몬', quantity: 20 },
        { name: '허브', quantity: 5 }
      ]
    },
    {
      id: 'lunch-3',
      name: '두부조림과 시금치 나물',
      calories: 423,
      nutrition: {
        calories: 423,
        protein: 31.8,
        carbohydrates: 45.2,
        fat: 16.9,
        fiber: 11.4,
        sugar: 9.7,
        sodium: 1248,
        cholesterol: 0
      },
      ingredients: [
        { name: '두부', quantity: 200 },
        { name: '시금치', quantity: 80 },
        { name: '양파', quantity: 40 },
        { name: '대파', quantity: 20 },
        { name: '된장', quantity: 15 },
        { name: '참기름', quantity: 5 }
      ]
    },
    {
      id: 'lunch-4',
      name: '닭가슴살 샐러드',
      calories: 487,
      nutrition: {
        calories: 487,
        protein: 45.6,
        carbohydrates: 28.9,
        fat: 19.2,
        fiber: 8.7,
        sugar: 12.4,
        sodium: 789,
        cholesterol: 98
      },
      ingredients: [
        { name: '닭가슴살', quantity: 150 },
        { name: '양상추', quantity: 100 },
        { name: '토마토', quantity: 80 },
        { name: '오이', quantity: 50 },
        { name: '올리브오일', quantity: 10 },
        { name: '발사믹식초', quantity: 15 }
      ]
    }
  ];

  // 날짜에 따른 일관된 선택
  const dateHash = date.split('-').reduce((acc, part) => acc + parseInt(part), 0);
  const selectedMeal = lunchOptions[dateHash % lunchOptions.length];

  return {
    ...selectedMeal,
    date,
    type: 'lunch'
  };
}
