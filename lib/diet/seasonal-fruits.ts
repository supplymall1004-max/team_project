/**
 * @file lib/diet/seasonal-fruits.ts
 * @description 제철 과일 데이터베이스 및 추천 로직
 * 
 * 핵심 기능:
 * 1. 11종 과일 데이터 (딸기, 체리, 수박, 복숭아, 멜론, 포도, 배, 사과, 감, 키위, 바나나)
 * 2. 월별 제철 과일 필터링
 * 3. 질병 고려 추천
 * 4. 어린이 우선 추천
 */

export interface FruitNutrition {
  servingSize: string;        // "100g (중간 크기 7개)"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  vitaminC?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
}

export interface Fruit {
  id: string;                  // "strawberry", "banana"
  name: string;                // "딸기", "바나나"
  season: number[];            // [3, 4, 5] = 3월, 4월, 5월
  nutrition: FruitNutrition;
  benefits: string[];          // ["비타민C 풍부", "항산화 효과"]
  goodForKids: boolean;        // 성장기 어린이 추천 여부
  kidsBenefits?: string;       // 어린이에게 좋은 구체적 이유
  availability: "high" | "medium" | "low";  // 시중 구매 용이성
  avoidForDiseases?: string[]; // ["diabetes", "gout"]
  coupangUrl?: string;         // 쿠팡 파트너스 링크 (추후)
  imageUrl?: string;           // 과일 이미지 URL
  emoji: string;               // "🍓", "🍌"
}

// 제철 과일 데이터 (11종)
export const SEASONAL_FRUITS: Fruit[] = [
  {
    id: "strawberry",
    name: "딸기",
    season: [3, 4, 5],
    nutrition: {
      servingSize: "100g (중간 크기 7개)",
      calories: 32,
      protein: 0.7,
      carbs: 7.7,
      fat: 0.3,
      fiber: 2.0,
      vitaminC: 58.8,
      calcium: 16,
      iron: 0.4,
    },
    benefits: ["비타민C 풍부", "항산화 효과", "면역력 강화"],
    goodForKids: true,
    kidsBenefits: "비타민C가 풍부하여 면역력 강화와 피부 건강에 좋고, 철분 흡수를 도와 성장기 어린이에게 이상적입니다.",
    availability: "high",
    avoidForDiseases: [],
    imageUrl: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=1200&h=900&fit=crop&q=80&auto=format",
    emoji: "🍓",
  },
  {
    id: "cherry",
    name: "체리",
    season: [5, 6],
    nutrition: {
      servingSize: "100g (약 10개)",
      calories: 50,
      protein: 1.0,
      carbs: 12.2,
      fat: 0.3,
      fiber: 1.6,
      vitaminC: 7.0,
      potassium: 222,
    },
    benefits: ["항산화 효과", "수면 유도", "염증 완화"],
    goodForKids: true,
    kidsBenefits: "멜라토닌이 풍부하여 수면을 도와주고, 항산화 성분이 성장기 면역력을 키워줍니다.",
    availability: "medium",
    avoidForDiseases: ["diabetes"],
    imageUrl: "https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=1200&h=900&fit=crop&q=80&auto=format",
    emoji: "🍒",
  },
  {
    id: "watermelon",
    name: "수박",
    season: [6, 7, 8],
    nutrition: {
      servingSize: "100g (한 컵)",
      calories: 30,
      protein: 0.6,
      carbs: 7.6,
      fat: 0.2,
      fiber: 0.4,
      vitaminC: 8.1,
      calcium: 7,
    },
    benefits: ["수분 보충", "전해질 균형", "더위 해소"],
    goodForKids: true,
    kidsBenefits: "92%가 수분으로 구성되어 더운 여름철 탈수 예방에 탁월하며, 리코펜이 풍부해 성장기 면역력 강화에 도움을 줍니다.",
    availability: "high",
    avoidForDiseases: ["diabetes"],
    imageUrl: "https://images.unsplash.com/photo-1582284540020-8acbe03f7df6?w=1200&h=900&fit=crop&q=80&auto=format",
    emoji: "🍉",
  },
  {
    id: "peach",
    name: "복숭아",
    season: [7, 8],
    nutrition: {
      servingSize: "100g (중간 크기 1개)",
      calories: 39,
      protein: 0.9,
      carbs: 9.5,
      fat: 0.3,
      fiber: 1.5,
      vitaminC: 6.6,
      potassium: 190,
    },
    benefits: ["소화 촉진", "피부 건강", "면역력 강화"],
    goodForKids: true,
    kidsBenefits: "부드러운 식감과 달콤한 맛으로 어린이가 좋아하며, 비타민A가 풍부해 시력 발달에 도움을 줍니다.",
    availability: "high",
    avoidForDiseases: [],
    imageUrl: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=1200&h=900&fit=crop&q=80&auto=format",
    emoji: "🍑",
  },
  {
    id: "melon",
    name: "멜론",
    season: [6, 7, 8],
    nutrition: {
      servingSize: "100g",
      calories: 34,
      protein: 0.8,
      carbs: 8.2,
      fat: 0.2,
      fiber: 0.9,
      vitaminC: 36.7,
      potassium: 267,
    },
    benefits: ["수분 공급", "비타민C 풍부", "피로 회복"],
    goodForKids: true,
    kidsBenefits: "달콤한 맛과 풍부한 수분으로 어린이가 좋아하며, 칼륨이 풍부해 나트륨 배출에 도움을 줍니다.",
    availability: "high",
    avoidForDiseases: ["diabetes"],
    imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1200&h=900&fit=crop&q=80&auto=format",
    emoji: "🍈",
  },
  {
    id: "grape",
    name: "포도",
    season: [8, 9, 10],
    nutrition: {
      servingSize: "100g (약 15알)",
      calories: 69,
      protein: 0.7,
      carbs: 18.1,
      fat: 0.2,
      fiber: 0.9,
      vitaminC: 3.2,
      potassium: 191,
    },
    benefits: ["항산화 효과", "심혈관 건강", "피로 회복"],
    goodForKids: true,
    kidsBenefits: "작고 먹기 쉬워 어린이가 좋아하며, 포도당이 빠르게 에너지를 공급하여 활동량이 많은 어린이에게 좋습니다.",
    availability: "high",
    avoidForDiseases: ["diabetes"],
    imageUrl: "https://images.unsplash.com/photo-1537640538966-79f36943f303?w=1200&h=900&fit=crop&q=80&auto=format",
    emoji: "🍇",
  },
  {
    id: "pear",
    name: "배",
    season: [9, 10, 11],
    nutrition: {
      servingSize: "100g (중간 크기 1/2개)",
      calories: 57,
      protein: 0.4,
      carbs: 15.2,
      fat: 0.1,
      fiber: 3.1,
      vitaminC: 4.3,
      potassium: 116,
    },
    benefits: ["소화 촉진", "기관지 건강", "수분 공급"],
    goodForKids: true,
    kidsBenefits: "수분과 식이섬유가 풍부하여 소화를 돕고, 기침과 가래 완화에 도움을 주어 환절기 어린이 건강에 좋습니다.",
    availability: "high",
    avoidForDiseases: [],
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&h=900&fit=crop&q=80&auto=format",
    emoji: "🍐",
  },
  {
    id: "apple",
    name: "사과",
    season: [9, 10, 11, 12],
    nutrition: {
      servingSize: "100g (중간 크기 1/2개)",
      calories: 52,
      protein: 0.3,
      carbs: 13.8,
      fat: 0.2,
      fiber: 2.4,
      vitaminC: 4.6,
      potassium: 107,
    },
    benefits: ["소화 촉진", "콜레스테롤 조절", "혈당 안정"],
    goodForKids: true,
    kidsBenefits: "씹는 식감이 좋아 치아 발달에 도움이 되며, 펙틴이 풍부하여 장 건강을 지켜줍니다.",
    availability: "high",
    avoidForDiseases: [],
    imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=1200&h=900&fit=crop&q=80&auto=format",
    emoji: "🍎",
  },
  {
    id: "persimmon",
    name: "감",
    season: [10, 11],
    nutrition: {
      servingSize: "100g (중간 크기 1개)",
      calories: 70,
      protein: 0.6,
      carbs: 18.6,
      fat: 0.2,
      fiber: 3.6,
      vitaminC: 7.5,
      potassium: 161,
    },
    benefits: ["비타민A 풍부", "피로 회복", "면역력 강화"],
    goodForKids: true,
    kidsBenefits: "비타민A가 매우 풍부하여 시력 발달과 성장에 도움이 되며, 달콤한 맛으로 어린이가 좋아합니다.",
    availability: "high",
    avoidForDiseases: ["diabetes"],
    imageUrl: "https://images.unsplash.com/photo-xeuU_50FbYU?w=1200&h=900&fit=crop&q=80&auto=format",
    emoji: "🍊", // 감 이모지가 없어서 대체
  },
  {
    id: "kiwi",
    name: "키위",
    season: [1, 2, 11, 12],
    nutrition: {
      servingSize: "100g (중간 크기 1.5개)",
      calories: 61,
      protein: 1.1,
      carbs: 14.7,
      fat: 0.5,
      fiber: 3.0,
      vitaminC: 92.7,
      potassium: 312,
    },
    benefits: ["비타민C 매우 풍부", "소화 촉진", "면역력 강화"],
    goodForKids: true,
    kidsBenefits: "비타민C 함량이 과일 중 최고 수준으로 면역력 강화에 탁월하며, 소화 효소가 풍부하여 소화를 돕습니다.",
    availability: "high",
    avoidForDiseases: [],
    imageUrl: "https://images.unsplash.com/photo-1585059895524-72359e06133?w=1200&h=900&fit=crop&q=80&auto=format",
    emoji: "🥝",
  },
  {
    id: "banana",
    name: "바나나",
    season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // 연중
    nutrition: {
      servingSize: "1개 (중간 크기 120g)",
      calories: 105,
      protein: 1.3,
      carbs: 27.0,
      fat: 0.4,
      fiber: 3.1,
      vitaminC: 10.3,
      potassium: 422,
    },
    benefits: ["에너지 공급", "소화 개선", "혈압 조절"],
    goodForKids: true,
    kidsBenefits: "탄수화물이 풍부하여 성장기 어린이의 에너지원으로 좋고, 칼륨이 풍부해 나트륨 배출에 도움을 줍니다.",
    availability: "high",
    avoidForDiseases: ["diabetes"],
    imageUrl: "https://images.unsplash.com/photo-1607637025946-45b5c7d7e9b8?w=1200&h=900&fit=crop&q=80&auto=format",
    emoji: "🍌",
  },
];

/**
 * 제철 과일 필터링
 */
export function getSeasonalFruits(month: number): Fruit[] {
  const seasonal = SEASONAL_FRUITS.filter((fruit) =>
    fruit.season.includes(month)
  );

  // 정렬: 어린이 추천 > 구매 용이성
  return seasonal.sort((a, b) => {
    if (a.goodForKids && !b.goodForKids) return -1;
    if (!a.goodForKids && b.goodForKids) return 1;
    
    const availabilityOrder = { high: 0, medium: 1, low: 2 };
    return availabilityOrder[a.availability] - availabilityOrder[b.availability];
  });
}

/**
 * 과일 간식 추천
 * 
 * @param targetCalories - 목표 칼로리 (사용하지 않음, 항상 1회분 추천)
 * @param currentMonth - 현재 월 (1-12)
 * @param isChild - 어린이 여부
 * @param diseases - 질병 목록
 */
export function recommendFruitSnack(
  targetCalories: number,
  currentMonth: number,
  isChild: boolean,
  diseases: string[] = []
): {
  fruit: Fruit;
  servings: number;
  totalCalories: number;
  reason: string;
} {
  console.group("🍎 과일 간식 추천");
  console.log(`현재 월: ${currentMonth}월, 어린이: ${isChild}, 질병: ${diseases.join(", ")}`);

  // 1. 제철 과일 필터링
  let candidateFruits = getSeasonalFruits(currentMonth);
  console.log(`제철 과일: ${candidateFruits.map(f => f.name).join(", ")}`);

  // 2. 질병 기반 필터링
  if (diseases.length > 0) {
    candidateFruits = candidateFruits.filter((fruit) => {
      const shouldAvoid = fruit.avoidForDiseases?.some((disease) =>
        diseases.includes(disease)
      );
      return !shouldAvoid;
    });
    console.log(`질병 필터링 후: ${candidateFruits.map(f => f.name).join(", ")}`);
  }

  // 3. 폴백: 제철 과일이 없으면 바나나 (연중 가능)
  if (candidateFruits.length === 0) {
    console.warn("⚠️ 제철 과일 없음 - 바나나로 폴백");
    const banana = SEASONAL_FRUITS.find((f) => f.id === "banana");
    
    // 바나나도 질병으로 제외되면 딸기로 최종 폴백
    if (banana && banana.avoidForDiseases?.some((d) => diseases.includes(d))) {
      const strawberry = SEASONAL_FRUITS.find((f) => f.id === "strawberry");
      candidateFruits = strawberry ? [strawberry] : [banana];
    } else {
      candidateFruits = banana ? [banana] : [];
    }
  }

  // 최종 선택
  const selectedFruit = candidateFruits[0];

  // 항상 1회분 추천 (칼로리 무관)
  const servings = 1;
  const totalCalories = selectedFruit.nutrition.calories * servings;

  let reason = `${currentMonth}월 제철 과일`;
  if (isChild && selectedFruit.goodForKids) {
    reason += " (성장기 어린이에게 좋음)";
  }
  if (diseases.length > 0) {
    reason += ` (${diseases.join(", ")} 고려)`;
  }

  console.log(`✅ 선택: ${selectedFruit.name} ${servings}회분 (${totalCalories}kcal)`);
  console.groupEnd();

  return {
    fruit: selectedFruit,
    servings,
    totalCalories,
    reason,
  };
}

