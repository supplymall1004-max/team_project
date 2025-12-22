/**
 * @file recipe-detail-client.tsx
 * @description 레시피 상세 페이지 클라이언트 컴포넌트
 *
 * 주요 기능:
 * 1. 레시피 메타 정보 표시 (제목, 설명, 별점, 난이도, 조리 시간)
 * 2. 재료 목록 표시
 * 3. 단계별 카드 형식 레시피 표시
 * 4. 요리 시작 모드 전환 (타이머, 체크리스트)
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import { Clock, ChefHat, Star, Play, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { MotionWrapper } from "@/components/motion/motion-wrapper";
import { RecipeDetail } from "@/types/recipe";
import {
  formatCookingTime,
  formatDifficulty,
  getRatingStars,
} from "@/lib/recipes/utils";
import { Button } from "@/components/ui/button";
import { RecipeStepCard } from "./recipe-step-card";
import { RecipeBlogSteps } from "./recipe-blog-steps";
import { CookingMode } from "./cooking-mode";
import { RecipeRating } from "./recipe-rating";

interface RecipeDetailClientProps {
  recipe: RecipeDetail;
}

export function RecipeDetailClient({ recipe }: RecipeDetailClientProps) {
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(
    new Set()
  );

  const ratingStars = getRatingStars(recipe.rating_stats?.average_rating || 0);

  const handleIngredientToggle = (ingredientId: string) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(ingredientId)) {
        next.delete(ingredientId);
      } else {
        next.add(ingredientId);
      }
      return next;
    });
  };

  const handleStartCooking = () => {
    console.groupCollapsed("[RecipeDetail] 요리 시작");
    console.log("recipeId", recipe.id);
    console.log("stepsCount", recipe.steps.length);
    console.groupEnd();
    setIsCookingMode(true);
  };

  if (isCookingMode) {
    return (
      <CookingMode
        recipe={recipe}
        checkedIngredients={checkedIngredients}
        onIngredientToggle={handleIngredientToggle}
        onExit={() => setIsCookingMode(false)}
      />
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
      <MotionWrapper>
        <div className="space-y-4">
          <RecipeHeroImage recipe={recipe} />

          {/* 제목 및 메타 정보 */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h1 className="text-4xl font-bold mb-2">{recipe.title}</h1>
              {recipe.description && (
                <p className="text-lg text-muted-foreground">
                  {recipe.description}
                </p>
              )}
            </motion.div>

          {/* 별점 */}
          {recipe.rating_stats && recipe.rating_stats.rating_count > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {ratingStars.map((star, index) => (
                  <Star
                    key={index}
                    className={`h-5 w-5 ${
                      star === "full"
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {recipe.rating_stats.average_rating.toFixed(1)} (
                {recipe.rating_stats.rating_count}개 평가)
              </span>
            </div>
          )}

          {/* 메타 정보 (조리 시간, 난이도, 인분) */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>{formatCookingTime(recipe.cooking_time_minutes)}</span>
            </div>
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              <span>{formatDifficulty(recipe.difficulty)}</span>
            </div>
            <div>
              <span>{recipe.servings}인분</span>
            </div>
            {/* 식약처 API 조리 방법 및 요리 종류 */}
            {recipe.foodsafety_rcp_way2 && (
              <div>
                <span className="text-xs text-muted-foreground">조리방법: </span>
                <span>{recipe.foodsafety_rcp_way2}</span>
              </div>
            )}
            {recipe.foodsafety_rcp_pat2 && (
              <div>
                <span className="text-xs text-muted-foreground">요리종류: </span>
                <span>{recipe.foodsafety_rcp_pat2}</span>
              </div>
            )}
          </div>

            {/* 요리 시작 버튼 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Button size="lg" onClick={handleStartCooking} className="mt-4">
                <Play className="h-5 w-5 mr-2" />
                요리 시작하기
              </Button>
            </motion.div>
          </div>
        </div>
      </MotionWrapper>

      {/* 별점 평가 */}
      <MotionWrapper>
        <div className="rounded-2xl border border-border/60 bg-white p-6">
          <RecipeRating
            recipeId={recipe.id}
            currentRating={recipe.user_rating}
            averageRating={recipe.rating_stats?.average_rating || 0}
            ratingCount={recipe.rating_stats?.rating_count || 0}
          />
        </div>
      </MotionWrapper>

      {/* 영양 정보 (식약처 API 데이터) */}
      {(recipe.foodsafety_info_eng ||
        recipe.foodsafety_info_car ||
        recipe.foodsafety_info_pro ||
        recipe.foodsafety_info_fat ||
        recipe.foodsafety_info_na ||
        recipe.foodsafety_info_fiber) && (
        <MotionWrapper>
          <div className="rounded-2xl border border-border/60 bg-white p-6">
          <h2 className="text-2xl font-bold mb-4">영양 정보</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {recipe.foodsafety_info_eng !== null &&
              recipe.foodsafety_info_eng !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">칼로리</div>
                  <div className="text-lg font-semibold">
                    {recipe.foodsafety_info_eng.toFixed(0)} kcal
                  </div>
                </div>
              )}
            {recipe.foodsafety_info_car !== null &&
              recipe.foodsafety_info_car !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">탄수화물</div>
                  <div className="text-lg font-semibold">
                    {recipe.foodsafety_info_car.toFixed(1)} g
                  </div>
                </div>
              )}
            {recipe.foodsafety_info_pro !== null &&
              recipe.foodsafety_info_pro !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">단백질</div>
                  <div className="text-lg font-semibold">
                    {recipe.foodsafety_info_pro.toFixed(1)} g
                  </div>
                </div>
              )}
            {recipe.foodsafety_info_fat !== null &&
              recipe.foodsafety_info_fat !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">지방</div>
                  <div className="text-lg font-semibold">
                    {recipe.foodsafety_info_fat.toFixed(1)} g
                  </div>
                </div>
              )}
            {recipe.foodsafety_info_na !== null &&
              recipe.foodsafety_info_na !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">나트륨</div>
                  <div className="text-lg font-semibold">
                    {recipe.foodsafety_info_na.toFixed(0)} mg
                  </div>
                </div>
              )}
            {recipe.foodsafety_info_fiber !== null &&
              recipe.foodsafety_info_fiber !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">식이섬유</div>
                  <div className="text-lg font-semibold">
                    {recipe.foodsafety_info_fiber.toFixed(1)} g
                  </div>
                </div>
              )}
          </div>
          </div>
        </MotionWrapper>
      )}

      {/* 재료 목록 */}
      <MotionWrapper>
        <div className="rounded-2xl border border-border/60 bg-white p-6">
        <h2 className="text-2xl font-bold mb-4">재료</h2>
        <ul className="space-y-3">
          {recipe.ingredients.map((ingredient) => {
            const isChecked = checkedIngredients.has(ingredient.id);
            return (
              <li
                key={ingredient.id}
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => handleIngredientToggle(ingredient.id)}
              >
                <CheckCircle2
                  className={`h-5 w-5 flex-shrink-0 ${
                    isChecked
                      ? "text-green-600 fill-green-600"
                      : "text-gray-300"
                  }`}
                />
                <span
                  className={isChecked ? "line-through text-muted-foreground" : ""}
                >
                  {/* 하위 호환성: ingredient_name 또는 name 사용 */}
                  {ingredient.ingredient_name || ingredient.name}
                  {ingredient.quantity && ingredient.unit
                    ? ` ${ingredient.quantity}${ingredient.unit}`
                    : ingredient.quantity
                    ? ` ${ingredient.quantity}`
                    : ""}
                  {/* 하위 호환성: preparation_note 또는 notes 사용 */}
                  {(ingredient.preparation_note || ingredient.notes) && 
                    ` (${ingredient.preparation_note || ingredient.notes})`}
                  {/* 선택 재료 표시 */}
                  {ingredient.is_optional && (
                    <span className="ml-2 text-xs text-muted-foreground">(선택)</span>
                  )}
                  {/* 카테고리 표시 (선택사항) */}
                  {ingredient.category && ingredient.category !== "기타" && (
                    <span className="ml-2 text-xs text-blue-600">[{ingredient.category}]</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        </div>
      </MotionWrapper>

      {/* 조리 과정 (블로그 형태) */}
      <MotionWrapper>
        <RecipeBlogSteps steps={recipe.steps} />
      </MotionWrapper>
    </motion.div>
  );
}

interface RecipeHeroImageProps {
  recipe: RecipeDetail;
}

function RecipeHeroImage({ recipe }: RecipeHeroImageProps) {
  const [imageError, setImageError] = useState(false);

  // 식약처 API 이미지 우선 사용, 없으면 thumbnail_url, 둘 다 없으면 기본 이미지
  const imageUrl =
    recipe.foodsafety_att_file_no_main ||
    recipe.thumbnail_url ||
    "/images/food/default.svg";

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-100">
      {!imageError ? (
        <Image
          src={imageUrl}
          alt={recipe.title}
          fill
          className="object-cover"
          sizes="100vw"
          priority
          quality={85}
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPg=="
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">이미지를 불러올 수 없습니다</p>
          </div>
        </div>
      )}
    </div>
  );
}

