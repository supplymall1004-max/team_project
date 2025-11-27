import { describe, expect, it } from "vitest";
import { scaleNutritionTotals, EMPTY_NUTRITION_TOTALS } from "@/lib/diet/nutrition-totals";

describe("scaleNutritionTotals", () => {
  it("scales nutrition values by multiplier", () => {
    const totals = {
      calories: 640,
      carbohydrates: 75.2,
      protein: 32.5,
      fat: 18.1,
      sodium: 540,
    };

    const result = scaleNutritionTotals(totals, 3);

    expect(result).toEqual({
      calories: 1920,
      carbohydrates: 225.6,
      protein: 97.5,
      fat: 54.3,
      sodium: 1620,
    });
  });

  it("returns zeros when totals are undefined or multiplier invalid", () => {
    const result = scaleNutritionTotals(undefined, Number.NaN);
    expect(result).toEqual(EMPTY_NUTRITION_TOTALS);
  });

  it("handles zero multiplier by returning zeroed nutrients", () => {
    const totals = {
      calories: 500,
      carbohydrates: 50,
      protein: 20,
      fat: 10,
      sodium: null,
    };

    const result = scaleNutritionTotals(totals, 0);

    expect(result).toEqual({
      calories: 0,
      carbohydrates: 0,
      protein: 0,
      fat: 0,
      sodium: null,
    });
  });
});


