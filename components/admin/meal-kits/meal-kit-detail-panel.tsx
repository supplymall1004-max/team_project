/**
 * @file components/admin/meal-kits/meal-kit-detail-panel.tsx
 * @description 관리자 밀키트 제품 상세 편집 패널
 *
 * 주요 기능:
 * 1. 선택된 밀키트의 상세 정보 표시 및 편집
 * 2. 저장/삭제 액션
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { Save, Trash2, ArrowLeft, Package, DollarSign, Users, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { saveMealKit } from "@/actions/admin/meal-kits/save";
import { deleteMealKit } from "@/actions/admin/meal-kits/delete";
import type { AdminMealKit } from "@/actions/admin/meal-kits/list";
import type { MealType } from "@/types/health";

interface MealKitDetailPanelProps {
  mealKit: AdminMealKit;
  onUpdate?: () => void;
  onBack?: () => void;
}

export function MealKitDetailPanel({ mealKit, onUpdate, onBack }: MealKitDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 편집 폼 상태
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    image_url: "",
    price: 0,
    serving_size: 1,
    calories: null as number | null,
    protein: null as number | null,
    carbs: null as number | null,
    fat: null as number | null,
    category: "other" as "korean" | "western" | "japanese" | "chinese" | "fusion" | "other",
    meal_type: [] as MealType[],
    purchase_url: "",
    is_active: true,
    is_premium_only: true,
  });

  const { toast } = useToast();

  // 선택된 밀키트가 변경되면 편집 폼 초기화
  useEffect(() => {
    setEditForm({
      name: mealKit.name,
      description: mealKit.description || "",
      image_url: mealKit.image_url || "",
      price: mealKit.price,
      serving_size: mealKit.serving_size,
      calories: mealKit.calories,
      protein: mealKit.protein,
      carbs: mealKit.carbs,
      fat: mealKit.fat,
      category: (mealKit.category as typeof editForm.category) || "other",
      meal_type: mealKit.meal_type || [],
      purchase_url: mealKit.purchase_url || "",
      is_active: mealKit.is_active,
      is_premium_only: mealKit.is_premium_only,
    });
    setIsEditing(false);
    // editForm은 이 useEffect에서 설정하는 값이므로 의존성에 포함하지 않음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealKit]);

  // 폼 변경 핸들러
  const handleFormChange = useCallback((field: string, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // 식사 타입 토글
  const handleMealTypeToggle = useCallback((mealType: MealType) => {
    setEditForm(prev => {
      const current = prev.meal_type;
      const newMealTypes = current.includes(mealType)
        ? current.filter(mt => mt !== mealType)
        : [...current, mealType];
      return { ...prev, meal_type: newMealTypes };
    });
  }, []);

  // 저장 핸들러
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      console.group("[AdminConsole][MealKits][Detail]");
      console.log("event", "save-meal-kit");
      console.log("meal_kit_id", mealKit.id);

      const result = await saveMealKit({
        id: mealKit.id,
        ...editForm,
        image_url: editForm.image_url || null,
        purchase_url: editForm.purchase_url || null,
      });

      if (result.success) {
        toast({
          title: "저장 완료",
          description: `"${editForm.name}"이 저장되었습니다.`,
        });
        setIsEditing(false);
        onUpdate?.();
        console.log("save_success", result.data.id);
      } else {
        const errorMessage = "error" in result ? result.error : "알 수 없는 오류가 발생했습니다";
        toast({
          title: "저장 실패",
          description: errorMessage,
          variant: "destructive",
        });
        console.error("save_error", errorMessage);
      }
    } catch (error) {
      console.error("save_unexpected_error", error);
      toast({
        title: "오류 발생",
        description: "저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      console.groupEnd();
    }
  }, [mealKit.id, editForm, toast, onUpdate]);

  // 삭제 핸들러
  const handleDelete = useCallback(async () => {
    if (!confirm(`"${mealKit.name}"을(를) 삭제하시겠습니까?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      console.group("[AdminConsole][MealKits][Detail]");
      console.log("event", "delete-meal-kit");
      console.log("meal_kit_id", mealKit.id);

      const result = await deleteMealKit({ id: mealKit.id, hardDelete: false });

      if (result.success) {
        toast({
          title: "삭제 완료",
          description: `"${mealKit.name}"이 비활성화되었습니다.`,
        });
        onUpdate?.();
        console.log("delete_success");
      } else {
        const errorMessage = "error" in result ? result.error : "알 수 없는 오류가 발생했습니다";
        toast({
          title: "삭제 실패",
          description: errorMessage,
          variant: "destructive",
        });
        console.error("delete_error", errorMessage);
      }
    } catch (error) {
      console.error("delete_unexpected_error", error);
      toast({
        title: "오류 발생",
        description: "삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      console.groupEnd();
    }
  }, [mealKit.id, mealKit.name, toast, onUpdate]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {isEditing ? "밀키트 편집" : "밀키트 상세"}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  취소
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "저장 중..." : "저장"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "삭제 중..." : "삭제"}
                </Button>
                <Button onClick={() => setIsEditing(true)}>
                  편집
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-6">
        {/* 기본 정보 */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">기본 정보</h3>
          
          <div>
            <Label>제품명 *</Label>
            <Input
              value={editForm.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
              disabled={!isEditing}
              placeholder="예: 한식 밀키트 세트"
            />
          </div>

          <div>
            <Label>설명</Label>
            <Textarea
              value={editForm.description}
              onChange={(e) => handleFormChange("description", e.target.value)}
              disabled={!isEditing}
              placeholder="제품에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>가격 (원) *</Label>
              <Input
                type="number"
                value={editForm.price}
                onChange={(e) => handleFormChange("price", parseInt(e.target.value) || 0)}
                disabled={!isEditing}
                placeholder="0"
              />
            </div>
            <div>
              <Label>인분 수 *</Label>
              <Input
                type="number"
                value={editForm.serving_size}
                onChange={(e) => handleFormChange("serving_size", parseInt(e.target.value) || 1)}
                disabled={!isEditing}
                placeholder="1"
                min={1}
              />
            </div>
          </div>

          <div>
            <Label>카테고리</Label>
            <Select
              value={editForm.category}
              onValueChange={(value) => handleFormChange("category", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="korean">한식</SelectItem>
                <SelectItem value="western">양식</SelectItem>
                <SelectItem value="japanese">일식</SelectItem>
                <SelectItem value="chinese">중식</SelectItem>
                <SelectItem value="fusion">퓨전</SelectItem>
                <SelectItem value="other">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>식사 타입</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((mealType) => (
                <div key={mealType} className="flex items-center space-x-2">
                  <Checkbox
                    id={`meal-type-${mealType}`}
                    checked={editForm.meal_type.includes(mealType)}
                    onCheckedChange={() => handleMealTypeToggle(mealType)}
                    disabled={!isEditing}
                  />
                  <Label
                    htmlFor={`meal-type-${mealType}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {mealType === "breakfast" ? "아침" : mealType === "lunch" ? "점심" : mealType === "dinner" ? "저녁" : "간식"}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 이미지 및 링크 */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">이미지 및 링크</h3>
          
          <div>
            <Label>이미지 URL</Label>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <Input
                type="url"
                value={editForm.image_url}
                onChange={(e) => handleFormChange("image_url", e.target.value)}
                disabled={!isEditing}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            {editForm.image_url && (
              <img
                src={editForm.image_url}
                alt={editForm.name}
                className="mt-2 w-32 h-32 object-cover rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
          </div>

          <div>
            <Label>구매 링크</Label>
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <Input
                type="url"
                value={editForm.purchase_url}
                onChange={(e) => handleFormChange("purchase_url", e.target.value)}
                disabled={!isEditing}
                placeholder="https://example.com/product"
              />
            </div>
          </div>
        </div>

        {/* 영양 정보 */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">영양 정보 (선택사항)</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>칼로리 (kcal)</Label>
              <Input
                type="number"
                value={editForm.calories || ""}
                onChange={(e) => handleFormChange("calories", e.target.value ? parseInt(e.target.value) : null)}
                disabled={!isEditing}
                placeholder="0"
              />
            </div>
            <div>
              <Label>단백질 (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={editForm.protein || ""}
                onChange={(e) => handleFormChange("protein", e.target.value ? parseFloat(e.target.value) : null)}
                disabled={!isEditing}
                placeholder="0"
              />
            </div>
            <div>
              <Label>탄수화물 (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={editForm.carbs || ""}
                onChange={(e) => handleFormChange("carbs", e.target.value ? parseFloat(e.target.value) : null)}
                disabled={!isEditing}
                placeholder="0"
              />
            </div>
            <div>
              <Label>지방 (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={editForm.fat || ""}
                onChange={(e) => handleFormChange("fat", e.target.value ? parseFloat(e.target.value) : null)}
                disabled={!isEditing}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* 설정 */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">설정</h3>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={editForm.is_active}
              onCheckedChange={(checked) => handleFormChange("is_active", checked)}
              disabled={!isEditing}
            />
            <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">
              활성 상태
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_premium_only"
              checked={editForm.is_premium_only}
              onCheckedChange={(checked) => handleFormChange("is_premium_only", checked)}
              disabled={!isEditing}
            />
            <Label htmlFor="is_premium_only" className="text-sm font-normal cursor-pointer">
              프리미엄 전용
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}









