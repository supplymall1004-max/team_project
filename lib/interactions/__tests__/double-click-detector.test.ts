import { describe, expect, it } from "vitest";

import {
  DOUBLE_CLICK_THRESHOLD_MS,
  isWithinDoubleClickWindow,
} from "../double-click-detector";

describe("isWithinDoubleClickWindow", () => {
  it("returns false when there is no previous click", () => {
    expect(isWithinDoubleClickWindow(null, Date.now())).toBe(false);
  });

  it("returns false when current timestamp is not greater than previous", () => {
    const timestamp = Date.now();
    expect(isWithinDoubleClickWindow(timestamp, timestamp)).toBe(false);
    expect(isWithinDoubleClickWindow(timestamp, timestamp - 1)).toBe(false);
  });

  it("returns true for clicks inside threshold", () => {
    const first = 1_000;
    const second = first + DOUBLE_CLICK_THRESHOLD_MS - 1;
    expect(isWithinDoubleClickWindow(first, second)).toBe(true);
  });

  it("returns false for clicks outside threshold", () => {
    const first = 1_000;
    const second = first + DOUBLE_CLICK_THRESHOLD_MS + 1;
    expect(isWithinDoubleClickWindow(first, second)).toBe(false);
  });
});

