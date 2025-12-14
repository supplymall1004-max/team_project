/**
 * @file main-cards-section.tsx
 * @description 의료기관 메인 카드 섹션 컴포넌트
 *
 * 병원, 약국, 동물병원, 동물약국 4개의 카테고리 카드를 표시합니다.
 * 각 카드 클릭 시 상세 페이지로 이동합니다.
 */

"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hospital, Pill, Heart, HeartPulse } from "lucide-react";
import type { MedicalFacilityCategory } from "@/types/medical-facility";
import { CATEGORY_LABELS } from "@/types/medical-facility";

interface CategoryCard {
  category: MedicalFacilityCategory;
  label: string;
  icon: typeof Hospital;
  description: string;
  href: string;
}

const categories: CategoryCard[] = [
  {
    category: "hospital",
    label: CATEGORY_LABELS.hospital,
    icon: Hospital,
    description: "주변 병원을 찾아보세요",
    href: "/health/emergency/medical-facilities/hospital",
  },
  {
    category: "pharmacy",
    label: CATEGORY_LABELS.pharmacy,
    icon: Pill,
    description: "주변 약국을 찾아보세요",
    href: "/health/emergency/medical-facilities/pharmacy",
  },
  {
    category: "animal_hospital",
    label: CATEGORY_LABELS.animal_hospital,
    icon: Heart,
    description: "반려동물 병원을 찾아보세요",
    href: "/health/emergency/medical-facilities/animal_hospital",
  },
  {
    category: "animal_pharmacy",
    label: CATEGORY_LABELS.animal_pharmacy,
    icon: HeartPulse,
    description: "반려동물 약국을 찾아보세요",
    href: "/health/emergency/medical-facilities/animal_pharmacy",
  },
];

export function MainCardsSection() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <Link key={category.category} href={category.href}>
            <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:scale-105">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{category.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{category.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

