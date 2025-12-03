/**
 * @file meal-kit-selector.tsx
 * @description 밀키트 선택 UI 컴포넌트
 *
 * 주요 기능:
 * 1. 밀키트 목록 표시
 * 2. 밀키트 선택/해제
 * 3. 프리미엄 전용 기능
 */

"use client";

import { useState, useEffect } from "react";
import { Package, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMealKits } from "@/actions/diet/get-meal-kits";
import { PremiumGate } from "@/components/premium/premium-gate";
import { getCurrentSubscription } from "@/actions/payments/get-subscription";
import type { MealKit, MealKitProduct } from "@/types/diet";
import type { MealType } from "@/types/health";
import { toast } from "sonner";

interface MealKitSelectorProps {
  /** 선택된 밀키트 ID 목록 */
  selectedMealKitIds: string[];
  /** 밀키트 선택 변경 핸들러 */
  onSelectionChange: (ids: string[]) => void;
  /** 식사 유형 필터 */
  mealType?: MealType;
  /** 카테고리 필터 */
  category?: string;
}

export function MealKitSelector({
  selectedMealKitIds,
  onSelectionChange,
  mealType,
  category,
}: MealKitSelectorProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mealKits, setMealKits] = useState<MealKit[]>([]);
  const [coupangProducts, setCoupangProducts] = useState<MealKitProduct[]>([]);

  // 프리미엄 여부 확인
  useEffect(() => {
    async function checkPremium() {
      try {
        const subscription = await getCurrentSubscription();
        setIsPremium(subscription.isPremium);
      } catch (error) {
        console.error("[MealKitSelector] 프리미엄 확인 실패:", error);
        setIsPremium(false);
      }
    }

    checkPremium();
  }, []);

  // 밀키트 목록 로드
  useEffect(() => {
    async function loadMealKits() {
      if (!isPremium) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      console.group("[MealKitSelector] 밀키트 목록 로드");

      try {
        const result = await getMealKits({
          category,
          mealType,
          useCoupang: true,
        });

        if (result.success) {
          if (result.mealKits) {
            setMealKits(result.mealKits);
            setCoupangProducts([]);
          } else if (result.coupangProducts) {
            setCoupangProducts(result.coupangProducts);
            setMealKits([]);
          }
          console.log("✅ 밀키트 목록 로드 성공");
        } else {
          toast.error(result.error || "밀키트 목록을 불러오는데 실패했습니다.");
          console.error("❌ 밀키트 목록 로드 실패:", result.error);
        }
      } catch (error) {
        console.error("❌ 밀키트 목록 로드 오류:", error);
        toast.error("오류가 발생했습니다. 다시 시도해주세요.");
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    }

    loadMealKits();
  }, [isPremium, category, mealType]);

  const handleToggle = (id: string, isCoupang: boolean = false) => {
    const fullId = isCoupang ? `coupang_${id}` : id;
    const newSelection = selectedMealKitIds.includes(fullId)
      ? selectedMealKitIds.filter((selectedId) => selectedId !== fullId)
      : [...selectedMealKitIds, fullId];

    onSelectionChange(newSelection);
    console.group("[MealKitSelector] 밀키트 선택 토글");
    console.log("id:", fullId);
    console.log("선택된 목록:", newSelection);
    console.groupEnd();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">밀키트 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const allProducts = [
    ...mealKits.map((kit) => ({ ...kit, isCoupang: false })),
    ...coupangProducts.map((product) => ({ ...product, isCoupang: true })),
  ];

  return (
    <PremiumGate
      isPremium={isPremium}
      variant="card"
      message="밀키트 식단은 프리미엄 전용 기능입니다. 쿠팡에서 판매하는 밀키트를 식단에 추가하세요!"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold">밀키트 선택</h3>
          <span className="text-sm text-gray-500">
            ({selectedMealKitIds.length}개 선택됨)
          </span>
        </div>

        {allProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>사용 가능한 밀키트가 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allProducts.map((product) => {
              const fullId = product.isCoupang
                ? `coupang_${product.id}`
                : product.id;
              const isSelected = selectedMealKitIds.includes(fullId);
              const name = product.isCoupang
                ? (product as MealKitProduct).name
                : (product as MealKit).name;
              const price = product.isCoupang
                ? (product as MealKitProduct).price
                : (product as MealKit).price;
              const imageUrl = product.isCoupang
                ? (product as MealKitProduct).image_url
                : (product as MealKit).image_url;
              const purchaseUrl = product.isCoupang
                ? (product as MealKitProduct).product_url
                : (product as MealKit).purchase_url;

              return (
                <div
                  key={fullId}
                  className={`rounded-lg border-2 p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 bg-white hover:border-orange-300"
                  }`}
                  onClick={() => handleToggle(product.id, product.isCoupang)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 flex-1">{name}</h4>
                    {product.isCoupang && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        쿠팡
                      </span>
                    )}
                  </div>

                  {imageUrl && (
                    <div className="mb-2">
                      <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-orange-600">
                      {price.toLocaleString()}원
                    </span>
                    {purchaseUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(purchaseUrl, "_blank");
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {isSelected && (
                    <div className="mt-2 text-sm text-orange-600 font-medium">
                      ✓ 선택됨
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PremiumGate>
  );
}



