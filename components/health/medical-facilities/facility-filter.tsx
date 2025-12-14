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
import { Hospital, Pill, Heart, HeartPulse } from "lucide-react";

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
}

export function FacilityFilter({
  selectedCategory,
  onCategoryChange,
}: FacilityFilterProps) {
  return (
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
  );
}

