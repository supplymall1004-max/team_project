/**
 * @file facility-card-list.tsx
 * @description 의료기관 카드 리스트 컴포넌트
 *
 * 검색 결과를 카드 형태로 나열합니다.
 * 스켈레톤 UI 로딩 상태를 제공합니다.
 */

"use client";

import { FacilityCard } from "./facility-card";
import type { MedicalFacility } from "@/types/medical-facility";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface FacilityCardListProps {
  facilities: MedicalFacility[];
  loading?: boolean;
  onMapClick?: (facility: MedicalFacility) => void;
}

// 스켈레톤 카드 컴포넌트
function FacilityCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          <div className="h-12 w-12 shrink-0 rounded-xl bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="space-y-2">
              <div className="h-5 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/4 rounded bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
            </div>
            <div className="flex gap-2 pt-2">
              <div className="h-9 flex-1 rounded bg-muted" />
              <div className="h-9 flex-1 rounded bg-muted" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FacilityCardList({
  facilities,
  loading = false,
  onMapClick,
}: FacilityCardListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <FacilityCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (facilities.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <MapPin className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-foreground">검색 결과가 없습니다</p>
        <p className="mt-2 text-sm text-muted-foreground">
          다른 위치에서 검색해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {facilities.map((facility, index) => (
        <div
          key={facility.id}
          className="animate-in fade-in-50 slide-in-from-bottom-4"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <FacilityCard
            facility={facility}
            onMapClick={onMapClick}
          />
        </div>
      ))}
    </div>
  );
}

