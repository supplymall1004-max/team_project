/**
 * @file lib/diet/family-meal-utils.ts
 * @description 가족 구성원 식단 관련 유틸리티 함수
 *
 * 식단 상세페이지에서 가족 구성원의 식단을 조회하고 변환하는 공통 로직
 */

import type { FamilyMember } from '@/types/family';

export interface MealData {
  id: string;
  name: string;
  calories: number;
  nutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    cholesterol: number;
  };
  ingredients: Array<{
    name: string;
    quantity: number;
  }>;
  relatedRecipes?: any[];
}

/**
 * 가족 구성원의 특정 식사(아침/점심/저녁) 식단 데이터를 가져옵니다.
 */
export function getMemberMealData(
  familyDietData: Record<string, any> | null,
  memberId: string,
  mealType: 'breakfast' | 'lunch' | 'dinner',
  date: string
): MealData | null {
  if (!familyDietData || !familyDietData[memberId]) return null;
  
  const memberPlans = familyDietData[memberId];
  const mealPlans = memberPlans[mealType];
  
  if (!mealPlans || !Array.isArray(mealPlans) || mealPlans.length === 0) {
    return null;
  }

  // 첫 번째 식단 사용 (여러 개인 경우 합산도 가능하지만 일단 첫 번째만)
  const plan = mealPlans[0];
  
  return {
    id: plan.recipe_id || `${mealType}-${date}-${memberId}`,
    name: plan.title || `${mealType === 'breakfast' ? '아침' : mealType === 'lunch' ? '점심' : '저녁'} 식단`,
    calories: plan.nutrition?.calories || 0,
    nutrition: {
      calories: plan.nutrition?.calories || 0,
      protein: plan.nutrition?.protein || 0,
      carbohydrates: plan.nutrition?.carbohydrates || plan.nutrition?.carbs || 0,
      fat: plan.nutrition?.fat || 0,
      fiber: 0,
      sugar: 0,
      sodium: plan.nutrition?.sodium || 0,
      cholesterol: 0,
    },
    ingredients: Array.isArray(plan.ingredients) 
      ? plan.ingredients.map((ing: any) => ({
          name: typeof ing === 'string' ? ing : ing.name || '',
          quantity: typeof ing === 'object' && ing.quantity ? ing.quantity : 0,
        }))
      : [],
    relatedRecipes: [],
  };
}

/**
 * 탭에 표시할 구성원 목록을 생성합니다 (식단 on 상태인 구성원 모두 포함).
 * 식단 데이터가 없는 구성원도 포함되며, hasMeal 속성으로 식단 데이터 유무를 표시합니다.
 * 
 * @param familyMembers - 가족 구성원 목록
 * @param familyDietData - 가족 식단 데이터
 * @param mealType - 식사 유형 (breakfast, lunch, dinner)
 * @param date - 날짜
 * @param userName - 사용자 이름
 * @returns 탭에 표시할 구성원 목록 (식단 on 상태인 구성원 모두 포함, hasMeal로 데이터 유무 표시)
 */
export function getTabMembers(
  familyMembers: FamilyMember[],
  familyDietData: Record<string, any> | null,
  mealType: 'breakfast' | 'lunch' | 'dinner',
  date: string,
  userName: string
): Array<{ id: string; name: string; isUser: boolean; hasMeal: boolean }> {
  console.group('[getTabMembers] 탭 구성원 필터링');
  console.log('전체 가족 구성원 수:', familyMembers.length);
  
  // 반려동물 제외 (member_type이 'pet'인 경우 제외)
  const humanMembers = familyMembers.filter(member => {
    const isPet = (member as any).member_type === 'pet';
    if (isPet) {
      console.log(`- ${member.name}: 반려동물이므로 제외`);
    }
    return !isPet;
  });
  
  console.log('반려동물 제외 후 구성원 수:', humanMembers.length);
  
  // 식단 on 상태인 구성원만 필터링 (include_in_unified_diet !== false)
  const dietOnMembers = humanMembers.filter(member => {
    const isDietOn = member.include_in_unified_diet !== false; // null/undefined도 true로 처리
    console.log(`- ${member.name}: 식단 on=${isDietOn}, include_in_unified_diet=${member.include_in_unified_diet}`);
    return isDietOn;
  });
  
  console.log('식단 on 상태인 구성원 수:', dietOnMembers.length);
  
  // 식단 on 상태인 구성원은 모두 포함 (식단 데이터 유무와 관계없이)
  // 식단 데이터가 있는지 확인하여 hasMeal 속성에 표시
  const membersWithMealInfo = dietOnMembers.map(member => {
    const memberMeal = getMemberMealData(familyDietData, member.id, mealType, date);
    const hasMeal = memberMeal !== null;
    console.log(`- ${member.name}: 식단 데이터 있음=${hasMeal}`);
    return {
      id: member.id,
      name: member.name,
      isUser: false,
      hasMeal,
    };
  });
  
  console.log('식단 on 상태인 구성원 수 (탭 표시):', membersWithMealInfo.length);
  console.groupEnd();
  
  return [
    { id: 'self', name: userName, isUser: true, hasMeal: true },
    ...membersWithMealInfo,
  ];
}
