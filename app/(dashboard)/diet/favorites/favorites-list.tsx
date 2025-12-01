/**
 * @file favorites-list.tsx
 * @description 즐겨찾기 목록 컴포넌트
 */

"use client";

import { useState, useEffect } from "react";
import { Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFavoriteMeals, removeFavoriteMeal } from "@/lib/diet/favorite-meals";
import type { FavoriteMeal } from "@/types/diet";
import { toast } from "sonner";
import { MEAL_TYPE_LABELS } from "@/types/health";

export function FavoritesList() {
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setIsLoading(true);
    console.group("[FavoritesList] 즐겨찾기 목록 로드");

    try {
      const result = await getFavoriteMeals();
      if (result.success && result.favorites) {
        setFavorites(result.favorites);
        console.log("✅ 즐겨찾기 목록 로드 성공:", result.favorites.length, "개");
      } else {
        console.error("❌ 즐겨찾기 목록 로드 실패:", result.error);
        toast.error(result.error || "즐겨찾기 목록을 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("❌ 즐겨찾기 목록 로드 오류:", error);
      toast.error("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  };

  const handleDelete = async (favoriteId: string, recipeId: string) => {
    if (!recipeId) {
      toast.error("레시피 ID가 없어 삭제할 수 없습니다.");
      return;
    }

    setDeletingIds((prev) => new Set(prev).add(favoriteId));
    console.group("[FavoritesList] 즐겨찾기 삭제");
    console.log("favoriteId:", favoriteId);
    console.log("recipeId:", recipeId);

    try {
      const result = await removeFavoriteMeal(recipeId);
      if (result.success) {
        setFavorites((prev) => prev.filter((fav) => fav.id !== favoriteId));
        toast.success("즐겨찾기에서 제거되었습니다.");
        console.log("✅ 즐겨찾기 삭제 성공");
      } else {
        toast.error(result.error || "즐겨찾기 삭제에 실패했습니다.");
        console.error("❌ 즐겨찾기 삭제 실패:", result.error);
      }
    } catch (error) {
      console.error("❌ 즐겨찾기 삭제 오류:", error);
      toast.error("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(favoriteId);
        return next;
      });
      console.groupEnd();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">즐겨찾기 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">저장된 즐겨찾기가 없습니다</h3>
        <p className="text-gray-600 mb-6">
          식단 카드의 하트 아이콘을 클릭하여 즐겨찾기에 추가하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-600">
          총 <span className="font-semibold text-orange-600">{favorites.length}</span>개의 즐겨찾기
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {favorites.map((favorite) => (
          <div
            key={favorite.id}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{favorite.recipe_title}</h3>
                {favorite.meal_type && (
                  <span className="inline-block px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                    {MEAL_TYPE_LABELS[favorite.meal_type]}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(favorite.id, favorite.recipe_id || "")}
                disabled={deletingIds.has(favorite.id) || !favorite.recipe_id}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* 영양 정보 */}
            {(favorite.calories !== null ||
              favorite.protein !== null ||
              favorite.carbs !== null ||
              favorite.fat !== null) && (
              <div className="grid grid-cols-4 gap-2 rounded-lg bg-gray-50 p-3 mb-4">
                {favorite.calories !== null && (
                  <div className="text-center">
                    <p className="text-xs text-gray-600">칼로리</p>
                    <p className="text-sm font-bold">{favorite.calories}</p>
                  </div>
                )}
                {favorite.protein !== null && (
                  <div className="text-center">
                    <p className="text-xs text-gray-600">단백질</p>
                    <p className="text-sm font-bold">{Math.round(favorite.protein)}g</p>
                  </div>
                )}
                {favorite.carbs !== null && (
                  <div className="text-center">
                    <p className="text-xs text-gray-600">탄수화물</p>
                    <p className="text-sm font-bold">{Math.round(favorite.carbs)}g</p>
                  </div>
                )}
                {favorite.fat !== null && (
                  <div className="text-center">
                    <p className="text-xs text-gray-600">지방</p>
                    <p className="text-sm font-bold">{Math.round(favorite.fat)}g</p>
                  </div>
                )}
              </div>
            )}

            {/* 메모 */}
            {favorite.notes && (
              <p className="text-sm text-gray-600 italic">&quot;{favorite.notes}&quot;</p>
            )}

            {/* 저장 날짜 */}
            <p className="text-xs text-gray-400 mt-4">
              저장일: {new Date(favorite.created_at).toLocaleDateString("ko-KR")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}



