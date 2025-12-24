/**
 * @file components/home/character-preview.tsx
 * @description 홈페이지 캐릭터창 미리보기 컴포넌트
 *
 * 홈페이지 `id="chapter-2"` 섹션에 배치되는 캐릭터창 미리보기입니다.
 * 가족 구성원별 캐릭터 카드를 그리드로 표시하고, 각 카드 클릭 시 상세 캐릭터창으로 이동합니다.
 *
 * 주요 기능:
 * 1. 가족 구성원별 캐릭터 카드 그리드 표시
 * 2. 건강 점수 및 상태 표시
 * 3. 게임 스타일 네온 효과 적용
 * 4. 상세 캐릭터창으로 이동
 *
 * @dependencies
 * - @/components/section: Section
 * - @/actions/health/character: getCharacterCards
 * - @/components/ui/card: Card, CardContent
 * - @/lib/utils: cn
 */

import { Section } from "@/components/section";
import { getCharacterCards } from "@/actions/health/character";
import { cn } from "@/lib/utils";
import { CharacterPreviewClient } from "./character-preview-client";

/**
 * 홈페이지 캐릭터창 미리보기 컴포넌트
 *
 * 가족 구성원별 캐릭터 카드를 그리드로 표시합니다.
 */
export async function CharacterPreview({ className }: { className?: string }) {
  let cards;
  try {
    cards = await getCharacterCards();
  } catch (error) {
    console.error("캐릭터 카드 조회 실패:", error);
    cards = [];
  }

  return (
    <Section
      id="chapter-2"
      className={cn("bg-green-50/50", className)}
      title="💚 챕터 2: 건강 관리 현황"
      description="가족 건강을 한눈에 확인하고 관리하세요"
    >
      <CharacterPreviewClient cards={cards} />
    </Section>
  );
}

