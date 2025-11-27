import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearDietPlanCache,
  getCachedDietPlan,
  setCachedDietPlan,
} from "@/lib/cache/diet-plan-cache";
import { DailyDietPlan } from "@/types/health";

const mockDietPlan: DailyDietPlan = {
  date: "2025-11-25",
  breakfast: null,
  lunch: null,
  dinner: null,
  snack: null,
  totalNutrition: {
    calories: 1200,
    carbohydrates: 150,
    protein: 60,
    fat: 40,
    sodium: 800,
  },
};

describe("diet-plan-cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearDietPlanCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores and retrieves diet plan entries", () => {
    setCachedDietPlan("user-1", "2025-11-25", mockDietPlan);

    const cached = getCachedDietPlan("user-1", "2025-11-25");
    expect(cached).not.toBeNull();
    expect(cached?.dietPlan.totalNutrition.calories).toBe(1200);
  });

  it("returns null when entry expired", () => {
    setCachedDietPlan("user-2", "2025-11-25", mockDietPlan, 1);

    expect(getCachedDietPlan("user-2", "2025-11-25")).not.toBeNull();

    // Fast-forward expiration
    vi.advanceTimersByTime(2);
    expect(getCachedDietPlan("user-2", "2025-11-25")).toBeNull();
  });

  it("removes corrupt cache entries safely", () => {
    window.localStorage.setItem(
      "dietPlan:user-3:2025-11-25",
      "{not-json...}"
    );

    expect(getCachedDietPlan("user-3", "2025-11-25")).toBeNull();
    expect(
      window.localStorage.getItem("dietPlan:user-3:2025-11-25")
    ).toBeNull();
  });

  it("clears cache for specific user and date", () => {
    setCachedDietPlan("user-4", "2025-11-25", mockDietPlan);
    clearDietPlanCache("user-4", "2025-11-25");

    expect(getCachedDietPlan("user-4", "2025-11-25")).toBeNull();
  });
});


