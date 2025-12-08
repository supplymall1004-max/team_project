/**
 * @file app/api/mfds-recipes/route.ts
 * @description 식약처 레시피 API 라우트
 * 
 * 주요 기능:
 * 1. 식약처 API를 통한 레시피 목록 조회
 * 2. 배치 요청으로 여러 레시피 가져오기
 * 3. 차트 데이터 생성
 */

import { NextResponse } from 'next/server';
import { getMfdsRecipeList, parseNutritionInfo, type RecipeItem } from '@/lib/services/mfds-recipe-api';

// 이 라우트는 항상 동적으로 렌더링되어야 함 (쿼리 파라미터 사용)
export const dynamic = 'force-dynamic';

/**
 * GET /api/mfds-recipes
 * 레시피 목록을 가져오는 API 엔드포인트
 */
export async function GET(request: Request) {
  try {
    console.log('[API 라우트] 레시피 목록 요청 시작');
    
    // 환경 변수 확인
    const apiKey = process.env.FOOD_SAFETY_RECIPE_API_KEY;
    console.log('[API 라우트] 환경 변수 확인:', {
      apiKeyExists: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
    });
    
    if (!apiKey) {
      console.error('[API 라우트] FOOD_SAFETY_RECIPE_API_KEY가 설정되지 않았습니다.');
      return NextResponse.json(
        {
          success: false,
          error: 'FOOD_SAFETY_RECIPE_API_KEY가 환경 변수에 설정되지 않았습니다. .env.local 파일을 확인해주세요.',
          recipes: [],
          chartData: [],
          totalCount: 0,
        },
        { status: 500 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const start = parseInt(searchParams.get('start') || '1', 10);
    const end = parseInt(searchParams.get('end') || '100', 10);
    const maxRecipes = parseInt(searchParams.get('maxRecipes') || '500', 10);

    console.log('[API 라우트] 요청 파라미터:', { start, end, maxRecipes });

    const batchSize = 100;
    let recipeList: RecipeItem[] = [];
    
    // 여러 배치로 나누어 순차적으로 요청
    for (let batchStart = start; batchStart <= Math.min(end, maxRecipes); batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize - 1, Math.min(end, maxRecipes));
      console.log(`[API 라우트] 배치 요청: ${batchStart} ~ ${batchEnd}`);
      
      try {
        const batch = await getMfdsRecipeList(batchStart, batchEnd);
        recipeList = [...recipeList, ...batch];
        
        // 배치 결과가 비어있으면 더 이상 데이터가 없음
        if (batch.length === 0) {
          console.log(`[API 라우트] ${batchStart}번째부터 데이터가 없어 요청 중단`);
          break;
        }
      } catch (err) {
        console.error(`[API 라우트] 배치 ${batchStart}-${batchEnd} 요청 실패:`, err);
        // 일부 배치 실패해도 계속 진행
        break;
      }
    }
    
    console.log('[API 라우트] 레시피 목록 로딩 완료:', recipeList.length, '개');

    // 차트 데이터 생성
    const chartData = recipeList.map((recipe) => {
      const nutrition = parseNutritionInfo(recipe);
      return {
        name: recipe.RCP_NM.length > 15 ? recipe.RCP_NM.substring(0, 15) + '...' : recipe.RCP_NM,
        칼로리: nutrition.calories,
      };
    });

    return NextResponse.json({
      success: true,
      recipes: recipeList,
      chartData,
      totalCount: recipeList.length,
    });
  } catch (error) {
    console.error('[API 라우트] 레시피 로딩 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '레시피를 불러오는 중 오류가 발생했습니다.',
        recipes: [],
        chartData: [],
        totalCount: 0,
      },
      { status: 500 }
    );
  }
}

