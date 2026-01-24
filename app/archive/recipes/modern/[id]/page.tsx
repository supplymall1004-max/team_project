/**
 * @file app/archive/recipes/modern/[id]/page.tsx
 * @description 현대 레시피 상세 페이지
 *
 * 주요 기능:
 * 1. 레시피 상세 정보 표시
 * 2. 재료 및 조리 방법
 * 3. 영양 정보
 * 4. 이미지 표시
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UtensilsCrossed, AlertCircle, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { loadRecipeById } from "@/lib/modern-recipes/recipe-loader";
import { DirectionalEntrance } from "@/components/motion/directional-entrance";
import { MotionWrapper } from "@/components/motion/motion-wrapper";
import { StaggerCard } from "@/components/motion/stagger-card";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import Image from "next/image";

// dishType별 라벨
const dishTypeLabels: Record<
  "side" | "soup" | "stew" | "rice" | "dessert" | "main",
  string
> = {
  side: "반찬",
  soup: "국",
  stew: "찌개",
  rice: "밥",
  dessert: "후식",
  main: "주요리",
};

// dishType별 색상
const dishTypeColors: Record<
  "side" | "soup" | "stew" | "rice" | "dessert" | "main",
  string
> = {
  side: "bg-green-100 text-green-700",
  soup: "bg-blue-100 text-blue-700",
  stew: "bg-red-100 text-red-700",
  rice: "bg-yellow-100 text-yellow-700",
  dessert: "bg-pink-100 text-pink-700",
  main: "bg-purple-100 text-purple-700",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ModernRecipeDetailPage({ params }: PageProps) {
  console.log("[ModernRecipeDetailPage] 페이지 렌더링 시작");

  const resolvedParams = await params;
  const { id } = resolvedParams;

  console.log("[ModernRecipeDetailPage] 레시피 ID:", id);

  // 레시피 로드
  const recipe = loadRecipeById(id);

  if (!recipe) {
    console.warn("[ModernRecipeDetailPage] 레시피를 찾을 수 없음:", id);
    notFound();
  }

  console.log("[ModernRecipeDetailPage] 레시피 로드 성공:", recipe.title);

  return (
    <DirectionalEntrance direction="up" delay={0.3}>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* 뒤로가기 버튼 */}
          <MotionWrapper>
            <div className="flex justify-start">
              <Link href="/archive/recipes">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  레시피 목록으로
                </Button>
              </Link>
            </div>
          </MotionWrapper>

          {/* 메인 콘텐츠 */}
          <StaggerCard delay={0.1}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {recipe.emoji && (
                      <span className="text-4xl">{recipe.emoji}</span>
                    )}
                    <div>
                      <CardTitle className="text-2xl sm:text-3xl">
                        {recipe.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {recipe.description}
                      </CardDescription>
                    </div>
                  </div>
                  <UtensilsCrossed className="h-8 w-8 text-amber-500 flex-shrink-0" />
                </div>

                {/* 분류 뱃지 */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {recipe.dishType.map((type) => (
                    <AnimatedBadge key={type} className={dishTypeColors[type]}>
                      {dishTypeLabels[type]}
                    </AnimatedBadge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 이미지 */}
                {recipe.imageUrl && (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                )}

                {/* 영양 정보 */}
                <Alert>
                  <Flame className="h-4 w-4" />
                  <AlertTitle>영양 정보 (1인분 기준)</AlertTitle>
                  <AlertDescription>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-3">
                      <div>
                        <span className="text-xs text-gray-500">열량</span>
                        <p className="font-semibold">
                          {recipe.nutrition.calories}kcal
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">단백질</span>
                        <p className="font-semibold">
                          {recipe.nutrition.protein}g
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">탄수화물</span>
                        <p className="font-semibold">
                          {recipe.nutrition.carbs}g
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">지방</span>
                        <p className="font-semibold">
                          {recipe.nutrition.fat}g
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">나트륨</span>
                        <p className="font-semibold">
                          {recipe.nutrition.sodium}mg
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">식이섬유</span>
                        <p className="font-semibold">
                          {recipe.nutrition.fiber}g
                        </p>
                      </div>
                      {recipe.nutrition.potassium && (
                        <div>
                          <span className="text-xs text-gray-500">칼륨</span>
                          <p className="font-semibold">
                            {recipe.nutrition.potassium}mg
                          </p>
                        </div>
                      )}
                      {recipe.nutrition.phosphorus && (
                        <div>
                          <span className="text-xs text-gray-500">인</span>
                          <p className="font-semibold">
                            {recipe.nutrition.phosphorus}mg
                          </p>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </StaggerCard>

          {/* 재료 */}
          <StaggerCard delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle>재료</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center py-2 border-b last:border-0"
                    >
                      <span className="font-medium">{ingredient.name}</span>
                      <span className="text-gray-600">
                        {ingredient.amount} {ingredient.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </StaggerCard>

          {/* 조리 방법 */}
          <StaggerCard delay={0.3}>
            <Card>
              <CardHeader>
                <CardTitle>조리 방법</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm sm:prose max-w-none">
                  <p className="whitespace-pre-line">{recipe.instructions}</p>
                </div>
              </CardContent>
            </Card>
          </StaggerCard>

          {/* 출처 정보 */}
          <StaggerCard delay={0.4}>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>레시피 출처</AlertTitle>
              <AlertDescription>
                이 레시피는 수집된 자료를 바탕으로 제공됩니다. 개인의 건강 상태와
                식습관에 맞춰 조절하여 사용하시기 바랍니다.
              </AlertDescription>
            </Alert>
          </StaggerCard>
        </div>
      </div>
    </DirectionalEntrance>
  );
}

