import { describe, expect, it } from "vitest";

import {
  filterRecipesByExcludedFoods,
  type ExcludedFood,
} from "@/lib/diet/family-recommendation";
import type { RecipeDetailForDiet } from "@/types/recipe";

const sampleRecipe: RecipeDetailForDiet = {
  id: "recipe-1",
  title: "흰쌀밥",
  description: "담백한 흰쌀밥",
  ingredients: [{ name: "흰쌀", amount: "1", unit: "cup" }],
  nutrition: { calories: 210, protein: 4, carbs: 46, fat: 0.5 },
};

const baseExcludedFood: ExcludedFood = {
  id: "excluded-1",
  disease: "diabetes",
  excluded_food_name: "흰쌀",
  excluded_type: "ingredient",
  severity: "moderate",
};

describe("filterRecipesByExcludedFoods", () => {
  it("제외 음식 이름이 없으면 레시피를 제외하지 않는다", () => {
    const brokenEntry: ExcludedFood = {
      ...baseExcludedFood,
      id: "excluded-broken",
      excluded_food_name: undefined as unknown as string,
    };

    const run = () =>
      filterRecipesByExcludedFoods([sampleRecipe], [brokenEntry]);

    expect(run).not.toThrow();
    expect(run()).toHaveLength(1);
  });

  it("정상적인 제외 음식은 레시피를 제외한다", () => {
    const result = filterRecipesByExcludedFoods(
      [sampleRecipe],
      [baseExcludedFood],
    );

    expect(result).toHaveLength(0);
  });
});














