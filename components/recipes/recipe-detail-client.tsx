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
            {/* 식약처 레시피 조리 방법 및 요리 종류 (DB에 저장된 필드) */}
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

            {/* 요리 시작 버튼 - GDWEB 스타일 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Button
                size="lg"
                onClick={handleStartCooking}
                className="mt-4 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{
                  boxShadow: "0 8px 32px rgba(255, 107, 53, 0.3)",
                }}
              >
                <Play className="h-5 w-5 mr-2" />
                요리 시작하기
              </Button>
            </motion.div>
          </div>
        </div>
      </MotionWrapper>

      {/* 별점 평가 - GDWEB 카드 스타일 */}
      <MotionWrapper>
        <div className="rounded-2xl bg-white/95 backdrop-blur-md border-2 border-orange-200/50 p-6 gdweb-card shadow-lg">
          <RecipeRating
            recipeId={recipe.id}
            currentRating={recipe.user_rating}
            averageRating={recipe.rating_stats?.average_rating || 0}
            ratingCount={recipe.rating_stats?.rating_count || 0}
          />
        </div>
      </MotionWrapper>

      {/* 영양 정보 (식약처 레시피 데이터) - GDWEB 카드 스타일 */}
      {(recipe.foodsafety_info_eng ||
        recipe.foodsafety_info_car ||
        recipe.foodsafety_info_pro ||
        recipe.foodsafety_info_fat ||
        recipe.foodsafety_info_na ||
        recipe.foodsafety_info_fiber) && (
        <MotionWrapper>
          <div className="rounded-2xl bg-gradient-to-br from-white via-orange-50/30 to-white backdrop-blur-md border-2 border-orange-200/50 p-6 gdweb-card shadow-lg">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
            영양 정보
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {recipe.foodsafety_info_eng !== null &&
              recipe.foodsafety_info_eng !== undefined && (
                <div className="bg-white/80 rounded-xl p-4 border border-orange-100 hover:shadow-md transition-all duration-300">
                  <div className="text-sm text-gray-600 font-medium mb-1">칼로리</div>
                  <div className="text-xl font-bold text-orange-600">
                    {recipe.foodsafety_info_eng.toFixed(0)} kcal
                  </div>
                </div>
              )}
            {recipe.foodsafety_info_car !== null &&
              recipe.foodsafety_info_car !== undefined && (
                <div className="bg-white/80 rounded-xl p-4 border border-orange-100 hover:shadow-md transition-all duration-300">
                  <div className="text-sm text-gray-600 font-medium mb-1">탄수화물</div>
                  <div className="text-xl font-bold text-orange-600">
                    {recipe.foodsafety_info_car.toFixed(1)} g
                  </div>
                </div>
              )}
            {recipe.foodsafety_info_pro !== null &&
              recipe.foodsafety_info_pro !== undefined && (
                <div className="bg-white/80 rounded-xl p-4 border border-orange-100 hover:shadow-md transition-all duration-300">
                  <div className="text-sm text-gray-600 font-medium mb-1">단백질</div>
                  <div className="text-xl font-bold text-orange-600">
                    {recipe.foodsafety_info_pro.toFixed(1)} g
                  </div>
                </div>
              )}
            {recipe.foodsafety_info_fat !== null &&
              recipe.foodsafety_info_fat !== undefined && (
                <div className="bg-white/80 rounded-xl p-4 border border-orange-100 hover:shadow-md transition-all duration-300">
                  <div className="text-sm text-gray-600 font-medium mb-1">지방</div>
                  <div className="text-xl font-bold text-orange-600">
                    {recipe.foodsafety_info_fat.toFixed(1)} g
                  </div>
                </div>
              )}
            {recipe.foodsafety_info_na !== null &&
              recipe.foodsafety_info_na !== undefined && (
                <div className="bg-white/80 rounded-xl p-4 border border-orange-100 hover:shadow-md transition-all duration-300">
                  <div className="text-sm text-gray-600 font-medium mb-1">나트륨</div>
                  <div className="text-xl font-bold text-orange-600">
                    {recipe.foodsafety_info_na.toFixed(0)} mg
                  </div>
                </div>
              )}
            {recipe.foodsafety_info_fiber !== null &&
              recipe.foodsafety_info_fiber !== undefined && (
                <div className="bg-white/80 rounded-xl p-4 border border-orange-100 hover:shadow-md transition-all duration-300">
                  <div className="text-sm text-gray-600 font-medium mb-1">식이섬유</div>
                  <div className="text-xl font-bold text-orange-600">
                    {recipe.foodsafety_info_fiber.toFixed(1)} g
                  </div>
                </div>
              )}
          </div>
          </div>
        </MotionWrapper>
      )}

      {/* 재료 목록 - GDWEB 카드 스타일 */}
      <MotionWrapper>
        <div className="rounded-2xl bg-gradient-to-br from-white via-orange-50/30 to-white backdrop-blur-md border-2 border-orange-200/50 p-6 gdweb-card shadow-lg">
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
          재료
        </h2>
        <ul className="space-y-3">
          {recipe.ingredients.map((ingredient) => {
            const isChecked = checkedIngredients.has(ingredient.id);
            return (
              <motion.li
                key={ingredient.id}
                className="flex items-center gap-3 cursor-pointer bg-white/80 rounded-xl p-3 border border-orange-100 hover:shadow-md hover:bg-white transition-all duration-300"
                onClick={() => handleIngredientToggle(ingredient.id)}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <CheckCircle2
                  className={`h-6 w-6 flex-shrink-0 transition-all duration-300 ${
                    isChecked
                      ? "text-green-600 fill-green-600 scale-110"
                      : "text-gray-300 hover:text-orange-400"
                  }`}
                />
                <span
                  className={`flex-1 font-medium ${
                    isChecked 
                      ? "line-through text-gray-400" 
                      : "text-gray-700"
                  }`}
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
              </motion.li>
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

  // 식약처 레시피 이미지 우선 사용, 없으면 thumbnail_url, 둘 다 없으면 기본 이미지
  const imageUrl =
    recipe.foodsafety_att_file_no_main ||
    recipe.thumbnail_url ||
    "/images/food/default.svg";

  return (
    <motion.div
      className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-100 shadow-2xl"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      style={{
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
      }}
    >
      {!imageError ? (
        <Image
          src={imageUrl}
          alt={recipe.title}
          fill
          className="object-cover transition-transform duration-500 hover:scale-105"
          sizes="100vw"
          priority
          quality={85}
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPg=="
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200">
          <div className="text-center">
            <p className="text-sm text-gray-600">이미지를 불러올 수 없습니다</p>
          </div>
        </div>
      )}
      {/* 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
    </motion.div>
  );
}

