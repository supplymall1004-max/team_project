import { describe, expect, it } from "vitest";

import type { FoodRecord } from "@/types/food-image-pipeline";
import { buildPrompts } from "../prompt-builder";

const soupFood: FoodRecord = {
  id: "food-1",
  name: "김치찌개",
  category: "soup_stew",
  seasonality: "all",
  needs_images: true,
  image_priority: 100,
  last_generated_at: null,
  total_generated_images: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const sideDishFood: FoodRecord = {
  ...soupFood,
  id: "food-2",
  name: "멸치볶음",
  category: "side_dish"
};

describe("buildPrompts", () => {
  it("creates three deterministic prompts for soup/stew foods with bilingual text", () => {
    const prompts = buildPrompts(soupFood, { includeNegativePrompt: true });

    expect(prompts).toHaveLength(3);
    expect(prompts[0].prompt).toContain("Kimchi Jjigae");
    expect(prompts[0].prompt).toContain("김치찌개");
    expect(prompts[0].metadata.category).toBe("soup_stew");
    expect(prompts[0].negativePrompt).toContain("blurry");
  });

  it("switches template when category is side dish and rotates style/backdrop/technique", () => {
    const prompts = buildPrompts(sideDishFood, { count: 2 });

    expect(prompts).toHaveLength(2);
    expect(prompts[0].metadata.category).toBe("side_dish");
    expect(prompts[0].prompt).toContain("Myeolchi Bokkeum");
    expect(prompts[0].prompt).toMatch(/small ceramic dish/i);
    expect(prompts[1].prompt).not.toEqual(prompts[0].prompt);
  });
});

