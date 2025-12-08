/**
 * 질병 관리 서비스
 * 
 * 질병별 제외 음식 조회, 칼로리 조정 계산, 영양소 비율 조정 등을 담당
 */

import { createClient } from '@supabase/supabase-js';

export interface Disease {
    id: string;
    code: string;
    name_ko: string;
    name_en: string | null;
    category: string | null;
    description: string | null;
    calorie_adjustment_factor: number;
}

export interface ExcludedFood {
    id: string;
    disease_code: string;
    food_name: string;
    food_type: string | null;
    severity: string;
    reason: string | null;
}

export interface NutrientRatio {
    carbohydrate: number; // 탄수화물 비율 (%)
    protein: number; // 단백질 비율 (%)
    fat: number; // 지방 비율 (%)
}

export class DiseaseManager {
    /**
     * 모든 질병 목록 조회
     */
    static async getAllDiseases(): Promise<Disease[]> {
        // 공개 데이터이므로 anon key만 사용
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Supabase 환경 변수가 설정되지 않았습니다.');
            return [];
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('diseases')
            .select('*')
            .order('category', { ascending: true })
            .order('name_ko', { ascending: true });

        if (error) {
            console.error('질병 목록 조회 오류:', error);
            return [];
        }

        return data || [];
    }

    /**
     * 특정 질병 정보 조회
     */
    static async getDiseaseByCode(code: string): Promise<Disease | null> {
        // 공개 데이터이므로 anon key만 사용
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Supabase 환경 변수가 설정되지 않았습니다.');
            return null;
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('diseases')
            .select('*')
            .eq('code', code)
            .single();

        if (error) {
            console.error(`질병 조회 오류 (${code}):`, error);
            return null;
        }

        return data;
    }

    /**
     * 질병별 제외 음식 조회
     */
    static async getExcludedFoodsByDiseases(
        diseaseCodes: string[]
    ): Promise<ExcludedFood[]> {
        if (diseaseCodes.length === 0) return [];

        // 공개 데이터이므로 anon key만 사용
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Supabase 환경 변수가 설정되지 않았습니다.');
            return [];
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('disease_excluded_foods_extended')
            .select('*')
            .in('disease_code', diseaseCodes)
            .order('severity', { ascending: false }); // critical > high > moderate

        if (error) {
            console.error('제외 음식 조회 오류:', error);
            return [];
        }

        return data || [];
    }

    /**
     * 질병별 칼로리 조정 계산
     * 
     * @param baseCalories 기본 칼로리
     * @param diseases 질병 목록
     * @returns 조정된 칼로리
     */
    static calculateDiseaseAdjustedCalories(
        baseCalories: number,
        diseases: Disease[]
    ): number {
        if (diseases.length === 0) return baseCalories;

        // 가장 낮은 조정 계수 사용 (가장 엄격한 제한)
        const lowestFactor = Math.min(
            ...diseases.map((d) => d.calorie_adjustment_factor)
        );

        const adjustedCalories = baseCalories * lowestFactor;

        // 최소 안전 칼로리 보장
        const MIN_CALORIES_FEMALE = 1200;
        const MIN_CALORIES_MALE = 1500;

        // 성별 정보가 없으므로 더 안전한 값 사용
        return Math.max(adjustedCalories, MIN_CALORIES_FEMALE);
    }

    /**
     * 질병별 영양소 비율 조정
     * 
     * @param diseases 질병 목록
     * @returns 조정된 영양소 비율
     */
    static getNutrientRatioAdjustments(diseases: Disease[]): NutrientRatio {
        // 기본 비율
        const defaultRatio: NutrientRatio = {
            carbohydrate: 50,
            protein: 20,
            fat: 30,
        };

        if (diseases.length === 0) return defaultRatio;

        // 질병별 특수 비율 적용
        const hasDiabetes = diseases.some((d) =>
            d.code.includes('diabetes')
        );
        const hasCKD = diseases.some((d) => d.code === 'ckd');
        const hasGout = diseases.some((d) => d.code === 'gout');

        if (hasDiabetes) {
            // 당뇨병: 탄수화물 약간 낮춤, 단백질 증가
            return {
                carbohydrate: 45,
                protein: 25,
                fat: 30,
            };
        }

        if (hasCKD) {
            // CKD: 단백질 제한 (의사 지시 필요)
            return {
                carbohydrate: 55,
                protein: 15,
                fat: 30,
            };
        }

        if (hasGout) {
            // 통풍: 단백질 약간 낮춤
            return {
                carbohydrate: 50,
                protein: 18,
                fat: 32,
            };
        }

        return defaultRatio;
    }

    /**
     * 레시피가 질병 제한에 걸리는지 확인
     * 
     * @param recipeTitle 레시피 제목
     * @param recipeIngredients 레시피 재료 목록
     * @param excludedFoods 제외 음식 목록
     * @returns 제한 걸림 여부
     */
    static checkRecipeAgainstDiseaseRestrictions(
        recipeTitle: string,
        recipeIngredients: string[],
        excludedFoods: ExcludedFood[]
    ): {
        isRestricted: boolean;
        matchedFoods: ExcludedFood[];
    } {
        const matchedFoods: ExcludedFood[] = [];

        for (const excludedFood of excludedFoods) {
            const foodName = excludedFood.food_name.toLowerCase();
            const titleLower = recipeTitle.toLowerCase();
            const ingredientsLower = recipeIngredients.map((i) => i.toLowerCase());

            // 제목이나 재료에서 제외 음식 검색
            const foundInTitle = titleLower.includes(foodName);
            const foundInIngredients = ingredientsLower.some((ing) =>
                ing.includes(foodName)
            );

            if (foundInTitle || foundInIngredients) {
                matchedFoods.push(excludedFood);
            }
        }

        return {
            isRestricted: matchedFoods.length > 0,
            matchedFoods,
        };
    }

    /**
     * 질병 카테고리별 그룹화
     */
    static groupDiseasesByCategory(
        diseases: Disease[]
    ): Record<string, Disease[]> {
        const grouped: Record<string, Disease[]> = {};

        for (const disease of diseases) {
            const category = disease.category || 'other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(disease);
        }

        return grouped;
    }
}
