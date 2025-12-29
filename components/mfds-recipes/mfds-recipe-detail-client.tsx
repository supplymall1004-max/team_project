/**
 * @file components/mfds-recipes/mfds-recipe-detail-client.tsx
 * @description 식약처 레시피 상세 페이지 클라이언트 컴포넌트
 *
 * 주요 기능:
 * 1. 레시피 메타 정보 표시 (제목, 설명, 조리법, 요리종류)
 * 2. 영양 정보 박스 표시
 * 3. 재료 목록 표시 (주재료/양념 구분)
 * 4. 단계별 조리 과정 표시 (텍스트 + 이미지)
 */

"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MfdsRecipe } from "@/types/mfds-recipe";
import {
  getMainImageUrl,
  getManualImageUrl,
} from "@/lib/mfds/recipe-image-utils";

interface MfdsRecipeDetailClientProps {
  recipe: MfdsRecipe;
}

export function MfdsRecipeDetailClient({
  recipe,
}: MfdsRecipeDetailClientProps) {
  console.group("[MfdsRecipeDetailClient] 컴포넌트 렌더링");
  console.log("레시피 제목:", recipe.title);
  console.log("조리 단계 개수:", recipe.steps.length);
  console.log("재료 개수:", recipe.ingredients.length);
  console.log("영양 정보:", recipe.nutrition);
  console.groupEnd();

  const mainImageUrl = getMainImageUrl(
    recipe.images.mainImageOriginalUrl,
    recipe.images.mainImageLocalPath,
    recipe.frontmatter.rcp_seq
  );

  // 데이터가 없으면 에러 메시지 표시
  if (!recipe.title) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">레시피 데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      {/* 레시피 헤더 */}
      <div className="space-y-4">
        {/* 대표 이미지 */}
        {mainImageUrl && (
          <motion.div
            className="relative w-full aspect-video overflow-hidden rounded-lg border shadow-lg bg-gray-100"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Image
              src={mainImageUrl}
              alt={recipe.title}
              fill
              className="object-cover"
              unoptimized
            />
          </motion.div>
        )}

        {/* 제목 및 메타 정보 */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div>
            <h1 className="text-4xl font-bold mb-2">{recipe.title}</h1>
            {recipe.description && (
              <p className="text-lg text-muted-foreground">
                {recipe.description}
              </p>
            )}
          </div>

          {/* 태그 */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{recipe.frontmatter.rcp_pat2}</Badge>
            <Badge variant="outline">{recipe.frontmatter.rcp_way2}</Badge>
          </div>
        </motion.div>
      </div>

      {/* 영양 정보 박스 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4">영양 성분 (1인분 기준)</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {recipe.nutrition.calories?.toFixed(1) || "-"}
                </div>
                <div className="text-sm text-muted-foreground">칼로리 (kcal)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {recipe.nutrition.sodium?.toFixed(1) || "-"}
                </div>
                <div className="text-sm text-muted-foreground">나트륨 (mg)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {recipe.nutrition.carbohydrates?.toFixed(1) || "-"}
                </div>
                <div className="text-sm text-muted-foreground">탄수화물 (g)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {recipe.nutrition.protein?.toFixed(1) || "-"}
                </div>
                <div className="text-sm text-muted-foreground">단백질 (g)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {recipe.nutrition.fat?.toFixed(1) || "-"}
                </div>
                <div className="text-sm text-muted-foreground">지방 (g)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 재료 섹션 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4">재료 확인</h2>
            <div className="space-y-4">
              {/* 주재료 */}
              {recipe.ingredients.filter((ing) => !ing.category).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">주재료</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {recipe.ingredients
                      .filter((ing) => !ing.category)
                      .map((ingredient, index) => (
                        <li key={index}>{ingredient.name}</li>
                      ))}
                  </ul>
                </div>
              )}

              {/* 양념 */}
              {recipe.ingredients.filter((ing) => ing.category).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">양념</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {recipe.ingredients
                      .filter((ing) => ing.category)
                      .map((ingredient, index) => (
                        <li key={index}>
                          {ingredient.category && (
                            <span className="font-medium">
                              {ingredient.category}:{" "}
                            </span>
                          )}
                          {ingredient.name}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 조리 단계 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <h2 className="text-2xl font-bold mb-4">조리 순서</h2>
        <div className="space-y-6">
          {recipe.steps.map((step, index) => {
            const stepImageUrl = getManualImageUrl(
              step.originalImageUrl,
              step.localImagePath,
              recipe.frontmatter.rcp_seq,
              step.step
            );

            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <p className="text-lg leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>

                      {/* 조리 단계 이미지 */}
                      {stepImageUrl && (
                        <div className="relative w-full aspect-video overflow-hidden rounded-lg border bg-gray-100 mt-4">
                          <Image
                            src={stepImageUrl}
                            alt={`${recipe.title} 조리 단계 ${step.step}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

