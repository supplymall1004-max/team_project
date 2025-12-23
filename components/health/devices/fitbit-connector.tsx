/**
 * @file fitbit-connector.tsx
 * @description Fitbit 연동 컴포넌트
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FitbitConnectorProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function FitbitConnector({ open, onClose, onSuccess }: FitbitConnectorProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      console.group('[FitbitConnector] Fitbit 연동 시작');

      // OAuth 인증 페이지로 리다이렉트
      const response = await fetch('/api/health/devices/fitbit/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('연동 시작 실패');
      }

      const result = await response.json();
      
      if (result.authUrl) {
        // OAuth 인증 페이지로 이동
        window.location.href = result.authUrl;
      } else {
        throw new Error('인증 URL을 받을 수 없습니다');
      }
    } catch (error) {
      console.error('❌ Fitbit 연동 실패:', error);
      console.groupEnd();
      
      toast({
        title: '연동 실패',
        description: error instanceof Error ? error.message : 'Fitbit 연동에 실패했습니다.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-600" />
            Fitbit 연동
          </DialogTitle>
          <DialogDescription>
            Fitbit과 연동하여 활동량, 수면, 심박수, 체중 데이터를 자동으로 가져올 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">제공되는 데이터</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>활동량 (걸음 수, 운동 시간, 소모 칼로리)</li>
                <li>수면 (수면 시간, 수면 단계)</li>
                <li>심박수</li>
                <li>체중</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-sm space-y-2">
                <p className="font-medium text-green-900">연동 방법</p>
                <ol className="list-decimal list-inside space-y-1 text-green-700">
                  <li>아래 버튼을 클릭하여 Fitbit 계정으로 로그인합니다</li>
                  <li>데이터 접근 권한을 허용합니다</li>
                  <li>연동이 완료되면 자동으로 데이터를 가져옵니다</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
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
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Fitbit 연결하기
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
