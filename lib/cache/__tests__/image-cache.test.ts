import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearRecipeImageCache,
  getCachedRecipeImage,
  setCachedRecipeImage,
} from "@/lib/cache/image-cache";

describe("image-cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearRecipeImageCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores and retrieves recipe images", () => {
    setCachedRecipeImage("kimchi-jjigae", "https://img", "pixabay", true);

    const cached = getCachedRecipeImage("kimchi-jjigae");
    expect(cached).not.toBeNull();
    expect(cached?.imageSource).toBe("pixabay");
  });

  it("removes expired images", () => {
    setCachedRecipeImage("bibimbap", "https://img", "pixabay", true, 1);

    expect(getCachedRecipeImage("bibimbap")).not.toBeNull();
    vi.advanceTimersByTime(5);
    expect(getCachedRecipeImage("bibimbap")).toBeNull();
  });

  it("clears cache for specific recipe", () => {
    setCachedRecipeImage("ssambap", "https://img", "unsplash", false);
    clearRecipeImageCache("ssambap");

    expect(getCachedRecipeImage("ssambap")).toBeNull();
  });
});





