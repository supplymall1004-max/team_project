import { describe, expect, it } from "vitest";

import { recommendFruitSnack } from "@/lib/diet/seasonal-fruits";

describe("recommendFruitSnack", () => {
  it("목표 칼로리에 맞춰 1~3회분으로 조절한다", () => {
    const res = recommendFruitSnack(120, 10, false, []);
    expect(res.servings).toBeGreaterThanOrEqual(1);
    expect(res.servings).toBeLessThanOrEqual(3);
    expect(res.totalCalories).toBeGreaterThan(0);
  });

  it("신장질환(ckd/kidney_disease)에서는 고칼륨 과일을 우선 회피한다", () => {
    // 1~2월은 키위/바나나 등 칼륨 높은 과일이 후보로 자주 올라오는 시기라,
    // 신장질환 필터가 작동하면 가능한 한 200mg 이하 칼륨 과일을 우선 선택해야 한다.
    const res = recommendFruitSnack(60, 1, false, ["ckd"]);
    const potassium = res.fruit.nutrition.potassium;
    if (typeof potassium === "number") {
      expect(potassium).toBeLessThanOrEqual(200);
    }
  });
});


