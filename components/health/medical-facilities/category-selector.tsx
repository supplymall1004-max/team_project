/**
 * @file category-selector.tsx
 * @description 의료기관 카테고리 선택 컴포넌트
 *
 * 의료기관 카테고리를 선택할 수 있는 컴포넌트입니다.
 * 선택된 카테고리는 부모 컴포넌트로 전달됩니다.
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hospital, Pill, Heart, HeartPulse, MapPin } from "lucide-react";
import type { MedicalFacilityCategory } from "@/types/medical-facility";
import { CATEGORY_LABELS } from "@/types/medical-facility";

interface CategoryCard {
  category: MedicalFacilityCategory;
  label: string;
  icon: typeof Hospital;
  description: string;
  color: string;
}

const categories: CategoryCard[] = [
  {
    category: "hospital",
    label: CATEGORY_LABELS.hospital,
    icon: Hospital,
    description: "병원을 찾아보세요",
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  },
  {
    category: "pharmacy",
    label: CATEGORY_LABELS.pharmacy,
    icon: Pill,
    description: "약국을 찾아보세요",
    color: "bg-green-50 border-green-200 hover:bg-green-100",
  },
  {
    category: "animal_hospital",
    label: CATEGORY_LABELS.animal_hospital,
    icon: Heart,
    description: "동물병원을 찾아보세요",
    color: "bg-orange-50 border-orange-200 hover:bg-orange-100",
  },
  {
    category: "animal_pharmacy",
    label: CATEGORY_LABELS.animal_pharmacy,
    icon: HeartPulse,
    description: "동물약국을 찾아보세요",
    color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
  },
];

interface CategorySelectorProps {
  selectedCategory: MedicalFacilityCategory;
  onCategoryChange: (category: MedicalFacilityCategory) => void;
}

export function CategorySelector({ selectedCategory, onCategoryChange }: CategorySelectorProps) {
  console.log("[CategorySelector] 선택된 카테고리:", selectedCategory);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <CardTitle>의료기관 카테고리 선택</CardTitle>
        </div>
        <CardDescription>
          찾고자 하는 의료기관 카테고리를 선택하세요. 선택한 카테고리의 시설들이 지도에 표시됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.category;

            return (
              <Button
                key={category.category}
                variant={isSelected ? "default" : "outline"}
                className={`h-auto p-4 flex flex-col items-center gap-3 transition-all ${
                  isSelected
                    ? "ring-2 ring-primary ring-offset-2"
                    : `hover:shadow-md ${category.color}`
                }`}
                onClick={() => onCategoryChange(category.category)}
              >
                <div className={`rounded-lg p-2 ${isSelected ? "bg-primary/10" : "bg-muted"}`}>
                  <Icon className={`h-6 w-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="text-center">
                  <div className={`font-medium ${isSelected ? "text-primary-foreground" : ""}`}>
                    {category.label}
                  </div>
                  <div className={`text-sm ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {category.description}
                  </div>
                </div>
                {isSelected && (
                  <Badge variant="secondary" className="text-xs">
                    선택됨
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}


