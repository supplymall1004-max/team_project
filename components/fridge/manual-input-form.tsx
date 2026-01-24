/**
 * @file manual-input-form.tsx
 * @description 식재료 수동 입력 폼
 */

"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { ProductInfo } from "./barcode-scanner";
import { addFridgeItem } from "@/actions/fridge/manage-ingredients";
import { useToast } from "@/hooks/use-toast";

interface ManualInputFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: ProductInfo | null;
}

export function ManualInputForm({ isOpen, onClose, onSuccess, initialData }: ManualInputFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    expiryDate: "",
    purchaseDate: "",
    category: "",
    barcode: "",
  });

  useEffect(() => {
    // 다이얼로그가 열릴 때 initialData가 있으면 폼을 채움
    if (isOpen && initialData) {
      const today = new Date();
      const expiryDate = new Date(today);
      expiryDate.setDate(today.getDate() + (initialData.shelfLifeDays || 7));

      setFormData({
        name: initialData.name || "",
        quantity: "1개",
        expiryDate: expiryDate.toISOString().split("T")[0],
        purchaseDate: today.toISOString().split("T")[0],
        category: initialData.category || "",
        barcode: initialData.barcode || "",
      });
    } else if (!isOpen) {
      // 다이얼로그가 닫힐 때 폼 초기화 (handleClose에서도 초기화하지만 안전을 위해)
      resetForm();
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await addFridgeItem({
        name: formData.name,
        quantity: formData.quantity,
        expiryDate: formData.expiryDate,
        purchaseDate: formData.purchaseDate || undefined,
        category: formData.category || undefined,
        barcode: formData.barcode || undefined,
      });

      if (result.success) {
        toast({
          title: "식재료 추가 완료",
          description: `${formData.name}이(가) 냉장고에 추가되었습니다.`,
        });
        onSuccess();
        resetForm();
      } else {
        toast({
          title: "추가 실패",
          description: result.error || "식재료 추가에 실패했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("식재료 추가 오류:", error);
      toast({
        title: "오류 발생",
        description: "예기치 않은 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      quantity: "",
      expiryDate: "",
      purchaseDate: "",
      category: "",
      barcode: "",
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>식재료 추가</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 제품명 */}
          <div className="space-y-2">
            <Label htmlFor="name">제품명 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="예: 우유, 계란, 김치"
              required
            />
          </div>

          {/* 수량 */}
          <div className="space-y-2">
            <Label htmlFor="quantity">수량</Label>
            <Input
              id="quantity"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="예: 1개, 500g"
            />
          </div>

          {/* 구매일 */}
          <div className="space-y-2">
            <Label htmlFor="purchaseDate">구매일</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            />
          </div>

          {/* 유통기한 */}
          <div className="space-y-2">
            <Label htmlFor="expiryDate">유통기한 *</Label>
            <Input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              required
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-2">
            <Label htmlFor="category">카테고리</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="예: 유제품, 채소, 육류"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  추가 중...
                </>
              ) : (
                "추가"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

