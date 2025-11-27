/**
 * @file replacement.ts
 * @description 전통 재료와 현대 대체재료 매칭 헬퍼 (테스트 우선).
 */

import { ReplacementGuide } from "@/types/legacy";

const includesKeyword = (target: string, keyword: string) =>
  target.toLowerCase().includes(keyword.toLowerCase());

export function findReplacementGuide(
  guides: ReplacementGuide[],
  keyword: string,
): ReplacementGuide | undefined {
  const normalizedKeyword = keyword.trim();
  if (!normalizedKeyword) {
    console.groupCollapsed("[ReplacementGuide] 검색 실패");
    console.log("reason", "keyword empty");
    console.groupEnd();
    return undefined;
  }

  console.groupCollapsed("[ReplacementGuide] 검색");
  console.log("keyword", normalizedKeyword);

  const guide = guides.find(
    (item) =>
      includesKeyword(item.traditional.name, normalizedKeyword) ||
      includesKeyword(item.modern.name, normalizedKeyword),
  );

  console.log("found", Boolean(guide));
  console.groupEnd();
  return guide;
}

