/**
 * @file components/admin/recipes/era-selector.tsx
 * @description 궁중 레시피 시대 선택 컴포넌트
 *
 * 주요 기능:
 * - 고려시대, 조선시대, 삼국시대 선택
 * - 선택된 시대 강조 표시
 *
 * @dependencies
 * - lucide-react: 아이콘
 * - @/components/ui/button: 버튼 컴포넌트
 */

import { Crown, Castle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoyalRecipeEra } from "./recipes-page-client";

interface EraSelectorProps {
  selectedEra: RoyalRecipeEra | null;
  onEraSelect: (era: RoyalRecipeEra) => void;
}

const ERAS = [
  {
    id: "goryeo" as const,
    label: "고려시대 궁중 레시피",
    description: "고려시대 궁중 음식 문화",
    icon: Crown,
    color: "text-yellow-600",
  },
  {
    id: "joseon" as const,
    label: "조선시대 궁중 레시피",
    description: "조선시대 궁중 음식 문화",
    icon: Castle,
    color: "text-blue-600",
  },
  {
    id: "three_kingdoms" as const,
    label: "삼국시대 궁중 레시피",
    description: "삼국시대 궁중 음식 문화",
    icon: Shield,
    color: "text-green-600",
  },
] as const;

export function EraSelector({ selectedEra, onEraSelect }: EraSelectorProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {ERAS.map((era) => {
        const Icon = era.icon;
        const isSelected = selectedEra === era.id;

        return (
          <Button
            key={era.id}
            variant={isSelected ? "default" : "outline"}
            className={`h-auto p-6 flex flex-col items-center gap-3 ${
              isSelected
                ? "bg-primary text-primary-foreground shadow-lg"
                : "hover:bg-muted"
            }`}
            onClick={() => onEraSelect(era.id)}
          >
            <Icon className={`h-8 w-8 ${isSelected ? "" : era.color}`} />
            <div className="text-center">
              <div className="font-semibold text-sm">{era.label}</div>
              <div className={`text-xs mt-1 ${
                isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
              }`}>
                {era.description}
              </div>
            </div>
          </Button>
        );
      })}
    </div>
  );
}








