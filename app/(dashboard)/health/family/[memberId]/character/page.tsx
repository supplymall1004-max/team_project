/**
 * @file app/(dashboard)/health/family/[memberId]/character/page.tsx
 * @description 가족 구성원별 상세 캐릭터창 페이지
 *
 * 캐릭터 아바타를 중심으로 기본 정보, 약물 복용 상태, 건강검진, 백신 정보,
 * 생애주기별 알림을 게임 HUD 스타일로 표시합니다.
 *
 * 주요 기능:
 * 1. 캐릭터 아바타 중앙 배치
 * 2. 기본 정보 패널 (체중, 키, 나이, 체지방율)
 * 3. 중요 정보 패널 (질병, 알레르기, 건강 점수)
 * 4. 약물 복용 패널 (오늘 복용 체크)
 * 5. 건강검진 패널
 * 6. 백신 패널
 * 7. 구충제 패널
 * 8. 생애주기별 알림 패널
 * 9. 리마인드 및 일정 패널
 *
 * @dependencies
 * - @/actions/health/character: getCharacterData
 * - @/types/character: CharacterData
 */

import { Suspense } from "react";
import { getCharacterData } from "@/actions/health/character";
import { Section } from "@/components/section";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import { CharacterPageClient } from "./character-page-client";

/**
 * 로딩 스켈레톤
 */
function CharacterPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <Section className="py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-green-400 mx-auto" />
            <p className="text-gray-400">캐릭터 데이터를 불러오는 중...</p>
          </div>
        </div>
      </Section>
    </div>
  );
}

/**
 * 캐릭터창 콘텐츠 컴포넌트 (서버 컴포넌트)
 */
async function CharacterContent({ memberId }: { memberId: string }) {
  let characterData;
  try {
    characterData = await getCharacterData(memberId);
  } catch (error) {
    console.error("캐릭터 데이터 조회 실패:", error);
    notFound();
  }

  return <CharacterPageClient characterData={characterData} memberId={memberId} />;
}

/**
 * 상세 캐릭터창 페이지
 */
export default function CharacterPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  return (
    <Suspense fallback={<CharacterPageSkeleton />}>
      <CharacterPageWrapper params={params} />
    </Suspense>
  );
}

/**
 * 캐릭터 페이지 래퍼 (async 컴포넌트)
 */
async function CharacterPageWrapper({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  return <CharacterContent memberId={memberId} />;
}

