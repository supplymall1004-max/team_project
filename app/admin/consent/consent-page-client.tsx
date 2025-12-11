/**
 * @file app/admin/consent/consent-page-client.tsx
 * @description 동의 내역 관리 클라이언트 컴포넌트
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ConsentRecordsTable } from '@/components/admin/consent/consent-records-table';
import { ConsentRecordsFilters } from '@/components/admin/consent/consent-records-filters';
import { ConsentRecordsExport } from '@/components/admin/consent/consent-records-export';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

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

interface ConsentRecordsResponse {
  success: boolean;
  data: ConsentRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface Filters {
  clerkUserId: string;
  consentType: string;
  startDate: string;
  endDate: string;
}

export function ConsentRecordsPageClient() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    clerkUserId: '',
    consentType: '',
    startDate: '',
    endDate: '',
  });
  const { toast } = useToast();

  // 동의 내역 조회
  const { data, isLoading, error, refetch } = useQuery<ConsentRecordsResponse>({
    queryKey: ['admin-consent-records', page, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
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

      const res = await fetch(`/api/admin/consent-records?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '동의 내역 조회 실패');
      }
      return res.json();
    },
  });

  const handleFiltersChange = useCallback((newFilters: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1); // 필터 변경 시 첫 페이지로
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  useEffect(() => {
    if (error) {
      toast({
        title: '오류 발생',
        description: error instanceof Error ? error.message : '동의 내역을 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  return (
    <div className="space-y-6">
      {/* 필터 및 내보내기 */}
      <Card>
        <CardHeader>
          <CardTitle>필터 및 내보내기</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConsentRecordsFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
          <ConsentRecordsExport
            filters={filters}
            totalRecords={data?.pagination.total || 0}
          />
        </CardContent>
      </Card>

      {/* 동의 내역 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>
            동의 내역 목록
            {data?.pagination.total !== undefined && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (총 {data.pagination.total}건)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ConsentRecordsTable
            records={data?.data || []}
            isLoading={isLoading}
            pagination={data?.pagination}
            onPageChange={handlePageChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}

