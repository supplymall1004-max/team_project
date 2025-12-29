/**
 * @file components/mfds-recipes/mfds-recipe-card.tsx
 * @description 식약처 레시피 카드 컴포넌트 (Client Component)
 *
 * 주요 기능:
 * 1. 레시피 썸네일 이미지 표시
 * 2. 레시피 제목 및 태그 표시
 * 3. 클릭 시 상세 페이지로 이동
 */

"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MfdsRecipe } from "@/types/mfds-recipe";
import { getMainImageUrl } from "@/lib/mfds/recipe-image-utils";

interface MfdsRecipeCardProps {
  recipe: MfdsRecipe;
}

export function MfdsRecipeCard({ recipe }: MfdsRecipeCardProps) {
  const mainImageUrl = getMainImageUrl(
    recipe.images.mainImageOriginalUrl,
    recipe.images.mainImageLocalPath,
    recipe.frontmatter.rcp_seq
  );

  return (
    <Link
      href={`/recipes/mfds/${recipe.frontmatter.rcp_seq}`}
      className="group"
    >
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105">
        <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
          {mainImageUrl ? (
            <Image
              src={mainImageUrl}
              alt={recipe.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              이미지 없음
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {recipe.title}
          </h3>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {recipe.frontmatter.rcp_pat2}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {recipe.frontmatter.rcp_way2}
            </Badge>
          </div>
          {recipe.nutrition.calories && (
            <div className="mt-2 text-sm text-muted-foreground">
              {recipe.nutrition.calories.toFixed(1)} kcal
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

