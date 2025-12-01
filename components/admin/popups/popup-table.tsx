/**
 * @file components/admin/popups/popup-table.tsx
 * @description 관리자 팝업 공지 테이블 컴포넌트
 *
 * 주요 기능:
 * 1. 팝업 공지 목록을 테이블 형태로 표시
 * 2. 상태 필터링 및 검색 기능
 * 3. 배포/배포취소 토글
 * 4. 우선순위 및 세그먼트 관리
 */

"use client";

import { useState, useCallback } from "react";
import { Search, Plus, Play, Square, Settings, Eye, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { deployPopup } from "@/actions/admin/popups/deploy";
import { togglePopup as togglePopupAction } from "@/actions/admin/popups/toggle";
import type { AdminPopupAnnouncement } from "@/actions/admin/popups/list";

interface PopupTableProps {
  popups: AdminPopupAnnouncement[];
  onSelectPopup: (popup: AdminPopupAnnouncement) => void;
  onCreatePopup: () => void;
  isLoading?: boolean;
  onPopupUpdated?: () => void;
}

export function PopupTable({
  popups,
  onSelectPopup,
  onCreatePopup,
  isLoading = false,
  onPopupUpdated,
}: PopupTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deployingIds, setDeployingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // 필터링된 팝업 목록
  const filteredPopups = popups.filter(popup => {
    // 상태 필터
    if (statusFilter !== "all" && popup.status !== statusFilter) {
      return false;
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      return (
        popup.title.toLowerCase().includes(query) ||
        popup.body.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // 배포 토글 핸들러
  const handleDeployToggle = useCallback(async (popup: AdminPopupAnnouncement) => {
    const action = popup.status === "published" ? "unpublish" : "publish";
    const deployingId = popup.id;

    setDeployingIds(prev => new Set(prev).add(deployingId));

    try {
      console.group("[AdminConsole][Popups][Table]");
      console.log("event", "deploy-toggle");
      console.log("popup_id", deployingId);
      console.log("action", action);

      const result = await deployPopup({ id: deployingId, action });

      if (result.success) {
        toast({
          title: action === "publish" ? "배포 완료" : "배포 취소",
          description: `"${popup.title}"이 ${action === "publish" ? "배포되었습니다" : "배포 취소되었습니다"}.`,
        });
        onPopupUpdated?.();
        console.log("deploy_success", result.data.status);
      } else {
        const errorMessage = "error" in result ? result.error : "알 수 없는 오류가 발생했습니다";
        toast({
          title: "배포 실패",
          description: errorMessage,
          variant: "destructive",
        });
        console.error("deploy_error", errorMessage);
      }
    } catch (error) {
      console.error("deploy_unexpected_error", error);
      toast({
        title: "오류 발생",
        description: "배포 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setDeployingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(deployingId);
        return newSet;
      });
      console.groupEnd();
    }
  }, [toast, onPopupUpdated]);

  // 우선순위 변경 핸들러
  const handlePriorityChange = useCallback(async (popupId: string, newPriority: number) => {
    try {
      console.group("[AdminConsole][Popups][Table]");
      console.log("event", "priority-change");
      console.log("popup_id", popupId);
      console.log("new_priority", newPriority);

      const result = await togglePopupAction({
        id: popupId,
        type: "priority",
        value: newPriority,
      });

      if (result.success) {
        onPopupUpdated?.();
        console.log("priority_update_success");
      } else {
        const errorMessage = "error" in result ? result.error : "알 수 없는 오류가 발생했습니다";
        toast({
          title: "우선순위 변경 실패",
          description: errorMessage,
          variant: "destructive",
        });
        console.error("priority_error", errorMessage);
      }
    } catch (error) {
      console.error("priority_unexpected_error", error);
      toast({
        title: "오류 발생",
        description: "우선순위 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      console.groupEnd();
    }
  }, [toast, onPopupUpdated]);

  // 상태 뱃지 컴포넌트
  const StatusBadge = ({ status }: { status: string }) => {
    const variants = {
      draft: { variant: "secondary" as const, label: "초안" },
      published: { variant: "default" as const, label: "배포중" },
      archived: { variant: "outline" as const, label: "보관됨" },
    };

    const config = variants[status as keyof typeof variants] || variants.draft;

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            팝업 공지 관리
          </CardTitle>
          <Button
            onClick={onCreatePopup}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            새 팝업
          </Button>
        </div>

        {/* 필터 및 검색 */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="제목 또는 내용 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="draft">초안</SelectItem>
              <SelectItem value="published">배포중</SelectItem>
              <SelectItem value="archived">보관됨</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredPopups.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchQuery ? "검색 결과가 없습니다" : "등록된 팝업이 없습니다"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? "다른 검색어로 시도해보세요" : "새 팝업 공지를 생성해보세요"}
            </p>
            {!searchQuery && (
              <div className="mt-6">
                <Button
                  onClick={onCreatePopup}
                  variant="outline"
                  className="border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  첫 팝업 생성하기
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>제목</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>우선순위</TableHead>
                  <TableHead>기간</TableHead>
                  <TableHead>대상</TableHead>
                  <TableHead>수정일</TableHead>
                  <TableHead className="w-32">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPopups.map((popup) => (
                  <TableRow
                    key={popup.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => onSelectPopup(popup)}
                  >
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate" title={popup.title}>
                        {popup.title}
                      </div>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={popup.status} />
                    </TableCell>

                    <TableCell>
                      <Select
                        value={popup.priority.toString()}
                        onValueChange={(value) => handlePriorityChange(popup.id, parseInt(value))}
                      >
                        <SelectTrigger className="w-20 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">낮음</SelectItem>
                          <SelectItem value="50">보통</SelectItem>
                          <SelectItem value="100">높음</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(popup.active_from)}
                        </div>
                        {popup.active_until && (
                          <div className="text-xs text-gray-500 mt-1">
                            ~ {formatDate(popup.active_until)}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">
                          {popup.target_segments.length > 0
                            ? `${popup.target_segments.length}개 세그먼트`
                            : "전체"
                          }
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-gray-500">
                      {formatDate(popup.updated_at)}
                    </TableCell>

                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeployToggle(popup);
                        }}
                        disabled={deployingIds.has(popup.id)}
                        className={
                          popup.status === "published"
                            ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                            : "text-green-600 hover:text-green-700 hover:bg-green-50"
                        }
                      >
                        {deployingIds.has(popup.id) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        ) : popup.status === "published" ? (
                          <Square className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
