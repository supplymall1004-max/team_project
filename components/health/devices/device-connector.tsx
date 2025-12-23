/**
 * @file device-connector.tsx
 * @description 스마트 기기 연동 관리 컴포넌트
 *
 * Google Fit, Fitbit 등 스마트 기기와의 연동을 관리합니다.
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Plus, 
  RefreshCw, 
  Unlink, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GoogleFitConnector } from './google-fit-connector';
import { FitbitConnector } from './fitbit-connector';
import { FileUploadConnector } from './file-upload-connector';
import { BluetoothConnector } from './bluetooth-connector';
import { DeviceList } from './device-list';
import type { HealthDataSource, DataSourceType } from '@/types/health-data-integration';

// 지원 기기 정보
const SUPPORTED_DEVICES = {
  google_fit: {
    name: 'Google Fit',
    description: '활동량, 심박수, 체중 데이터를 자동으로 가져옵니다',
    icon: Smartphone,
    color: 'text-blue-600',
  },
  fitbit: {
    name: 'Fitbit',
    description: '활동량, 수면, 심박수, 체중 데이터를 자동으로 가져옵니다',
    icon: Smartphone,
    color: 'text-green-600',
  },
  apple_health: {
    name: 'Apple Health',
    description: 'Apple Health 데이터를 파일로 업로드하여 가져옵니다',
    icon: Smartphone,
    color: 'text-gray-600',
  },
  samsung_health: {
    name: 'Samsung Health',
    description: 'Samsung Health 데이터를 파일로 업로드하여 가져옵니다',
    icon: Smartphone,
    color: 'text-blue-500',
  },
  bluetooth: {
    name: 'Bluetooth 기기',
    description: '블루투스로 연결된 건강 기기에서 데이터를 자동으로 가져옵니다',
    icon: Smartphone,
    color: 'text-purple-600',
  },
} as const;

interface DeviceConnectorProps {
  className?: string;
}

export function DeviceConnector({ className }: DeviceConnectorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDevice, setSelectedDevice] = useState<DataSourceType | null>(null);

  // 연결된 기기 목록 조회
  const { data: devices, isLoading } = useQuery({
    queryKey: ['health-devices'],
    queryFn: async (): Promise<HealthDataSource[]> => {
      const response = await fetch('/api/health/data-sources');
      if (!response.ok) {
        throw new Error('기기 목록 조회 실패');
      }
      const result = await response.json();
      // 스마트 기기만 필터링
      return (result.data || []).filter(
        (d: HealthDataSource) => 
          d.source_type === 'google_fit' || 
          d.source_type === 'fitbit' || 
          d.source_type === 'apple_health' || 
          d.source_type === 'samsung_health' ||
          d.source_type === 'bluetooth'
      );
    },
  });

  // 기기 연결 해제
  const disconnectMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await fetch(`/api/health/data-sources/${deviceId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('연결 해제 실패');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-devices'] });
      toast({
        title: '연결 해제 완료',
        description: '기기 연결이 해제되었습니다.',
      });
    },
    onError: (error) => {
      toast({
        title: '연결 해제 실패',
        description: error instanceof Error ? error.message : '기기 연결 해제에 실패했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 수동 동기화
  const syncMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      console.group('[DeviceConnector] 기기 동기화 시작');
      const response = await fetch('/api/health/devices/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_source_id: deviceId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '동기화 실패');
      }
      const result = await response.json();
      console.log('✅ 동기화 완료:', result);
      console.groupEnd();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-devices'] });
      toast({
        title: '동기화 완료',
        description: '기기 데이터가 동기화되었습니다.',
      });
    },
    onError: (error) => {
      toast({
        title: '동기화 실패',
        description: error instanceof Error ? error.message : '데이터 동기화에 실패했습니다.',
        variant: 'destructive',
      });
    },
  });

  const handleConnect = (deviceType: DataSourceType) => {
    setSelectedDevice(deviceType);
  };

  const handleDisconnect = (deviceId: string) => {
    if (confirm('정말 이 기기의 연결을 해제하시겠습니까?')) {
      disconnectMutation.mutate(deviceId);
    }
  };

  const handleSync = (deviceId: string) => {
    syncMutation.mutate(deviceId);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 연결된 기기 목록 */}
      {devices && devices.length > 0 && (
        <DeviceList
          devices={devices}
          onDisconnect={handleDisconnect}
          onSync={handleSync}
          isSyncing={syncMutation.isPending}
        />
      )}

      {/* 기기 추가 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            기기 연결하기
          </CardTitle>
          <CardDescription>
            스마트 기기와 연동하여 건강 데이터를 자동으로 가져올 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 블루투스 기기 (환경 변수 불필요) */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-purple-200 bg-purple-50" onClick={() => handleConnect('bluetooth')}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className={`h-5 w-5 ${SUPPORTED_DEVICES.bluetooth.color}`} />
                  {SUPPORTED_DEVICES.bluetooth.name}
                  <Badge variant="secondary" className="ml-auto">추천</Badge>
                </CardTitle>
                <CardDescription>{SUPPORTED_DEVICES.bluetooth.description}</CardDescription>
              </CardHeader>
            </Card>

            {/* Google Fit */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleConnect('google_fit')}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className={`h-5 w-5 ${SUPPORTED_DEVICES.google_fit.color}`} />
                  {SUPPORTED_DEVICES.google_fit.name}
                </CardTitle>
                <CardDescription>{SUPPORTED_DEVICES.google_fit.description}</CardDescription>
              </CardHeader>
            </Card>

            {/* Fitbit */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleConnect('fitbit')}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className={`h-5 w-5 ${SUPPORTED_DEVICES.fitbit.color}`} />
                  {SUPPORTED_DEVICES.fitbit.name}
                </CardTitle>
                <CardDescription>{SUPPORTED_DEVICES.fitbit.description}</CardDescription>
              </CardHeader>
            </Card>

            {/* Apple Health */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleConnect('apple_health')}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className={`h-5 w-5 ${SUPPORTED_DEVICES.apple_health.color}`} />
                  {SUPPORTED_DEVICES.apple_health.name}
                </CardTitle>
                <CardDescription>{SUPPORTED_DEVICES.apple_health.description}</CardDescription>
              </CardHeader>
            </Card>

            {/* Samsung Health */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleConnect('samsung_health')}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className={`h-5 w-5 ${SUPPORTED_DEVICES.samsung_health.color}`} />
                  {SUPPORTED_DEVICES.samsung_health.name}
                </CardTitle>
                <CardDescription>{SUPPORTED_DEVICES.samsung_health.description}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* 기기별 연결 다이얼로그 */}
      {selectedDevice === 'google_fit' && (
        <GoogleFitConnector
          open={selectedDevice === 'google_fit'}
          onClose={() => setSelectedDevice(null)}
          onSuccess={() => {
            setSelectedDevice(null);
            queryClient.invalidateQueries({ queryKey: ['health-devices'] });
          }}
        />
      )}

      {selectedDevice === 'fitbit' && (
        <FitbitConnector
          open={selectedDevice === 'fitbit'}
          onClose={() => setSelectedDevice(null)}
          onSuccess={() => {
            setSelectedDevice(null);
            queryClient.invalidateQueries({ queryKey: ['health-devices'] });
          }}
        />
      )}

      {selectedDevice === 'bluetooth' && (
        <BluetoothConnector
          open={selectedDevice === 'bluetooth'}
          onClose={() => setSelectedDevice(null)}
          onSuccess={() => {
            setSelectedDevice(null);
            queryClient.invalidateQueries({ queryKey: ['health-devices'] });
          }}
        />
      )}

      {(selectedDevice === 'apple_health' || selectedDevice === 'samsung_health') && (
        <FileUploadConnector
          deviceType={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onSuccess={() => {
            setSelectedDevice(null);
            queryClient.invalidateQueries({ queryKey: ['health-devices'] });
          }}
        />
      )}
    </div>
  );
}
