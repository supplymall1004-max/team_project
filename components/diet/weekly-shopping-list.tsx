/**
 * @file components/diet/weekly-shopping-list.tsx
 * @description 주간 장보기 리스트 컴포넌트
 * 
 * 카테고리별로 재료를 그룹화하여 표시
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShoppingListItem as ShoppingListItemType } from "@/types/weekly-diet";

interface ShoppingListItem extends Omit<ShoppingListItemType, "id"> {
  id: string; // 컴포넌트에서 필수로 사용하므로 필수로 만듦
}

interface WeeklyShoppingListProps {
  items: ShoppingListItem[];
  onTogglePurchase?: (itemId: string, purchased: boolean) => void;
  className?: string;
}

export function WeeklyShoppingList({
  items,
  onTogglePurchase,
  className,
}: WeeklyShoppingListProps) {
  const [purchasedItems, setPurchasedItems] = useState<Set<string>>(
    new Set(items.filter((item) => item.is_purchased).map((item) => item.id))
  );

  // 카테고리별로 그룹화
  const itemsByCategory = groupByCategory(items);
  const categories = Object.keys(itemsByCategory).sort();

  // 구매 완료율 계산
  const totalItems = items.length;
  const purchasedCount = purchasedItems.size;
  const completionRate = totalItems > 0 ? (purchasedCount / totalItems) * 100 : 0;

  const handleToggle = (itemId: string, checked: boolean) => {
    const newPurchased = new Set(purchasedItems);
    if (checked) {
      newPurchased.add(itemId);
    } else {
      newPurchased.delete(itemId);
    }
    setPurchasedItems(newPurchased);
    onTogglePurchase?.(itemId, checked);
  };

  const handleMarkAllPurchased = () => {
    const allIds = new Set(items.map((item) => item.id));
    setPurchasedItems(allIds);
    items.forEach((item) => onTogglePurchase?.(item.id, true));
  };

  const handleClearAll = () => {
    setPurchasedItems(new Set());
    items.forEach((item) => onTogglePurchase?.(item.id, false));
  };

  if (items.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">장보기 리스트가 비어있습니다</p>
          <p className="text-sm text-muted-foreground">
            주간 식단을 생성하면 자동으로 재료가 집계됩니다
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 헤더 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              <CardTitle>장보기 리스트</CardTitle>
              <Badge variant="secondary">
                {purchasedCount} / {totalItems}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllPurchased}
                disabled={purchasedCount === totalItems}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                전체 완료
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={purchasedCount === 0}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                초기화
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* 진행률 바 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">구매 진행률</span>
              <span className="font-medium">{Math.round(completionRate)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 카테고리별 아이템 */}
      {categories.map((category) => {
        const categoryItems = itemsByCategory[category];
        const purchasedInCategory = categoryItems.filter((item) =>
          purchasedItems.has(item.id)
        ).length;

        return (
          <Card key={category}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{category}</CardTitle>
                <Badge variant="outline">
                  {purchasedInCategory} / {categoryItems.length}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {categoryItems.map((item) => {
                  const isPurchased = purchasedItems.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                        isPurchased
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <Checkbox
                        checked={isPurchased}
                        onCheckedChange={(checked) =>
                          handleToggle(item.id, checked as boolean)
                        }
                        className="mt-0.5"
                      />

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "font-medium",
                              isPurchased && "line-through text-muted-foreground"
                            )}
                          >
                            {item.ingredient_name}
                          </span>
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isPurchased
                                ? "text-muted-foreground"
                                : "text-foreground"
                            )}
                          >
                            {item.total_quantity.toFixed(1)} {item.unit}
                          </span>
                        </div>

                        {item.recipes_using.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-xs text-muted-foreground">
                              사용:
                            </span>
                            {item.recipes_using.slice(0, 3).map((recipeId, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs"
                              >
                                레시피 {idx + 1}
                              </Badge>
                            ))}
                            {item.recipes_using.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{item.recipes_using.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * 카테고리별로 아이템 그룹화
 */
function groupByCategory(
  items: ShoppingListItem[]
): Record<string, ShoppingListItem[]> {
  const grouped: Record<string, ShoppingListItem[]> = {};

  for (const item of items) {
    const category = item.category || "기타";
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(item);
  }

  // 각 카테고리 내에서 이름순 정렬
  for (const category of Object.keys(grouped)) {
    grouped[category].sort((a, b) =>
      a.ingredient_name.localeCompare(b.ingredient_name)
    );
  }

  return grouped;
}










