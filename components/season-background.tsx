/**
 * @file season-background.tsx
 * @description 계절별 배경 이미지 컴포넌트
 * 
 * 현재 날짜를 기준으로 계절을 판단하여 해당 계절의 배경 이미지를 표시합니다.
 * 배경 이미지는 전체 화면을 덮으며, 투명도를 조절하여 콘텐츠 위에 자연스럽게 표시됩니다.
 * 
 * 주요 기능:
 * - 현재 날짜 기반 계절 자동 판단
 * - 배경 이미지 자동 전환
 * - 투명도 조절 가능
 * - 반응형 디자인 지원
 * 
 * @dependencies
 * - lib/utils/season.ts: 계절 판단 유틸리티
 */

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { 
  getCurrentSeason, 
  getSeasonImagePath, 
  getSeasonPanelIndex,
  type Season 
} from '@/lib/utils/season';

interface SeasonBackgroundProps {
  /**
   * 배경 이미지의 투명도 (0 ~ 1)
   * @default 0.25
   */
  opacity?: number;
  /**
   * 배경 이미지의 z-index
   * @default -1
   */
  zIndex?: number;
}

export function SeasonBackground({
  opacity = 0.25,
  zIndex = -1,
}: SeasonBackgroundProps) {
  const [season, setSeason] = useState<Season>('spring');
  const [imagePath, setImagePath] = useState<string>('/봄.jpg');
  const [panelIndex, setPanelIndex] = useState<number>(0);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행 (hydration 오류 방지)
    const now = new Date();
    const currentSeason = getCurrentSeason(now);
    const path = getSeasonImagePath(currentSeason);
    const index = getSeasonPanelIndex(now);
    
    console.log('[SeasonBackground] 현재 계절:', currentSeason);
    console.log('[SeasonBackground] 이미지 경로:', path);
    console.log('[SeasonBackground] 패널 인덱스:', index);
    
    setSeason(currentSeason);
    setImagePath(path);
    setPanelIndex(index);
  }, []);

  // 각 패널은 이미지의 25% 너비를 차지 (4개 패널)
  // 패널 위치 계산: 0번 패널 = 12.5%, 1번 패널 = 37.5%, 2번 패널 = 62.5%, 3번 패널 = 87.5%
  const panelPosition = 12.5 + (panelIndex * 25); // 각 패널의 중심 위치 (%)

  return (
    <div
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex,
        opacity,
      }}
    >
      <div
        className="relative w-full h-full overflow-hidden"
      >
        <Image
          src={imagePath}
          alt={`${season} 배경 이미지 - 패널 ${panelIndex + 1}`}
          fill
          priority
          quality={75}
          className="object-cover"
          style={{
            objectFit: 'cover',
            objectPosition: `${panelPosition}% center`, // 선택된 패널의 중심으로 위치 조정
          }}
        />
      </div>
    </div>
  );
}

