"use client";

/**
 * @file legacy-video-cta.tsx
 * @description 영상 상세 페이지 CTA 버튼. 프리미엄 여부에 따라 다른 로그를 남깁니다.
 */

import { Button } from "@/components/ui/button";

interface LegacyVideoCtaProps {
  premiumOnly: boolean;
  videoSlug: string;
  videoTitle: string;
}

export function LegacyVideoCta({
  premiumOnly,
  videoSlug,
  videoTitle,
}: LegacyVideoCtaProps) {
  const handlePlay = () => {
    console.groupCollapsed("[LegacyVideo] 재생 요청");
    console.log("slug", videoSlug);
    console.log("title", videoTitle);
    console.groupEnd();
  };

  const handlePremium = () => {
    console.groupCollapsed("[LegacyVideo] 프리미엄 CTA");
    console.log("slug", videoSlug);
    console.groupEnd();
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button size="lg" className="flex-1" onClick={handlePlay}>
        영상 재생
      </Button>
      {premiumOnly && (
        <Button
          size="lg"
          variant="outline"
          className="flex-1"
          onClick={handlePremium}
        >
          프리미엄 구독
        </Button>
      )}
    </div>
  );
}

