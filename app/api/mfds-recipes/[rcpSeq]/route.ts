/**
 * @file app/api/mfds-recipes/[rcpSeq]/route.ts
 * @description 식약처 레시피 조회 API
 *
 * 클라이언트에서 레시피를 조회할 수 있도록 API를 제공합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadRecipeBySeq } from '@/lib/mfds/recipe-loader';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rcpSeq: string }> }
) {
  try {
    const { rcpSeq } = await params;

    if (!rcpSeq) {
      return NextResponse.json(
        { error: '레시피 순번이 필요합니다' },
        { status: 400 }
      );
    }

    const recipe = loadRecipeBySeq(rcpSeq);

    if (!recipe) {
      return NextResponse.json(
        { error: '레시피를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error('[MFDS Recipe API] 레시피 조회 실패:', error);
    return NextResponse.json(
      { error: '레시피 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

