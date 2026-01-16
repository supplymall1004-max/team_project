/**
 * @file fridge-manager.tsx
 * @description 냉장고 식재료 관리 메인 컴포넌트
 * 
 * 주요 기능:
 * 1. 식재료 추가 (바코드/수동)
 * 2. 식재료 목록 표시
 * 3. 유통기한별 그룹화
 * 4. 삭제/수정 기능
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Plus, Loader2, AlertTriangle } from "lucide-react";
import { BarcodeScanner, ProductInfo } from "./barcode-scanner";
import { ManualInputForm } from "./manual-input-form";
import { FridgeItemsList } from "./fridge-items-list";
import { FridgeQuickAccessCards } from "./fridge-quick-access-cards";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";

export interface FridgeItem {
  id: string;
  name: string;
  barcode?: string;
  purchaseDate?: string;
  expiryDate: string;
  quantity?: string;
  category?: string;
  imageUrl?: string;
  notificationSent3days: boolean;
  notificationSent1day: boolean;
  notificationSentToday: boolean;
}

export function FridgeManager() {
  const { isSignedIn } = useAuth();
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ProductInfo | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      fetchFridgeItems();
    } else {
      setLoading(false);
    }
  }, [isSignedIn]);

  const fetchFridgeItems = async () => {
    try {
      const response = await fetch("/api/fridge/items");
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("냉장고 아이템 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = (barcode: string, productInfo?: ProductInfo) => {
    console.log("바코드 스캔 완료:", barcode, productInfo);
    setScannedProduct(productInfo || null);
    setShowBarcodeScanner(false);
    setShowManualInput(true);
  };

  const handleItemAdded = () => {
    setScannedProduct(null);
    setShowManualInput(false);
    fetchFridgeItems();
  };

  const handleItemDeleted = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  // 유통기한 임박 재료 개수 계산 (3일 이내)
  const expiringItemsCount = items.filter(item => {
    const expiryDate = new Date(item.expiryDate);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  }).length;

  return (
    <div className="space-y-6">
      {/* 바로가기 카드 섹션 - 항상 표시 */}
      <div className="w-full">
        <FridgeQuickAccessCards
          expiringItemsCount={expiringItemsCount}
          onBarcodeClick={isSignedIn ? () => setShowBarcodeScanner(true) : undefined}
          onManualAddClick={isSignedIn ? () => setShowManualInput(true) : undefined}
        />
      </div>

      {!isSignedIn ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              냉장고 관리 기능을 사용하려면 로그인이 필요합니다
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : (
        <>

      {/* 헤더 및 추가 버튼 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              🧊 우리집 냉장고
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBarcodeScanner(true)}
                className="gap-2"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">바코드 스캔</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setShowManualInput(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">직접 입력</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            식재료를 등록하고 유통기한을 관리하세요. 유통기한 임박 시 자동으로 알림을 받을 수 있습니다.
          </p>
        </CardContent>
      </Card>

      {/* 식재료 목록 */}
      <FridgeItemsList 
        items={items} 
        onItemDeleted={handleItemDeleted}
        onItemUpdated={fetchFridgeItems}
      />

      {/* 바코드 스캐너 모달 */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScanSuccess={handleBarcodeScanned}
      />

      {/* 수동 입력 모달 */}
      <ManualInputForm
        isOpen={showManualInput}
        onClose={() => {
          setShowManualInput(false);
          setScannedProduct(null);
        }}
        onSuccess={handleItemAdded}
        initialData={scannedProduct}
      />
        </>
      )}
    </div>
  );
}

