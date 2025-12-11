/**
 * @file components/admin/consent/consent-records-filters.tsx
 * @description 동의 내역 필터 컴포넌트
 */

'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Filters {
  clerkUserId: string;
  consentType: string;
  startDate: string;
  endDate: string;
}

interface ConsentRecordsFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Partial<Filters>) => void;
}

export function ConsentRecordsFilters({
  filters,
  onFiltersChange,
}: ConsentRecordsFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="space-y-2">
        <Label htmlFor="clerkUserId">사용자 ID</Label>
        <Input
          id="clerkUserId"
          placeholder="Clerk User ID"
          value={filters.clerkUserId}
          onChange={(e) => onFiltersChange({ clerkUserId: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="consentType">동의 유형</Label>
        <Select
          value={filters.consentType}
          onValueChange={(value) => onFiltersChange({ consentType: value })}
        >
          <SelectTrigger id="consentType">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">전체</SelectItem>
            <SelectItem value="identity_verification">신원확인</SelectItem>
            <SelectItem value="health_data_collection">건강정보 수집</SelectItem>
            <SelectItem value="data_sync">데이터 동기화</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">시작일</Label>
        <Input
          id="startDate"
          type="date"
          value={filters.startDate}
          onChange={(e) => onFiltersChange({ startDate: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="endDate">종료일</Label>
        <Input
          id="endDate"
          type="date"
          value={filters.endDate}
          onChange={(e) => onFiltersChange({ endDate: e.target.value })}
        />
      </div>
    </div>
  );
}

