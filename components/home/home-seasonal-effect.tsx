/**
 * @file home-seasonal-effect.tsx
 * @description 메인 페이지용 계절 효과 컴포넌트
 * 
 * 현재 계절에 따라 자동으로 파티클 효과를 표시합니다.
 * 사용자가 토글 버튼으로 켜고 끌 수 있습니다.
 */

"use client";

import { useState, useEffect } from "react";
import { SeasonalEffect } from "@/components/storybook/seasonal-effect";
import { getCurrentSeason } from "@/lib/utils/season";
import type { Season } from "@/data/seasons";

export function HomeSeasonalEffect() {
  const [season, setSeason] = useState<Season>("spring");
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 선택된 계절 불러오기
    const savedSeason = localStorage.getItem("selected-season");
    if (savedSeason && ["spring", "summer", "autumn", "winter"].includes(savedSeason)) {
      setSeason(savedSeason as Season);
    } else {
      // 저장된 계절이 없으면 현재 계절 사용
      const currentSeason = getCurrentSeason();
      setSeason(currentSeason);
    }

    // 로컬 스토리지에서 설정 불러오기
    const saved = localStorage.getItem("seasonal-effect-enabled");
    if (saved !== null) {
      setIsEnabled(saved === "true");
    }

    // 전역 이벤트 리스너 추가
    const handleToggle = (event: CustomEvent<{ enabled: boolean }>) => {
      setIsEnabled(event.detail.enabled);
    };

    const handleSeasonChange = (event: CustomEvent<{ season: Season }>) => {
      setSeason(event.detail.season);
    };

    window.addEventListener("seasonal-effect-toggle", handleToggle as EventListener);
    window.addEventListener("season-change", handleSeasonChange as EventListener);

    return () => {
      window.removeEventListener("seasonal-effect-toggle", handleToggle as EventListener);
      window.removeEventListener("season-change", handleSeasonChange as EventListener);
    };
  }, []);

  if (!isEnabled) {
    return null;
  }

  return <SeasonalEffect season={season} />;
}

