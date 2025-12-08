/**
 * @file components/admin/promo-codes/promo-code-detail-panel.tsx
 * @description 관리자 프로모션 코드 상세 패널
 *
 * 주요 기능:
 * 1. 선택된 프로모션 코드의 상세 정보 표시
 * 2. 사용 통계 및 상태 표시
 * 3. 편집 및 삭제 액션
 */

"use client";

import { useState, useCallback } from "react";
import { Edit, Trash2, Copy, Calendar, Users, Percent, Tag, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { deletePromoCode } from "@/actions/admin/promo-codes/delete";
import type { PromoCodeListItem } from "@/types/promo-code";

interface PromoCodeDetailPanelProps {
  selectedCode?: PromoCodeListItem;
  onEdit?: (code: PromoCodeListItem) => void;
  onCodeDeleted?: () => void;
}

export function PromoCodeDetailPanel({ 
  selectedCode, 
  onEdit,
  onCodeDeleted 
}: PromoCodeDetailPanelProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // 코드 복사 핸들러
  const handleCopyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "복사 완료",
        description: `프로모션 코드 "${code}"가 클립보드에 복사되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "복사 실패",
        description: "클립보드 복사에 실패했습니다.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // 삭제 핸들러
  const handleDelete = useCallback(async () => {
    if (!selectedCode) return;
    
    if (!confirm(`프로모션 코드 "${selectedCode.code}"를 삭제하시겠습니까?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      console.group("[AdminConsole][PromoCodes][Detail]");
      console.log("event", "delete-code");
      console.log("code_id", selectedCode.id);

      const result = await deletePromoCode({ id: selectedCode.id });

      if (result.success) {
        toast({
          title: "삭제 완료",
          description: `프로모션 코드 "${selectedCode.code}"가 삭제되었습니다.`,
        });
        onCodeDeleted?.();
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
        description: "프로모션 코드 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      console.groupEnd();
    }
  }, [selectedCode, toast, onCodeDeleted]);

  if (!selectedCode) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">프로모션 코드를 선택하세요</p>
            <p className="text-sm mt-2">좌측 목록에서 코드를 선택하면 상세 정보가 표시됩니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 상태 배지 렌더링
  const renderStatusBadge = (status: PromoCodeListItem['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">활성</Badge>;
      case 'expired':
        return <Badge variant="secondary">만료</Badge>;
      case 'used_up':
        return <Badge variant="destructive">소진</Badge>;
      default:
        return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  // 할인 타입 표시
  const renderDiscountInfo = () => {
    switch (selectedCode.discount_type) {
      case 'percentage':
        return `${selectedCode.discount_value}% 할인`;
      case 'fixed_amount':
        return `${selectedCode.discount_value.toLocaleString()}원 할인`;
      case 'free_trial':
        return `${selectedCode.discount_value}일 무료 체험`;
      default:
        return '-';
    }
  };

  // 사용률 계산
  const usageRate = selectedCode.max_uses !== null 
    ? Math.round((selectedCode.current_uses / selectedCode.max_uses) * 100)
    : null;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">프로모션 코드 상세</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(selectedCode)}
            >
              <Edit className="h-4 w-4 mr-2" />
              수정
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              삭제
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-6">
        {/* 코드 및 상태 */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-muted-foreground">프로모션 코드</Label>
              {renderStatusBadge(selectedCode.status)}
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-lg font-semibold">
                {selectedCode.code}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopyCode(selectedCode.code)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* 할인 정보 */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
              <Percent className="h-4 w-4" />
              할인 정보
            </Label>
            <div className="text-2xl font-bold">{renderDiscountInfo()}</div>
            <p className="text-sm text-muted-foreground mt-1">
              타입: {selectedCode.discount_type === 'percentage' ? '퍼센트 할인' 
                : selectedCode.discount_type === 'fixed_amount' ? '고정 금액 할인' 
                : '무료 체험'}
            </p>
          </div>

          <Separator />

          {/* 사용 통계 */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
              <Users className="h-4 w-4" />
              사용 통계
            </Label>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">사용 횟수</span>
                <span className="font-semibold">
                  {selectedCode.current_uses} / {selectedCode.max_uses !== null ? selectedCode.max_uses : '무제한'}
                </span>
              </div>
              {usageRate !== null && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${usageRate}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* 유효 기간 */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4" />
              유효 기간
            </Label>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">시작일</span>
                <span>{new Date(selectedCode.valid_from).toLocaleString('ko-KR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">종료일</span>
                <span>{new Date(selectedCode.valid_until).toLocaleString('ko-KR')}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* 적용 조건 */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2">적용 조건</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">적용 가능 플랜</span>
                <div className="flex gap-2">
                  {selectedCode.applicable_plans && selectedCode.applicable_plans.length > 0 ? (
                    selectedCode.applicable_plans.map(plan => (
                      <Badge key={plan} variant="outline">
                        {plan === 'monthly' ? '월간' : '연간'}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">모든 플랜</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">신규 사용자 전용</span>
                <Badge variant={selectedCode.new_users_only ? "default" : "outline"}>
                  {selectedCode.new_users_only ? "예" : "아니오"}
                </Badge>
              </div>
            </div>
          </div>

          {/* 설명 */}
          {selectedCode.description && (
            <>
              <Separator />
              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4" />
                  설명
                </Label>
                <p className="text-sm text-muted-foreground">{selectedCode.description}</p>
              </div>
            </>
          )}

          {/* 생성 정보 */}
          <Separator />
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2">생성 정보</Label>
            <div className="text-sm text-muted-foreground">
              생성일: {new Date(selectedCode.created_at).toLocaleString('ko-KR')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


