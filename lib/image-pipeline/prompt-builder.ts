/**
 * @file prompt-builder.ts
 * @description 음식명과 카테고리를 기반으로 Gemini 이미지 생성 프롬프트를 생성합니다.
 */

import type { FoodCategory } from "@/types/food-image-pipeline";

export interface FoodRecordForPrompt {
  id: string;
  name: string;
  category: FoodCategory;
  seasonality: string | null;
}

import {
  BACKDROP_LIBRARY,
  CATEGORY_INGREDIENT_FOCUS,
  CATEGORY_TEMPLATES,
  CATEGORY_VESSELS,
  NEGATIVE_PROMPTS,
  PromptComponent,
  STYLE_LIBRARY,
  TECHNIQUE_LIBRARY
} from "./prompt-library";

export interface PromptBuildOptions {
  count?: number;
  includeNegativePrompt?: boolean;
  seasonHint?: string | null;
}

export interface BuiltPrompt {
  id: string;
  prompt: string;
  negativePrompt?: string;
  metadata: {
    category: FoodCategory;
    templateId: string;
    styleId: string;
    backdropId: string;
    techniqueId: string;
    seasonality?: string | null;
  };
}

const DEFAULT_COUNT = 3;

const ROMANIZATION_OVERRIDES: Record<string, string> = {
  김치찌개: "Kimchi Jjigae",
  된장찌개: "Doenjang Jjigae",
  순두부찌개: "Sundubu Jjigae",
  미역국: "Miyeok-guk",
  갈비탕: "Galbitang",
  오징어국: "Ojing-eo Guk",
  멸치볶음: "Myeolchi Bokkeum",
  쌀밥: "Ssambap",
  밥: "Bap",
  비빔밥: "Bibimbap"
};

function getRomanizedName(foodName: string): string {
  return ROMANIZATION_OVERRIDES[foodName] ?? `Korean ${foodName}`;
}

function hashSeed(value: string): number {
  return value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function selectComponent(
  components: PromptComponent[],
  category: FoodCategory,
  seed: number,
  offset: number
): PromptComponent {
  const matching = components.filter(component => {
    if (!component.categories || component.categories.length === 0) return true;
    return component.categories.includes(category);
  });

  const pool = matching.length > 0 ? matching : components;
  const index = Math.abs(seed + offset) % pool.length;
  return pool[index];
}

function selectTemplate(category: FoodCategory) {
  const template =
    CATEGORY_TEMPLATES.find(entry => entry.categories.includes(category)) ??
    CATEGORY_TEMPLATES.find(entry => entry.id === "default-main");
  return template ?? CATEGORY_TEMPLATES[0];
}

function buildPromptText(params: {
  template: ReturnType<typeof selectTemplate>;
  foodName: string;
  romanizedName: string;
  category: FoodCategory;
  seasonality?: string | null;
  style: PromptComponent;
  backdrop: PromptComponent;
  technique: PromptComponent;
  iteration: number;
}): string {
  const vesselOptions = CATEGORY_VESSELS[params.category] ?? CATEGORY_VESSELS.default;
  const ingredientOptions = CATEGORY_INGREDIENT_FOCUS[params.category] ?? CATEGORY_INGREDIENT_FOCUS.default;

  const vessel = vesselOptions[params.iteration % vesselOptions.length];
  const ingredientFocus = ingredientOptions[params.iteration % ingredientOptions.length];

  const replacements: Record<string, string> = {
    foodName: params.foodName,
    romanizedName: params.romanizedName,
    vessel,
    ingredientFocus
  };

  const english = renderTemplate(params.template.english, replacements);
  const korean = renderTemplate(params.template.korean, replacements);

  const seasonSnippet = params.seasonality && params.seasonality !== "all" ? `Seasonal cue: ${params.seasonality}. ` : "";

  return [
    `${english} ${params.style.text}. ${params.backdrop.text}. ${params.technique.text}.`,
    seasonSnippet + korean
  ]
    .map(str => str.trim())
    .join("\n\n");
}

function renderTemplate(template: string, replacements: Record<string, string>): string {
  return Object.entries(replacements).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value),
    template
  );
}

export function buildPrompts(food: FoodRecordForPrompt, options?: PromptBuildOptions): BuiltPrompt[] {
  const count = options?.count ?? DEFAULT_COUNT;
  const seasonality = options?.seasonHint ?? food.seasonality ?? null;
  const romanizedName = getRomanizedName(food.name);
  const template = selectTemplate(food.category);
  const seed = hashSeed(food.id || food.name);

  return Array.from({ length: count }).map((_, index) => {
    const style = selectComponent(STYLE_LIBRARY, food.category, seed, index);
    const backdrop = selectComponent(BACKDROP_LIBRARY, food.category, seed, index + 7);
    const technique = selectComponent(TECHNIQUE_LIBRARY, food.category, seed, index + 13);

    const promptText = buildPromptText({
      template,
      foodName: food.name,
      romanizedName,
      category: food.category,
      seasonality,
      style,
      backdrop,
      technique,
      iteration: index
    });

    const negative =
      options?.includeNegativePrompt === false
        ? undefined
        : NEGATIVE_PROMPTS.join(", ");

    return {
      id: `${food.id}-${index}`,
      prompt: promptText,
      negativePrompt: negative,
      metadata: {
        category: food.category,
        templateId: template.id,
        styleId: style.id,
        backdropId: backdrop.id,
        techniqueId: technique.id,
        seasonality
      }
    };
  });
}

