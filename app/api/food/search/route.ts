/**
 * @file api/food/search/route.ts
 * @description foodreaserch2.md 기반 한국 음식 검색어 생성 API
 *
 * 이 API는 foodreaserch2.md 문서의 3단계 검색 우선순위를 따르는 검색어를 생성합니다.
 *
 * 주요 기능:
 * 1. 한국 음식명을 3단계 우선순위 검색어로 변환
 * 2. 검색 플랜 생성 및 반환
 *
 * @dependencies
 * - lib/korean-food-search.ts: 검색어 변환 로직
 * - lib/food-image-search.ts: 검색 플랜 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getFoodSearchPlans,
  getMultipleFoodSearchPlans,
} from '@/lib/food-image-search';
import { getKoreanFoodSearchQueries } from '@/lib/korean-food-search';

/**
 * GET /api/food/search
 *
 * Query Parameters:
 * - q: 검색어 (한국 음식명) - 필수
 * - foods: 쉼표로 구분된 여러 음식명 (q 대신 사용 가능) - 선택
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const foods = searchParams.get('foods'); // 쉼표로 구분된 여러 음식명

    console.groupCollapsed('[Food Search API] 검색 요청');
    console.log('query:', query);
    console.log('foods:', foods);

    // 여러 음식 검색 모드
    if (foods) {
      const foodList = foods
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      if (foodList.length === 0) {
        return NextResponse.json(
          { error: '음식명을 입력해주세요' },
          { status: 400 }
        );
      }

      console.log('다중 음식 검색 모드:', foodList);

      const searchPlans = getMultipleFoodSearchPlans(foodList);
      const queries = foodList.reduce((acc, foodName) => {
        acc[foodName] = getKoreanFoodSearchQueries(foodName);
        return acc;
      }, {} as Record<string, { priority1: string; priority2: string; priority3: string }>);

      console.log('검색 결과:', Object.keys(searchPlans).length, '개 음식');
      console.groupEnd();

      return NextResponse.json({
        success: true,
        mode: 'multiple',
        results: {
          searchPlans,
          queries,
        },
        count: Object.keys(searchPlans).length,
      });
    }

    // 단일 검색 모드
    if (!query.trim()) {
      return NextResponse.json(
        { error: '검색어를 입력해주세요 (q 파라미터 또는 foods 파라미터 필요)' },
        { status: 400 }
      );
    }

    console.log('단일 검색 모드:', query);

    // 검색 플랜 생성
    const searchPlans = getFoodSearchPlans(query);
    const queries = getKoreanFoodSearchQueries(query);

    console.log('검색 플랜:', searchPlans.map(p => `${p.priority}순위: ${p.query}`).join(', '));
    console.groupEnd();

    return NextResponse.json({
      success: true,
      mode: 'single',
      query: {
        original: query,
        queries,
      },
      searchPlans,
      count: searchPlans.length,
    });
  } catch (error) {
    console.error('[Food Search API] 오류:', error);

    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';

    return NextResponse.json(
      {
        error: '검색어 생성에 실패했습니다',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

