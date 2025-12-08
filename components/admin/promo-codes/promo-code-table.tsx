/**
 * @file components/admin/promo-codes/promo-code-table.tsx
 * @description 관리자 프로모션 코드 테이블 컴포넌트
 *
 * 주요 기능:
 * 1. 프로모션 코드 목록을 테이블 형태로 표시
 * 2. 상태 필터링 및 검색 기능
 * 3. 사용 통계 표시
 */

"use client";

import { useState, useCallback } from "react";
import { Search, Plus, Trash2, Edit, Copy, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { deletePromoCode } from "@/actions/admin/promo-codes/delete";
import { syncPromoCodeUsage } from "@/actions/admin/promo-codes/sync-usage";
import type { PromoCodeListItem } from "@/types/promo-code";

interface PromoCodeTableProps {
  codes: PromoCodeListItem[];
  onSelectCode: (code: PromoCodeListItem) => void;
  onCreateCode: () => void;
  isLoading?: boolean;
  onCodeUpdated?: () => void;
}

export function PromoCodeTable({
  codes,
  onSelectCode,
  onCreateCode,
  isLoading = false,
  onCodeUpdated,
}: PromoCodeTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // 필터링된 코드 목록
  const filteredCodes = codes.filter(code => {
    // 상태 필터
    if (statusFilter !== "all" && code.status !== statusFilter) {
      return false;
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      return (
        code.code.toLowerCase().includes(query) ||
        (code.description && code.description.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // 사용 횟수 동기화 핸들러
  const handleSyncUsage = useCallback(async () => {
    setIsSyncing(true);
    try {
      console.group("[AdminConsole][PromoCodes][Table]");
      console.log("event", "sync-usage");

      const result = await syncPromoCodeUsage();

      if (result.success) {
        toast({
          title: "동기화 완료",
          description: `${result.updated}개 프로모션 코드의 사용 횟수가 동기화되었습니다.`,
        });
        onCodeUpdated?.();
        console.log("sync_success", result.updated);
      } else {
        const errorMessage = "error" in result ? result.error : "알 수 없는 오류가 발생했습니다";
        toast({
          title: "동기화 실패",
          description: errorMessage,
          variant: "destructive",
        });
        console.error("sync_error", errorMessage);
      }
    } catch (error) {
      console.error("sync_unexpected_error", error);
      toast({
        title: "오류 발생",
        description: "사용 횟수 동기화 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
      console.groupEnd();
    }
  }, [toast, onCodeUpdated]);

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
  const handleDelete = useCallback(async (code: PromoCodeListItem) => {
    if (!confirm(`프로모션 코드 "${code.code}"를 삭제하시겠습니까?`)) {
      return;
    }

    const deletingId = code.id;
    setDeletingIds(prev => new Set(prev).add(deletingId));

    try {
      console.group("[AdminConsole][PromoCodes][Table]");
      console.log("event", "delete-code");
      console.log("code_id", deletingId);

      const result = await deletePromoCode({ id: deletingId });

      if (result.success) {
        toast({
          title: "삭제 완료",
          description: `프로모션 코드 "${code.code}"가 삭제되었습니다.`,
        });
        onCodeUpdated?.();
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
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(deletingId);
        return next;
      });
      console.groupEnd();
    }
  }, [toast, onCodeUpdated]);

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
  const renderDiscountType = (type: string, value: number) => {
    switch (type) {
      case 'percentage':
        return `${value}% 할인`;
      case 'fixed_amount':
        return `${value.toLocaleString()}원 할인`;
      case 'free_trial':
        return `${value}일 무료 체험`;
      default:
        return '-';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">프로모션 코드</CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={handleSyncUsage} 
              size="sm" 
              variant="outline"
              disabled={isSyncing}
            >
              {isSyncing ? "동기화 중..." : "사용 횟수 동기화"}
            </Button>
            <Button onClick={onCreateCode} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              새 코드 생성
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        {/* 필터 및 검색 */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="코드 또는 설명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="active">활성</SelectItem>
              <SelectItem value="expired">만료</SelectItem>
              <SelectItem value="used_up">소진</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 테이블 */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">코드</TableHead>
                <TableHead className="w-[150px]">할인</TableHead>
                <TableHead className="w-[100px]">상태</TableHead>
                <TableHead className="w-[120px]">사용 횟수</TableHead>
                <TableHead className="w-[180px]">유효 기간</TableHead>
                <TableHead>설명</TableHead>
                <TableHead className="w-[100px]">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : filteredCodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchQuery || statusFilter !== "all" 
                      ? "검색 결과가 없습니다" 
                      : "프로모션 코드가 없습니다"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCodes.map((code) => (
                  <TableRow
                    key={code.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelectCode(code)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{code.code}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyCode(code.code);
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{renderDiscountType(code.discount_type, code.discount_value)}</span>
                    </TableCell>
                    <TableCell>{renderStatusBadge(code.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {code.max_uses !== null 
                          ? `${code.current_uses} / ${code.max_uses}`
                          : `${code.current_uses} / 무제한`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        <div>{new Date(code.valid_from).toLocaleDateString('ko-KR')}</div>
                        <div>~ {new Date(code.valid_until).toLocaleDateString('ko-KR')}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground line-clamp-1">
                        {code.description || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCode(code);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(code);
                          }}
                          disabled={deletingIds.has(code.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

