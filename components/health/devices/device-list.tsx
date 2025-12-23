/**
 * @file device-list.tsx
 * @description 연결된 기기 목록 컴포넌트
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Unlink, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Clock
} from 'lucide-react';
import type { HealthDataSource } from '@/types/health-data-integration';

interface DeviceListProps {
  devices: HealthDataSource[];
  onDisconnect: (deviceId: string) => void;
  onSync: (deviceId: string) => void;
  isSyncing: boolean;
}

const DEVICE_NAMES: Record<string, string> = {
  google_fit: 'Google Fit',
  fitbit: 'Fitbit',
  apple_health: 'Apple Health',
  samsung_health: 'Samsung Health',
};

const STATUS_CONFIG = {
  connected: {
    label: '연결됨',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'text-green-600',
  },
  disconnected: {
    label: '연결 해제',
    variant: 'outline' as const,
    icon: XCircle,
    color: 'text-gray-600',
  },
  error: {
    label: '오류',
    variant: 'destructive' as const,
    icon: AlertCircle,
    color: 'text-red-600',
  },
  pending: {
    label: '대기 중',
    variant: 'secondary' as const,
    icon: Clock,
    color: 'text-yellow-600',
  },
};

export function DeviceList({ devices, onDisconnect, onSync, isSyncing }: DeviceListProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '동기화 기록 없음';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>연결된 기기</CardTitle>
        <CardDescription>연동된 스마트 기기 목록입니다</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {devices.map((device) => {
            const statusConfig = STATUS_CONFIG[device.connection_status] || STATUS_CONFIG.disconnected;
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={device.id} className="border">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {DEVICE_NAMES[device.source_type] || device.source_name}
                        </h3>
                        <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                          <StatusIcon className={`h-3 w-3 ${statusConfig.color}`} />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>연결일: {formatDate(device.connected_at)}</p>
                        <p>마지막 동기화: {formatDate(device.last_synced_at)}</p>
                        {device.error_message && (
                          <p className="text-red-600">오류: {device.error_message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSync(device.id)}
                        disabled={isSyncing || device.connection_status !== 'connected'}
                      >
                        {isSyncing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            동기화 중...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            동기화
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDisconnect(device.id)}
                        disabled={isSyncing}
                      >
                        <Unlink className="mr-2 h-4 w-4" />
                        연결 해제
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
