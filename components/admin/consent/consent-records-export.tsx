/**
 * @file components/admin/consent/consent-records-export.tsx
 * @description 동의 내역 출력 컴포넌트 (PDF, Excel, HWP)
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Filters {
  clerkUserId: string;
  consentType: string;
  startDate: string;
  endDate: string;
}

interface ConsentRecordsExportProps {
  filters: Filters;
  totalRecords: number;
}

export function ConsentRecordsExport({
  filters,
  totalRecords,
}: ConsentRecordsExportProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExport = async (format: 'pdf' | 'excel' | 'hwp') => {
    if (totalRecords === 0) {
      toast({
        title: '내보낼 데이터 없음',
        description: '출력할 동의 내역이 없습니다.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(format);
    try {
      const params = new URLSearchParams({
        format,
      });

      if (filters.clerkUserId) {
        params.append('clerk_user_id', filters.clerkUserId);
      }
      if (filters.consentType) {
        params.append('consent_type', filters.consentType);
      }
      if (filters.startDate) {
        params.append('start_date', filters.startDate);
      }
      if (filters.endDate) {
        params.append('end_date', filters.endDate);
      }

      const response = await fetch(`/api/admin/consent-records/export?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '출력 실패');
      }

      // 파일 다운로드
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const contentType = response.headers.get('content-type') || '';
      let extension: string = format;
      if (format === 'excel') extension = 'xlsx';
      if (format === 'hwp') extension = 'hwp';
      
      a.download = `consent-records-${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: '출력 완료',
        description: `${totalRecords}건의 동의 내역이 ${format.toUpperCase()} 형식으로 다운로드되었습니다.`,
      });
    } catch (error) {
      console.error('[ConsentRecordsExport] 출력 오류:', error);
      toast({
        title: '출력 실패',
        description: error instanceof Error ? error.message : '파일 출력 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => handleExport('pdf')}
        disabled={isExporting !== null || totalRecords === 0}
      >
        {isExporting === 'pdf' ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            PDF 생성 중...
          </>
        ) : (
          <>
            <FileDown className="h-4 w-4 mr-2" />
            PDF 출력
          </>
        )}
      </Button>

      <Button
        variant="outline"
        onClick={() => handleExport('excel')}
        disabled={isExporting !== null || totalRecords === 0}
      >
        {isExporting === 'excel' ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Excel 생성 중...
          </>
        ) : (
          <>
            <FileDown className="h-4 w-4 mr-2" />
            Excel 출력
          </>
        )}
      </Button>

      <Button
        variant="outline"
        onClick={() => handleExport('hwp')}
        disabled={isExporting !== null || totalRecords === 0}
      >
        {isExporting === 'hwp' ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            HWP 생성 중...
          </>
        ) : (
          <>
            <FileDown className="h-4 w-4 mr-2" />
            HWP 출력
          </>
        )}
      </Button>
    </div>
  );
}

