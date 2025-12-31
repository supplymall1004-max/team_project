/**
 * @file components/diet/mfds-recipe-modal.tsx
 * @description 식약처 레시피 모달 컴포넌트
 *
 * 레시피 상세 정보를 모달로 표시합니다.
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Clock, Users, Utensils } from 'lucide-react';
import type { MfdsRecipe } from '@/types/mfds-recipe';

interface MfdsRecipeModalProps {
  rcpSeq: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MfdsRecipeModal({ rcpSeq, open, onOpenChange }: MfdsRecipeModalProps) {
  const [recipe, setRecipe] = useState<MfdsRecipe | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && rcpSeq) {
      setLoading(true);
      setRecipe(null);

      // API를 통해 레시피 로드
      fetch(`/api/mfds-recipes/${rcpSeq}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setRecipe(data);
        })
        .catch((error) => {
          console.error('[MfdsRecipeModal] 레시피 로드 실패:', error);
          setRecipe(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setRecipe(null);
    }
  }, [open, rcpSeq]);

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-300 border-t-blue-600 mx-auto"></div>
              <div className="text-slate-600 font-medium">레시피를 불러오는 중...</div>
            </div>
          </div>
        ) : recipe ? (
          <>
            <DialogHeader className="border-b border-slate-200 pb-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 -m-6 mb-0 p-6 rounded-t-lg">
              <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-100">
                  <ChefHat className="h-5 w-5 text-blue-600" />
                </div>
                {recipe.title}
              </DialogTitle>
              <DialogDescription className="text-slate-600 mt-2">
                {recipe.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              {/* 기본 정보 */}
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  {recipe.frontmatter.rcp_pat2 || '기타'}
                </Badge>
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                  {recipe.frontmatter.rcp_way2 || '기타'}
                </Badge>
              </div>

              {/* 영양 정보 */}
              <Card className="border border-slate-200 shadow-md">
                <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-emerald-50/50 to-green-50/50">
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-emerald-600" />
                    영양 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50">
                      <div className="text-xs font-medium text-blue-700 mb-2">칼로리</div>
                      <div className="text-xl font-bold text-blue-900">
                        {recipe.nutrition.calories?.toFixed(0) || 0}
                        <span className="text-sm font-normal text-blue-600 ml-1">kcal</span>
                      </div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50">
                      <div className="text-xs font-medium text-purple-700 mb-2">단백질</div>
                      <div className="text-xl font-bold text-purple-900">
                        {recipe.nutrition.protein?.toFixed(1) || 0}
                        <span className="text-sm font-normal text-purple-600 ml-1">g</span>
                      </div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/50">
                      <div className="text-xs font-medium text-green-700 mb-2">탄수화물</div>
                      <div className="text-xl font-bold text-green-900">
                        {recipe.nutrition.carbohydrates?.toFixed(1) || 0}
                        <span className="text-sm font-normal text-green-600 ml-1">g</span>
                      </div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50">
                      <div className="text-xs font-medium text-amber-700 mb-2">지방</div>
                      <div className="text-xl font-bold text-amber-900">
                        {recipe.nutrition.fat?.toFixed(1) || 0}
                        <span className="text-sm font-normal text-amber-600 ml-1">g</span>
                      </div>
                    </div>
                    {recipe.nutrition.sodium && (
                      <div className="text-center p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/50">
                        <div className="text-xs font-medium text-slate-700 mb-2">나트륨</div>
                        <div className="text-xl font-bold text-slate-900">
                          {recipe.nutrition.sodium.toFixed(0)}
                          <span className="text-sm font-normal text-slate-600 ml-1">mg</span>
                        </div>
                      </div>
                    )}
                    {recipe.nutrition.fiber && (
                      <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50">
                        <div className="text-xs font-medium text-emerald-700 mb-2">식이섬유</div>
                        <div className="text-xl font-bold text-emerald-900">
                          {recipe.nutrition.fiber.toFixed(1)}
                          <span className="text-sm font-normal text-emerald-600 ml-1">g</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 재료 */}
              {recipe.ingredients.length > 0 && (
                <Card className="border border-slate-200 shadow-md">
                  <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
                    <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <Utensils className="h-5 w-5 text-amber-600" />
                      재료
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {recipe.ingredients.map((ingredient, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-white hover:bg-amber-50/30 hover:border-amber-200 transition-colors"
                        >
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-sm text-slate-700">{ingredient.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 조리 방법 */}
              {recipe.steps.length > 0 && (
                <Card className="border border-slate-200 shadow-md">
                  <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-purple-50/50 to-pink-50/50">
                    <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-600" />
                      조리 방법
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ol className="space-y-4">
                      {recipe.steps.map((step, index) => (
                        <li key={index} className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center font-semibold text-white text-sm shadow-sm">
                            {step.step}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p className="text-sm leading-relaxed text-slate-700 mb-2">{step.description}</p>
                            {step.imageUrl && (
                              <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 hover:border-purple-200 transition-colors">
                                <img
                                  src={step.imageUrl}
                                  alt={`조리 단계 ${step.step}`}
                                  className="w-full h-auto"
                                  onError={(e) => {
                                    // 이미지 로드 실패 시 숨김
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">레시피를 찾을 수 없습니다.</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

