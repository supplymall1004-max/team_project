/**
 * @file bluetooth-form-button.tsx
 * @description 폼에 통합할 블루투스 연결 버튼 컴포넌트
 *
 * 각 입력 필드 옆에 배치하여 블루투스 기기에서 데이터를 받아와 폼에 자동으로 채웁니다.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bluetooth, 
  Loader2, 
  CheckCircle, 
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BluetoothHealthClient, BloodPressureData, GlucoseData, WeightData, TemperatureData } from '@/lib/health/devices/bluetooth-client';

export type BluetoothDeviceType = 
  | 'heart_rate' 
  | 'blood_pressure' 
  | 'glucose' 
  | 'weight' 
  | 'temperature'
  | 'activity';

interface BluetoothFormButtonProps {
  deviceType: BluetoothDeviceType;
  onDataReceived: (data: any) => void;
  disabled?: boolean;
  className?: string;
}

const DEVICE_TYPE_INFO = {
  heart_rate: {
    serviceName: 'heart_rate',
    serviceId: 0x180D,
    label: '심박수',
    description: '심박수 모니터와 연결하여 심박수를 자동으로 가져옵니다',
    compatibleDevices: ['Polar H10', 'Polar OH1', 'Wahoo TICKR'],
  },
  blood_pressure: {
    serviceName: 'blood_pressure',
    serviceId: 0x1810,
    label: '혈압',
    description: '혈압계와 연결하여 혈압을 자동으로 가져옵니다',
    compatibleDevices: ['Omron HEM-9200T', 'Omron HEM-7600T', 'iHealth BP5'],
  },
  glucose: {
    serviceName: 'glucose',
    serviceId: 0x1808,
    label: '혈당',
    description: '혈당계와 연결하여 혈당을 자동으로 가져옵니다',
    compatibleDevices: ['Accu-Chek Guide', 'OneTouch Verio Flex'],
  },
  weight: {
    serviceName: 'weight_scale',
    serviceId: 0x181D,
    label: '체중',
    description: '스마트 체중계와 연결하여 체중을 자동으로 가져옵니다',
    compatibleDevices: ['Withings Body+', 'Xiaomi Mi Smart Scale', 'Fitbit Aria'],
  },
  temperature: {
    serviceName: 'health_thermometer',
    serviceId: 0x1809,
    label: '체온',
    description: '체온계와 연결하여 체온을 자동으로 가져옵니다',
    compatibleDevices: ['Withings Thermo', 'iHealth PT3'],
  },
  activity: {
    serviceName: 'heart_rate', // 활동량은 제한적 지원
    serviceId: 0x180D,
    label: '활동량',
    description: '활동량 트래커와 연결하여 걸음 수를 가져옵니다 (제한적 지원)',
    compatibleDevices: ['일부 스마트워치'],
  },
};

export function BluetoothFormButton({ 
  deviceType, 
  onDataReceived, 
  disabled,
  className 
}: BluetoothFormButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const deviceInfo = DEVICE_TYPE_INFO[deviceType];
  const isBluetoothSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  const handleConnect = async () => {
    if (!isBluetoothSupported) {
      toast({
        title: '브라우저 미지원',
        description: '이 브라우저는 Web Bluetooth API를 지원하지 않습니다. Chrome, Edge, Samsung Internet을 사용해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      console.group(`[BluetoothFormButton] ${deviceInfo.label} 기기 연결`);

      const client = new BluetoothHealthClient();
      
      // 기기 타입에 따라 적절한 서비스로 연결
      await client.connectWithService(deviceInfo.serviceId);

      setIsConnected(true);
      console.log('✅ 기기 연결 완료');

      // 데이터 읽기
      let data: any = null;

      switch (deviceType) {
        case 'heart_rate': {
          const hr = await client.readHeartRate();
          if (hr !== null) {
            data = { heart_rate: hr };
          }
          break;
        }
        case 'blood_pressure': {
          const bp = await client.readBloodPressure();
          if (bp) {
            data = {
              systolic_bp: bp.systolic,
              diastolic_bp: bp.diastolic,
              heart_rate: bp.pulse,
            };
          }
          break;
        }
        case 'glucose': {
          const glucose = await client.readGlucose();
          if (glucose) {
            // context에 따라 공복/식후 구분
            if (glucose.context === 'fasting' || glucose.context === 'before_meal') {
              data = { fasting_glucose: glucose.glucose };
            } else {
              data = { postprandial_glucose: glucose.glucose };
            }
          }
          break;
        }
        case 'weight': {
          const weight = await client.readWeight();
          if (weight) {
            data = {
              weight_kg: weight.weight,
              body_fat_percentage: weight.bodyFat,
              muscle_mass_kg: weight.muscleMass,
            };
          }
          break;
        }
        case 'temperature': {
          const temp = await client.readTemperature();
          if (temp) {
            // 체온은 vital_signs에 저장할 수 있지만 현재 폼에는 없음
            // 향후 확장 가능
            toast({
              title: '체온 측정 완료',
              description: `체온: ${temp.temperature}°C`,
            });
          }
          break;
        }
      }

      if (data) {
        console.log('✅ 데이터 수신:', data);
        onDataReceived(data);
        
        toast({
          title: '데이터 수신 완료',
          description: `${deviceInfo.label} 데이터가 폼에 자동으로 채워졌습니다.`,
        });
      } else {
        throw new Error('데이터를 읽을 수 없습니다');
      }

      // 연결 해제
      client.disconnect();
      setIsConnected(false);

      console.groupEnd();
    } catch (error) {
      console.error('❌ 블루투스 연결 실패:', error);
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

  if (!isBluetoothSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled
              className={className}
            >
              <Bluetooth className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>이 브라우저는 Web Bluetooth를 지원하지 않습니다</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleConnect}
            disabled={disabled || isConnecting || isConnected}
            className={className}
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isConnected ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : error ? (
              <XCircle className="h-4 w-4 text-red-600" />
            ) : (
              <Bluetooth className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">{deviceInfo.label} 기기 연결</p>
            <p className="text-sm">{deviceInfo.description}</p>
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mt-2">호환 기기:</p>
              <ul className="list-disc list-inside space-y-1">
                {deviceInfo.compatibleDevices.map((device, idx) => (
                  <li key={idx}>{device}</li>
                ))}
              </ul>
            </div>
            {error && (
              <p className="text-xs text-red-600 mt-2">오류: {error}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
