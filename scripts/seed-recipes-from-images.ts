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
    // 나물류
    '취나물': {
      title: '취나물',
      description: '향긋하고 부드러운 취나물입니다.',
      difficulty: 2,
      cookingTimeMinutes: 20,
      servings: 4,
      ingredients: [
        { ingredient_name: '취나물', quantity: '200', unit: 'g', category: '채소' },
        { ingredient_name: '마늘', quantity: '2', unit: '쪽', category: '조미료' },
        { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '소금', quantity: '0.5', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '취나물을 깨끗이 씻어 준비합니다.',
        '끓는 물에 데쳐 찬물에 헹굽니다.',
        '물기를 꽉 짜서 준비합니다.',
        '다진 마늘과 참기름, 소금으로 양념합니다.',
        '완성합니다.',
      ],
    },
    '미역줄기볶음': {
      title: '미역줄기볶음',
      description: '쫄깃하고 고소한 미역줄기볶음입니다.',
      difficulty: 2,
      cookingTimeMinutes: 15,
      servings: 4,
      ingredients: [
        { ingredient_name: '미역줄기', quantity: '200', unit: 'g', category: '해산물' },
        { ingredient_name: '마늘', quantity: '2', unit: '쪽', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '소금', quantity: '0.5', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '미역줄기를 불려 준비합니다.',
        '팬에 기름을 두르고 미역줄기를 볶습니다.',
        '다진 마늘과 고춧가루를 넣어 양념합니다.',
        '참기름을 넣고 소금으로 간을 맞춥니다.',
        '완성합니다.',
      ],
    },
    '고사리나물': {
      title: '고사리나물',
      description: '향긋하고 부드러운 고사리나물입니다.',
      difficulty: 2,
      cookingTimeMinutes: 25,
      servings: 4,
      ingredients: [
        { ingredient_name: '고사리', quantity: '200', unit: 'g', category: '채소' },
        { ingredient_name: '마늘', quantity: '2', unit: '쪽', category: '조미료' },
        { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '소금', quantity: '0.5', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '고사리를 불려 준비합니다.',
        '끓는 물에 데쳐 찬물에 헹굽니다.',
        '물기를 꽉 짜서 준비합니다.',
        '다진 마늘과 참기름, 소금으로 양념합니다.',
        '완성합니다.',
      ],
    },
    '감자채볶음': {
      title: '감자채볶음',
      description: '아삭하고 고소한 감자채볶음입니다.',
      difficulty: 2,
      cookingTimeMinutes: 15,
      servings: 4,
      ingredients: [
        { ingredient_name: '감자', quantity: '3', unit: '개', category: '채소' },
        { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
        { ingredient_name: '마늘', quantity: '2', unit: '쪽', category: '조미료' },
        { ingredient_name: '식용유', quantity: '2', unit: '큰술', category: '조미료' },
        { ingredient_name: '소금', quantity: '0.5', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '감자를 채썰어 준비합니다.',
        '팬에 기름을 두르고 감자를 볶습니다.',
        '다진 마늘을 넣어 볶습니다.',
        '대파를 넣고 소금으로 간을 맞춥니다.',
        '완성합니다.',
      ],
    },
    '호박볶음': {
      title: '호박볶음',
      description: '부드럽고 달콤한 호박볶음입니다.',
      difficulty: 1,
      cookingTimeMinutes: 10,
      servings: 4,
      ingredients: [
        { ingredient_name: '호박', quantity: '1', unit: '개', category: '채소' },
        { ingredient_name: '대파', quantity: '0.5', unit: '대', category: '채소' },
        { ingredient_name: '마늘', quantity: '1', unit: '쪽', category: '조미료' },
        { ingredient_name: '식용유', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '소금', quantity: '0.5', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '호박을 적당한 크기로 썹니다.',
        '팬에 기름을 두르고 호박을 볶습니다.',
        '다진 마늘을 넣어 볶습니다.',
        '대파를 넣고 소금으로 간을 맞춥니다.',
        '완성합니다.',
      ],
    },
    '어묵볶음': {
      title: '어묵볶음',
      description: '쫄깃하고 고소한 어묵볶음입니다.',
      difficulty: 2,
      cookingTimeMinutes: 15,
      servings: 4,
      ingredients: [
        { ingredient_name: '어묵', quantity: '200', unit: 'g', category: '해산물' },
        { ingredient_name: '양파', quantity: '0.5', unit: '개', category: '채소' },
        { ingredient_name: '고춧가루', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '설탕', quantity: '1', unit: '작은술', category: '조미료' },
        { ingredient_name: '식용유', quantity: '1', unit: '큰술', category: '조미료' },
      ],
      steps: [
        '어묵을 적당한 크기로 썹니다.',
        '양파를 채썰어 준비합니다.',
        '팬에 기름을 두르고 어묵을 볶습니다.',
        '양파를 넣고 고춧가루와 설탕으로 양념합니다.',
        '완성합니다.',
      ],
    },
    '애호박볶음': {
      title: '애호박볶음',
      description: '부드럽고 달콤한 애호박볶음입니다.',
      difficulty: 1,
      cookingTimeMinutes: 10,
      servings: 4,
      ingredients: [
        { ingredient_name: '애호박', quantity: '2', unit: '개', category: '채소' },
        { ingredient_name: '대파', quantity: '0.5', unit: '대', category: '채소' },
        { ingredient_name: '마늘', quantity: '1', unit: '쪽', category: '조미료' },
        { ingredient_name: '식용유', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '소금', quantity: '0.5', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '애호박을 적당한 크기로 썹니다.',
        '팬에 기름을 두르고 애호박을 볶습니다.',
        '다진 마늘을 넣어 볶습니다.',
        '대파를 넣고 소금으로 간을 맞춥니다.',
        '완성합니다.',
      ],
    },
    '오이무침': {
      title: '오이무침',
      description: '아삭하고 시원한 오이무침입니다.',
      difficulty: 1,
      cookingTimeMinutes: 10,
      servings: 4,
      ingredients: [
        { ingredient_name: '오이', quantity: '2', unit: '개', category: '채소' },
        { ingredient_name: '양파', quantity: '0.25', unit: '개', category: '채소' },
        { ingredient_name: '고춧가루', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '식초', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '설탕', quantity: '0.5', unit: '작은술', category: '조미료' },
        { ingredient_name: '소금', quantity: '0.5', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '오이를 얇게 썹니다.',
        '소금에 절여 물기를 뺍니다.',
        '양파를 채썰어 준비합니다.',
        '고춧가루, 식초, 설탕으로 양념장을 만듭니다.',
        '오이와 양파를 넣고 양념장으로 무칩니다.',
      ],
    },
    '가지나물': {
      title: '가지나물',
      description: '부드럽고 고소한 가지나물입니다.',
      difficulty: 2,
      cookingTimeMinutes: 15,
      servings: 4,
      ingredients: [
        { ingredient_name: '가지', quantity: '2', unit: '개', category: '채소' },
        { ingredient_name: '마늘', quantity: '2', unit: '쪽', category: '조미료' },
        { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '소금', quantity: '0.5', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '가지를 찜기에 쪄 익힙니다.',
        '가지를 찬물에 헹구어 껍질을 벗깁니다.',
        '물기를 꽉 짜서 준비합니다.',
        '다진 마늘과 참기름, 소금으로 양념합니다.',
        '완성합니다.',
      ],
    },
    '고구마줄기볶음': {
      title: '고구마줄기볶음',
      description: '쫄깃하고 고소한 고구마줄기볶음입니다.',
      difficulty: 2,
      cookingTimeMinutes: 15,
      servings: 4,
      ingredients: [
        { ingredient_name: '고구마줄기', quantity: '200', unit: 'g', category: '채소' },
        { ingredient_name: '마늘', quantity: '2', unit: '쪽', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '소금', quantity: '0.5', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '고구마줄기를 깨끗이 씻어 준비합니다.',
        '끓는 물에 데쳐 찬물에 헹굽니다.',
        '물기를 꽉 짜서 준비합니다.',
        '팬에 기름을 두르고 고구마줄기를 볶습니다.',
        '다진 마늘과 고춧가루, 참기름, 소금으로 양념합니다.',
      ],
    },
    '콩나물무침': {
      title: '콩나물무침',
      description: '아삭하고 시원한 콩나물무침입니다.',
      difficulty: 1,
      cookingTimeMinutes: 10,
      servings: 4,
      ingredients: [
        { ingredient_name: '콩나물', quantity: '300', unit: 'g', category: '채소' },
        { ingredient_name: '대파', quantity: '0.5', unit: '대', category: '채소' },
        { ingredient_name: '마늘', quantity: '1', unit: '쪽', category: '조미료' },
        { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '소금', quantity: '0.5', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '콩나물을 깨끗이 씻어 준비합니다.',
        '끓는 물에 데쳐 찬물에 헹굽니다.',
        '물기를 꽉 짜서 준비합니다.',
        '다진 마늘과 대파, 참기름, 소금으로 양념합니다.',
        '완성합니다.',
      ],
    },
    '시금치나물': {
      title: '시금치나물',
      description: '부드럽고 고소한 시금치나물입니다.',
      difficulty: 1,
      cookingTimeMinutes: 10,
      servings: 4,
      ingredients: [
        { ingredient_name: '시금치', quantity: '300', unit: 'g', category: '채소' },
        { ingredient_name: '마늘', quantity: '1', unit: '쪽', category: '조미료' },
        { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '소금', quantity: '0.5', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '시금치를 깨끗이 씻어 준비합니다.',
        '끓는 물에 데쳐 찬물에 헹굽니다.',
        '물기를 꽉 짜서 준비합니다.',
        '다진 마늘과 참기름, 소금으로 양념합니다.',
        '완성합니다.',
      ],
    },
    // 볶음류
    '진미채볶음': {
      title: '진미채볶음',
      description: '고소하고 달콤한 진미채볶음입니다.',
      difficulty: 2,
      cookingTimeMinutes: 15,
      servings: 4,
      ingredients: [
        { ingredient_name: '진미채', quantity: '200', unit: 'g', category: '해산물' },
        { ingredient_name: '양파', quantity: '0.5', unit: '개', category: '채소' },
        { ingredient_name: '고춧가루', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '설탕', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '식용유', quantity: '1', unit: '큰술', category: '조미료' },
      ],
      steps: [
        '진미채를 불려 준비합니다.',
        '양파를 채썰어 준비합니다.',
        '팬에 기름을 두르고 진미채를 볶습니다.',
        '양파를 넣고 고춧가루와 설탕으로 양념합니다.',
        '완성합니다.',
      ],
    },
    '멸치볶음': {
      title: '멸치볶음',
      description: '고소하고 달콤한 멸치볶음입니다.',
      difficulty: 2,
      cookingTimeMinutes: 15,
      servings: 4,
      ingredients: [
        { ingredient_name: '멸치', quantity: '200', unit: 'g', category: '해산물' },
        { ingredient_name: '마늘', quantity: '3', unit: '쪽', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '설탕', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '식용유', quantity: '2', unit: '큰술', category: '조미료' },
      ],
      steps: [
        '멸치를 깨끗이 준비합니다.',
        '팬에 기름을 두르고 멸치를 볶습니다.',
        '다진 마늘을 넣어 볶습니다.',
        '고춧가루와 설탕을 넣어 양념합니다.',
        '완성합니다.',
      ],
    },
    // 김치류
    '보쌈김치': {
      title: '보쌈김치',
      description: '아삭하고 시원한 보쌈김치입니다.',
      difficulty: 3,
      cookingTimeMinutes: 60,
      servings: 10,
      ingredients: [
        { ingredient_name: '배추', quantity: '1', unit: '포기', category: '채소' },
        { ingredient_name: '소금', quantity: '200', unit: 'g', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '100', unit: 'g', category: '조미료' },
        { ingredient_name: '마늘', quantity: '10', unit: '쪽', category: '조미료' },
        { ingredient_name: '생강', quantity: '1', unit: '개', category: '조미료' },
        { ingredient_name: '멸치젓갈', quantity: '50', unit: 'g', category: '해산물' },
      ],
      steps: [
        '배추를 소금에 절입니다.',
        '절인 배추를 헹구어 물기를 뺍니다.',
        '고춧가루, 다진 마늘, 생강, 멸치젓갈로 양념을 만듭니다.',
        '배추 잎 사이사이에 양념을 넣습니다.',
        '상온에서 하루 숙성시킨 후 냉장고에 보관합니다.',
      ],
    },
    '동치미': {
      title: '동치미',
      description: '시원하고 깔끔한 동치미입니다.',
      difficulty: 2,
      cookingTimeMinutes: 30,
      servings: 10,
      ingredients: [
        { ingredient_name: '무', quantity: '1', unit: '개', category: '채소' },
        { ingredient_name: '소금', quantity: '100', unit: 'g', category: '조미료' },
        { ingredient_name: '설탕', quantity: '50', unit: 'g', category: '조미료' },
        { ingredient_name: '생강', quantity: '1', unit: '개', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '1', unit: '큰술', category: '조미료' },
      ],
      steps: [
        '무를 적당한 크기로 썹니다.',
        '소금에 절여 물기를 뺍니다.',
        '절인 무를 헹구어 준비합니다.',
        '설탕, 생강, 고춧가루로 양념장을 만듭니다.',
        '무를 양념장에 넣고 물을 부어 숙성시킵니다.',
      ],
    },
    '갓김치': {
      title: '갓김치',
      description: '향긋하고 아삭한 갓김치입니다.',
      difficulty: 3,
      cookingTimeMinutes: 60,
      servings: 8,
      ingredients: [
        { ingredient_name: '갓', quantity: '500', unit: 'g', category: '채소' },
        { ingredient_name: '소금', quantity: '100', unit: 'g', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '50', unit: 'g', category: '조미료' },
        { ingredient_name: '마늘', quantity: '5', unit: '쪽', category: '조미료' },
        { ingredient_name: '생강', quantity: '1', unit: '개', category: '조미료' },
        { ingredient_name: '멸치젓갈', quantity: '30', unit: 'g', category: '해산물' },
      ],
      steps: [
        '갓을 깨끗이 씻어 소금에 절입니다.',
        '절인 갓을 헹구어 물기를 뺍니다.',
        '고춧가루, 다진 마늘, 생강, 멸치젓갈로 양념을 만듭니다.',
        '갓에 양념을 넣고 버무립니다.',
        '상온에서 하루 숙성시킨 후 냉장고에 보관합니다.',
      ],
    },
    '열무김치': {
      title: '열무김치',
      description: '아삭하고 시원한 열무김치입니다.',
      difficulty: 2,
      cookingTimeMinutes: 30,
      servings: 8,
      ingredients: [
        { ingredient_name: '열무', quantity: '500', unit: 'g', category: '채소' },
        { ingredient_name: '소금', quantity: '50', unit: 'g', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '50', unit: 'g', category: '조미료' },
        { ingredient_name: '마늘', quantity: '3', unit: '쪽', category: '조미료' },
        { ingredient_name: '생강', quantity: '0.5', unit: '개', category: '조미료' },
        { ingredient_name: '멸치젓갈', quantity: '20', unit: 'g', category: '해산물' },
      ],
      steps: [
        '열무를 깨끗이 씻어 소금에 절입니다.',
        '절인 열무를 헹구어 물기를 뺍니다.',
        '고춧가루, 다진 마늘, 생강, 멸치젓갈로 양념을 만듭니다.',
        '열무에 양념을 넣고 버무립니다.',
        '상온에서 하루 숙성시킨 후 냉장고에 보관합니다.',
      ],
    },
    '파김치': {
      title: '파김치',
      description: '향긋하고 아삭한 파김치입니다.',
      difficulty: 2,
      cookingTimeMinutes: 30,
      servings: 8,
      ingredients: [
        { ingredient_name: '대파', quantity: '500', unit: 'g', category: '채소' },
        { ingredient_name: '소금', quantity: '50', unit: 'g', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '50', unit: 'g', category: '조미료' },
        { ingredient_name: '마늘', quantity: '3', unit: '쪽', category: '조미료' },
        { ingredient_name: '생강', quantity: '0.5', unit: '개', category: '조미료' },
        { ingredient_name: '멸치젓갈', quantity: '20', unit: 'g', category: '해산물' },
      ],
      steps: [
        '대파를 깨끗이 씻어 소금에 절입니다.',
        '절인 대파를 헹구어 물기를 뺍니다.',
        '고춧가루, 다진 마늘, 생강, 멸치젓갈로 양념을 만듭니다.',
        '대파에 양념을 넣고 버무립니다.',
        '상온에서 하루 숙성시킨 후 냉장고에 보관합니다.',
      ],
    },
    '총각김치': {
      title: '총각김치',
      description: '아삭하고 시원한 총각김치입니다.',
      difficulty: 2,
      cookingTimeMinutes: 30,
      servings: 8,
      ingredients: [
        { ingredient_name: '총각무', quantity: '500', unit: 'g', category: '채소' },
        { ingredient_name: '소금', quantity: '50', unit: 'g', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '50', unit: 'g', category: '조미료' },
        { ingredient_name: '마늘', quantity: '3', unit: '쪽', category: '조미료' },
        { ingredient_name: '생강', quantity: '0.5', unit: '개', category: '조미료' },
        { ingredient_name: '멸치젓갈', quantity: '20', unit: 'g', category: '해산물' },
      ],
      steps: [
        '총각무를 깨끗이 씻어 소금에 절입니다.',
        '절인 총각무를 헹구어 물기를 뺍니다.',
        '고춧가루, 다진 마늘, 생강, 멸치젓갈로 양념을 만듭니다.',
        '총각무에 양념을 넣고 버무립니다.',
        '상온에서 하루 숙성시킨 후 냉장고에 보관합니다.',
      ],
    },
    '오이지': {
      title: '오이지',
      description: '아삭하고 시원한 오이지입니다.',
      difficulty: 2,
      cookingTimeMinutes: 30,
      servings: 8,
      ingredients: [
        { ingredient_name: '오이', quantity: '500', unit: 'g', category: '채소' },
        { ingredient_name: '소금', quantity: '50', unit: 'g', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '30', unit: 'g', category: '조미료' },
        { ingredient_name: '마늘', quantity: '3', unit: '쪽', category: '조미료' },
        { ingredient_name: '생강', quantity: '0.5', unit: '개', category: '조미료' },
        { ingredient_name: '멸치젓갈', quantity: '20', unit: 'g', category: '해산물' },
      ],
      steps: [
        '오이를 깨끗이 씻어 소금에 절입니다.',
        '절인 오이를 헹구어 물기를 뺍니다.',
        '고춧가루, 다진 마늘, 생강, 멸치젓갈로 양념을 만듭니다.',
        '오이에 양념을 넣고 버무립니다.',
        '상온에서 하루 숙성시킨 후 냉장고에 보관합니다.',
      ],
    },
    '고춧잎장아찌': {
      title: '고춧잎장아찌',
      description: '향긋하고 고소한 고춧잎장아찌입니다.',
      difficulty: 2,
      cookingTimeMinutes: 20,
      servings: 8,
      ingredients: [
        { ingredient_name: '고춧잎', quantity: '300', unit: 'g', category: '채소' },
        { ingredient_name: '간장', quantity: '100', unit: 'ml', category: '조미료' },
        { ingredient_name: '설탕', quantity: '50', unit: 'g', category: '조미료' },
        { ingredient_name: '마늘', quantity: '5', unit: '쪽', category: '조미료' },
        { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      ],
      steps: [
        '고춧잎을 깨끗이 씻어 준비합니다.',
        '간장, 설탕, 다진 마늘로 양념장을 만듭니다.',
        '고춧잎을 양념장에 넣고 버무립니다.',
        '참기름을 넣고 섞습니다.',
        '냉장고에 보관하여 숙성시킵니다.',
      ],
    },
    '오이소박이': {
      title: '오이소박이',
      description: '아삭하고 시원한 오이소박이입니다.',
      difficulty: 3,
      cookingTimeMinutes: 40,
      servings: 8,
      ingredients: [
        { ingredient_name: '오이', quantity: '500', unit: 'g', category: '채소' },
        { ingredient_name: '소금', quantity: '50', unit: 'g', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '50', unit: 'g', category: '조미료' },
        { ingredient_name: '마늘', quantity: '5', unit: '쪽', category: '조미료' },
        { ingredient_name: '생강', quantity: '0.5', unit: '개', category: '조미료' },
        { ingredient_name: '멸치젓갈', quantity: '20', unit: 'g', category: '해산물' },
      ],
      steps: [
        '오이를 깨끗이 씻어 소금에 절입니다.',
        '절인 오이를 헹구어 물기를 뺍니다.',
        '오이에 칼집을 내어 속을 파냅니다.',
        '고춧가루, 다진 마늘, 생강, 멸치젓갈로 양념을 만듭니다.',
        '오이 속에 양념을 넣고 버무립니다.',
        '상온에서 하루 숙성시킨 후 냉장고에 보관합니다.',
      ],
    },
    '깍두기': {
      title: '깍두기',
      description: '아삭하고 매콤한 깍두기입니다.',
      difficulty: 2,
      cookingTimeMinutes: 30,
      servings: 8,
      ingredients: [
        { ingredient_name: '무', quantity: '1', unit: '개', category: '채소' },
        { ingredient_name: '소금', quantity: '100', unit: 'g', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '50', unit: 'g', category: '조미료' },
        { ingredient_name: '마늘', quantity: '5', unit: '쪽', category: '조미료' },
        { ingredient_name: '생강', quantity: '1', unit: '개', category: '조미료' },
        { ingredient_name: '멸치젓갈', quantity: '30', unit: 'g', category: '해산물' },
      ],
      steps: [
        '무를 깍둑썰기하여 소금에 절입니다.',
        '절인 무를 헹구어 물기를 뺍니다.',
        '고춧가루, 다진 마늘, 생강, 멸치젓갈로 양념을 만듭니다.',
        '무에 양념을 넣고 버무립니다.',
        '상온에서 하루 숙성시킨 후 냉장고에 보관합니다.',
      ],
    },
    '김치': {
      title: '김치',
      description: '전통적인 배추김치입니다.',
      difficulty: 3,
      cookingTimeMinutes: 90,
      servings: 10,
      ingredients: [
        { ingredient_name: '배추', quantity: '1', unit: '포기', category: '채소' },
        { ingredient_name: '소금', quantity: '200', unit: 'g', category: '조미료' },
        { ingredient_name: '고춧가루', quantity: '100', unit: 'g', category: '조미료' },
        { ingredient_name: '마늘', quantity: '10', unit: '쪽', category: '조미료' },
        { ingredient_name: '생강', quantity: '1', unit: '개', category: '조미료' },
        { ingredient_name: '멸치젓갈', quantity: '50', unit: 'g', category: '해산물' },
        { ingredient_name: '무', quantity: '200', unit: 'g', category: '채소' },
        { ingredient_name: '대파', quantity: '2', unit: '대', category: '채소' },
      ],
      steps: [
        '배추를 소금에 절입니다.',
        '절인 배추를 헹구어 물기를 뺍니다.',
        '무와 대파를 채썰어 준비합니다.',
        '고춧가루, 다진 마늘, 생강, 멸치젓갈로 양념을 만듭니다.',
        '배추 잎 사이사이에 양념을 넣습니다.',
        '상온에서 하루 숙성시킨 후 냉장고에 보관합니다.',
      ],
    },
    '무생채': {
      title: '무생채',
      description: '아삭하고 시원한 무생채입니다.',
      difficulty: 1,
      cookingTimeMinutes: 10,
      servings: 4,
      ingredients: [
        { ingredient_name: '무', quantity: '300', unit: 'g', category: '채소' },
        { ingredient_name: '식초', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '설탕', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '소금', quantity: '0.5', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '무를 채썰어 준비합니다.',
        '소금에 절여 물기를 뺍니다.',
        '식초와 설탕으로 양념장을 만듭니다.',
        '무에 양념장을 넣고 무칩니다.',
        '완성합니다.',
      ],
    },
    // 조림류
    '계란찜': {
      title: '계란찜',
      description: '부드럽고 고소한 계란찜입니다.',
      difficulty: 1,
      cookingTimeMinutes: 10,
      servings: 4,
      ingredients: [
        { ingredient_name: '달걀', quantity: '4', unit: '개', category: '유제품' },
        { ingredient_name: '대파', quantity: '0.5', unit: '대', category: '채소' },
        { ingredient_name: '물', quantity: '50', unit: 'ml', category: '기타' },
        { ingredient_name: '소금', quantity: '0.5', unit: '작은술', category: '조미료' },
        { ingredient_name: '식용유', quantity: '1', unit: '큰술', category: '조미료' },
      ],
      steps: [
        '달걀을 풀어 준비합니다.',
        '대파를 다져 넣습니다.',
        '물과 소금을 넣고 섞습니다.',
        '팬에 기름을 두르고 달걀물을 부어줍니다.',
        '약한 불에서 익혀 완성합니다.',
      ],
    },
    '감자조림': {
      title: '감자조림',
      description: '달콤하고 부드러운 감자조림입니다.',
      difficulty: 2,
      cookingTimeMinutes: 20,
      servings: 4,
      ingredients: [
        { ingredient_name: '감자', quantity: '3', unit: '개', category: '채소' },
        { ingredient_name: '간장', quantity: '2', unit: '큰술', category: '조미료' },
        { ingredient_name: '설탕', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '물', quantity: '100', unit: 'ml', category: '기타' },
        { ingredient_name: '식용유', quantity: '1', unit: '큰술', category: '조미료' },
      ],
      steps: [
        '감자를 적당한 크기로 썹니다.',
        '팬에 기름을 두르고 감자를 볶습니다.',
        '간장과 설탕을 넣고 볶습니다.',
        '물을 넣고 끓입니다.',
        '감자가 익고 국물이 졸아들면 완성합니다.',
      ],
    },
    '두부조림': {
      title: '두부조림',
      description: '부드럽고 고소한 두부조림입니다.',
      difficulty: 2,
      cookingTimeMinutes: 15,
      servings: 4,
      ingredients: [
        { ingredient_name: '두부', quantity: '1', unit: '모', category: '채소' },
        { ingredient_name: '간장', quantity: '2', unit: '큰술', category: '조미료' },
        { ingredient_name: '설탕', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '마늘', quantity: '2', unit: '쪽', category: '조미료' },
        { ingredient_name: '대파', quantity: '0.5', unit: '대', category: '채소' },
        { ingredient_name: '식용유', quantity: '1', unit: '큰술', category: '조미료' },
      ],
      steps: [
        '두부를 적당한 크기로 썹니다.',
        '팬에 기름을 두르고 두부를 볶습니다.',
        '간장과 설탕을 넣고 볶습니다.',
        '다진 마늘과 대파를 넣습니다.',
        '완성합니다.',
      ],
    },
    // 밥류
    '현미밥': {
      title: '현미밥',
      description: '고소하고 영양이 풍부한 현미밥입니다.',
      difficulty: 1,
      cookingTimeMinutes: 50,
      servings: 4,
      ingredients: [
        { ingredient_name: '현미', quantity: '2', unit: '컵', category: '곡물' },
        { ingredient_name: '물', quantity: '2.5', unit: '컵', category: '기타' },
      ],
      steps: [
        '현미를 깨끗이 씻어 준비합니다.',
        '물에 30분 이상 불립니다.',
        '압력밥솥이나 전기밥솥에 넣고 밥을 짓습니다.',
        '완성합니다.',
      ],
    },
    '잡곡밥': {
      title: '잡곡밥',
      description: '영양이 풍부한 잡곡밥입니다.',
      difficulty: 1,
      cookingTimeMinutes: 50,
      servings: 4,
      ingredients: [
        { ingredient_name: '쌀', quantity: '1.5', unit: '컵', category: '곡물' },
        { ingredient_name: '보리', quantity: '0.3', unit: '컵', category: '곡물' },
        { ingredient_name: '현미', quantity: '0.2', unit: '컵', category: '곡물' },
        { ingredient_name: '물', quantity: '2', unit: '컵', category: '기타' },
      ],
      steps: [
        '쌀과 잡곡을 깨끗이 씻어 준비합니다.',
        '물에 30분 이상 불립니다.',
        '압력밥솥이나 전기밥솥에 넣고 밥을 짓습니다.',
        '완성합니다.',
      ],
    },
    '흰쌀밥': {
      title: '흰쌀밥',
      description: '부드럽고 고소한 흰쌀밥입니다.',
      difficulty: 1,
      cookingTimeMinutes: 40,
      servings: 4,
      ingredients: [
        { ingredient_name: '쌀', quantity: '2', unit: '컵', category: '곡물' },
        { ingredient_name: '물', quantity: '2', unit: '컵', category: '기타' },
      ],
      steps: [
        '쌀을 깨끗이 씻어 준비합니다.',
        '물에 30분 이상 불립니다.',
        '압력밥솥이나 전기밥솥에 넣고 밥을 짓습니다.',
        '완성합니다.',
      ],
    },
    // 과일류 (간단한 설명으로 처리)
    '오징어': {
      title: '오징어',
      description: '신선한 오징어입니다.',
      difficulty: 1,
      cookingTimeMinutes: 5,
      servings: 2,
      ingredients: [
        { ingredient_name: '오징어', quantity: '1', unit: '마리', category: '해산물' },
      ],
      steps: [
        '오징어를 깨끗이 씻어 준비합니다.',
        '적당한 크기로 썹니다.',
        '완성합니다.',
      ],
    },
    '아이스크림': {
      title: '아이스크림',
      description: '시원하고 달콤한 아이스크림입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '아이스크림', quantity: '1', unit: '컵', category: '기타' },
      ],
      steps: [
        '아이스크림을 그릇에 담습니다.',
        '완성합니다.',
      ],
    },
    '홍시': {
      title: '홍시',
      description: '달콤하고 부드러운 홍시입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '홍시', quantity: '1', unit: '개', category: '과일' },
      ],
      steps: [
        '홍시를 깨끗이 씻어 준비합니다.',
        '껍질을 벗겨 먹습니다.',
        '완성합니다.',
      ],
    },
    '감': {
      title: '감',
      description: '달콤하고 부드러운 감입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '감', quantity: '1', unit: '개', category: '과일' },
      ],
      steps: [
        '감을 깨끗이 씻어 준비합니다.',
        '껍질을 벗겨 먹습니다.',
        '완성합니다.',
      ],
    },
    '참나물': {
      title: '참나물',
      description: '향긋하고 부드러운 참나물입니다.',
      difficulty: 1,
      cookingTimeMinutes: 5,
      servings: 4,
      ingredients: [
        { ingredient_name: '참나물', quantity: '200', unit: 'g', category: '채소' },
        { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '소금', quantity: '0.5', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '참나물을 깨끗이 씻어 준비합니다.',
        '참기름과 소금으로 양념합니다.',
        '완성합니다.',
      ],
    },
    '쑥갓나물': {
      title: '쑥갓나물',
      description: '향긋하고 부드러운 쑥갓나물입니다.',
      difficulty: 1,
      cookingTimeMinutes: 5,
      servings: 4,
      ingredients: [
        { ingredient_name: '쑥갓', quantity: '200', unit: 'g', category: '채소' },
        { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
        { ingredient_name: '소금', quantity: '0.5', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '쑥갓을 깨끗이 씻어 준비합니다.',
        '참기름과 소금으로 양념합니다.',
        '완성합니다.',
      ],
    },
    '도라지나물': {
      title: '도라지나물',
      description: '쓴맛이 나는 도라지나물입니다.',
      difficulty: 2,
      cookingTimeMinutes: 15,
      servings: 4,
      ingredients: [
        { ingredient_name: '도라지', quantity: '200', unit: 'g', category: '채소' },
        { ingredient_name: '소금', quantity: '1', unit: '작은술', category: '조미료' },
        { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      ],
      steps: [
        '도라지를 깨끗이 씻어 소금에 절입니다.',
        '절인 도라지를 헹구어 물기를 뺍니다.',
        '참기름으로 양념합니다.',
        '완성합니다.',
      ],
    },
    '대추': {
      title: '대추',
      description: '달콤하고 부드러운 대추입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '대추', quantity: '10', unit: '개', category: '과일' },
      ],
      steps: [
        '대추를 깨끗이 씻어 준비합니다.',
        '씨를 제거하고 먹습니다.',
        '완성합니다.',
      ],
    },
    '무화과': {
      title: '무화과',
      description: '달콤하고 부드러운 무화과입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '무화과', quantity: '2', unit: '개', category: '과일' },
      ],
      steps: [
        '무화과를 깨끗이 씻어 준비합니다.',
        '껍질을 벗겨 먹습니다.',
        '완성합니다.',
      ],
    },
    '자두': {
      title: '자두',
      description: '달콤하고 새콤한 자두입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '자두', quantity: '3', unit: '개', category: '과일' },
      ],
      steps: [
        '자두를 깨끗이 씻어 준비합니다.',
        '껍질을 벗겨 먹습니다.',
        '완성합니다.',
      ],
    },
    '살구': {
      title: '살구',
      description: '달콤하고 부드러운 살구입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '살구', quantity: '3', unit: '개', category: '과일' },
      ],
      steps: [
        '살구를 깨끗이 씻어 준비합니다.',
        '껍질을 벗겨 먹습니다.',
        '완성합니다.',
      ],
    },
    '크랜베리': {
      title: '크랜베리',
      description: '새콤달콤한 크랜베리입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '크랜베리', quantity: '100', unit: 'g', category: '과일' },
      ],
      steps: [
        '크랜베리를 깨끗이 씻어 준비합니다.',
        '먹습니다.',
        '완성합니다.',
      ],
    },
    '블랙베리': {
      title: '블랙베리',
      description: '달콤하고 새콤한 블랙베리입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '블랙베리', quantity: '100', unit: 'g', category: '과일' },
      ],
      steps: [
        '블랙베리를 깨끗이 씻어 준비합니다.',
        '먹습니다.',
        '완성합니다.',
      ],
    },
    '망고': {
      title: '망고',
      description: '달콤하고 부드러운 망고입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '망고', quantity: '1', unit: '개', category: '과일' },
      ],
      steps: [
        '망고를 깨끗이 씻어 준비합니다.',
        '껍질을 벗겨 먹습니다.',
        '완성합니다.',
      ],
    },
    '라즈베리': {
      title: '라즈베리',
      description: '달콤하고 새콤한 라즈베리입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '라즈베리', quantity: '100', unit: 'g', category: '과일' },
      ],
      steps: [
        '라즈베리를 깨끗이 씻어 준비합니다.',
        '먹습니다.',
        '완성합니다.',
      ],
    },
    '도토리묵': {
      title: '도토리묵',
      description: '부드럽고 고소한 도토리묵입니다.',
      difficulty: 3,
      cookingTimeMinutes: 60,
      servings: 4,
      ingredients: [
        { ingredient_name: '도토리묵가루', quantity: '100', unit: 'g', category: '곡물' },
        { ingredient_name: '물', quantity: '500', unit: 'ml', category: '기타' },
        { ingredient_name: '소금', quantity: '0.5', unit: '작은술', category: '조미료' },
      ],
      steps: [
        '도토리묵가루를 물에 풀어줍니다.',
        '팬에 넣고 끓입니다.',
        '끓으면 약한 불에서 저어가며 익힙니다.',
        '완전히 익으면 그릇에 담아 식힙니다.',
        '완성합니다.',
      ],
    },
    '블루베리': {
      title: '블루베리',
      description: '달콤하고 새콤한 블루베리입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '블루베리', quantity: '100', unit: 'g', category: '과일' },
      ],
      steps: [
        '블루베리를 깨끗이 씻어 준비합니다.',
        '먹습니다.',
        '완성합니다.',
      ],
    },
    '파인애플': {
      title: '파인애플',
      description: '달콤하고 시원한 파인애플입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '파인애플', quantity: '1', unit: '개', category: '과일' },
      ],
      steps: [
        '파인애플을 깨끗이 씻어 준비합니다.',
        '껍질을 벗겨 먹습니다.',
        '완성합니다.',
      ],
    },
    '자몽': {
      title: '자몽',
      description: '새콤달콤한 자몽입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '자몽', quantity: '1', unit: '개', category: '과일' },
      ],
      steps: [
        '자몽을 깨끗이 씻어 준비합니다.',
        '껍질을 벗겨 먹습니다.',
        '완성합니다.',
      ],
    },
    '레몬': {
      title: '레몬',
      description: '새콤한 레몬입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '레몬', quantity: '1', unit: '개', category: '과일' },
      ],
      steps: [
        '레몬을 깨끗이 씻어 준비합니다.',
        '껍질을 벗겨 먹거나 즙을 짜서 사용합니다.',
        '완성합니다.',
      ],
    },
    '귤': {
      title: '귤',
      description: '달콤하고 새콤한 귤입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '귤', quantity: '3', unit: '개', category: '과일' },
      ],
      steps: [
        '귤을 깨끗이 씻어 준비합니다.',
        '껍질을 벗겨 먹습니다.',
        '완성합니다.',
      ],
    },
    '오렌지': {
      title: '오렌지',
      description: '달콤하고 시원한 오렌지입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '오렌지', quantity: '1', unit: '개', category: '과일' },
      ],
      steps: [
        '오렌지를 깨끗이 씻어 준비합니다.',
        '껍질을 벗겨 먹습니다.',
        '완성합니다.',
      ],
    },
    '체리': {
      title: '체리',
      description: '달콤하고 새콤한 체리입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '체리', quantity: '200', unit: 'g', category: '과일' },
      ],
      steps: [
        '체리를 깨끗이 씻어 준비합니다.',
        '씨를 제거하고 먹습니다.',
        '완성합니다.',
      ],
    },
    '멜론': {
      title: '멜론',
      description: '달콤하고 시원한 멜론입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '멜론', quantity: '1', unit: '개', category: '과일' },
      ],
      steps: [
        '멜론을 깨끗이 씻어 준비합니다.',
        '껍질을 벗겨 먹습니다.',
        '완성합니다.',
      ],
    },
    '키위': {
      title: '키위',
      description: '새콤달콤한 키위입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '키위', quantity: '2', unit: '개', category: '과일' },
      ],
      steps: [
        '키위를 깨끗이 씻어 준비합니다.',
        '껍질을 벗겨 먹습니다.',
        '완성합니다.',
      ],
    },
    '딸기': {
      title: '딸기',
      description: '달콤하고 새콤한 딸기입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '딸기', quantity: '200', unit: 'g', category: '과일' },
      ],
      steps: [
        '딸기를 깨끗이 씻어 준비합니다.',
        '먹습니다.',
        '완성합니다.',
      ],
    },
    '포도': {
      title: '포도',
      description: '달콤하고 시원한 포도입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '포도', quantity: '200', unit: 'g', category: '과일' },
      ],
      steps: [
        '포도를 깨끗이 씻어 준비합니다.',
        '먹습니다.',
        '완성합니다.',
      ],
    },
    '복숭아': {
      title: '복숭아',
      description: '달콤하고 부드러운 복숭아입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '복숭아', quantity: '2', unit: '개', category: '과일' },
      ],
      steps: [
        '복숭아를 깨끗이 씻어 준비합니다.',
        '껍질을 벗겨 먹습니다.',
        '완성합니다.',
      ],
    },
    '옥수수': {
      title: '옥수수',
      description: '달콤하고 고소한 옥수수입니다.',
      difficulty: 1,
      cookingTimeMinutes: 15,
      servings: 1,
      ingredients: [
        { ingredient_name: '옥수수', quantity: '1', unit: '개', category: '곡물' },
      ],
      steps: [
        '옥수수를 깨끗이 씻어 준비합니다.',
        '끓는 물에 삶거나 찜기에 쪄 익힙니다.',
        '완성합니다.',
      ],
    },
    '수박': {
      title: '수박',
      description: '달콤하고 시원한 수박입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '수박', quantity: '1', unit: '개', category: '과일' },
      ],
      steps: [
        '수박을 깨끗이 씻어 준비합니다.',
        '적당한 크기로 잘라 먹습니다.',
        '완성합니다.',
      ],
    },
    '바나나': {
      title: '바나나',
      description: '달콤하고 부드러운 바나나입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '바나나', quantity: '1', unit: '개', category: '과일' },
      ],
      steps: [
        '바나나를 깨끗이 씻어 준비합니다.',
        '껍질을 벗겨 먹습니다.',
        '완성합니다.',
      ],
    },
    '사과': {
      title: '사과',
      description: '아삭하고 달콤한 사과입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '사과', quantity: '1', unit: '개', category: '과일' },
      ],
      steps: [
        '사과를 깨끗이 씻어 준비합니다.',
        '껍질을 벗겨 먹습니다.',
        '완성합니다.',
      ],
    },
    '배': {
      title: '배',
      description: '아삭하고 달콤한 배입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '배', quantity: '1', unit: '개', category: '과일' },
      ],
      steps: [
        '배를 깨끗이 씻어 준비합니다.',
        '껍질을 벗겨 먹습니다.',
        '완성합니다.',
      ],
    },
    '유자': {
      title: '유자',
      description: '향긋하고 새콤한 유자입니다.',
      difficulty: 1,
      cookingTimeMinutes: 0,
      servings: 1,
      ingredients: [
        { ingredient_name: '유자', quantity: '2', unit: '개', category: '과일' },
      ],
      steps: [
        '유자를 깨끗이 씻어 준비합니다.',
        '껍질을 벗겨 먹거나 즙을 짜서 사용합니다.',
        '완성합니다.',
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

