/**
 * 건강정보 마스터 데이터 시드 스크립트
 * 
 * 실행 방법:
 * npx tsx scripts/seed-health-data.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ 환경 변수가 설정되지 않았습니다.');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// 1. 질병 데이터
// ============================================================================

const diseases = [
    // 대사 질환
    {
        code: 'diabetes_type1',
        name_ko: '1형 당뇨병',
        name_en: 'Type 1 Diabetes',
        category: 'metabolic',
        description: '췌장에서 인슐린이 거의 분비되지 않는 당뇨병',
        calorie_adjustment_factor: 1.00,
    },
    {
        code: 'diabetes_type2',
        name_ko: '2형 당뇨병',
        name_en: 'Type 2 Diabetes',
        category: 'metabolic',
        description: '인슐린 저항성이 주원인인 당뇨병',
        calorie_adjustment_factor: 0.90, // 체중 감량 권장
    },
    {
        code: 'gestational_diabetes',
        name_ko: '임신성 당뇨병',
        name_en: 'Gestational Diabetes',
        category: 'maternity',
        description: '임신 중 발생하는 당뇨병',
        calorie_adjustment_factor: 1.00,
    },
    // 심혈관 질환
    {
        code: 'hypertension',
        name_ko: '고혈압',
        name_en: 'Hypertension',
        category: 'cardiovascular',
        description: '혈압이 정상보다 높은 상태',
        calorie_adjustment_factor: 0.95,
    },
    {
        code: 'hyperlipidemia',
        name_ko: '고지혈증',
        name_en: 'Hyperlipidemia',
        category: 'cardiovascular',
        description: '혈중 지질 수치가 높은 상태',
        calorie_adjustment_factor: 0.95,
    },
    {
        code: 'preeclampsia',
        name_ko: '임신중독증 (전자간증)',
        name_en: 'Preeclampsia',
        category: 'maternity',
        description: '임신 20주 이후 고혈압과 단백뇨가 동반되는 질환',
        calorie_adjustment_factor: 1.00,
    },
    // 신장 질환
    {
        code: 'ckd',
        name_ko: '만성 신장 질환',
        name_en: 'Chronic Kidney Disease',
        category: 'kidney',
        description: '신장 기능이 점진적으로 저하되는 질환',
        calorie_adjustment_factor: 1.00,
    },
    // 통풍
    {
        code: 'gout',
        name_ko: '통풍',
        name_en: 'Gout',
        category: 'gout',
        description: '요산 수치가 높아 관절에 염증이 생기는 질환',
        calorie_adjustment_factor: 0.95,
    },
    // 위장 질환
    {
        code: 'gerd',
        name_ko: '역류성 식도염',
        name_en: 'GERD',
        category: 'digestive',
        description: '위산이 식도로 역류하여 염증을 일으키는 질환',
        calorie_adjustment_factor: 1.00,
    },
    {
        code: 'gastric_ulcer',
        name_ko: '위궤양',
        name_en: 'Gastric Ulcer',
        category: 'digestive',
        description: '위 점막이 손상되어 궤양이 생긴 상태',
        calorie_adjustment_factor: 1.00,
    },
    {
        code: 'ibs',
        name_ko: '과민성 대장 증후군',
        name_en: 'Irritable Bowel Syndrome',
        category: 'digestive',
        description: '장의 기능 이상으로 복통, 설사, 변비 등이 반복되는 질환',
        calorie_adjustment_factor: 1.00,
    },
    {
        code: 'celiac',
        name_ko: '셀리악병',
        name_en: 'Celiac Disease',
        category: 'digestive',
        description: '글루텐에 대한 자가면역 질환',
        calorie_adjustment_factor: 1.00,
    },
];

// ============================================================================
// 2. 질병별 제외 음식
// ============================================================================

const diseaseExcludedFoods = [
    // 당뇨병 제외 음식
    { disease_code: 'diabetes_type1', food_name: '설탕', food_type: 'ingredient', severity: 'critical' },
    { disease_code: 'diabetes_type1', food_name: '꿀', food_type: 'ingredient', severity: 'critical' },
    { disease_code: 'diabetes_type1', food_name: '탄산음료', food_type: 'recipe_keyword', severity: 'critical' },
    { disease_code: 'diabetes_type1', food_name: '주스', food_type: 'recipe_keyword', severity: 'critical' },
    { disease_code: 'diabetes_type1', food_name: '케이크', food_type: 'recipe_keyword', severity: 'high' },
    { disease_code: 'diabetes_type1', food_name: '도넛', food_type: 'recipe_keyword', severity: 'high' },
    { disease_code: 'diabetes_type1', food_name: '사탕', food_type: 'recipe_keyword', severity: 'critical' },
    { disease_code: 'diabetes_type1', food_name: '초콜릿', food_type: 'recipe_keyword', severity: 'high' },

    { disease_code: 'diabetes_type2', food_name: '설탕', food_type: 'ingredient', severity: 'critical' },
    { disease_code: 'diabetes_type2', food_name: '꿀', food_type: 'ingredient', severity: 'critical' },
    { disease_code: 'diabetes_type2', food_name: '탄산음료', food_type: 'recipe_keyword', severity: 'critical' },
    { disease_code: 'diabetes_type2', food_name: '주스', food_type: 'recipe_keyword', severity: 'critical' },
    { disease_code: 'diabetes_type2', food_name: '흰쌀밥', food_type: 'recipe_keyword', severity: 'moderate' },
    { disease_code: 'diabetes_type2', food_name: '케이크', food_type: 'recipe_keyword', severity: 'high' },
    { disease_code: 'diabetes_type2', food_name: '튀김', food_type: 'cooking_method', severity: 'high' },

    // 고혈압 제외 음식
    { disease_code: 'hypertension', food_name: '라면', food_type: 'recipe_keyword', severity: 'critical' },
    { disease_code: 'hypertension', food_name: '찌개', food_type: 'recipe_keyword', severity: 'high' },
    { disease_code: 'hypertension', food_name: '햄', food_type: 'ingredient', severity: 'high' },
    { disease_code: 'hypertension', food_name: '소시지', food_type: 'ingredient', severity: 'high' },
    { disease_code: 'hypertension', food_name: '베이컨', food_type: 'ingredient', severity: 'high' },
    { disease_code: 'hypertension', food_name: '젓갈', food_type: 'ingredient', severity: 'critical' },
    { disease_code: 'hypertension', food_name: '장아찌', food_type: 'recipe_keyword', severity: 'high' },

    // CKD 제외 음식
    { disease_code: 'ckd', food_name: '바나나', food_type: 'ingredient', severity: 'critical', reason: '고칼륨' },
    { disease_code: 'ckd', food_name: '시금치', food_type: 'ingredient', severity: 'high', reason: '고칼륨' },
    { disease_code: 'ckd', food_name: '견과류', food_type: 'category', severity: 'critical', reason: '고인' },
    { disease_code: 'ckd', food_name: '우유', food_type: 'ingredient', severity: 'high', reason: '고인' },
    { disease_code: 'ckd', food_name: '치즈', food_type: 'ingredient', severity: 'high', reason: '고인' },
    { disease_code: 'ckd', food_name: '토마토', food_type: 'ingredient', severity: 'moderate', reason: '고칼륨' },
    { disease_code: 'ckd', food_name: '감자', food_type: 'ingredient', severity: 'moderate', reason: '고칼륨' },

    // 통풍 제외 음식
    { disease_code: 'gout', food_name: '내장육', food_type: 'category', severity: 'critical', reason: '고퓨린' },
    { disease_code: 'gout', food_name: '간', food_type: 'ingredient', severity: 'critical', reason: '고퓨린' },
    { disease_code: 'gout', food_name: '고등어', food_type: 'ingredient', severity: 'critical', reason: '고퓨린' },
    { disease_code: 'gout', food_name: '꽁치', food_type: 'ingredient', severity: 'critical', reason: '고퓨린' },
    { disease_code: 'gout', food_name: '정어리', food_type: 'ingredient', severity: 'critical', reason: '고퓨린' },
    { disease_code: 'gout', food_name: '맥주', food_type: 'recipe_keyword', severity: 'critical', reason: '고퓨린 + 알코올' },
    { disease_code: 'gout', food_name: '육수', food_type: 'ingredient', severity: 'high', reason: '농축 퓨린' },

    // 역류성 식도염 제외 음식
    { disease_code: 'gerd', food_name: '튀김', food_type: 'cooking_method', severity: 'high' },
    { disease_code: 'gerd', food_name: '커피', food_type: 'recipe_keyword', severity: 'high' },
    { disease_code: 'gerd', food_name: '탄산음료', food_type: 'recipe_keyword', severity: 'high' },
    { disease_code: 'gerd', food_name: '초콜릿', food_type: 'ingredient', severity: 'high' },
    { disease_code: 'gerd', food_name: '토마토', food_type: 'ingredient', severity: 'moderate' },
    { disease_code: 'gerd', food_name: '오렌지', food_type: 'ingredient', severity: 'moderate' },
    { disease_code: 'gerd', food_name: '마늘', food_type: 'ingredient', severity: 'moderate' },
    { disease_code: 'gerd', food_name: '양파', food_type: 'ingredient', severity: 'moderate' },
];

// ============================================================================
// 3. 알레르기 데이터
// ============================================================================

const allergies = [
    // 8대 주요 알레르기
    {
        code: 'milk',
        name_ko: '우유',
        name_en: 'Milk',
        category: 'major_8',
        severity_level: 'critical',
        description: '우유의 카제인이나 유청 단백질에 반응',
    },
    {
        code: 'eggs',
        name_ko: '달걀',
        name_en: 'Eggs',
        category: 'major_8',
        severity_level: 'critical',
        description: '특히 흰자위 단백질에 반응',
    },
    {
        code: 'peanuts',
        name_ko: '땅콩',
        name_en: 'Peanuts',
        category: 'major_8',
        severity_level: 'critical',
        description: '아나필락시스를 일으킬 수 있는 가장 위험한 알레르기 중 하나',
    },
    {
        code: 'tree_nuts',
        name_ko: '견과류',
        name_en: 'Tree Nuts',
        category: 'major_8',
        severity_level: 'critical',
        description: '아몬드, 호두, 캐슈넛, 피스타치오 등',
    },
    {
        code: 'wheat',
        name_ko: '밀',
        name_en: 'Wheat',
        category: 'major_8',
        severity_level: 'high',
        description: '밀가루의 글루텐이나 다른 밀 단백질에 반응',
    },
    {
        code: 'soybeans',
        name_ko: '콩',
        name_en: 'Soybeans',
        category: 'major_8',
        severity_level: 'high',
        description: '콩 단백질에 반응',
    },
    {
        code: 'crustacean',
        name_ko: '갑각류',
        name_en: 'Crustacean Shellfish',
        category: 'major_8',
        severity_level: 'critical',
        description: '새우, 게, 가재 등',
    },
    {
        code: 'fish',
        name_ko: '생선',
        name_en: 'Fish',
        category: 'major_8',
        severity_level: 'high',
        description: '연어, 참치, 대구 등 특정 어류 단백질에 반응',
    },
    // 특수 알레르기
    {
        code: 'sulfites',
        name_ko: '아황산염',
        name_en: 'Sulfites',
        category: 'special',
        severity_level: 'high',
        description: '천식 환자에게 기관지 수축을 일으킬 수 있음',
    },
    {
        code: 'nickel',
        name_ko: '니켈',
        name_en: 'Nickel',
        category: 'special',
        severity_level: 'moderate',
        description: '음식물에 포함된 니켈이 전신 피부염을 유발',
    },
    {
        code: 'histamine',
        name_ko: '히스타민 불내증',
        name_en: 'Histamine Intolerance',
        category: 'intolerance',
        severity_level: 'moderate',
        description: '히스타민 분해 효소 부족으로 인한 과민 반응',
    },
    {
        code: 'fdeia',
        name_ko: '운동 유발성 아나필락시스',
        name_en: 'FDEIA',
        category: 'special',
        severity_level: 'critical',
        description: '특정 음식 섭취 후 운동 시 아나필락시스 발생',
    },
];

// ============================================================================
// 4. 알레르기 파생 재료 (엄격한 필터링용)
// ============================================================================

const allergyDerivedIngredients = [
    // 우유 파생 재료
    { allergy_code: 'milk', ingredient_name: '치즈', ingredient_type: 'processed' },
    { allergy_code: 'milk', ingredient_name: '버터', ingredient_type: 'processed' },
    { allergy_code: 'milk', ingredient_name: '크림', ingredient_type: 'processed' },
    { allergy_code: 'milk', ingredient_name: '요거트', ingredient_type: 'processed' },
    { allergy_code: 'milk', ingredient_name: '생크림', ingredient_type: 'processed' },
    { allergy_code: 'milk', ingredient_name: '연유', ingredient_type: 'processed' },
    { allergy_code: 'milk', ingredient_name: '카제인', ingredient_type: 'processed' },
    { allergy_code: 'milk', ingredient_name: '유청', ingredient_type: 'processed' },

    // 갑각류 파생 재료
    { allergy_code: 'crustacean', ingredient_name: '새우젓', ingredient_type: 'fermented' },
    { allergy_code: 'crustacean', ingredient_name: '새우 육수', ingredient_type: 'sauce' },
    { allergy_code: 'crustacean', ingredient_name: '해물 육수', ingredient_type: 'sauce' },
    { allergy_code: 'crustacean', ingredient_name: '게장', ingredient_type: 'fermented' },
    { allergy_code: 'crustacean', ingredient_name: '새우가루', ingredient_type: 'seasoning' },
    { allergy_code: 'crustacean', ingredient_name: '크래미', ingredient_type: 'processed' },

    // 밀 파생 재료
    { allergy_code: 'wheat', ingredient_name: '간장', ingredient_type: 'sauce' },
    { allergy_code: 'wheat', ingredient_name: '된장', ingredient_type: 'sauce' },
    { allergy_code: 'wheat', ingredient_name: '고추장', ingredient_type: 'sauce' },
    { allergy_code: 'wheat', ingredient_name: '빵가루', ingredient_type: 'processed' },
    { allergy_code: 'wheat', ingredient_name: '밀가루', ingredient_type: 'direct' },
    { allergy_code: 'wheat', ingredient_name: '면', ingredient_type: 'processed' },

    // 콩 파생 재료
    { allergy_code: 'soybeans', ingredient_name: '두부', ingredient_type: 'processed' },
    { allergy_code: 'soybeans', ingredient_name: '두유', ingredient_type: 'processed' },
    { allergy_code: 'soybeans', ingredient_name: '된장', ingredient_type: 'fermented' },
    { allergy_code: 'soybeans', ingredient_name: '간장', ingredient_type: 'fermented' },
    { allergy_code: 'soybeans', ingredient_name: '콩가루', ingredient_type: 'processed' },
    { allergy_code: 'soybeans', ingredient_name: '콩나물', ingredient_type: 'processed' },

    // 달걀 파생 재료
    { allergy_code: 'eggs', ingredient_name: '마요네즈', ingredient_type: 'sauce' },
    { allergy_code: 'eggs', ingredient_name: '계란 흰자', ingredient_type: 'direct' },
    { allergy_code: 'eggs', ingredient_name: '계란 노른자', ingredient_type: 'direct' },

    // 생선 파생 재료
    { allergy_code: 'fish', ingredient_name: '멸치', ingredient_type: 'direct' },
    { allergy_code: 'fish', ingredient_name: '멸치 육수', ingredient_type: 'sauce' },
    { allergy_code: 'fish', ingredient_name: '액젓', ingredient_type: 'sauce' },
    { allergy_code: 'fish', ingredient_name: '어묵', ingredient_type: 'processed' },
    { allergy_code: 'fish', ingredient_name: '젓갈', ingredient_type: 'fermented' },
];

// ============================================================================
// 5. 응급조치 정보
// ============================================================================

const emergencyProcedures = [
    {
        allergy_code: 'peanuts',
        procedure_type: 'anaphylaxis',
        title_ko: '아나필락시스 응급조치',
        title_en: 'Anaphylaxis Emergency Response',
        steps: JSON.stringify([
            { step: 1, description: '즉시 에피네프린 자가주사기를 준비합니다.' },
            { step: 2, description: '허벅지 바깥쪽 중앙에 수직으로 강하게 주사합니다.' },
            { step: 3, description: '3-10초간 눌러 약물이 완전히 주입되도록 합니다.' },
            { step: 4, description: '즉시 119에 신고합니다.' },
            { step: 5, description: '환자를 편안하게 눕히고 구토 시 옆으로 눕힙니다.' },
        ]),
        warning_signs: JSON.stringify([
            '호흡 곤란',
            '목이 조이는 느낌',
            '전신 두드러기',
            '심한 구토/설사',
            '어지러움/실신',
        ]),
        when_to_call_911: '에피네프린 투여 후 즉시 119에 신고하고, 증상 호전 여부와 관계없이 반드시 응급실을 방문하여 최소 4-6시간 동안 관찰해야 합니다.',
    },
    {
        allergy_code: 'crustacean',
        procedure_type: 'anaphylaxis',
        title_ko: '갑각류 알레르기 응급조치',
        title_en: 'Shellfish Allergy Emergency Response',
        steps: JSON.stringify([
            { step: 1, description: '즉시 에피네프린 자가주사기를 준비합니다.' },
            { step: 2, description: '허벅지 바깥쪽 중앙에 수직으로 강하게 주사합니다.' },
            { step: 3, description: '3-10초간 눌러 약물이 완전히 주입되도록 합니다.' },
            { step: 4, description: '즉시 119에 신고합니다.' },
            { step: 5, description: '환자를 편안하게 눕히고 구토 시 옆으로 눕힙니다.' },
        ]),
        warning_signs: JSON.stringify([
            '호흡 곤란',
            '목이 조이는 느낌',
            '전신 두드러기',
            '심한 구토/설사',
            '어지러움/실신',
        ]),
        when_to_call_911: '에피네프린 투여 후 즉시 119에 신고하고, 증상 호전 여부와 관계없이 반드시 응급실을 방문하여 최소 4-6시간 동안 관찰해야 합니다.',
    },
    {
        allergy_code: 'peanuts',
        procedure_type: 'epinephrine_use',
        title_ko: '에피네프린 자가주사기 사용법',
        title_en: 'How to Use Epinephrine Auto-Injector',
        steps: JSON.stringify([
            { step: 1, title: '안전 캡 제거', description: '파란색 안전 캡을 잡고 힘껏 잡아당겨 제거합니다.' },
            { step: 2, title: '투여 부위 확인', description: '허벅지 바깥쪽 중앙에 주황색 끝 부분이 향하도록 잡습니다.' },
            { step: 3, title: '주사 및 유지', description: '수직(90도)으로 강하게 밀어 넣고 딸깍 소리 확인 후 3-10초 유지합니다.' },
            { step: 4, title: '제거 및 마사지', description: '주사기를 제거하고 주사 부위를 10초 정도 마사지합니다.' },
        ]),
        warning_signs: JSON.stringify([
            '절대 손가락으로 주황색 끝을 만지지 마세요',
            '엉덩이에 주사하지 마세요',
            '옷을 벗길 필요는 없지만 두꺼운 벨트는 피하세요',
        ]),
        when_to_call_911: '에피네프린 투여 후 반드시 119에 신고하고 응급실로 이동해야 합니다.',
    },
];

// ============================================================================
// 6. 칼로리 계산 공식
// ============================================================================

const calorieFormulas = [
    {
        formula_name: 'mifflin_st_jeor_male',
        formula_type: 'bmr',
        gender: 'male',
        age_min: 18,
        age_max: null,
        formula_expression: '(10 × 체중kg) + (6.25 × 신장cm) - (5 × 나이) + 5',
        description: 'Mifflin-St Jeor 공식 (남성용) - 가장 정확도가 높은 BMR 계산 공식',
        is_default: true,
    },
    {
        formula_name: 'mifflin_st_jeor_female',
        formula_type: 'bmr',
        gender: 'female',
        age_min: 18,
        age_max: null,
        formula_expression: '(10 × 체중kg) + (6.25 × 신장cm) - (5 × 나이) - 161',
        description: 'Mifflin-St Jeor 공식 (여성용) - 가장 정확도가 높은 BMR 계산 공식',
        is_default: true,
    },
    {
        formula_name: 'harris_benedict_male',
        formula_type: 'bmr',
        gender: 'male',
        age_min: 18,
        age_max: null,
        formula_expression: '88.362 + (13.397 × 체중kg) + (4.799 × 신장cm) - (5.677 × 나이)',
        description: 'Harris-Benedict 수정 공식 (남성용)',
        is_default: false,
    },
    {
        formula_name: 'harris_benedict_female',
        formula_type: 'bmr',
        gender: 'female',
        age_min: 18,
        age_max: null,
        formula_expression: '447.593 + (9.247 × 체중kg) + (3.098 × 신장cm) - (4.330 × 나이)',
        description: 'Harris-Benedict 수정 공식 (여성용)',
        is_default: false,
    },
    {
        formula_name: 'eer_child_male',
        formula_type: 'eer',
        gender: 'male',
        age_min: 3,
        age_max: 18,
        formula_expression: '88.5 - (61.9 × 나이) + PA × [(26.7 × 체중kg) + (903 × 신장m)] + 성장에너지',
        description: 'EER 공식 (남아 3-18세) - 성장 에너지 포함',
        is_default: true,
    },
    {
        formula_name: 'eer_child_female',
        formula_type: 'eer',
        gender: 'female',
        age_min: 3,
        age_max: 18,
        formula_expression: '135.3 - (30.8 × 나이) + PA × [(10 × 체중kg) + (934 × 신장m)] + 성장에너지',
        description: 'EER 공식 (여아 3-18세) - 성장 에너지 포함',
        is_default: true,
    },
];

// ============================================================================
// 시드 실행 함수
// ============================================================================

async function seedHealthData() {
    console.log('🌱 건강정보 마스터 데이터 시드 시작...\n');

    try {
        // 1. 질병 데이터 삽입
        console.log('📋 질병 데이터 삽입 중...');
        const { data: diseasesData, error: diseasesError } = await supabase
            .from('diseases')
            .upsert(diseases, { onConflict: 'code' });

        if (diseasesError) throw diseasesError;
        console.log(`✅ ${diseases.length}개 질병 데이터 삽입 완료\n`);

        // 2. 질병별 제외 음식 삽입
        console.log('🚫 질병별 제외 음식 데이터 삽입 중...');
        const { data: excludedFoodsData, error: excludedFoodsError } = await supabase
            .from('disease_excluded_foods_extended')
            .insert(diseaseExcludedFoods);

        if (excludedFoodsError) throw excludedFoodsError;
        console.log(`✅ ${diseaseExcludedFoods.length}개 제외 음식 데이터 삽입 완료\n`);

        // 3. 알레르기 데이터 삽입
        console.log('🥜 알레르기 데이터 삽입 중...');
        const { data: allergiesData, error: allergiesError } = await supabase
            .from('allergies')
            .upsert(allergies, { onConflict: 'code' });

        if (allergiesError) throw allergiesError;
        console.log(`✅ ${allergies.length}개 알레르기 데이터 삽입 완료\n`);

        // 4. 알레르기 파생 재료 삽입
        console.log('🔍 알레르기 파생 재료 데이터 삽입 중...');
        const { data: derivedData, error: derivedError } = await supabase
            .from('allergy_derived_ingredients')
            .insert(allergyDerivedIngredients);

        if (derivedError) throw derivedError;
        console.log(`✅ ${allergyDerivedIngredients.length}개 파생 재료 데이터 삽입 완료\n`);

        // 5. 응급조치 정보 삽입
        console.log('🚨 응급조치 정보 삽입 중...');
        const { data: emergencyData, error: emergencyError } = await supabase
            .from('emergency_procedures')
            .insert(emergencyProcedures);

        if (emergencyError) throw emergencyError;
        console.log(`✅ ${emergencyProcedures.length}개 응급조치 정보 삽입 완료\n`);

        // 6. 칼로리 계산 공식 삽입
        console.log('🧮 칼로리 계산 공식 삽입 중...');
        const { data: formulasData, error: formulasError } = await supabase
            .from('calorie_calculation_formulas')
            .upsert(calorieFormulas, { onConflict: 'formula_name' });

        if (formulasError) throw formulasError;
        console.log(`✅ ${calorieFormulas.length}개 칼로리 공식 삽입 완료\n`);

        console.log('🎉 모든 건강정보 마스터 데이터 시드 완료!');
        console.log('\n📊 요약:');
        console.log(`  - 질병: ${diseases.length}개`);
        console.log(`  - 제외 음식: ${diseaseExcludedFoods.length}개`);
        console.log(`  - 알레르기: ${allergies.length}개`);
        console.log(`  - 파생 재료: ${allergyDerivedIngredients.length}개`);
        console.log(`  - 응급조치: ${emergencyProcedures.length}개`);
        console.log(`  - 칼로리 공식: ${calorieFormulas.length}개`);

    } catch (error) {
        console.error('❌ 시드 실행 중 오류 발생:', error);
        process.exit(1);
    }
}

// 실행
seedHealthData();
