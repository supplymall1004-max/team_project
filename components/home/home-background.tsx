/**
 * @file home-background.tsx
 * @description 홈페이지 메인 영역 배경 컴포넌트
 * 
 * 커스터마이징 설정에 따라 메인 영역 전체의 배경을 렌더링합니다.
 * - 그라데이션
 * - 이미지
 * - 단색
 */

"use client";

import Image from "next/image";
import { useHomeCustomization } from "@/hooks/use-home-customization";

export function HomeBackground() {
  const { customization, isLoaded: isCustomizationLoaded } = useHomeCustomization();

  if (!isCustomizationLoaded) {
    // 로딩 중일 때는 기본 흰색 배경
    return (
      <div 
        className="absolute inset-0 -z-10"
        style={{
          backgroundColor: '#ffffff',
        }}
      />
    );
  }

  const { backgroundType, backgroundImageUrl, backgroundColor, customGradient } = customization.theme;

  switch (backgroundType) {
    case 'image':
      if (backgroundImageUrl) {
        return (
          <div className="absolute inset-0 -z-10">
            <Image
              src={backgroundImageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              priority
              unoptimized
              onError={(e) => {
                console.error("[HomeBackground] 배경 이미지 로딩 실패:", backgroundImageUrl);
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>
        );
      }
      // 이미지가 없으면 흰색으로 폴백
      return (
        <div 
          className="absolute inset-0 -z-10"
          style={{
            backgroundColor: '#ffffff',
          }}
        />
      );

    case 'color':
      return (
        <div 
          className="absolute inset-0 -z-10"
          style={{
            backgroundColor: backgroundColor || '#ffffff',
          }}
        />
      );

    case 'gradient':
    default:
      return (
        <div 
          className="absolute inset-0 -z-10"
          style={{
            background: customGradient || 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
          }}
        />
      );
  }
}

