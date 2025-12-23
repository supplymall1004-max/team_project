/**
 * @file file-upload-connector.tsx
 * @description Apple Health / Samsung Health 파일 업로드 컴포넌트
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
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Smartphone, Upload, Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadConnectorProps {
  deviceType: 'apple_health' | 'samsung_health';
  onClose: () => void;
  onSuccess: () => void;
}

export function FileUploadConnector({ deviceType, onClose, onSuccess }: FileUploadConnectorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const deviceName = deviceType === 'apple_health' ? 'Apple Health' : 'Samsung Health';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: '파일 선택 필요',
        description: '업로드할 파일을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploading(true);
      console.group(`[FileUploadConnector] ${deviceName} 파일 업로드 시작`);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('source_type', deviceType);

      const response = await fetch('/api/health/devices/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '파일 업로드 실패');
      }

      console.log('✅ 파일 업로드 완료:', result);
      console.groupEnd();

      toast({
        title: '업로드 완료',
        description: result.message || '파일이 업로드되었습니다.',
      });

      onSuccess();
    } catch (error) {
      console.error(`❌ ${deviceName} 파일 업로드 실패:`, error);
      console.groupEnd();

      toast({
        title: '업로드 실패',
        description: error instanceof Error ? error.message : '파일 업로드에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            {deviceName} 데이터 업로드
          </DialogTitle>
          <DialogDescription>
            {deviceName}에서 내보낸 건강 데이터 파일을 업로드하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-sm space-y-2">
                <p className="font-medium text-blue-900">파일 내보내기 방법</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  {deviceType === 'apple_health' ? (
                    <>
                      <li>iPhone의 건강 앱을 엽니다</li>
                      <li>프로필 탭 → 데이터 내보내기</li>
                      <li>XML 또는 JSON 형식으로 내보내기</li>
                    </>
                  ) : (
                    <>
                      <li>Samsung Health 앱을 엽니다</li>
                      <li>설정 → 데이터 내보내기</li>
                      <li>CSV 또는 JSON 형식으로 내보내기</li>
                    </>
                  )}
                </ol>
              </div>
            </CardContent>
          </Card>

          <div>
            <Label htmlFor="file-upload" className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4" />
              파일 선택
            </Label>
            <Input
              id="file-upload"
              type="file"
              accept=".csv,.json,.xml"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {file && (
              <p className="text-sm text-muted-foreground mt-2">
                선택된 파일: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              취소
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || !file}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  업로드
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
