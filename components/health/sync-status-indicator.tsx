/**
 * @file components/health/sync-status-indicator.tsx
 * @description 건강 데이터 동기화 상태 표시 컴포넌트
 *
 * 데이터 동기화 상태를 표시하고 수동 동기화를 실행할 수 있는 컴포넌트입니다.
 * - 마지막 동기화 시간 표시
 * - 동기화 상태 표시 (성공/실패/진행 중)
 * - 수동 동기화 버튼
 * - 데이터 소스별 상태 표시
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Database,
  Wifi,
  WifiOff,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SyncStatus {
  lastSync: string | null;
  nextSyncAvailable: Date;
  canSyncNow: boolean;
  recentSyncs: Array<{
    id: string;
    sync_status: string;
    synced_at: string;
    records_synced: number;
    error_message?: string;
    health_data_sources: {
      source_type: string;
    };
  }>;
  dataSources: {
    mydata: {
      connected: boolean;
      lastSync: string | null;
    };
    health_highway: {
      connected: boolean;
      lastSync: string | null;
    };
  };
}

interface SyncStatusIndicatorProps {
  className?: string;
  compact?: boolean; // 간단한 버전 표시
  autoRefresh?: boolean; // 자동 새로고침 여부
  refreshInterval?: number; // 새로고침 간격 (ms)
}

export function SyncStatusIndicator({
  className,
  compact = false,
  autoRefresh = true,
  refreshInterval = 30000, // 30초
}: SyncStatusIndicatorProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const { toast } = useToast();

  // 상태 조회
  const fetchSyncStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/health/sync/status");

      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data.status);
        setLastRefresh(new Date());
      } else {
        console.error("동기화 상태 조회 실패:", response.statusText);
      }
    } catch (error) {
      console.error("동기화 상태 조회 중 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  // 수동 동기화 실행
  const handleManualSync = async () => {
    if (!syncStatus?.canSyncNow) {
      toast({
        title: "동기화 대기 중",
        description: `다음 동기화까지 ${getTimeUntilNextSync()}분 남았습니다.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setSyncing(true);
      const response = await fetch("/api/health/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataSources: ["mydata", "health_highway"],
          forceSync: false,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "동기화 완료",
          description: `${data.totalRecordsSynced}개의 데이터가 동기화되었습니다.`,
        });

        // 상태 새로고침
        await fetchSyncStatus();
      } else {
        toast({
          title: "동기화 실패",
          description: data.error || "동기화 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "동기화 실패",
        description: "네트워크 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  // 다음 동기화까지 남은 시간 계산
  const getTimeUntilNextSync = () => {
    if (!syncStatus) return 0;
    const now = new Date();
    const diff = syncStatus.nextSyncAvailable.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60)); // 분 단위
  };

  // 마지막 동기화로부터 경과 시간 계산
  const getTimeSinceLastSync = () => {
    if (!syncStatus?.lastSync) return null;
    const now = new Date();
    const lastSync = new Date(syncStatus.lastSync);
    const diff = now.getTime() - lastSync.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return "방금 전";
  };

  // 컴포넌트 마운트 시 상태 조회
  useEffect(() => {
    fetchSyncStatus();
  }, []);

  // 자동 새로고침
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchSyncStatus();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  if (compact) {
    // 간단한 버전
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Database className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">
          마지막 동기화: {getTimeSinceLastSync() || "없음"}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleManualSync}
          disabled={!syncStatus?.canSyncNow || syncing}
        >
          {syncing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
        </Button>
      </div>
    );
  }

  if (loading && !syncStatus) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!syncStatus) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              동기화 상태를 불러올 수 없습니다.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const lastSyncTime = getTimeSinceLastSync();
  const timeUntilNextSync = getTimeUntilNextSync();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          건강 데이터 동기화
          {lastRefresh && (
            <Badge variant="outline" className="text-xs">
              {lastRefresh.toLocaleTimeString()} 업데이트
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 전체 동기화 상태 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {syncStatus.lastSync ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Clock className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium">
                  {lastSyncTime ? `마지막 동기화: ${lastSyncTime}` : "동기화 기록 없음"}
                </p>
                <p className="text-sm text-gray-500">
                  {syncStatus.canSyncNow
                    ? "지금 동기화할 수 있습니다"
                    : `다음 동기화까지 ${timeUntilNextSync}분 남음`}
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleManualSync}
            disabled={!syncStatus.canSyncNow || syncing}
            size="sm"
          >
            {syncing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                동기화 중...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                수동 동기화
              </>
            )}
          </Button>
        </div>

        {/* 진행 중인 동기화 표시 */}
        {syncing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              데이터를 동기화하고 있습니다...
            </div>
            <Progress value={undefined} className="w-full" />
          </div>
        )}

        {/* 데이터 소스별 상태 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 마이데이터 */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              {syncStatus.dataSources.mydata.connected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <div>
                <p className="font-medium text-sm">마이데이터</p>
                <p className="text-xs text-gray-500">
                  {syncStatus.dataSources.mydata.lastSync
                    ? new Date(syncStatus.dataSources.mydata.lastSync).toLocaleDateString()
                    : "연결되지 않음"}
                </p>
              </div>
            </div>
            <Badge
              variant={syncStatus.dataSources.mydata.connected ? "default" : "secondary"}
              className="text-xs"
            >
              {syncStatus.dataSources.mydata.connected ? "연결됨" : "미연결"}
            </Badge>
          </div>

          {/* 건강정보고속도로 */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              {syncStatus.dataSources.health_highway.connected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <div>
                <p className="font-medium text-sm">건강정보고속도로</p>
                <p className="text-xs text-gray-500">
                  {syncStatus.dataSources.health_highway.lastSync
                    ? new Date(syncStatus.dataSources.health_highway.lastSync).toLocaleDateString()
                    : "연결되지 않음"}
                </p>
              </div>
            </div>
            <Badge
              variant={syncStatus.dataSources.health_highway.connected ? "default" : "secondary"}
              className="text-xs"
            >
              {syncStatus.dataSources.health_highway.connected ? "연결됨" : "미연결"}
            </Badge>
          </div>
        </div>

        {/* 최근 동기화 결과 */}
        {syncStatus.recentSyncs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">최근 동기화 결과</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {syncStatus.recentSyncs.slice(0, 3).map((sync) => (
                <div
                  key={sync.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    {sync.sync_status === "success" ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-500" />
                    )}
                    <span className="capitalize">
                      {sync.health_data_sources.source_type === "mydata" ? "마이데이터" :
                       sync.health_data_sources.source_type === "health_highway" ? "건강정보고속도로" :
                       sync.health_data_sources.source_type}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">
                      {new Date(sync.synced_at).toLocaleTimeString()}
                    </p>
                    {sync.records_synced > 0 && (
                      <p className="text-xs text-green-600">
                        {sync.records_synced}개 동기화
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 동기화 제한 안내 */}
        {!syncStatus.canSyncNow && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              동기화는 1시간에 한 번만 가능합니다. 다음 동기화까지 {timeUntilNextSync}분 남았습니다.
            </AlertDescription>
          </Alert>
        )}

        {/* 새로고침 버튼 */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSyncStatus}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-2" />
            )}
            상태 새로고침
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

