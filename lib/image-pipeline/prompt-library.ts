/**
 * @file prompt-library.ts
 * @description Structured prompt snippets extracted from `docs/foodprompt.md`.
 *
 * 프롬프트는 4가지 요소(메인 음식, 스타일/분위기, 배경/소품, 기술적 요소)를
 * 조합하도록 설계되어 있으며, 카테고리/계절별 우선순위를 포함합니다.
 */

import type { FoodCategory } from "@/types/food-image-pipeline";

export interface PromptComponent {
  id: string;
  text: string;
  weight?: number;
  categories?: FoodCategory[];
  seasons?: Array<string | "all">;
}

export interface PromptTemplate {
  id: string;
  categories: FoodCategory[];
  english: string;
  korean: string;
}

export const CATEGORY_TEMPLATES: PromptTemplate[] = [
  {
    id: "kimchi-stew",
    categories: ["soup_stew"],
    english:
      "Authentic Korean {{romanizedName}} bubbling in a {{vessel}}, {{ingredientFocus}}. Warm restaurant lighting, steam gently rising, appetizing close-up.",
    korean:
      "정통 {{foodName}}가 {{vessel}}에서 보글보글 끓고 있으며, {{ingredientFocus}}가 선명하게 보인다. 따뜻한 조명과 김이 어우러진 먹음직스러운 클로즈업."
  },
  {
    id: "doenjang-stew",
    categories: ["soup_stew"],
    english:
      "Hearty Korean {{romanizedName}} served in a {{vessel}}, packed with {{ingredientFocus}} inside a savory broth. Clean presentation suited for a nutrition plan.",
    korean:
      "구수한 {{foodName}}가 {{vessel}}에 담겨 있으며, {{ingredientFocus}}가 들어간 국물이 식단표에 어울리도록 깔끔하게 표현되어 있다."
  },
  {
    id: "side-dish",
    categories: ["side_dish", "snack"],
    english:
      "A neatly plated portion of {{romanizedName}} presented in a small ceramic dish, glossy texture emphasized for a professional food photo.",
    korean:
      "작은 도자기 접시에 담긴 깔끔한 {{foodName}}, 윤기 나는 질감을 강조한 전문 음식 사진."
  },
  {
    id: "default-main",
    categories: ["main", "dessert", "drink", "other"],
    english:
      "{{romanizedName}} styled for a nutritionist's meal plan, balanced composition highlighting freshness and detail.",
    korean:
      "영양사 식단표를 위한 {{foodName}} 연출, 신선함과 디테일을 균형 있게 강조."
  }
];

export const STYLE_LIBRARY: PromptComponent[] = [
  {
    id: "warm-light",
    text: "warm restaurant lighting with natural daylight highlights",
    weight: 3,
    categories: ["soup_stew", "main"]
  },
  {
    id: "studio-clean",
    text: "bright studio lighting with soft shadows, clinical and clean",
    weight: 2,
    categories: ["side_dish", "snack", "dessert"]
  },
  {
    id: "rustic-wood",
    text: "cozy rustic mood with gentle sunlight and muted tones",
    categories: ["soup_stew", "main", "other"]
  }
];

export const BACKDROP_LIBRARY: PromptComponent[] = [
  {
    id: "dark-wood-table",
    text: "placed on a dark wooden table with subtle steam visible",
    categories: ["soup_stew"]
  },
  {
    id: "white-ceramic",
    text: "served on a minimalist white ceramic plate over a linen cloth",
    categories: ["side_dish", "dessert", "snack"]
  },
  {
    id: "nutrition-board",
    text: "styled on a clean nutrition board with measuring spoons nearby",
    categories: ["main", "other"]
  }
];

export const TECHNIQUE_LIBRARY: PromptComponent[] = [
  {
    id: "macro-shot",
    text: "macro shot, shallow depth of field, professional DSLR quality",
    weight: 2
  },
  {
    id: "top-down",
    text: "top-down view, even lighting, high resolution detail",
    categories: ["side_dish", "snack"]
  },
  {
    id: "hero-angle",
    text: "45-degree hero angle, 4K resolution, gentle focus falloff"
  }
];

export const NEGATIVE_PROMPTS: string[] = [
  "ugly, blurry, messy, low quality, bad composition",
  "oversaturated colors, distorted shapes, noisy background"
];

export const CATEGORY_VESSELS: Record<FoodCategory | "default", string[]> = {
  soup_stew: ["black stone pot", "traditional Korean earthenware bowl"],
  side_dish: ["small white ceramic dish", "minimal porcelain bowl"],
  main: ["wide ceramic bowl", "modern matte plate"],
  dessert: ["glass dessert bowl", "white porcelain plate"],
  drink: ["taller glass cup", "double-wall glass mug"],
  snack: ["small plate", "bamboo tray"],
  other: ["neutral ceramic plate"],
  default: ["white ceramic plate"]
};

export const CATEGORY_INGREDIENT_FOCUS: Record<FoodCategory | "default", string[]> = {
  soup_stew: ["aged kimchi, tofu, pork belly, and scallions", "tofu cubes with zucchini, mushrooms, and clams"],
  side_dish: ["glossy anchovies with peppers and sesame seeds", "vivid vegetables with sesame oil sheen"],
  main: ["seasonal vegetables and protein arranged neatly", "balanced grains and colorful garnishes"],
  dessert: ["fresh fruits with subtle syrup", "delicate garnishes and powdered sugar"],
  drink: ["condensation on the glass with herbal garnish", "steaming cup with latte art"],
  snack: ["crunchy texture emphasized with sesame seeds", "layered ingredients displayed clearly"],
  other: ["fresh herbs and garnishes"],
  default: ["carefully arranged toppings"]
};

