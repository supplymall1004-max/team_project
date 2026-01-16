/**
 * @file fridge-quick-access-cards.tsx
 * @description 냉장고 페이지 바로가기 카드 섹션
 * 
 * 주요 기능:
 * 1. 바코드 스캔 바로가기
 * 2. 식재료 추가 바로가기
 * 3. 유통기한 임박 재료 확인
 */

"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Camera, Plus, AlertTriangle, IceCreamBowl } from "lucide-react";
import { motion } from "framer-motion";

interface FridgeQuickAccessCardsProps {
  expiringItemsCount?: number;
  onBarcodeClick?: () => void;
  onManualAddClick?: () => void;
}

export function FridgeQuickAccessCards({
  expiringItemsCount = 0,
  onBarcodeClick,
  onManualAddClick,
}: FridgeQuickAccessCardsProps) {
  const router = useRouter();

  const handleBarcodeClick = () => {
    if (onBarcodeClick) {
      onBarcodeClick();
    } else {
      // 바코드 스캔 기능으로 스크롤하거나 액션 수행
      router.push("/fridge#barcode-scan");
    }
  };

  const handleManualAddClick = () => {
    if (onManualAddClick) {
      onManualAddClick();
    } else {
      // 수동 추가 기능으로 스크롤하거나 액션 수행
      router.push("/fridge#manual-add");
    }
  };

  const handleExpiringClick = () => {
    // 유통기한 임박 재료 섹션으로 스크롤
    const expiringSection = document.getElementById("expiring-items");
    if (expiringSection) {
      expiringSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-2 w-full relative z-10">
      {/* 바코드 스캔 바로가기 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <button
          onClick={handleBarcodeClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleBarcodeClick();
            }
          }}
          className="flex items-center justify-between py-2.5 px-4 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition-all group w-full relative overflow-hidden"
          aria-label="바코드 스캔으로 식재료 추가하기"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
              <Camera className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-blue-900 text-sm">바코드 스캔</h3>
              <p className="text-xs text-blue-700">제품 바코드를 스캔하여 빠르게 추가</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors" />
        </button>
      </motion.div>

      {/* 수동 추가 바로가기 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <button
          onClick={handleManualAddClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleManualAddClick();
            }
          }}
          className="flex items-center justify-between py-2.5 px-4 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 hover:border-green-300 transition-all group w-full relative overflow-hidden"
          aria-label="수동으로 식재료 추가하기"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
              <Plus className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-green-900 text-sm">직접 추가</h3>
              <p className="text-xs text-green-700">식재료를 직접 입력하여 추가</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-green-400 group-hover:text-green-600 transition-colors" />
        </button>
      </motion.div>

      {/* 유통기한 임박 재료 바로가기 */}
      {expiringItemsCount > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <button
            onClick={handleExpiringClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleExpiringClick();
              }
            }}
            className="flex items-center justify-between py-2.5 px-4 bg-orange-50 border-2 border-orange-200 rounded-xl hover:bg-orange-100 hover:border-orange-300 transition-all group w-full relative overflow-hidden"
            aria-label={`유통기한 임박 재료 ${expiringItemsCount}개 확인하기`}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full group-hover:bg-orange-200 transition-colors relative">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                {expiringItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full">
                    {expiringItemsCount > 9 ? '9+' : expiringItemsCount}
                  </span>
                )}
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-orange-900 text-sm">유통기한 임박</h3>
                <p className="text-xs text-orange-700">
                  {expiringItemsCount}개의 재료가 곧 만료됩니다
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-orange-400 group-hover:text-orange-600 transition-colors" />
          </button>
        </motion.div>
      )}

      {/* 냉장고 관리 바로가기 (추가 옵션) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <button
          onClick={() => {
            const itemsSection = document.getElementById("fridge-items");
            if (itemsSection) {
              itemsSection.scrollIntoView({ behavior: "smooth" });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              const itemsSection = document.getElementById("fridge-items");
              if (itemsSection) {
                itemsSection.scrollIntoView({ behavior: "smooth" });
              }
            }
          }}
          className="flex items-center justify-between py-2.5 px-4 bg-purple-50 border-2 border-purple-200 rounded-xl hover:bg-purple-100 hover:border-purple-300 transition-all group w-full relative overflow-hidden"
          aria-label="냉장고 재료 전체 목록 보기"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
              <IceCreamBowl className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-purple-900 text-sm">전체 재료 목록</h3>
              <p className="text-xs text-purple-700">냉장고에 있는 모든 재료 확인</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-400 group-hover:text-purple-600 transition-colors" />
        </button>
      </motion.div>
    </div>
  );
}

