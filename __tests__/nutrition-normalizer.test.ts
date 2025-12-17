import { describe, expect, it } from "vitest";
import { toInt, toIntOrNull } from "@/lib/diet/nutrition-normalizer";

describe("nutrition-normalizer", () => {
  describe("toInt", () => {
    it("rounds numeric values to nearest integer", () => {
      expect(toInt(109.7)).toBe(110);
      expect(toInt(109.2)).toBe(109);
    });

    it("handles numeric strings", () => {
      expect(toInt("109.7")).toBe(110);
      expect(toInt("0")).toBe(0);
    });

    it("returns fallback for invalid values", () => {
      expect(toInt(undefined, 123)).toBe(123);
      expect(toInt(null, 123)).toBe(123);
      expect(toInt("not-a-number", 123)).toBe(123);
      expect(toInt(Number.NaN, 123)).toBe(123);
      expect(toInt(Infinity, 123)).toBe(123);
    });
  });

  describe("toIntOrNull", () => {
    it("rounds numeric values to nearest integer", () => {
      expect(toIntOrNull(109.7)).toBe(110);
      expect(toIntOrNull("109.7")).toBe(110);
    });

    it("returns null for missing/invalid values", () => {
      expect(toIntOrNull(undefined)).toBeNull();
      expect(toIntOrNull(null)).toBeNull();
      expect(toIntOrNull("nope")).toBeNull();
      expect(toIntOrNull(Number.NaN)).toBeNull();
    });
  });
});
