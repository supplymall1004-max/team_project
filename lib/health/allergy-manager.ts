/**
 * 알레르기 관리 서비스
 * 
 * 알레르기 파생 재료 조회, 레시피 알레르기 검사, 안전 경고 생성 등을 담당
 * 엄격한 필터링 모드로 생명을 보호합니다.
 */

import { createClient } from '@supabase/supabase-js';

export interface Allergy {
    id: string;
    code: string;
    name_ko: string;
    name_en: string | null;
    category: string | null;
    severity_level: string;
    description: string | null;
}

export interface DerivedIngredient {
    id: string;
    allergy_code: string;
    ingredient_name: string;
    ingredient_type: string | null;
    description: string | null;
}

export interface AllergyCheckResult {
    isSafe: boolean;
    detectedAllergens: string[];
    detectedDerivedIngredients: string[];
    severity: 'critical' | 'high' | 'moderate' | 'safe';
    warningMessage: string | null;
}

export class AllergyManager {
    /**
     * 모든 알레르기 목록 조회
     */
    static async getAllAllergies(): Promise<Allergy[]> {
        // 공개 데이터이므로 anon key만 사용
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Supabase 환경 변수가 설정되지 않았습니다.');
            return [];
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('allergies')
            .select('*')
            .order('category', { ascending: true })
            .order('name_ko', { ascending: true });

        if (error) {
            console.error('알레르기 목록 조회 오류:', error);
            return [];
        }

        return data || [];
    }

    /**
     * 특정 알레르기 정보 조회
     */
    static async getAllergyByCode(code: string): Promise<Allergy | null> {
        // 공개 데이터이므로 anon key만 사용
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Supabase 환경 변수가 설정되지 않았습니다.');
            return null;
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('allergies')
            .select('*')
            .eq('code', code)
            .single();

        if (error) {
            console.error(`알레르기 조회 오류 (${code}):`, error);
            return null;
        }

        return data;
    }

    /**
     * 알레르기 파생 재료 조회 (엄격 모드)
     * 
     * @param allergyCodes 알레르기 코드 목록
     * @returns 모든 파생 재료 목록
     */
    static async getDerivedIngredients(
        allergyCodes: string[]
    ): Promise<DerivedIngredient[]> {
        if (allergyCodes.length === 0) return [];

        // 공개 데이터이므로 anon key만 사용
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Supabase 환경 변수가 설정되지 않았습니다.');
            return [];
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('allergy_derived_ingredients')
            .select('*')
            .in('allergy_code', allergyCodes);

        if (error) {
            console.error('파생 재료 조회 오류:', error);
            return [];
        }

        return data || [];
    }

    /**
     * 레시피 알레르기 검사 (엄격 모드)
     * 
     * 모든 재료, 소스, 조미료를 검사하여 알레르기 유발 가능성을 확인합니다.
     * 
     * @param recipeTitle 레시피 제목
     * @param recipeIngredients 레시피 재료 목록
     * @param recipeSauces 레시피 소스/양념 목록
     * @param userAllergies 사용자 알레르기 목록
     * @returns 알레르기 검사 결과
     */
    static async checkRecipeForAllergens(
        recipeTitle: string,
        recipeIngredients: string[],
        recipeSauces: string[],
        userAllergies: Allergy[]
    ): Promise<AllergyCheckResult> {
        if (userAllergies.length === 0) {
            return {
                isSafe: true,
                detectedAllergens: [],
                detectedDerivedIngredients: [],
                severity: 'safe',
                warningMessage: null,
            };
        }

        const allergyCodes = userAllergies.map((a) => a.code);
        const derivedIngredients = await this.getDerivedIngredients(allergyCodes);

        const detectedAllergens: string[] = [];
        const detectedDerivedIngredients: string[] = [];

        // 검사할 모든 텍스트 결합
        const allText = [
            recipeTitle,
            ...recipeIngredients,
            ...recipeSauces,
        ]
            .join(' ')
            .toLowerCase();

        // 1. 직접 알레르기 항원 검사
        for (const allergy of userAllergies) {
            const allergyName = allergy.name_ko.toLowerCase();

            if (allText.includes(allergyName)) {
                detectedAllergens.push(allergy.name_ko);
            }
        }

        // 2. 파생 재료 검사 (엄격 모드)
        for (const derived of derivedIngredients) {
            const derivedName = derived.ingredient_name.toLowerCase();

            if (allText.includes(derivedName)) {
                detectedDerivedIngredients.push(derived.ingredient_name);
            }
        }

        // 3. 심각도 판단
        const isSafe =
            detectedAllergens.length === 0 &&
            detectedDerivedIngredients.length === 0;

        let severity: 'critical' | 'high' | 'moderate' | 'safe' = 'safe';

        if (detectedAllergens.length > 0) {
            // 직접 알레르기 항원 발견 시 critical
            const hasCriticalAllergy = userAllergies.some(
                (a) =>
                    detectedAllergens.includes(a.name_ko) &&
                    a.severity_level === 'critical'
            );
            severity = hasCriticalAllergy ? 'critical' : 'high';
        } else if (detectedDerivedIngredients.length > 0) {
            // 파생 재료만 발견 시 high
            severity = 'high';
        }

        // 4. 경고 메시지 생성
        const warningMessage = isSafe
            ? null
            : this.generateAllergyWarning(
                detectedAllergens,
                detectedDerivedIngredients,
                severity
            );

        return {
            isSafe,
            detectedAllergens,
            detectedDerivedIngredients,
            severity,
            warningMessage,
        };
    }

    /**
     * 알레르기 경고 메시지 생성
     */
    private static generateAllergyWarning(
        allergens: string[],
        derivedIngredients: string[],
        severity: 'critical' | 'high' | 'moderate' | 'safe'
    ): string {
        const parts: string[] = [];

        if (allergens.length > 0) {
            parts.push(`⚠️ 알레르기 유발 재료 발견: ${allergens.join(', ')}`);
        }

        if (derivedIngredients.length > 0) {
            parts.push(
                `⚠️ 알레르기 파생 재료 발견: ${derivedIngredients.join(', ')}`
            );
        }

        if (severity === 'critical') {
            parts.push(
                '\n🚨 치명적 위험: 이 음식을 절대 섭취하지 마세요. 아나필락시스를 유발할 수 있습니다.'
            );
        } else if (severity === 'high') {
            parts.push(
                '\n⚠️ 높은 위험: 이 음식 섭취를 피하세요. 심각한 알레르기 반응이 발생할 수 있습니다.'
            );
        }

        return parts.join('\n');
    }

    /**
     * 안전 경고 문구 생성 (불확실한 재료 정보용)
     */
    static generateSafetyWarning(uncertainIngredients: string[]): string {
        if (uncertainIngredients.length === 0) return '';

        return `⚠️ 섭취하는 음식의 재료 정보가 다를 수 있습니다. 섭취하시기 전에 재료명을 확인하여 알레르기를 일으킬 수 있는 음식의 섭취를 예방하시기 바랍니다.\n\n불확실한 재료: ${uncertainIngredients.join(', ')}`;
    }

    /**
     * 알레르기 카테고리별 그룹화
     */
    static groupAllergiesByCategory(
        allergies: Allergy[]
    ): Record<string, Allergy[]> {
        const grouped: Record<string, Allergy[]> = {
            major_8: [],
            special: [],
            intolerance: [],
            other: [],
        };

        for (const allergy of allergies) {
            const category = allergy.category || 'other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(allergy);
        }

        return grouped;
    }

    /**
     * 8대 주요 알레르기 목록 조회
     */
    static async getMajor8Allergies(): Promise<Allergy[]> {
        // 공개 데이터이므로 anon key만 사용
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Supabase 환경 변수가 설정되지 않았습니다.');
            return [];
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('allergies')
            .select('*')
            .eq('category', 'major_8')
            .order('name_ko', { ascending: true });

        if (error) {
            console.error('8대 알레르기 조회 오류:', error);
            return [];
        }

        return data || [];
    }

    /**
     * 특수 알레르기 목록 조회
     */
    static async getSpecialAllergies(): Promise<Allergy[]> {
        // 공개 데이터이므로 anon key만 사용
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Supabase 환경 변수가 설정되지 않았습니다.');
            return [];
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('allergies')
            .select('*')
            .in('category', ['special', 'intolerance'])
            .order('name_ko', { ascending: true });

        if (error) {
            console.error('특수 알레르기 조회 오류:', error);
            return [];
        }

        return data || [];
    }
}
