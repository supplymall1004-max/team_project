import { describe, expect, it } from "vitest";

import { replacementGuides } from "@/data/legacy-content";
import { findReplacementGuide } from "@/lib/legacy/replacement";

describe("findReplacementGuide", () => {
  it("검색어가 전통 재료명을 포함하면 해당 가이드를 반환한다", () => {
    const guide = findReplacementGuide(replacementGuides, "안동 메주");
    expect(guide?.traditional.name).toBe("안동 메주");
  });

  it("검색어가 현대 재료명을 포함해도 매칭한다", () => {
    const guide = findReplacementGuide(replacementGuides, "국산 메주 블록");
    expect(guide?.modern.name).toBe("국산 메주 블록");
  });

  it("검색어가 없으면 undefined를 반환한다", () => {
    expect(
      findReplacementGuide(replacementGuides, "없는 재료"),
    ).toBeUndefined();
  });
});

