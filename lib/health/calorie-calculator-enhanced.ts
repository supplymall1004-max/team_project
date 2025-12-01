/**
 * 고도화된 칼로리 계산 서비스
 * 
 * 다중 공식 지원 (Mifflin-St Jeor, Harris-Benedict, EER, 임신부)
 * 연령대별 자동 선택, 질병 조정, 공식 설명 생성 등
 */

import type { Disease } from './disease-manager';

export interface CalorieParams {
    gender: 'male' | 'female';
    age: number;
    weight: number; // kg
    height: number; // cm
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    diseases?: Disease[];
}

export interface EERParams extends CalorieParams {
    // EER은 성장 에너지가 포함됨
    // 추가 필드가 필요하면 여기에 추가
    [key: string]: unknown;
}

export interface MaternityParams extends CalorieParams {
    trimester: 1 | 2 | 3; // 임신 삼분기
    prePregnancyBMI?: number;
}

export interface CalorieResult {
    calories: number;
    bmr: number;
    tdee: number;
    formula: string;
    explanation: string;
    adjustments: {
        disease?: number;
        activity?: number;
    };
}

export class CalorieCalculatorEnhanced {
    /**
     * 활동 계수 매핑
     */
    private static readonly ACTIVITY_FACTORS = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9,
    };

    /**
     * Mifflin-St Jeor 공식 (성인용, 기본)
     */
    static calculateMifflinStJeor(params: CalorieParams): CalorieResult {
        const { gender, age, weight, height, activityLevel, diseases = [] } = params;

        // BMR 계산
        let bmr: number;
        if (gender === 'male') {
            bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }

        // TDEE 계산
        const activityFactor = this.ACTIVITY_FACTORS[activityLevel];
        const tdee = bmr * activityFactor;

        // 질병 조정
        let finalCalories = tdee;
        let diseaseAdjustment = 0;

        if (diseases.length > 0) {
            const lowestFactor = Math.min(
                ...diseases.map((d) => d.calorie_adjustment_factor)
            );
            finalCalories = tdee * lowestFactor;
            diseaseAdjustment = finalCalories - tdee;
        }

        // 최소 안전 칼로리 보장
        const minCalories = gender === 'male' ? 1500 : 1200;
        finalCalories = Math.max(finalCalories, minCalories);

        // 공식 설명
        const formula = 'Mifflin-St Jeor';
        const explanation = this.getFormulaExplanation('mifflin_st_jeor', params, {
            bmr,
            tdee,
            finalCalories,
        });

        return {
            calories: Math.round(finalCalories),
            bmr: Math.round(bmr),
            tdee: Math.round(tdee),
            formula,
            explanation,
            adjustments: {
                disease: diseaseAdjustment,
                activity: tdee - bmr,
            },
        };
    }

    /**
     * Harris-Benedict 공식 (대안)
     */
    static calculateHarrisBenedict(params: CalorieParams): CalorieResult {
        const { gender, age, weight, height, activityLevel, diseases = [] } = params;

        // BMR 계산
        let bmr: number;
        if (gender === 'male') {
            bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
        } else {
            bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
        }

        // TDEE 계산
        const activityFactor = this.ACTIVITY_FACTORS[activityLevel];
        const tdee = bmr * activityFactor;

        // 질병 조정
        let finalCalories = tdee;
        let diseaseAdjustment = 0;

        if (diseases.length > 0) {
            const lowestFactor = Math.min(
                ...diseases.map((d) => d.calorie_adjustment_factor)
            );
            finalCalories = tdee * lowestFactor;
            diseaseAdjustment = finalCalories - tdee;
        }

        // 최소 안전 칼로리 보장
        const minCalories = gender === 'male' ? 1500 : 1200;
        finalCalories = Math.max(finalCalories, minCalories);

        const formula = 'Harris-Benedict';
        const explanation = this.getFormulaExplanation('harris_benedict', params, {
            bmr,
            tdee,
            finalCalories,
        });

        return {
            calories: Math.round(finalCalories),
            bmr: Math.round(bmr),
            tdee: Math.round(tdee),
            formula,
            explanation,
            adjustments: {
                disease: diseaseAdjustment,
                activity: tdee - bmr,
            },
        };
    }

    /**
     * EER 공식 (어린이/청소년용)
     */
    static calculateEER(params: EERParams): CalorieResult {
        const { gender, age, weight, height, activityLevel } = params;

        // PA 계수 (활동 계수)
        const PA_FACTORS = {
            sedentary: 1.0,
            light: gender === 'male' ? 1.11 : 1.16,
            moderate: gender === 'male' ? 1.25 : 1.31,
            active: gender === 'male' ? 1.48 : 1.56,
            very_active: gender === 'male' ? 1.48 : 1.56,
        };

        const PA = PA_FACTORS[activityLevel];
        const heightM = height / 100; // cm to m

        // 성장 에너지
        const growthEnergy = age <= 8 ? 20 : 25;

        // EER 계산
        let eer: number;
        if (gender === 'male') {
            eer = 88.5 - 61.9 * age + PA * (26.7 * weight + 903 * heightM) + growthEnergy;
        } else {
            eer = 135.3 - 30.8 * age + PA * (10 * weight + 934 * heightM) + growthEnergy;
        }

        const formula = 'EER (어린이/청소년)';
        const explanation = this.getFormulaExplanation('eer', params, {
            bmr: eer,
            tdee: eer,
            finalCalories: eer,
        });

        return {
            calories: Math.round(eer),
            bmr: Math.round(eer),
            tdee: Math.round(eer),
            formula,
            explanation,
            adjustments: {},
        };
    }

    /**
     * 임신부 칼로리 계산
     */
    static calculateMaternityCalories(params: MaternityParams): CalorieResult {
        const { trimester } = params;

        // 기본 칼로리 계산 (Mifflin-St Jeor 사용)
        const baseResult = this.calculateMifflinStJeor(params);

        // 임신 단계별 추가 칼로리
        const TRIMESTER_ADDITIONS = {
            1: 0, // 임신 초기: 추가 불필요
            2: 340, // 임신 중기: +340 kcal
            3: 450, // 임신 후기: +450 kcal
        };

        const additionalCalories = TRIMESTER_ADDITIONS[trimester];
        const finalCalories = baseResult.calories + additionalCalories;

        const formula = 'Mifflin-St Jeor + 임신 추가 칼로리';
        const explanation = this.getFormulaExplanation('maternity', params, {
            bmr: baseResult.bmr,
            tdee: baseResult.tdee,
            finalCalories,
        });

        return {
            calories: Math.round(finalCalories),
            bmr: baseResult.bmr,
            tdee: baseResult.tdee,
            formula,
            explanation,
            adjustments: {
                ...baseResult.adjustments,
                activity: additionalCalories,
            },
        };
    }

    /**
     * 자동 공식 선택 (연령대 기반)
     */
    static calculateAuto(params: CalorieParams): CalorieResult {
        const { age } = params;

        // 어린이/청소년: EER 사용
        if (age >= 3 && age <= 18) {
            return this.calculateEER(params as any);
        }

        // 성인: Mifflin-St Jeor 사용 (기본)
        return this.calculateMifflinStJeor(params);
    }

    /**
     * 공식 설명 문자열 생성
     */
    private static getFormulaExplanation(
        method: string,
        params: CalorieParams | MaternityParams,
        results: { bmr: number; tdee: number; finalCalories: number }
    ): string {
        const { gender, age, weight, height, activityLevel } = params;
        const { bmr, tdee, finalCalories } = results;

        const lines: string[] = [];

        if (method === 'mifflin_st_jeor') {
            lines.push('📐 Mifflin-St Jeor 공식 (가장 정확한 BMR 계산)');
            lines.push('');

            if (gender === 'male') {
                lines.push(
                    `BMR = (10 × ${weight}kg) + (6.25 × ${height}cm) - (5 × ${age}세) + 5`
                );
            } else {
                lines.push(
                    `BMR = (10 × ${weight}kg) + (6.25 × ${height}cm) - (5 × ${age}세) - 161`
                );
            }

            lines.push(`BMR = ${bmr.toFixed(0)} kcal/일`);
            lines.push('');
            lines.push(
                `TDEE = BMR × 활동계수(${this.ACTIVITY_FACTORS[activityLevel]})`
            );
            lines.push(`TDEE = ${tdee.toFixed(0)} kcal/일`);
        } else if (method === 'harris_benedict') {
            lines.push('📐 Harris-Benedict 수정 공식');
            lines.push('');

            if (gender === 'male') {
                lines.push(
                    `BMR = 88.362 + (13.397 × ${weight}) + (4.799 × ${height}) - (5.677 × ${age})`
                );
            } else {
                lines.push(
                    `BMR = 447.593 + (9.247 × ${weight}) + (3.098 × ${height}) - (4.330 × ${age})`
                );
            }

            lines.push(`BMR = ${bmr.toFixed(0)} kcal/일`);
            lines.push('');
            lines.push(
                `TDEE = BMR × 활동계수(${this.ACTIVITY_FACTORS[activityLevel]})`
            );
            lines.push(`TDEE = ${tdee.toFixed(0)} kcal/일`);
        } else if (method === 'eer') {
            lines.push('📐 EER 공식 (어린이/청소년 전용, 성장 에너지 포함)');
            lines.push('');
            lines.push(`EER = ${finalCalories.toFixed(0)} kcal/일`);
            lines.push('※ 성장에 필요한 추가 에너지가 포함되어 있습니다.');
        } else if (method === 'maternity') {
            const maternityParams = params as MaternityParams;
            lines.push('📐 임신부 칼로리 계산');
            lines.push('');
            lines.push(`기본 TDEE = ${tdee.toFixed(0)} kcal/일`);

            const TRIMESTER_ADDITIONS = { 1: 0, 2: 340, 3: 450 };
            const addition = TRIMESTER_ADDITIONS[maternityParams.trimester];

            lines.push(`임신 ${maternityParams.trimester}삼분기 추가 = +${addition} kcal/일`);
            lines.push(`최종 권장 칼로리 = ${finalCalories.toFixed(0)} kcal/일`);
        }

        // 질병 조정 안내
        if ('diseases' in params && params.diseases && params.diseases.length > 0) {
            lines.push('');
            lines.push('⚕️ 질병 조정:');
            for (const disease of params.diseases) {
                if (disease.calorie_adjustment_factor < 1.0) {
                    const reduction = ((1 - disease.calorie_adjustment_factor) * 100).toFixed(0);
                    lines.push(`  - ${disease.name_ko}: ${reduction}% 감량 권장`);
                }
            }
        }

        // 최소 안전 칼로리 안내
        const minCalories = gender === 'male' ? 1500 : 1200;
        if (finalCalories <= minCalories) {
            lines.push('');
            lines.push(
                `⚠️ 최소 안전 칼로리 (${minCalories} kcal)가 적용되었습니다.`
            );
        }

        return lines.join('\n');
    }

    /**
     * 질병 조정 적용
     */
    static applyDiseaseAdjustments(
        baseCalories: number,
        diseases: Disease[],
        gender: 'male' | 'female'
    ): number {
        if (diseases.length === 0) return baseCalories;

        const lowestFactor = Math.min(
            ...diseases.map((d) => d.calorie_adjustment_factor)
        );

        const adjustedCalories = baseCalories * lowestFactor;

        // 최소 안전 칼로리 보장
        const minCalories = gender === 'male' ? 1500 : 1200;
        return Math.max(adjustedCalories, minCalories);
    }
}
