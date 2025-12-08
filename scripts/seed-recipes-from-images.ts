/**
 * @file seed-recipes-from-images.ts
 * @description public/images/food 폴더의 이미지를 기반으로 레시피 일괄 등록
 * 
 * 사용법:
 * pnpm tsx scripts/seed-recipes-from-images.ts
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { createRecipe, type CreateRecipeInput } from '@/actions/recipe-create';

// 레시피 기본 데이터 타입
interface RecipeSeedData {
  title: string;
  description: string;
  difficulty: number; // 1-5
  cookingTimeMinutes: number;
  servings: number;
  ingredients: Array<{
    ingredient_name: string;
    quantity?: string;
    unit?: string;
    category: "곡물" | "채소" | "과일" | "육류" | "해산물" | "유제품" | "조미료" | "기타";
    is_optional?: boolean;
  }>;
  steps: string[];
  imageFileName: string;
}

/**
 * 이미지 파일명에서 레시피 기본 데이터 생성
 */
function generateRecipeData(imageFileName: string): RecipeSeedData | null {
  const nameWithoutExt = imageFileName.replace(/\.(png|jpg|jpeg)$/i, '');
  
  // 기본 레시피 템플릿
  const recipeTemplates: Record<string, Partial<RecipeSeedData>> = {
    // 국류
    '무국': {
      title: '무국',
      description: '시원하고 깔끔한 무국입니다.',
      difficulty: 2,
      cookingTimeMinutes: 30,
      servings: 4,
      ingredients: [
        { ingredient_name: '무', quantity: '300', unit: 'g', category: '채소' },
        { ingredient_name: '다시마', quantity: '10', unit: 'cm', category: '해산물' },
        { ingredient_name: '멸치', quantity: '10', unit: '마리', category: '해산물' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '마늘', quantity: '2', unit: '쪽', category: '조미료' },
        { ingredient_name: '소금', quantity: '1', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '다시마와 멸치로 육수를 만듭니다.',
        '무를 깍둑썰기하여 준비합니다.',
        '육수가 끓으면 무를 넣고 끓입니다.',
        '무가 투명해지면 다진 마늘과 대파를 넣습니다.',
        '소금으로 간을 맞춰 완성합니다.',
      ],
    },
    '감자국': {
      title: '감자국',
      description: '부드럽고 담백한 감자국입니다.',
      difficulty: 2,
      cookingTimeMinutes: 25,
      servings: 4,
      ingredients: [
        { ingredient_name: '감자', quantity: '3', unit: '개', category: '채소' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '멸치', quantity: '10', unit: '마리', category: '해산물' },
        { ingredient_name: '다시마', quantity: '10', unit: 'cm', category: '해산물' },
        { ingredient_name: '소금', quantity: '1', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '감자를 깍둑썰기하여 준비합니다.',
        '다시마와 멸치로 육수를 만듭니다.',
        '육수가 끓으면 감자를 넣고 끓입니다.',
        '감자가 익으면 대파를 넣습니다.',
        '소금으로 간을 맞춰 완성합니다.',
      ],
    },
    '김치국': {
      title: '김치국',
      description: '시원하고 깔끔한 김치국입니다.',
      difficulty: 2,
      cookingTimeMinutes: 20,
      servings: 4,
      ingredients: [
        { ingredient_name: '신김치', quantity: '200', unit: 'g', category: '채소' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '멸치', quantity: '10', unit: '마리', category: '해산물' },
        { ingredient_name: '다시마', quantity: '10', unit: 'cm', category: '해산물' },
        { ingredient_name: '고춧가루', quantity: '1', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '신김치를 적당한 크기로 썹니다.',
        '다시마와 멸치로 육수를 만듭니다.',
        '육수가 끓으면 김치를 넣고 끓입니다.',
        '고춧가루를 넣어 색을 냅니다.',
        '대파를 넣고 한 번 더 끓여 완성합니다.',
      ],
    },
    '달걀국': {
      title: '달걀국',
      description: '부드럽고 담백한 달걀국입니다.',
      difficulty: 1,
      cookingTimeMinutes: 15,
      servings: 4,
      ingredients: [
        { ingredient_name: '달걀', quantity: '3', unit: '개', category: '유제품' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '멸치', quantity: '10', unit: '마리', category: '해산물' },
        { ingredient_name: '다시마', quantity: '10', unit: 'cm', category: '해산물' },
        { ingredient_name: '소금', quantity: '1', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '다시마와 멸치로 육수를 만듭니다.',
        '달걀을 풀어 준비합니다.',
        '육수가 끓으면 달걀물을 천천히 넣습니다.',
        '대파를 넣고 한 번 더 끓입니다.',
        '소금으로 간을 맞춰 완성합니다.',
      ],
    },
    '버섯국': {
      title: '버섯국',
      description: '고소하고 깔끔한 버섯국입니다.',
      difficulty: 2,
      cookingTimeMinutes: 20,
      servings: 4,
      ingredients: [
        { ingredient_name: '팽이버섯', quantity: '1', unit: '팩', category: '채소' },
        { ingredient_name: '느타리버섯', quantity: '100', unit: 'g', category: '채소' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '멸치', quantity: '10', unit: '마리', category: '해산물' },
        { ingredient_name: '다시마', quantity: '10', unit: 'cm', category: '해산물' },
        { ingredient_name: '소금', quantity: '1', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '버섯을 깨끗이 씻어 준비합니다.',
        '다시마와 멸치로 육수를 만듭니다.',
        '육수가 끓으면 버섯을 넣고 끓입니다.',
        '대파를 넣고 한 번 더 끓입니다.',
        '소금으로 간을 맞춰 완성합니다.',
      ],
    },
    '고사리국': {
      title: '고사리국',
      description: '향긋하고 깔끔한 고사리국입니다.',
      difficulty: 2,
      cookingTimeMinutes: 25,
      servings: 4,
      ingredients: [
        { ingredient_name: '고사리', quantity: '200', unit: 'g', category: '채소' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '멸치', quantity: '10', unit: '마리', category: '해산물' },
        { ingredient_name: '다시마', quantity: '10', unit: 'cm', category: '해산물' },
        { ingredient_name: '마늘', quantity: '2', unit: '쪽', category: '조미료' },
        { ingredient_name: '소금', quantity: '1', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '고사리를 적당한 길이로 자릅니다.',
        '다시마와 멸치로 육수를 만듭니다.',
        '육수가 끓으면 고사리를 넣고 끓입니다.',
        '다진 마늘과 대파를 넣습니다.',
        '소금으로 간을 맞춰 완성합니다.',
      ],
    },
    '토란국': {
      title: '토란국',
      description: '부드럽고 고소한 토란국입니다.',
      difficulty: 3,
      cookingTimeMinutes: 30,
      servings: 4,
      ingredients: [
        { ingredient_name: '토란', quantity: '300', unit: 'g', category: '채소' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '멸치', quantity: '10', unit: '마리', category: '해산물' },
        { ingredient_name: '다시마', quantity: '10', unit: 'cm', category: '해산물' },
        { ingredient_name: '마늘', quantity: '2', unit: '쪽', category: '조미료' },
        { ingredient_name: '소금', quantity: '1', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '토란을 깨끗이 씻어 껍질을 벗깁니다.',
        '다시마와 멸치로 육수를 만듭니다.',
        '육수가 끓으면 토란을 넣고 끓입니다.',
        '토란이 익으면 다진 마늘과 대파를 넣습니다.',
        '소금으로 간을 맞춰 완성합니다.',
      ],
    },
    '만두국': {
      title: '만두국',
      description: '고소하고 시원한 만두국입니다.',
      difficulty: 3,
      cookingTimeMinutes: 25,
      servings: 4,
      ingredients: [
        { ingredient_name: '만두', quantity: '12', unit: '개', category: '기타' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '멸치', quantity: '10', unit: '마리', category: '해산물' },
        { ingredient_name: '다시마', quantity: '10', unit: 'cm', category: '해산물' },
        { ingredient_name: '마늘', quantity: '2', unit: '쪽', category: '조미료' },
        { ingredient_name: '소금', quantity: '1', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '다시마와 멸치로 육수를 만듭니다.',
        '육수가 끓으면 만두를 넣고 끓입니다.',
        '만두가 떠오르면 다진 마늘과 대파를 넣습니다.',
        '한 번 더 끓여 만두가 완전히 익도록 합니다.',
        '소금으로 간을 맞춰 완성합니다.',
      ],
    },
    '떡국': {
      title: '떡국',
      description: '새해 첫날 먹는 떡국입니다.',
      difficulty: 2,
      cookingTimeMinutes: 20,
      servings: 4,
      ingredients: [
        { ingredient_name: '떡', quantity: '400', unit: 'g', category: '곡물' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '달걀', quantity: '2', unit: '개', category: '유제품' },
        { ingredient_name: '멸치', quantity: '10', unit: '마리', category: '해산물' },
        { ingredient_name: '다시마', quantity: '10', unit: 'cm', category: '해산물' },
        { ingredient_name: '소금', quantity: '1', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '떡을 적당한 크기로 자릅니다.',
        '다시마와 멸치로 육수를 만듭니다.',
        '육수가 끓으면 떡을 넣고 끓입니다.',
        '달걀을 풀어 넣고 대파를 넣습니다.',
        '소금으로 간을 맞춰 완성합니다.',
      ],
    },
    '황태국': {
      title: '황태국',
      description: '구수하고 시원한 황태국입니다.',
      difficulty: 3,
      cookingTimeMinutes: 40,
      servings: 4,
      ingredients: [
        { ingredient_name: '황태', quantity: '200', unit: 'g', category: '해산물' },
        { ingredient_name: '무', quantity: '200', unit: 'g', category: '채소' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '마늘', quantity: '3', unit: '쪽', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '1', unit: '작은술', category: '조미료' },
        { ingredient_name: '소금', quantity: '1', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '황태를 불려 준비합니다.',
        '무를 깍둑썰기하여 준비합니다.',
        '황태와 무를 넣고 끓입니다.',
        '황태가 익으면 다진 마늘과 고춧가루를 넣습니다.',
        '대파를 넣고 소금으로 간을 맞춰 완성합니다.',
      ],
    },
    '시래기국': {
      title: '시래기국',
      description: '구수하고 담백한 시래기국입니다.',
      difficulty: 2,
      cookingTimeMinutes: 30,
      servings: 4,
      ingredients: [
        { ingredient_name: '시래기', quantity: '100', unit: 'g', category: '채소' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '멸치', quantity: '10', unit: '마리', category: '해산물' },
        { ingredient_name: '다시마', quantity: '10', unit: 'cm', category: '해산물' },
        { ingredient_name: '마늘', quantity: '2', unit: '쪽', category: '조미료' },
        { ingredient_name: '소금', quantity: '1', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '시래기를 불려 준비합니다.',
        '다시마와 멸치로 육수를 만듭니다.',
        '육수가 끓으면 시래기를 넣고 끓입니다.',
        '다진 마늘과 대파를 넣습니다.',
        '소금으로 간을 맞춰 완성합니다.',
      ],
    },
    '뼈해장국': {
      title: '뼈해장국',
      description: '진한 국물의 뼈해장국입니다.',
      difficulty: 4,
      cookingTimeMinutes: 120,
      servings: 4,
      ingredients: [
        { ingredient_name: '소뼈', quantity: '1', unit: 'kg', category: '육류' },
        { ingredient_name: '무', quantity: '300', unit: 'g', category: '채소' },
        { ingredient_name: '대파', quantity: '2', unit: '대', category: '채소' },
        { ingredient_name: '마늘', quantity: '5', unit: '쪽', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '2', unit: '큰술', category: '조미료' },
        { ingredient_name: '된장', quantity: '1', unit: '큰술', category: '조미료' },
      ],
      steps: [
        '소뼈를 깨끗이 씻어 끓는 물에 데칩니다.',
        '뼈를 넣고 푹 끓여 육수를 만듭니다.',
        '무를 넣고 더 끓입니다.',
        '된장과 고춧가루를 넣어 양념합니다.',
        '다진 마늘과 대파를 넣고 소금으로 간을 맞춰 완성합니다.',
      ],
    },
    '소고기무국': {
      title: '소고기무국',
      description: '고소하고 시원한 소고기무국입니다.',
      difficulty: 3,
      cookingTimeMinutes: 40,
      servings: 4,
      ingredients: [
        { ingredient_name: '소고기', quantity: '300', unit: 'g', category: '육류' },
        { ingredient_name: '무', quantity: '300', unit: 'g', category: '채소' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '마늘', quantity: '3', unit: '쪽', category: '조미료' },
        { ingredient_name: '소금', quantity: '1', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '소고기를 적당한 크기로 썹니다.',
        '무를 깍둑썰기하여 준비합니다.',
        '소고기와 무를 넣고 끓입니다.',
        '고기가 익으면 다진 마늘과 대파를 넣습니다.',
        '소금으로 간을 맞춰 완성합니다.',
      ],
    },
    '북어국': {
      title: '북어국',
      description: '구수하고 시원한 북어국입니다.',
      difficulty: 3,
      cookingTimeMinutes: 30,
      servings: 4,
      ingredients: [
        { ingredient_name: '북어', quantity: '200', unit: 'g', category: '해산물' },
        { ingredient_name: '무', quantity: '200', unit: 'g', category: '채소' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '마늘', quantity: '2', unit: '쪽', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '1', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '북어를 불려 준비합니다.',
        '무를 깍둑썰기하여 준비합니다.',
        '북어와 무를 넣고 끓입니다.',
        '다진 마늘과 고춧가루를 넣습니다.',
        '대파를 넣고 소금으로 간을 맞춰 완성합니다.',
      ],
    },
    '콩나물국': {
      title: '콩나물국',
      description: '시원하고 깔끔한 콩나물국입니다.',
      difficulty: 1,
      cookingTimeMinutes: 15,
      servings: 4,
      ingredients: [
        { ingredient_name: '콩나물', quantity: '300', unit: 'g', category: '채소' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '멸치', quantity: '10', unit: '마리', category: '해산물' },
        { ingredient_name: '다시마', quantity: '10', unit: 'cm', category: '해산물' },
        { ingredient_name: '소금', quantity: '1', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '콩나물을 깨끗이 씻어 준비합니다.',
        '다시마와 멸치로 육수를 만듭니다.',
        '육수가 끓으면 콩나물을 넣고 끓입니다.',
        '대파를 넣고 한 번 더 끓입니다.',
        '소금으로 간을 맞춰 완성합니다.',
      ],
    },
    '미역국': {
      title: '미역국',
      description: '부드럽고 시원한 미역국입니다.',
      difficulty: 2,
      cookingTimeMinutes: 20,
      servings: 4,
      ingredients: [
        { ingredient_name: '마른미역', quantity: '20', unit: 'g', category: '해산물' },
        { ingredient_name: '소고기', quantity: '100', unit: 'g', category: '육류' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '마늘', quantity: '2', unit: '쪽', category: '조미료' },
        { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '소금', quantity: '1', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '미역을 불려 준비합니다.',
        '소고기를 볶아 고소한 맛을 냅니다.',
        '미역을 넣고 볶습니다.',
        '물을 넣고 끓입니다.',
        '다진 마늘과 대파를 넣고 참기름과 소금으로 간을 맞춰 완성합니다.',
      ],
    },
    '된장국': {
      title: '된장국',
      description: '구수하고 담백한 된장국입니다.',
      difficulty: 2,
      cookingTimeMinutes: 20,
      servings: 4,
      ingredients: [
        { ingredient_name: '된장', quantity: '2', unit: '큰술', category: '조미료' },
        { ingredient_name: '두부', quantity: '1', unit: '모', category: '채소' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '멸치', quantity: '10', unit: '마리', category: '해산물' },
        { ingredient_name: '다시마', quantity: '10', unit: 'cm', category: '해산물' },
      ],
      steps: [
        '다시마와 멸치로 육수를 만듭니다.',
        '된장을 풀어 넣습니다.',
        '두부를 넣고 끓입니다.',
        '대파를 넣고 한 번 더 끓입니다.',
        '완성합니다.',
      ],
    },
    // 찌개류
    '콩비지찌개': {
      title: '콩비지찌개',
      description: '구수하고 진한 콩비지찌개입니다.',
      difficulty: 3,
      cookingTimeMinutes: 40,
      servings: 4,
      ingredients: [
        { ingredient_name: '콩비지', quantity: '200', unit: 'g', category: '채소' },
        { ingredient_name: '돼지고기', quantity: '200', unit: 'g', category: '육류' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '마늘', quantity: '3', unit: '쪽', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '된장', quantity: '1', unit: '큰술', category: '조미료' },
      ],
      steps: [
        '돼지고기를 볶아 고소한 맛을 냅니다.',
        '콩비지를 넣고 볶습니다.',
        '물을 넣고 된장과 고춧가루를 넣어 끓입니다.',
        '다진 마늘과 대파를 넣습니다.',
        '완성합니다.',
      ],
    },
    '육개장': {
      title: '육개장',
      description: '매콤하고 진한 육개장입니다.',
      difficulty: 4,
      cookingTimeMinutes: 60,
      servings: 4,
      ingredients: [
        { ingredient_name: '소고기', quantity: '400', unit: 'g', category: '육류' },
        { ingredient_name: '고사리', quantity: '100', unit: 'g', category: '채소' },
        { ingredient_name: '대파', quantity: '2', unit: '대', category: '채소' },
        { ingredient_name: '마늘', quantity: '5', unit: '쪽', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '3', unit: '큰술', category: '조미료' },
        { ingredient_name: '된장', quantity: '1', unit: '큰술', category: '조미료' },
      ],
      steps: [
        '소고기를 끓는 물에 데쳐 핏물을 뺍니다.',
        '고사리를 불려 준비합니다.',
        '소고기와 고사리를 넣고 푹 끓입니다.',
        '된장과 고춧가루를 넣어 양념합니다.',
        '다진 마늘과 대파를 넣고 완성합니다.',
      ],
    },
    '소고기찌개': {
      title: '소고기찌개',
      description: '고소하고 진한 소고기찌개입니다.',
      difficulty: 3,
      cookingTimeMinutes: 50,
      servings: 4,
      ingredients: [
        { ingredient_name: '소고기', quantity: '400', unit: 'g', category: '육류' },
        { ingredient_name: '무', quantity: '200', unit: 'g', category: '채소' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '마늘', quantity: '3', unit: '쪽', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '2', unit: '큰술', category: '조미료' },
        { ingredient_name: '된장', quantity: '1', unit: '큰술', category: '조미료' },
      ],
      steps: [
        '소고기를 적당한 크기로 썹니다.',
        '무를 넣고 끓입니다.',
        '된장과 고춧가루를 넣어 양념합니다.',
        '다진 마늘과 대파를 넣습니다.',
        '완성합니다.',
      ],
    },
    '돼지고기찌개': {
      title: '돼지고기찌개',
      description: '고소하고 진한 돼지고기찌개입니다.',
      difficulty: 3,
      cookingTimeMinutes: 45,
      servings: 4,
      ingredients: [
        { ingredient_name: '돼지고기', quantity: '400', unit: 'g', category: '육류' },
        { ingredient_name: '김치', quantity: '200', unit: 'g', category: '채소' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '마늘', quantity: '3', unit: '쪽', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '2', unit: '큰술', category: '조미료' },
      ],
      steps: [
        '돼지고기를 볶아 고소한 맛을 냅니다.',
        '김치를 넣고 볶습니다.',
        '물을 넣고 고춧가루를 넣어 끓입니다.',
        '다진 마늘과 대파를 넣습니다.',
        '완성합니다.',
      ],
    },
    '부대찌개': {
      title: '부대찌개',
      description: '다양한 재료가 들어간 부대찌개입니다.',
      difficulty: 3,
      cookingTimeMinutes: 30,
      servings: 4,
      ingredients: [
        { ingredient_name: '소시지', quantity: '200', unit: 'g', category: '육류' },
        { ingredient_name: '햄', quantity: '200', unit: 'g', category: '육류' },
        { ingredient_name: '라면', quantity: '1', unit: '봉', category: '곡물' },
        { ingredient_name: '김치', quantity: '200', unit: 'g', category: '채소' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '고춧가루', quantity: '2', unit: '큰술', category: '조미료' },
      ],
      steps: [
        '소시지와 햄을 적당한 크기로 썹니다.',
        '김치를 넣고 볶습니다.',
        '물을 넣고 고춧가루를 넣어 끓입니다.',
        '소시지와 햄을 넣고 끓입니다.',
        '라면과 대파를 넣고 완성합니다.',
      ],
    },
    '청국장찌개': {
      title: '청국장찌개',
      description: '구수하고 진한 청국장찌개입니다.',
      difficulty: 3,
      cookingTimeMinutes: 35,
      servings: 4,
      ingredients: [
        { ingredient_name: '청국장', quantity: '200', unit: 'g', category: '채소' },
        { ingredient_name: '두부', quantity: '1', unit: '모', category: '채소' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '마늘', quantity: '3', unit: '쪽', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '1', unit: '큰술', category: '조미료' },
      ],
      steps: [
        '청국장을 준비합니다.',
        '두부를 넣고 끓입니다.',
        '고춧가루를 넣어 양념합니다.',
        '다진 마늘과 대파를 넣습니다.',
        '완성합니다.',
      ],
    },
    '김치찌개': {
      title: '김치찌개',
      description: '매콤하고 시원한 김치찌개입니다.',
      difficulty: 3,
      cookingTimeMinutes: 30,
      servings: 4,
      ingredients: [
        { ingredient_name: '신김치', quantity: '300', unit: 'g', category: '채소' },
        { ingredient_name: '돼지고기', quantity: '200', unit: 'g', category: '육류' },
        { ingredient_name: '두부', quantity: '1', unit: '모', category: '채소' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '마늘', quantity: '3', unit: '쪽', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '2', unit: '큰술', category: '조미료' },
      ],
      steps: [
        '돼지고기를 볶아 고소한 맛을 냅니다.',
        '김치를 넣고 볶습니다.',
        '물을 넣고 고춧가루를 넣어 끓입니다.',
        '두부를 넣고 끓입니다.',
        '다진 마늘과 대파를 넣고 완성합니다.',
      ],
    },
    '순두부찌개': {
      title: '순두부찌개',
      description: '부드럽고 매콤한 순두부찌개입니다.',
      difficulty: 2,
      cookingTimeMinutes: 20,
      servings: 4,
      ingredients: [
        { ingredient_name: '순두부', quantity: '1', unit: '팩', category: '채소' },
        { ingredient_name: '달걀', quantity: '1', unit: '개', category: '유제품' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '마늘', quantity: '2', unit: '쪽', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '1', unit: '큰술', category: '조미료' },
      ],
      steps: [
        '순두부를 준비합니다.',
        '물을 넣고 고춧가루를 넣어 끓입니다.',
        '순두부를 넣고 끓입니다.',
        '달걀을 넣고 대파를 넣습니다.',
        '다진 마늘을 넣고 완성합니다.',
      ],
    },
    '된장찌개': {
      title: '된장찌개',
      description: '구수하고 진한 된장찌개입니다.',
      difficulty: 2,
      cookingTimeMinutes: 25,
      servings: 4,
      ingredients: [
        { ingredient_name: '된장', quantity: '3', unit: '큰술', category: '조미료' },
        { ingredient_name: '두부', quantity: '1', unit: '모', category: '채소' },
        { ingredient_name: '호박', quantity: '1', unit: '개', category: '채소' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '마늘', quantity: '2', unit: '쪽', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '1', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '된장을 풀어 준비합니다.',
        '두부와 호박을 넣고 끓입니다.',
        '고춧가루를 넣어 양념합니다.',
        '다진 마늘과 대파를 넣습니다.',
        '완성합니다.',
      ],
    },
    '감자탕': {
      title: '감자탕',
      description: '진하고 시원한 감자탕입니다.',
      difficulty: 4,
      cookingTimeMinutes: 90,
      servings: 4,
      ingredients: [
        { ingredient_name: '돼지뼈', quantity: '1', unit: 'kg', category: '육류' },
        { ingredient_name: '감자', quantity: '3', unit: '개', category: '채소' },
        { ingredient_name: '우거지', quantity: '200', unit: 'g', category: '채소' },
        { ingredient_name: '대파', quantity: '2', unit: '대', category: '채소' },
        { ingredient_name: '마늘', quantity: '5', unit: '쪽', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '3', unit: '큰술', category: '조미료' },
        { ingredient_name: '된장', quantity: '1', unit: '큰술', category: '조미료' },
      ],
      steps: [
        '돼지뼈를 깨끗이 씻어 끓는 물에 데칩니다.',
        '뼈를 넣고 푹 끓여 육수를 만듭니다.',
        '감자와 우거지를 넣고 더 끓입니다.',
        '된장과 고춧가루를 넣어 양념합니다.',
        '다진 마늘과 대파를 넣고 완성합니다.',
      ],
    },
  };

  // 템플릿에서 찾기
  const template = recipeTemplates[nameWithoutExt];
  if (template) {
    return {
      title: template.title || nameWithoutExt,
      description: template.description || `${nameWithoutExt} 레시피입니다.`,
      difficulty: template.difficulty || 3,
      cookingTimeMinutes: template.cookingTimeMinutes || 30,
      servings: template.servings || 4,
      ingredients: template.ingredients || [],
      steps: template.steps || [],
      imageFileName,
    };
  }

  // 기본 템플릿 사용
  return {
    title: nameWithoutExt,
    description: `${nameWithoutExt} 레시피입니다.`,
    difficulty: 3,
    cookingTimeMinutes: 30,
    servings: 4,
    ingredients: [
      { ingredient_name: '재료1', quantity: '200', unit: 'g', category: '기타' },
      { ingredient_name: '재료2', quantity: '100', unit: 'g', category: '기타' },
    ],
    steps: [
      '재료를 준비합니다.',
      '조리합니다.',
      '완성합니다.',
    ],
    imageFileName,
  };
}

/**
 * 이미지를 Supabase Storage에 업로드하고 공개 URL 반환
 */
async function uploadImageToStorage(
  imagePath: string,
  recipeTitle: string
): Promise<string> {
  const supabase = getServiceRoleClient();
  const bucketName = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'uploads';
  
  console.log(`[UploadImage] 업로드 시작: ${imagePath}`);
  
  try {
    if (!existsSync(imagePath)) {
      console.error(`[UploadImage] 파일 없음: ${imagePath}`);
      return '';
    }
    
    const fileBuffer = readFileSync(imagePath);
    const fileName = imagePath.split('/').pop() || imagePath.split('\\').pop() || 'image.jpg';
    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    
    // 레시피별 폴더 구조: recipes/{recipe-slug}/{filename}
    const slug = recipeTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const storagePath = `recipes/${slug}/${fileName}`;
    
    // MIME 타입 결정
    const contentType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
    
    // Storage에 업로드
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: true,
      });
    
    if (error) {
      console.error(`[UploadImage] 업로드 실패: ${error.message}`);
      return '';
    }
    
    // 공개 URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);
    
    console.log(`[UploadImage] 업로드 성공: ${publicUrl}`);
    return publicUrl;
    
  } catch (error) {
    console.error(`[UploadImage] 오류 발생:`, error);
    return '';
  }
}

/**
 * 레시피 등록
 */
async function registerRecipe(
  recipeData: RecipeSeedData,
  userId: string
): Promise<boolean> {
  console.groupCollapsed(`[RegisterRecipe] ${recipeData.title}`);
  
  try {
    // 1. 이미지 업로드
    const imagePath = join(process.cwd(), 'public', 'images', 'food', recipeData.imageFileName);
    const imageUrl = await uploadImageToStorage(imagePath, recipeData.title);
    
    // 2. 레시피 데이터 준비
    const recipeInput: CreateRecipeInput = {
      title: recipeData.title,
      description: recipeData.description,
      difficulty: recipeData.difficulty,
      cookingTimeMinutes: recipeData.cookingTimeMinutes,
      servings: recipeData.servings,
      ingredients: recipeData.ingredients.map((ing, index) => ({
        ingredient_name: ing.ingredient_name,
        quantity: ing.quantity || undefined,
        unit: ing.unit || undefined,
        category: ing.category,
        is_optional: ing.is_optional || false,
        display_order: index,
      })),
      steps: recipeData.steps.map((step, index) => ({
        content: step,
        image_url: index === 0 && imageUrl ? imageUrl : undefined,
        video_url: undefined,
        timer_minutes: undefined,
      })),
      userId,
    };
    
    // 3. 레시피 생성
    const result = await createRecipe(recipeInput);
    
    if (!result.success) {
      console.error(`[RegisterRecipe] 실패: ${result.error}`);
      console.groupEnd();
      return false;
    }
    
    console.log(`[RegisterRecipe] 성공: ${result.slug}`);
    console.groupEnd();
    return true;
    
  } catch (error) {
    console.error(`[RegisterRecipe] 오류:`, error);
    console.groupEnd();
    return false;
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('[SeedRecipes] 레시피 일괄 등록 시작');
  
  // 사용자 ID 가져오기 (첫 번째 사용자 또는 관리자)
  const supabase = getServiceRoleClient();
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id')
    .limit(1);
  
  if (userError || !users || users.length === 0) {
    console.error('[SeedRecipes] 사용자를 찾을 수 없습니다.');
    return;
  }
  
  const userId = users[0].id;
  console.log(`[SeedRecipes] 사용자 ID: ${userId}`);
  
  // 이미지 파일 목록 가져오기
  const imagesDir = join(process.cwd(), 'public', 'images', 'food');
  const imageFiles = readdirSync(imagesDir).filter(file => 
    /\.(png|jpg|jpeg)$/i.test(file) && file !== 'default.svg'
  );
  
  console.log(`[SeedRecipes] 발견된 이미지 파일: ${imageFiles.length}개`);
  
  // 각 이미지에 대해 레시피 생성
  let successCount = 0;
  let failCount = 0;
  
  for (const imageFile of imageFiles) {
    const recipeData = generateRecipeData(imageFile);
    if (!recipeData) {
      console.warn(`[SeedRecipes] 레시피 데이터 생성 실패: ${imageFile}`);
      failCount++;
      continue;
    }
    
    const success = await registerRecipe(recipeData, userId);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // API 제한을 피하기 위해 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`[SeedRecipes] 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

export { registerRecipe, uploadImageToStorage, generateRecipeData };

