/**
 * @file bluetooth-guide-dialog.tsx
 * @description 블루투스 연결 가이드 다이얼로그
 *
 * 사용자가 처음 블루투스 기능을 사용할 때 표시되는 가이드입니다.
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bluetooth, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface BluetoothGuideDialogProps {
  trigger?: React.ReactNode;
}

export function BluetoothGuideDialog({ trigger }: BluetoothGuideDialogProps) {
  const isBluetoothSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Info className="mr-2 h-4 w-4" />
            블루투스 연결 가이드
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bluetooth className="h-5 w-5 text-blue-600" />
            블루투스 건강 기기 연결 가이드
          </DialogTitle>
          <DialogDescription>
            블루투스 건강 기기와 연결하여 데이터를 자동으로 가져오는 방법을 안내합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* 브라우저 호환성 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {isBluetoothSupported ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                브라우저 호환성
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isBluetoothSupported ? (
                <div className="space-y-2">
                  <p className="text-sm text-green-700">
                    ✅ 현재 브라우저는 Web Bluetooth API를 지원합니다.
                  </p>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">지원 브라우저:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Google Chrome (데스크톱 및 Android)</li>
                      <li>Microsoft Edge</li>
                      <li>Samsung Internet</li>
                      <li>Opera</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-red-700">
                    ❌ 현재 브라우저는 Web Bluetooth API를 지원하지 않습니다.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Chrome, Edge, Samsung Internet으로 접속해주세요.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 연결 방법 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">연결 방법</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-3 text-sm">
                <li>
                  <strong>기기 준비</strong>
                  <p className="text-muted-foreground ml-6 mt-1">
                    블루투스 건강 기기가 켜져 있고 페어링 가능한 상태인지 확인하세요.
                  </p>
                </li>
                <li>
                  <strong>블루투스 버튼 클릭</strong>
                  <p className="text-muted-foreground ml-6 mt-1">
                    입력 필드 옆의 블루투스 아이콘 버튼을 클릭하세요.
                  </p>
                </li>
                <li>
                  <strong>기기 선택</strong>
                  <p className="text-muted-foreground ml-6 mt-1">
                    브라우저에서 표시되는 기기 목록에서 연결할 기기를 선택하세요.
                  </p>
                </li>
                <li>
                  <strong>데이터 수신</strong>
                  <p className="text-muted-foreground ml-6 mt-1">
                    연결이 완료되면 자동으로 데이터를 읽어와 폼에 채워집니다.
                  </p>
                </li>
                <li>
                  <strong>분석 확인</strong>
                  <p className="text-muted-foreground ml-6 mt-1">
                    받아온 데이터는 자동으로 분석되어 건강 상태와 권장사항이 표시됩니다.
                  </p>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* 지원 기기 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">지원 기기</CardTitle>
              <CardDescription>표준 BLE 프로파일을 지원하는 건강 기기</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium mb-2">심박수 모니터</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Polar H10</li>
                    <li>Polar OH1</li>
                    <li>Wahoo TICKR</li>
                    <li>Coospo H6/H808</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-2">혈압계</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Omron HEM-9200T</li>
                    <li>Omron HEM-7600T</li>
                    <li>iHealth BP5</li>
                    <li>Withings BPM Connect</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-2">혈당계</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Accu-Chek Guide</li>
                    <li>OneTouch Verio Flex</li>
                    <li>Contour Next One</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-2">체중계</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Withings Body+</li>
                    <li>Xiaomi Mi Smart Scale</li>
                    <li>Fitbit Aria</li>
                    <li>Garmin Index S2</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 주의사항 */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                주의사항
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="list-disc list-inside space-y-1 text-yellow-700">
                <li>HTTPS 연결이 필수입니다 (보안상의 이유)</li>
                <li>기기가 블루투스로 페어링 가능한 상태여야 합니다</li>
                <li>일부 기기는 제조사 앱을 통해 먼저 페어링이 필요할 수 있습니다</li>
                <li>데이터 분석은 일반적인 기준을 바탕으로 하며, 개인차가 있을 수 있습니다</li>
                <li>지속적인 이상 증상이 있으면 의사와 상담하시기 바랍니다</li>
              </ul>
            </CardContent>
          </Card>

          {/* 문제 해결 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">문제 해결</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">기기를 찾을 수 없어요</p>
                  <p className="text-muted-foreground">
                    기기가 켜져 있고 블루투스가 활성화되어 있는지 확인하세요. 
                    일부 기기는 제조사 앱에서 먼저 블루투스를 활성화해야 합니다.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">연결이 자주 끊겨요</p>
                  <p className="text-muted-foreground">
                    기기와 컴퓨터/스마트폰의 거리를 가깝게 유지하세요. 
                    다른 블루투스 기기와의 간섭을 피하세요.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">데이터를 읽을 수 없어요</p>
                  <p className="text-muted-foreground">
                    기기가 측정 모드에 있는지 확인하세요. 
                    일부 기기는 측정을 시작해야 데이터를 전송합니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
