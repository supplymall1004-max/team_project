/**
 * @file lib/diet/adolescent-diet-optimizer.ts
 * @description 성장기 청소년(13-18세) 특별 식단 최적화
 *
 * 주요 기능:
 * 1. 청소년 영양소 목표 계산 (단백질, 칼슘, 철분, 비타민 D)
 * 2. 성장 영양소 우선순위 설정
 * 3. 청소년 맞춤 반찬 추천
 *
 * 영양소 요구사항:
 * - 단백질: 1.2-1.5g/kg 체중
 * - 칼슘: 1300mg/일 (14-18세)
 * - 철분: 남성 11mg, 여성 15mg (14-18세)
 * - 비타민 D: 600IU/일
 *
 * @dependencies
 * - types/recipe.ts: RecipeDetailForDiet, RecipeNutrition
 * - types/health.ts: UserHealthProfile
 */

import type { UserHealthProfile } from "@/types/health";
import type { RecipeDetailForDiet, RecipeNutrition } from "@/types/recipe";

/**
 * 청소년 영양소 목표 계산
 * 
 * @param profile 건강 프로필
 * @returns 청소년 매크로 목표
 */
export function calculateAdolescentMacros(
  profile: UserHealthProfile
): {
  protein: { target: number; min: number; max: number }; // g
  calcium: { target: number; min: number }; // mg
  iron: { target: number; min: number }; // mg
  vitaminD: { target: number; min: number }; // IU
} {
  console.group("🧑‍🎓 청소년 영양소 목표 계산");
  
  const age = profile.age || 15; // 기본값 15세
  const weight = profile.weight_kg || 55; // 기본값 55kg
  const gender = profile.gender || "other";
  
  // 단백질: 1.2-1.5g/kg 체중
  const proteinPerKg = age >= 14 ? 1.5 : 1.2; // 14세 이상은 1.5g/kg
  const proteinTarget = weight * proteinPerKg;
  const proteinMin = weight * 1.2;
  const proteinMax = weight * 1.5;
  
  // 칼슘: 14-18세는 1300mg, 13세는 1000mg
  const calciumTarget = age >= 14 ? 1300 : 1000;
  const calciumMin = age >= 14 ? 1200 : 900;
  
  // 철분: 남성 11mg, 여성 15mg (14-18세)
  // 13세는 남성 8mg, 여성 8mg
  let ironTarget: number;
  let ironMin: number;
  if (age >= 14) {
    ironTarget = gender === "female" ? 15 : 11;
    ironMin = gender === "female" ? 13 : 9;
  } else {
    ironTarget = 8;
    ironMin = 7;
  }
  
  // 비타민 D: 600IU/일
  const vitaminDTarget = 600;
  const vitaminDMin = 400;
  
  console.log(`연령: ${age}세, 체중: ${weight}kg, 성별: ${gender}`);
  console.log(`단백질 목표: ${Math.round(proteinTarget)}g (${Math.round(proteinMin)}-${Math.round(proteinMax)}g)`);
  console.log(`칼슘 목표: ${calciumTarget}mg`);
  console.log(`철분 목표: ${ironTarget}mg`);
  console.log(`비타민 D 목표: ${vitaminDTarget}IU`);
  console.groupEnd();
  
  return {
    protein: {
      target: Math.round(proteinTarget),
      min: Math.round(proteinMin),
      max: Math.round(proteinMax),
    },
    calcium: {
      target: calciumTarget,
      min: calciumMin,
    },
    iron: {
      target: ironTarget,
      min: ironMin,
    },
    vitaminD: {
      target: vitaminDTarget,
      min: vitaminDMin,
    },
  };
}

/**
 * 성장 영양소 우선순위 설정
 * 
 * @param currentNutrition 현재 섭취 영양소
 * @param targetMacros 목표 매크로
 * @returns 우선순위가 높은 영양소 목록 (부족한 순서대로)
 */
export function prioritizeGrowthNutrients(
  currentNutrition: RecipeNutrition,
  targetMacros: ReturnType<typeof calculateAdolescentMacros>
): Array<{
  nutrient: 'protein' | 'calcium' | 'iron' | 'vitaminD';
  priority: number; // 1-10 (높을수록 우선순위 높음)
  gap: number; // 부족량
  description: string;
}> {
  console.group("🔍 성장 영양소 우선순위 분석");
  
  const priorities: Array<{
    nutrient: 'protein' | 'calcium' | 'iron' | 'vitaminD';
    priority: number;
    gap: number;
    description: string;
  }> = [];
  
  // 단백질 부족분
  const proteinGap = Math.max(0, targetMacros.protein.target - (currentNutrition.protein || 0));
  if (proteinGap > 0) {
    const gapRatio = proteinGap / targetMacros.protein.target;
    priorities.push({
      nutrient: 'protein',
      priority: Math.min(10, Math.round(gapRatio * 10)),
      gap: proteinGap,
      description: `단백질 ${Math.round(proteinGap)}g 부족 (성장기 근육 발달 필수)`,
    });
  }
  
  // 칼슘 부족분
  const calciumGap = Math.max(0, targetMacros.calcium.target - (currentNutrition.calcium || 0));
  if (calciumGap > 0) {
    const gapRatio = calciumGap / targetMacros.calcium.target;
    priorities.push({
      nutrient: 'calcium',
      priority: Math.min(10, Math.round(gapRatio * 10)),
      gap: calciumGap,
      description: `칼슘 ${calciumGap}mg 부족 (뼈 성장 필수)`,
    });
  }
  
  // 철분 부족분
  const ironGap = Math.max(0, targetMacros.iron.target - (currentNutrition.iron || 0));
  if (ironGap > 0) {
    const gapRatio = ironGap / targetMacros.iron.target;
    priorities.push({
      nutrient: 'iron',
      priority: Math.min(10, Math.round(gapRatio * 10)),
      gap: ironGap,
      description: `철분 ${ironGap}mg 부족 (혈액 생성 필수)`,
    });
  }
  
  // 비타민 D 부족분
  const vitaminDGap = Math.max(0, targetMacros.vitaminD.target - (currentNutrition.vitaminD || 0));
  if (vitaminDGap > 0) {
    const gapRatio = vitaminDGap / targetMacros.vitaminD.target;
    priorities.push({
      nutrient: 'vitaminD',
      priority: Math.min(10, Math.round(gapRatio * 10)),
      gap: vitaminDGap,
      description: `비타민 D ${vitaminDGap}IU 부족 (칼슘 흡수 촉진)`,
    });
  }
  
  // 우선순위 순으로 정렬
  priorities.sort((a, b) => b.priority - a.priority);
  
  console.log(`✅ ${priorities.length}개의 영양소 우선순위 설정 완료`);
  priorities.forEach(p => {
    console.log(`  ${p.nutrient}: 우선순위 ${p.priority} - ${p.description}`);
  });
  console.groupEnd();
  
  return priorities;
}

/**
 * 청소년 맞춤 반찬 추천
 * 
 * @param priorities 영양소 우선순위
 * @param candidateSides 후보 반찬 목록
 * @param maxResults 최대 결과 수
 * @returns 추천 반찬 목록
 */
export function recommendAdolescentSides(
  priorities: ReturnType<typeof prioritizeGrowthNutrients>,
  candidateSides: RecipeDetailForDiet[],
  maxResults: number = 3
): RecipeDetailForDiet[] {
  console.group("🍽️ 청소년 맞춤 반찬 추천");
  
  if (priorities.length === 0) {
    console.log("⚠️ 우선순위 영양소가 없어 기본 반찬 반환");
    console.groupEnd();
    return candidateSides.slice(0, maxResults);
  }
  
  // 각 반찬의 점수 계산
  const scoredSides = candidateSides.map(side => {
    let totalScore = 0;
    
    for (const priority of priorities) {
      const nutrientValue = getNutrientValue(side.nutrition, priority.nutrient);
      if (nutrientValue > 0) {
        // 부족분을 보완할 수 있는 정도에 따라 점수 부여
        const contribution = Math.min(nutrientValue / priority.gap, 1);
        totalScore += contribution * priority.priority;
      }
    }
    
    return { side, score: totalScore };
  });
  
  // 점수 순으로 정렬
  scoredSides.sort((a, b) => b.score - a.score);
  
  const results = scoredSides.slice(0, maxResults).map(item => item.side);
  
  console.log(`✅ ${results.length}개의 청소년 맞춤 반찬 추천 완료`);
  results.forEach((side, index) => {
    const score = scoredSides[index].score;
    console.log(`  ${index + 1}. ${side.title} (점수: ${score.toFixed(2)})`);
  });
  console.groupEnd();
  
  return results;
}

/**
 * 영양소 값 추출
 */
function getNutrientValue(
  nutrition: RecipeNutrition,
  nutrient: 'protein' | 'calcium' | 'iron' | 'vitaminD'
): number {
  switch (nutrient) {
    case 'protein':
      return nutrition.protein || 0;
    case 'calcium':
      return nutrition.calcium || 0;
    case 'iron':
      return nutrition.iron || 0;
    case 'vitaminD':
      return nutrition.vitaminD || 0;
    default:
      return 0;
  }
}

/**
 * 청소년 성장 영양소 강화 레시피 목록
 * (정적 데이터 - 실제로는 DB에서 조회)
 */
export const ADOLESCENT_NUTRITION_FOCUS_RECIPES: Record<
  'protein' | 'calcium' | 'iron' | 'vitaminD',
  string[]
> = {
  protein: [
    '고등어구이',
    '닭가슴살',
    '두부',
    '계란말이',
    '연어구이',
    '소고기볶음',
    '돼지고기볶음',
  ],
  calcium: [
    '브로콜리나물',
    '우유',
    '치즈',
    '멸치볶음',
    '두부',
    '연어',
    '요구르트',
  ],
  iron: [
    '시금치나물',
    '콩나물무침',
    '소고기볶음',
    '간장게장',
    '멸치볶음',
    '두부',
    '닭고기',
  ],
  vitaminD: [
    '고등어구이',
    '연어구이',
    '계란',
    '우유',
    '버섯',
    '치즈',
  ],
};

/**
 * 영양소 강점별 레시피 추천 (간단한 매핑)
 */
export function getRecipesByNutritionFocus(
  focus: 'protein' | 'calcium' | 'iron' | 'vitaminD'
): string[] {
  return ADOLESCENT_NUTRITION_FOCUS_RECIPES[focus] || [];
}

