/**
 * @file components/admin/consent/consent-records-table.tsx
 * @description 동의 내역 테이블 컴포넌트
 */

'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ConsentRecord {
  id: string;
  clerk_user_id: string;
  consent_type: string;
  consent_content: string;
  consent_status: 'granted' | 'withdrawn' | 'expired';
  consent_time: string;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  location_country: string | null;
  location_region: string | null;
  location_city: string | null;
  verification_id: string | null;
  identity_verifications: {
    id: string;
    name: string;
    status: string;
    created_at: string;
  } | null;
}

interface ConsentRecordsTableProps {
  records: ConsentRecord[];
  isLoading: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

const CONSENT_TYPE_LABELS: Record<string, string> = {
  identity_verification: '신원확인',
  health_data_collection: '건강정보 수집',
  data_sync: '데이터 동기화',
};

const CONSENT_STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  granted: { label: '동의', variant: 'default' },
  withdrawn: { label: '철회', variant: 'destructive' },
  expired: { label: '만료', variant: 'secondary' },
};

const DEVICE_TYPE_LABELS: Record<string, string> = {
  desktop: '데스크톱',
  mobile: '모바일',
  tablet: '태블릿',
  unknown: '알 수 없음',
};

export function ConsentRecordsTable({
  records,
  isLoading,
  pagination,
  onPageChange,
}: ConsentRecordsTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        동의 내역이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>동의 시간</TableHead>
              <TableHead>사용자 ID</TableHead>
              <TableHead>이름</TableHead>
              <TableHead>동의 유형</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>기기</TableHead>
              <TableHead>IP 주소</TableHead>
              <TableHead>위치</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => {
              const consentContent = JSON.parse(record.consent_content || '{}');
              const statusInfo = CONSENT_STATUS_LABELS[record.consent_status] || CONSENT_STATUS_LABELS.granted;
              const location = [
                record.location_country,
                record.location_region,
                record.location_city,
              ]
                .filter(Boolean)
                .join(', ') || '알 수 없음';

              return (
                <TableRow key={record.id}>
                  <TableCell>
                    {format(new Date(record.consent_time), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {record.clerk_user_id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {record.identity_verifications?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {CONSENT_TYPE_LABELS[record.consent_type] || record.consent_type}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusInfo.variant}>
                      {statusInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {DEVICE_TYPE_LABELS[record.device_type || 'unknown']}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {record.ip_address || '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {location}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {pagination.page} / {pagination.totalPages} 페이지
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

