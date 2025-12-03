/**
 * 알레르기 API 엔드포인트
 * 
 * GET /api/health/allergies - 모든 알레르기 목록 조회
 */

import { NextResponse } from 'next/server';
import { AllergyManager } from '@/lib/health/allergy-manager';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        let allergies;

        if (category === 'major_8') {
            allergies = await AllergyManager.getMajor8Allergies();
        } else if (category === 'special') {
            allergies = await AllergyManager.getSpecialAllergies();
        } else {
            allergies = await AllergyManager.getAllAllergies();
        }

        return NextResponse.json({
            success: true,
            data: allergies,
        });
    } catch (error) {
        console.error('알레르기 목록 조회 오류:', error);

        return NextResponse.json(
            {
                success: false,
                error: '알레르기 목록을 조회하는 중 오류가 발생했습니다.',
            },
            { status: 500 }
        );
    }
}
