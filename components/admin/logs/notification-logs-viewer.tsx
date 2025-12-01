/**
 * @file components/admin/logs/notification-logs-viewer.tsx
 * @description 관리자 알림 로그 뷰어 컴포넌트
 *
 * 주요 기능:
 * 1. shadcn DataTable 기반 로그 목록 표시
 * 2. 타입/상태/날짜/사용자 필터링
 * 3. JSON 페이로드 상세 보기 Drawer
 * 4. 페이징 및 정렬
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, Filter, Calendar, User, Activity, Eye, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { listLogs } from "@/actions/admin/logs/list";
import type { NotificationLog } from "@/actions/admin/logs/list";

interface NotificationLogsViewerProps {
  className?: string;
}

export function NotificationLogsViewer({ className }: NotificationLogsViewerProps) {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);

  // 필터 상태
  const [filters, setFilters] = useState<{
    type: "all" | "kcdc" | "diet-popup" | "system";
    status: "all" | "pending" | "success" | "failed";
    userId: string;
    startDate: string;
    endDate: string;
    search: string;
  }>({
    type: "all",
    status: "all",
    userId: "",
    startDate: "",
    endDate: "",
    search: "",
  });

  const [offset, setOffset] = useState(0);
  const { toast } = useToast();

  // 로그 목록 로드
  const loadLogs = useCallback(async (resetOffset = false) => {
    setIsLoading(true);
    try {
      console.group("[AdminConsole][Logs][Viewer]");
      console.log("event", "load-logs");
      console.log("filters", filters);
      console.log("offset", resetOffset ? 0 : offset);

      const result = await listLogs({
        ...filters,
        limit: 50,
        offset: resetOffset ? 0 : offset,
      });

      if (result.success) {
        if (resetOffset) {
          setLogs(result.data);
          setOffset(0);
        } else {
          setLogs(prev => [...prev, ...result.data]);
          setOffset(prev => prev + result.data.length);
        }
        setTotal(result.total);
        setHasMore(result.hasMore);
        console.log("logs_loaded", result.total);
      } else {
        const errorMessage = "error" in result ? result.error : "알 수 없는 오류가 발생했습니다";
        toast({
          title: "로그 로드 실패",
          description: errorMessage,
          variant: "destructive",
        });
        console.error("load_error", errorMessage);
      }
    } catch (error) {
      console.error("load_unexpected_error", error);
      toast({
        title: "오류 발생",
        description: "로그 로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  }, [filters, offset, toast]);

  // 초기 로드 및 필터 변경 시 재로딩
  useEffect(() => {
    loadLogs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // 필터 변경 핸들러
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // 더보기 핸들러
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      loadLogs(false);
    }
  }, [hasMore, isLoading, loadLogs]);

  // 상태 뱃지 컴포넌트
  const StatusBadge = ({ status }: { status: string }) => {
    const configs = {
      success: { icon: CheckCircle, label: "성공", className: "text-green-600 bg-green-50" },
      failed: { icon: AlertCircle, label: "실패", className: "text-red-600 bg-red-50" },
      pending: { icon: Clock, label: "대기", className: "text-yellow-600 bg-yellow-50" },
    };

    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // 타입 뱃지 컴포넌트
  const TypeBadge = ({ type }: { type: string }) => {
    const configs = {
      kcdc: { label: "KCDC", className: "bg-blue-100 text-blue-800" },
      "diet-popup": { label: "식단 팝업", className: "bg-green-100 text-green-800" },
      system: { label: "시스템", className: "bg-purple-100 text-purple-800" },
    };

    const config = configs[type as keyof typeof configs] || configs.system;

    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // JSON 포맷팅
  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            알림 로그 뷰어
          </CardTitle>

          {/* 필터 패널 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="로그 검색..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 타입 필터 */}
            <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="모든 타입" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 타입</SelectItem>
                <SelectItem value="kcdc">KCDC</SelectItem>
                <SelectItem value="diet-popup">식단 팝업</SelectItem>
                <SelectItem value="system">시스템</SelectItem>
              </SelectContent>
            </Select>

            {/* 상태 필터 */}
            <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="모든 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="success">성공</SelectItem>
                <SelectItem value="failed">실패</SelectItem>
                <SelectItem value="pending">대기</SelectItem>
              </SelectContent>
            </Select>

            {/* 날짜 범위 */}
            <div className="flex gap-2">
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="flex-1"
              />
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading && logs.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">로그가 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">
                선택한 조건에 맞는 로그가 없습니다.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>시간</TableHead>
                      <TableHead>타입</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>실행자</TableHead>
                      <TableHead>메시지</TableHead>
                      <TableHead className="w-20">상세</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(log.triggered_at).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>
                          <TypeBadge type={log.type} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={log.status} />
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.actor ? (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span className="truncate max-w-20" title={log.actor}>
                                {log.actor}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate text-sm" title={log.error_message || "성공"}>
                            {log.error_message || "처리 완료"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Drawer>
                            <DrawerTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLog(log)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DrawerTrigger>
                            <DrawerContent className="max-h-[80vh]">
                              <DrawerHeader>
                                <DrawerTitle>로그 상세 정보</DrawerTitle>
                              </DrawerHeader>
                              <div className="p-4 space-y-4 overflow-auto">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">로그 ID</label>
                                    <p className="text-sm text-gray-600 font-mono">{log.id}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">타입</label>
                                    <div className="mt-1">
                                      <TypeBadge type={log.type} />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">상태</label>
                                    <div className="mt-1">
                                      <StatusBadge status={log.status} />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">실행자</label>
                                    <p className="text-sm text-gray-600">{log.actor || "시스템"}</p>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">실행 시간</label>
                                  <p className="text-sm text-gray-600">
                                    {new Date(log.triggered_at).toLocaleString('ko-KR')}
                                  </p>
                                </div>

                                {log.error_message && (
                                  <div>
                                    <label className="text-sm font-medium text-red-600">에러 메시지</label>
                                    <p className="text-sm text-red-700 mt-1">{log.error_message}</p>
                                  </div>
                                )}

                                <div>
                                  <label className="text-sm font-medium">페이로드</label>
                                  <pre className="text-xs bg-gray-50 p-3 rounded mt-1 overflow-auto max-h-60">
                                    {formatJson(log.payload)}
                                  </pre>
                                </div>
                              </div>
                            </DrawerContent>
                          </Drawer>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 더보기 버튼 */}
              {hasMore && (
                <div className="p-4 border-t">
                  <Button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    {isLoading ? "로딩 중..." : "더 보기"}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
