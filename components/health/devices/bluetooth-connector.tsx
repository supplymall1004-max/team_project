/**
 * @file bluetooth-connector.tsx
 * @description Web Bluetooth API를 사용한 블루투스 기기 연결 컴포넌트
 *
 * 환경 변수 없이 브라우저에서 직접 블루투스 기기와 연결합니다.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bluetooth, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Battery,
  Heart,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BluetoothHealthClient } from '@/lib/health/devices/bluetooth-client';

interface BluetoothConnectorProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BluetoothConnector({ open, onClose, onSuccess }: BluetoothConnectorProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [client, setClient] = useState<BluetoothHealthClient | null>(null);

  // Web Bluetooth API 지원 확인
  const isBluetoothSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  useEffect(() => {
    if (!open) {
      // 다이얼로그가 닫히면 연결 해제
      if (client) {
        client.disconnect();
        setClient(null);
      }
      setIsConnected(false);
      setHeartRate(null);
      setBatteryLevel(null);
      setDeviceName(null);
      setError(null);
    }
  }, [open, client]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      console.group('[BluetoothConnector] 블루투스 기기 연결 시작');

      const bluetoothClient = new BluetoothHealthClient();
      const device = await bluetoothClient.connect();

      setClient(bluetoothClient);
      setIsConnected(true);
      setDeviceName(device.name);

      // 기기 정보 읽기
      const deviceInfo = await bluetoothClient.readDeviceInfo();
      console.log('기기 정보:', deviceInfo);

      // 배터리 잔량 읽기
      const battery = await bluetoothClient.readBatteryLevel();
      setBatteryLevel(battery);

      console.log('✅ 블루투스 기기 연결 완료');
      console.groupEnd();

      toast({
        title: '연결 완료',
        description: `${device.name} 기기가 연결되었습니다.`,
      });
    } catch (error) {
      console.error('❌ 블루투스 기기 연결 실패:', error);
      console.groupEnd();

      const errorMessage = error instanceof Error ? error.message : '블루투스 기기 연결에 실패했습니다.';
      setError(errorMessage);

      toast({
        title: '연결 실패',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleReadHeartRate = async () => {
    if (!client) return;

    try {
      setIsReading(true);
      setError(null);
      console.group('[BluetoothConnector] 심박수 읽기');

      const hr = await client.readHeartRate();
      
      if (hr !== null) {
        setHeartRate(hr);

        // 서버에 데이터 저장
        const response = await fetch('/api/health/devices/bluetooth/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'heart_rate',
            value: hr,
            timestamp: new Date().toISOString(),
            device_name: deviceName,
          }),
        });

        if (response.ok) {
          toast({
            title: '심박수 저장 완료',
            description: `심박수 ${hr} bpm이 저장되었습니다.`,
          });
        }

        console.log('✅ 심박수 읽기 및 저장 완료');
      }
      console.groupEnd();
    } catch (error) {
      console.error('❌ 심박수 읽기 실패:', error);
      console.groupEnd();

      const errorMessage = error instanceof Error ? error.message : '심박수 읽기에 실패했습니다.';
      setError(errorMessage);

      toast({
        title: '읽기 실패',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsReading(false);
    }
  };

  const handleDisconnect = () => {
    if (client) {
      client.disconnect();
      setClient(null);
      setIsConnected(false);
      setHeartRate(null);
      setBatteryLevel(null);
      setDeviceName(null);
      setError(null);
      
      toast({
        title: '연결 해제',
        description: '블루투스 기기 연결이 해제되었습니다.',
      });
    }
  };

  if (!isBluetoothSupported) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bluetooth className="h-5 w-5 text-blue-600" />
              블루투스 기기 연결
            </DialogTitle>
            <DialogDescription>
              Web Bluetooth API를 지원하지 않는 브라우저입니다.
            </DialogDescription>
          </DialogHeader>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="text-sm space-y-2">
                <p className="font-medium text-yellow-900">지원 브라우저</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li>Google Chrome (데스크톱 및 Android)</li>
                  <li>Microsoft Edge</li>
                  <li>Samsung Internet</li>
                  <li>Opera</li>
                </ul>
                <p className="text-yellow-700 mt-2">
                  <strong>참고:</strong> HTTPS 연결이 필요합니다. Safari와 Firefox는 현재 지원하지 않습니다.
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bluetooth className="h-5 w-5 text-blue-600" />
            블루투스 기기 연결
          </DialogTitle>
          <DialogDescription>
            블루투스 건강 기기와 직접 연결하여 데이터를 가져올 수 있습니다. (환경 변수 불필요)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {/* 연결 상태 */}
          {isConnected && deviceName && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-green-900">연결됨</p>
                    <p className="text-sm text-green-700">{deviceName}</p>
                  </div>
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    연결됨
                  </Badge>
                </div>
                {batteryLevel !== null && (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Battery className="h-4 w-4" />
                    배터리: {batteryLevel}%
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 심박수 표시 */}
          {heartRate !== null && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">심박수</p>
                      <p className="text-2xl font-bold">{heartRate} bpm</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 오류 메시지 */}
          {error && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-4 w-4" />
                  <p className="text-sm">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 안내 카드 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-sm space-y-2">
                <p className="font-medium text-blue-900">연결 방법</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>블루투스 기기가 켜져 있고 페어링 가능한 상태인지 확인</li>
                  <li>"기기 연결" 버튼 클릭</li>
                  <li>기기 목록에서 연결할 기기 선택</li>
                  <li>연결 후 "심박수 읽기" 버튼으로 데이터 가져오기</li>
                </ol>
                <p className="text-blue-700 mt-2">
                  <strong>지원 기기:</strong> 심박수 측정 기능이 있는 블루투스 기기 (Mi Band, Fitbit, Garmin 등)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 버튼 */}
          <div className="flex justify-end gap-2">
            {!isConnected ? (
              <>
                <Button variant="outline" onClick={onClose} disabled={isConnecting}>
                  취소
                </Button>
                <Button onClick={handleConnect} disabled={isConnecting}>
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      연결 중...
                    </>
                  ) : (
                    <>
                      <Bluetooth className="mr-2 h-4 w-4" />
                      기기 연결
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleDisconnect}>
                  연결 해제
                </Button>
                <Button onClick={handleReadHeartRate} disabled={isReading}>
                  {isReading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      읽는 중...
                    </>
                  ) : (
                    <>
                      <Heart className="mr-2 h-4 w-4" />
                      심박수 읽기
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
