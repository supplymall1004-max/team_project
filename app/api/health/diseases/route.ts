/**
 * 질병 API 엔드포인트
 * 
 * GET /api/health/diseases - 모든 질병 목록 조회
 */

import { NextResponse } from 'next/server';
import { DiseaseManager } from '@/lib/health/disease-manager';

export async function GET() {
    try {
        const diseases = await DiseaseManager.getAllDiseases();

        return NextResponse.json({
            success: true,
            data: diseases,
        });
    } catch (error) {
        console.error('질병 목록 조회 오류:', error);

        return NextResponse.json(
            {
                success: false,
                error: '질병 목록을 조회하는 중 오류가 발생했습니다.',
            },
            { status: 500 }
        );
    }
}
