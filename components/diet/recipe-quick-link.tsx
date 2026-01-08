/**
 * @file components/diet/recipe-quick-link.tsx
 * @description 레시피 바로가기 버튼 컴포넌트
 *
 * 반찬/국/찌개별 레시피 바로가기 버튼을 제공합니다.
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Utensils, Soup, ChefHat } from 'lucide-react';

interface RecipeQuickLinkProps {
  recipes: Array<{ rcpSeq: string; title: string; category: string }>;
  onRecipeClick: (rcpSeq: string) => void;
}

const CATEGORY_ICONS: Record<string, typeof Utensils> = {
  반찬: Utensils,
  국: Soup,
  찌개: Soup,
  밥: ChefHat,
  기타: ChefHat,
};

const CATEGORY_COLORS: Record<string, { bg: string; hover: string; border: string; text: string }> = {
  반찬: {
    bg: 'bg-blue-50 border-blue-200',
    hover: 'hover:bg-blue-100 hover:border-blue-300',
    border: 'border',
    text: 'text-blue-700',
  },
  국: {
    bg: 'bg-green-50 border-green-200',
    hover: 'hover:bg-green-100 hover:border-green-300',
    border: 'border',
    text: 'text-green-700',
  },
  찌개: {
    bg: 'bg-orange-50 border-orange-200',
    hover: 'hover:bg-orange-100 hover:border-orange-300',
    border: 'border',
    text: 'text-orange-700',
  },
  밥: {
    bg: 'bg-amber-50 border-amber-200',
    hover: 'hover:bg-amber-100 hover:border-amber-300',
    border: 'border',
    text: 'text-amber-700',
  },
  기타: {
    bg: 'bg-slate-50 border-slate-200',
    hover: 'hover:bg-slate-100 hover:border-slate-300',
    border: 'border',
    text: 'text-slate-700',
  },
};

export function RecipeQuickLink({ recipes, onRecipeClick }: RecipeQuickLinkProps) {
  if (recipes.length === 0) {
    return null;
  }

  // 카테고리별로 그룹화
  const recipesByCategory = recipes.reduce((acc, recipe) => {
    const category = recipe.category || '기타';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(recipe);
    return acc;
  }, {} as Record<string, typeof recipes>);

  return (
    <Card className="border border-slate-200 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-amber-50/50 to-orange-50/50 px-4 sm:px-6 py-4">
        <CardTitle className="text-lg sm:text-xl font-semibold text-slate-900 flex items-center gap-2">
          <ChefHat className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 shrink-0" />
          <span>식약처 레시피 바로가기</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-slate-600 mt-1">
          이 식단에 포함된 각 반찬, 국, 찌개의 상세 레시피를 확인하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="space-y-4 sm:space-y-5">
          {Object.entries(recipesByCategory).map(([category, categoryRecipes]) => {
            const Icon = CATEGORY_ICONS[category] || ChefHat;
            const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS['기타'];

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="p-1.5 rounded bg-white shrink-0">
                    <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${colors.text}`} />
                  </div>
                  <span className={`text-xs sm:text-sm font-semibold ${colors.text}`}>
                    {category}
                  </span>
                  <Badge variant="outline" className="ml-2 text-xs bg-white shrink-0">
                    {categoryRecipes.length}개
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categoryRecipes.map((recipe) => (
                    <Button
                      key={recipe.rcpSeq}
                      variant="outline"
                      size="sm"
                      className={`${colors.bg} ${colors.hover} ${colors.border} ${colors.text} font-medium transition-all shadow-sm hover:shadow text-xs sm:text-sm min-h-[36px] sm:min-h-[32px] px-3 sm:px-4`}
                      onClick={() => onRecipeClick(recipe.rcpSeq)}
                    >
                      <span className="line-clamp-1">{recipe.title}</span>
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

