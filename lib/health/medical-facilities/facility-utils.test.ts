import React from "react";
import { describe, expect, it } from "vitest";
import { getOperatingStatusAt } from "@/lib/health/medical-facilities/facility-utils";

describe("getOperatingStatusAt", () => {
  it("자정을 넘지 않는 영업시간(09:00~18:00)에서 10:00은 open", () => {
    const now = new Date("2025-12-17T10:00:00");
    expect(getOperatingStatusAt(now, false, "09:00", "18:00")).toBe("open");
  });

  it("자정을 넘지 않는 영업시간(09:00~18:00)에서 20:00은 closed", () => {
    const now = new Date("2025-12-17T20:00:00");
    expect(getOperatingStatusAt(now, false, "09:00", "18:00")).toBe("closed");
  });

  it("자정을 넘기는 영업시간(22:00~02:00)에서 23:30은 open", () => {
    const now = new Date("2025-12-17T23:30:00");
    expect(getOperatingStatusAt(now, false, "22:00", "02:00")).toBe("open");
  });

  it("자정을 넘기는 영업시간(22:00~02:00)에서 01:30은 open", () => {
    const now = new Date("2025-12-18T01:30:00");
    expect(getOperatingStatusAt(now, false, "22:00", "02:00")).toBe("open");
  });

  it("자정을 넘기는 영업시간(22:00~02:00)에서 03:00은 closed", () => {
    const now = new Date("2025-12-18T03:00:00");
    expect(getOperatingStatusAt(now, false, "22:00", "02:00")).toBe("closed");
  });

  it("closing_soon: 30분 이내면 closing_soon", () => {
    const now = new Date("2025-12-17T17:45:00");
    expect(getOperatingStatusAt(now, false, "09:00", "18:00")).toBe("closing_soon");
  });
});

