/**
 * @file components/admin/meal-kits/meal-kit-table.tsx
 * @description 관리자 밀키트 제품 테이블 컴포넌트
 *
 * 주요 기능:
 * 1. 밀키트 제품 목록을 테이블 형태로 표시
 * 2. 활성 상태 필터링 및 검색 기능
 * 3. 활성/비활성 토글
 */

"use client";

import { useState, useCallback } from "react";
import { Search, Plus, RefreshCw, Package, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { AdminMealKit } from "@/actions/admin/meal-kits/list";

interface MealKitTableProps {
  mealKits: AdminMealKit[];
  selectedMealKit?: AdminMealKit;
  onSelectMealKit: (mealKit: AdminMealKit) => void;
  onCreateMealKit: () => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function MealKitTable({
  mealKits,
  selectedMealKit,
  onSelectMealKit,
  onCreateMealKit,
  isLoading = false,
  onRefresh,
}: MealKitTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 필터링된 밀키트 목록
  const filteredMealKits = mealKits.filter(mealKit => {
    // 상태 필터
    if (statusFilter === "active" && !mealKit.is_active) {
      return false;
    }
    if (statusFilter === "inactive" && mealKit.is_active) {
      return false;
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      return (
        mealKit.name.toLowerCase().includes(query) ||
        (mealKit.description?.toLowerCase().includes(query) ?? false) ||
        (mealKit.category?.toLowerCase().includes(query) ?? false)
      );
    }

    return true;
  });

  // 가격 포맷팅
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(price);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            밀키트 제품 관리
          </CardTitle>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                새로고침
              </Button>
            )}
            <Button size="sm" onClick={onCreateMealKit}>
              <Plus className="h-4 w-4 mr-2" />
              새 밀키트
            </Button>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="flex items-center gap-2 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="제품명, 설명, 카테고리로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="active">활성</SelectItem>
              <SelectItem value="inactive">비활성</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">제품명</TableHead>
              <TableHead className="w-[100px]">카테고리</TableHead>
              <TableHead className="w-[100px]">가격</TableHead>
              <TableHead className="w-[80px]">인분</TableHead>
              <TableHead className="w-[100px]">상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMealKits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {searchQuery || statusFilter !== "all"
                    ? "검색 결과가 없습니다"
                    : "등록된 밀키트가 없습니다"}
                </TableCell>
              </TableRow>
            ) : (
              filteredMealKits.map((mealKit) => {
                const isSelected = selectedMealKit?.id === mealKit.id;
                return (
                  <TableRow
                    key={mealKit.id}
                    className={`cursor-pointer hover:bg-muted/50 ${
                      isSelected ? "bg-muted" : ""
                    }`}
                    onClick={() => onSelectMealKit(mealKit)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {mealKit.image_url && (
                          <img
                            src={mealKit.image_url}
                            alt={mealKit.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-semibold">{mealKit.name}</div>
                          {mealKit.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {mealKit.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{mealKit.category || "기타"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        {formatPrice(mealKit.price)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {mealKit.serving_size}인분
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={mealKit.is_active ? "default" : "secondary"}>
                        {mealKit.is_active ? "활성" : "비활성"}
                      </Badge>
                      {mealKit.is_premium_only && (
                        <Badge variant="outline" className="ml-1">
                          프리미엄
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}













