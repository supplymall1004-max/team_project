/**
 * @file facility-card-list.tsx
 * @description 의료기관 카드 리스트 컴포넌트
 *
 * 검색 결과를 카드 형태로 나열합니다.
 * 스켈레톤 UI 로딩 상태를 제공합니다.
 */

"use client";

import { FacilityCard } from "./facility-card";
import type { MedicalFacility, MedicalFacilityCategory } from "@/types/medical-facility";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink } from "lucide-react";

interface FacilityCardListProps {
  facilities: MedicalFacility[];
  loading?: boolean;
  onMapClick?: (facility: MedicalFacility) => void;
  currentCategory?: MedicalFacilityCategory;
  currentLocation?: { lat: number; lon: number } | null;
}

/**
 * 카테고리에 맞는 네이버 지도 검색어 생성
 */
function getNaverMapQuery(category: MedicalFacilityCategory): string {
  const queryMap: Record<MedicalFacilityCategory, string> = {
    hospital: "병원",
    pharmacy: "약국",
    animal_hospital: "동물병원",
    animal_pharmacy: "동물약국",
  };
  return queryMap[category] || "병원";
}

/**
 * 사용자 위치 기반 네이버 지도 검색 URL 생성
 */
function generateNaverMapUrl(category: MedicalFacilityCategory, location?: { lat: number; lon: number } | null): string {
  const query = getNaverMapQuery(category);
  if (location) {
    // 사용자 위치 기반 검색 (줌 레벨 15)
    return `https://map.naver.com/p/search/${encodeURIComponent(query)}?c=${location.lat},${location.lon},15,0,0,0,dh`;
  }
  // 기본 검색 (전국)
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}?c=15.00,0,0,0,dh`;
}

/**
 * 카테고리에 맞는 색상 테마 반환
 */
function getCategoryTheme(category: MedicalFacilityCategory): {
  bgColor: string;
  borderColor: string;
  textColor: string;
  buttonColor: string;
  iconColor: string;
} {
  const themes: Record<MedicalFacilityCategory, any> = {
    hospital: {
      bgColor: "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20",
      borderColor: "border-red-200 dark:border-red-800",
      textColor: "text-red-700 dark:text-red-300",
      buttonColor: "border-red-300 text-red-700 hover:bg-red-100 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
    },
    pharmacy: {
      bgColor: "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      textColor: "text-blue-700 dark:text-blue-300",
      buttonColor: "border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    animal_hospital: {
      bgColor: "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
      borderColor: "border-green-200 dark:border-green-800",
      textColor: "text-green-700 dark:text-green-300",
      buttonColor: "border-green-300 text-green-700 hover:bg-green-100 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    animal_pharmacy: {
      bgColor: "bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20",
      borderColor: "border-purple-200 dark:border-purple-800",
      textColor: "text-purple-700 dark:text-purple-300",
      buttonColor: "border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
  };
  return themes[category] || themes.hospital;
}

/**
 * 카테고리에 맞는 헤더 제목 생성
 */
function getCategoryHeaderTitle(category: MedicalFacilityCategory): string {
  const titles: Record<MedicalFacilityCategory, string> = {
    hospital: "병원 검색 결과",
    pharmacy: "실시간 약국 검색 결과",
    animal_hospital: "동물병원 검색 결과",
    animal_pharmacy: "동물약국 검색 결과",
  };
  return titles[category] || "의료기관 검색 결과";
}

/**
 * 카테고리에 맞는 설명 생성
 */
function getCategoryDescription(category: MedicalFacilityCategory): string {
  const descriptions: Record<MedicalFacilityCategory, string> = {
    hospital: "병원을 쉽게 찾아보세요",
    pharmacy: "현재 영업 중인 약국을 우선 표시합니다",
    animal_hospital: "반려동물을 위한 병원을 찾아보세요",
    animal_pharmacy: "반려동물을 위한 약국을 찾아보세요",
  };
  return descriptions[category] || "의료기관을 쉽게 찾아보세요";
}

// 스켈레톤 카드 컴포넌트
function FacilityCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          <div className="h-12 w-12 shrink-0 rounded-xl bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="space-y-2">
              <div className="h-5 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/4 rounded bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
            </div>
            <div className="flex gap-2 pt-2">
              <div className="h-9 flex-1 rounded bg-muted" />
              <div className="h-9 flex-1 rounded bg-muted" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FacilityCardList({
  facilities,
  loading = false,
  onMapClick,
  currentCategory,
  currentLocation,
}: FacilityCardListProps) {
  const handleNaverMapClick = () => {
    if (!currentCategory) return;
    const naverMapUrl = generateNaverMapUrl(currentCategory, currentLocation);
    console.log(`[FacilityCardList] 네이버 지도 ${getNaverMapQuery(currentCategory)} 검색 링크: ${naverMapUrl}`);
    window.open(naverMapUrl, '_blank', 'noopener,noreferrer');
  };
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <FacilityCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (facilities.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <MapPin className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-foreground">검색 결과가 없습니다</p>
        <p className="mt-2 text-sm text-muted-foreground">
          다른 위치에서 검색해보세요.
        </p>
      </div>
    );
  }

  // 카테고리별 아이콘 매핑
  const categoryIcons: Record<MedicalFacilityCategory, typeof MapPin> = {
    hospital: MapPin,
    pharmacy: MapPin,
    animal_hospital: MapPin,
    animal_pharmacy: MapPin,
  };

  return (
    <div className="space-y-4">
      {/* 선택된 카테고리에 대한 헤더 */}
      {currentCategory && facilities.length > 0 && (
        <div className={`${getCategoryTheme(currentCategory).bgColor} rounded-lg border ${getCategoryTheme(currentCategory).borderColor} p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800`}>
                <MapPin className={`h-5 w-5 ${getCategoryTheme(currentCategory).iconColor}`} />
              </div>
              <div>
                <h3 className={`font-semibold ${getCategoryTheme(currentCategory).textColor}`}>
                  {getCategoryHeaderTitle(currentCategory)}
                </h3>
                <p className={`text-sm ${getCategoryTheme(currentCategory).textColor} opacity-90`}>
                  {getCategoryDescription(currentCategory)}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNaverMapClick}
              className={`gap-2 ${getCategoryTheme(currentCategory).buttonColor}`}
            >
              <ExternalLink className="h-4 w-4" />
              네이버 지도에서 더 보기
            </Button>
          </div>
        </div>
      )}

      {facilities.map((facility, index) => (
        <div
          key={facility.id}
          className="animate-in fade-in-50 slide-in-from-bottom-4"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <FacilityCard
            facility={facility}
            onMapClick={onMapClick}
          />
        </div>
      ))}
    </div>
  );
}

