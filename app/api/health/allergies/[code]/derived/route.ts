/**
 * 알레르기 파생 재료 API 엔드포인트
 * 
 * GET /api/health/allergies/[code]/derived - 특정 알레르기의 파생 재료 조회
 */

import { NextResponse } from 'next/server';
import { AllergyManager } from '@/lib/health/allergy-manager';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;

        const derivedIngredients = await AllergyManager.getDerivedIngredients([code]);

        return NextResponse.json({
            success: true,
            data: derivedIngredients,
        });
    } catch (error) {
        console.error('파생 재료 조회 오류:', error);

        return NextResponse.json(
            {
                success: false,
                error: '파생 재료를 조회하는 중 오류가 발생했습니다.',
            },
            { status: 500 }
        );
    }
}
