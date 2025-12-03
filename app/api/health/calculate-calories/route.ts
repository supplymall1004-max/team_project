/**
 * 칼로리 계산 API 엔드포인트
 * 
 * POST /api/health/calculate-calories - 칼로리 계산
 */

import { NextResponse } from 'next/server';
import { CalorieCalculatorEnhanced, type CalorieParams } from '@/lib/health/calorie-calculator-enhanced';
import { DiseaseManager } from '@/lib/health/disease-manager';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            method = 'auto',
            gender,
            age,
            weight,
            height,
            activityLevel,
            diseaseCodes = [],
        } = body;

        // 유효성 검사
        if (!gender || !age || !weight || !height || !activityLevel) {
            return NextResponse.json(
                {
                    success: false,
                    error: '필수 파라미터가 누락되었습니다.',
                },
                { status: 400 }
            );
        }

        // 질병 정보 조회
        const diseases = [];
        for (const code of diseaseCodes) {
            const disease = await DiseaseManager.getDiseaseByCode(code);
            if (disease) {
                diseases.push(disease);
            }
        }

        const params: CalorieParams = {
            gender,
            age,
            weight,
            height,
            activityLevel,
            diseases,
        };

        // 공식 선택 및 계산
        let result;

        switch (method) {
            case 'mifflin_st_jeor':
                result = CalorieCalculatorEnhanced.calculateMifflinStJeor(params);
                break;
            case 'harris_benedict':
                result = CalorieCalculatorEnhanced.calculateHarrisBenedict(params);
                break;
            case 'eer':
                result = CalorieCalculatorEnhanced.calculateEER(params as any);
                break;
            case 'auto':
            default:
                result = CalorieCalculatorEnhanced.calculateAuto(params);
                break;
        }

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('칼로리 계산 오류:', error);

        return NextResponse.json(
            {
                success: false,
                error: '칼로리를 계산하는 중 오류가 발생했습니다.',
            },
            { status: 500 }
        );
    }
}
