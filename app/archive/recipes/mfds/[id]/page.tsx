/**
 * @file app/archive/recipes/mfds/[id]/page.tsx
 * @description 식약처 레시피 상세 페이지
 *
 * 주요 기능:
 * 1. 레시피 상세 정보 표시
 * 2. 단계별 조리 방법
 * 3. 재료 및 영양 정보
 * 4. 각 레시피별 이미지 표시
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, ChefHat, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DirectionalEntrance } from "@/components/motion/directional-entrance";
import { MotionWrapper } from "@/components/motion/motion-wrapper";
import { StaggerCard } from "@/components/motion/stagger-card";
import { StaggerItem } from "@/components/motion/stagger-item";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { AnimatedIconWrapper } from "@/components/motion/animated-icon-wrapper";
import { AnimatedAlertWrapper } from "@/components/motion/animated-alert-wrapper";
import { AnimatedCheckIcon } from "@/components/motion/animated-check-icon";
import { AnimatedText } from "@/components/motion/animated-text";
import { AnimatedNutritionItem, AnimatedNutritionValue } from "@/components/motion/animated-nutrition-item";
import { AnimatedTimer } from "@/components/motion/animated-timer";
import { loadRecipeBySeq } from "@/lib/mfds/recipe-loader";
import { getMainImageUrl, getManualImageUrl } from "@/lib/mfds/recipe-image-utils";
import Image from "next/image";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const recipe = loadRecipeBySeq(id);

  if (!recipe) {
    return {
      title: "레시피를 찾을 수 없습니다",
    };
  }

  return {
    title: `${recipe.title} | 식약처 레시피`,
    description: recipe.description || `${recipe.title} 레시피`,
  };
}

export default async function MfdsRecipeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const recipe = loadRecipeBySeq(id);

  if (!recipe) {
    notFound();
  }

  console.log("[MfdsRecipeDetailPage] 식약처 레시피 상세 페이지 렌더링:", id);

  const mainImageUrl = getMainImageUrl(
    recipe.images.mainImageOriginalUrl,
    recipe.images.mainImageLocalPath,
    recipe.frontmatter.rcp_seq
  );

  return (
    <DirectionalEntrance direction="up" delay={0.3}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          {/* 뒤로가기 버튼 */}
          <MotionWrapper>
            <Link href="/archive/recipes?tab=mfds">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                목록으로 돌아가기
              </Button>
            </Link>

            {/* 레시피 헤더 */}
            <StaggerCard index={0}>
              <Card>
                <CardHeader>
                  {/* 대표 이미지 */}
                  {mainImageUrl && (
                    <div className="relative w-full aspect-video overflow-hidden rounded-lg border shadow-lg bg-gray-100 mb-4">
                      <Image
                        src={mainImageUrl}
                        alt={recipe.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-3xl mb-2">{recipe.title}</CardTitle>
                      {recipe.description && (
                        <CardDescription className="text-base">
                          {recipe.description}
                        </CardDescription>
                      )}
                    </div>
                    <AnimatedIconWrapper>
                      <ChefHat className="h-8 w-8 text-orange-500 flex-shrink-0" />
                    </AnimatedIconWrapper>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <AnimatedBadge delay={0.4}>
                      <Badge className="bg-orange-100 text-orange-700">
                        {recipe.frontmatter.rcp_pat2}
                      </Badge>
                    </AnimatedBadge>
                    <AnimatedBadge delay={0.5}>
                      <Badge variant="outline">{recipe.frontmatter.rcp_way2}</Badge>
                    </AnimatedBadge>
                  </div>
                </CardHeader>
              </Card>
            </StaggerCard>

            {/* 영양 정보 */}
            <StaggerCard index={1}>
              <Card>
                <CardHeader>
                  <CardTitle>영양 정보 (1인분 기준)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {recipe.nutrition.calories != null && (
                      <AnimatedNutritionItem delay={0.5}>
                        <div className="text-sm text-gray-600">칼로리</div>
                        <AnimatedNutritionValue delay={0.6} className="text-2xl font-bold">
                          {recipe.nutrition.calories.toFixed(1)} kcal
                        </AnimatedNutritionValue>
                      </AnimatedNutritionItem>
                    )}
                    {recipe.nutrition.carbohydrates != null && (
                      <AnimatedNutritionItem delay={0.55}>
                        <div className="text-sm text-gray-600">탄수화물</div>
                        <AnimatedNutritionValue delay={0.65} className="text-2xl font-bold">
                          {recipe.nutrition.carbohydrates.toFixed(1)} g
                        </AnimatedNutritionValue>
                      </AnimatedNutritionItem>
                    )}
                    {recipe.nutrition.protein != null && (
                      <AnimatedNutritionItem delay={0.6}>
                        <div className="text-sm text-gray-600">단백질</div>
                        <AnimatedNutritionValue delay={0.7} className="text-2xl font-bold">
                          {recipe.nutrition.protein.toFixed(1)} g
                        </AnimatedNutritionValue>
                      </AnimatedNutritionItem>
                    )}
                    {recipe.nutrition.fat != null && (
                      <AnimatedNutritionItem delay={0.65}>
                        <div className="text-sm text-gray-600">지방</div>
                        <AnimatedNutritionValue delay={0.75} className="text-2xl font-bold">
                          {recipe.nutrition.fat.toFixed(1)} g
                        </AnimatedNutritionValue>
                      </AnimatedNutritionItem>
                    )}
                    {recipe.nutrition.sodium != null && (
                      <AnimatedNutritionItem delay={0.7}>
                        <div className="text-sm text-gray-600">나트륨</div>
                        <AnimatedNutritionValue delay={0.8} className="text-2xl font-bold">
                          {recipe.nutrition.sodium.toFixed(1)} mg
                        </AnimatedNutritionValue>
                      </AnimatedNutritionItem>
                    )}
                  </div>
                </CardContent>
              </Card>
            </StaggerCard>

            {/* 재료 */}
            <StaggerCard index={2}>
              <Card>
                <CardHeader>
                  <CardTitle>재료</CardTitle>
                </CardHeader>
                <CardContent>
                  {recipe.ingredients.length === 0 ? (
                    <p className="text-muted-foreground">재료 정보가 없습니다.</p>
                  ) : (
                    <ul className="space-y-2">
                      {recipe.ingredients.map((ingredient, index) => (
                        <StaggerItem key={index} index={index} delay={0.3}>
                          <li className="flex items-start gap-2">
                            <AnimatedCheckIcon index={index}>
                              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            </AnimatedCheckIcon>
                            <div>
                              <span className="font-medium">{ingredient.name}</span>
                              {ingredient.category && (
                                <span className="text-gray-500 text-sm ml-2">
                                  ({ingredient.category})
                                </span>
                              )}
                            </div>
                          </li>
                        </StaggerItem>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </StaggerCard>

            {/* 조리 단계 */}
            <StaggerCard index={3}>
              <Card>
                <CardHeader>
                  <CardTitle>조리 방법</CardTitle>
                </CardHeader>
                <CardContent>
                  {recipe.steps.length === 0 ? (
                    <p className="text-muted-foreground">조리 과정 정보가 없습니다.</p>
                  ) : (
                    <ol className="space-y-6">
                      {recipe.steps.map((step) => {
                        const stepImageUrl = getManualImageUrl(
                          step.originalImageUrl,
                          step.localImagePath,
                          recipe.frontmatter.rcp_seq,
                          step.step
                        );

                        return (
                          <StaggerItem key={step.step} index={step.step - 1} delay={0.4}>
                            <li className="space-y-4">
                              <div className="flex gap-4">
                                <AnimatedIconWrapper
                                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 15,
                                    delay: 0.4 + (step.step - 1) * 0.1,
                                  }}
                                  className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold"
                                >
                                  {step.step}
                                </AnimatedIconWrapper>
                                <div className="flex-1 pt-1">
                                  <p className="text-gray-700 leading-relaxed">
                                    {step.description}
                                  </p>
                                </div>
                              </div>

                              {/* 조리 단계 이미지 */}
                              {stepImageUrl && (
                                <div className="relative w-full aspect-video overflow-hidden rounded-lg border bg-gray-100">
                                  <Image
                                    src={stepImageUrl}
                                    alt={`${recipe.title} 조리 단계 ${step.step}`}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                              )}
                            </li>
                          </StaggerItem>
                        );
                      })}
                    </ol>
                  )}
                </CardContent>
              </Card>
            </StaggerCard>

            {/* 출처 정보 */}
            <StaggerCard index={4}>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>레시피 출처</AlertTitle>
                <AlertDescription>
                  이 레시피는 식품의약품안전처에서 제공하는 공식 레시피입니다.
                  <br />
                  레시피 순번: {recipe.frontmatter.rcp_seq}
                </AlertDescription>
              </Alert>
            </StaggerCard>
          </MotionWrapper>
        </div>
      </div>
    </DirectionalEntrance>
  );
}

