/**
 * @file facility-filter.tsx
 * @description 의료기관 카테고리 필터 컴포넌트
 *
 * 병원, 약국, 동물병원, 동물약국 중 하나를 선택할 수 있는 필터 버튼 그룹입니다.
 */

"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MedicalFacilityCategory } from "@/types/medical-facility";
import { CATEGORY_LABELS } from "@/types/medical-facility";
import { Hospital, Pill, Heart, HeartPulse, ExternalLink } from "lucide-react";

interface CategoryOption {
  category: MedicalFacilityCategory;
  label: string;
  icon: typeof Hospital;
}

const categories: CategoryOption[] = [
  { category: "hospital", label: CATEGORY_LABELS.hospital, icon: Hospital },
  { category: "pharmacy", label: CATEGORY_LABELS.pharmacy, icon: Pill },
  {
    category: "animal_hospital",
    label: CATEGORY_LABELS.animal_hospital,
    icon: Heart,
  },
  {
    category: "animal_pharmacy",
    label: CATEGORY_LABELS.animal_pharmacy,
    icon: HeartPulse,
  },
];

interface FacilityFilterProps {
  selectedCategory: MedicalFacilityCategory;
  onCategoryChange: (category: MedicalFacilityCategory) => void;
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
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-red-200 dark:border-red-800",
      textColor: "text-red-800 dark:text-red-200",
      buttonColor: "border-red-300 text-red-700 hover:bg-red-100 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
    },
    pharmacy: {
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      textColor: "text-blue-800 dark:text-blue-200",
      buttonColor: "border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    animal_hospital: {
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-800",
      textColor: "text-green-800 dark:text-green-200",
      buttonColor: "border-green-300 text-green-700 hover:bg-green-100 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    animal_pharmacy: {
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      borderColor: "border-purple-200 dark:border-purple-800",
      textColor: "text-purple-800 dark:text-purple-200",
      buttonColor: "border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
  };
  return themes[category] || themes.hospital;
}

/**
 * 카테고리에 맞는 설명 메시지 생성
 */
function getCategoryDescription(category: MedicalFacilityCategory, hasLocation: boolean): string {
  const locationText = hasLocation ? "현재 위치 주변의" : "전국의";

  const descriptions: Record<MedicalFacilityCategory, string> = {
    hospital: `${locationText} 병원을 네이버 지도에서 확인하세요`,
    pharmacy: `${locationText} 약국을 네이버 지도에서 확인하세요`,
    animal_hospital: `${locationText} 동물병원을 네이버 지도에서 확인하세요`,
    animal_pharmacy: `${locationText} 동물약국을 네이버 지도에서 확인하세요`,
  };

  return descriptions[category] || descriptions.hospital;
}

export function FacilityFilter({
  selectedCategory,
  onCategoryChange,
  currentLocation,
}: FacilityFilterProps) {
  const handleNaverMapClick = () => {
    const naverMapUrl = generateNaverMapUrl(selectedCategory, currentLocation);
    console.log(`[FacilityFilter] 네이버 지도 ${getNaverMapQuery(selectedCategory)} 검색 링크: ${naverMapUrl}`);
    window.open(naverMapUrl, '_blank', 'noopener,noreferrer');
  };

  const theme = getCategoryTheme(selectedCategory);
  const categoryIcons: Record<MedicalFacilityCategory, typeof Hospital> = {
    hospital: Hospital,
    pharmacy: Pill,
    animal_hospital: Heart,
    animal_pharmacy: HeartPulse,
  };
  const IconComponent = categoryIcons[selectedCategory] || Hospital;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {categories.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedCategory === option.category;
          return (
            <Button
              key={option.category}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(option.category)}
              className={cn(
                "gap-2 transition-all duration-200",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-primary/10 hover:border-primary/50"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="whitespace-nowrap">{option.label}</span>
            </Button>
          );
        })}
      </div>

      {/* 선택된 카테고리에 대한 네이버 지도 링크 제공 */}
      <div className={`${theme.bgColor} rounded-lg border ${theme.borderColor} p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
            <IconComponent className={`h-4 w-4 ${theme.iconColor}`} />
            <span className="font-medium">
              네이버 지도에서 더 많은 {CATEGORY_LABELS[selectedCategory]} 보기
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNaverMapClick}
            className={`gap-2 ${theme.buttonColor}`}
          >
            <ExternalLink className="h-4 w-4" />
            네이버 지도
          </Button>
        </div>
        <p className={`text-xs ${theme.textColor} mt-2`}>
          {getCategoryDescription(selectedCategory, !!currentLocation)}
        </p>
      </div>
    </div>
  );
}

