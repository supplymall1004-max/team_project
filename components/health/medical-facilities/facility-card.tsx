/**
 * @file facility-card.tsx
 * @description 개별 의료기관 정보 카드 컴포넌트
 *
 * 의료기관의 이름, 주소, 전화번호, 거리 등을 표시합니다.
 * 디자인 문서에 맞춘 시각적이고 정보가 풍부한 카드 디자인을 적용합니다.
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, ExternalLink, Navigation, Hospital, Pill, Heart, HeartPulse, Clock } from "lucide-react";
import type { MedicalFacility } from "@/types/medical-facility";
import { formatDistance } from "@/lib/health/medical-facilities/location-utils";
import { CATEGORY_LABELS, type MedicalFacilityCategory } from "@/types/medical-facility";
import { cn } from "@/lib/utils";

interface FacilityCardProps {
  facility: MedicalFacility;
  onMapClick?: (facility: MedicalFacility) => void;
  className?: string;
}

// 카테고리별 아이콘 및 색상
const CATEGORY_CONFIG: Record<
  MedicalFacility["category"],
  { icon: typeof Hospital; color: string; bgColor: string }
> = {
  hospital: {
    icon: Hospital,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  pharmacy: {
    icon: Pill,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  animal_hospital: {
    icon: Heart,
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
  },
  animal_pharmacy: {
    icon: HeartPulse,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
};

export function FacilityCard({ facility, onMapClick, className }: FacilityCardProps) {
  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (facility.phone) {
      window.location.href = `tel:${facility.phone}`;
    }
  };

  const handleMapClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onMapClick) {
      onMapClick(facility);
    }
  };

  // 안전성 체크
  if (!facility) {
    console.warn("[FacilityCard] facility prop이 없습니다.");
    return null;
  }

  const categoryConfig = CATEGORY_CONFIG[facility.category];
  if (!categoryConfig) {
    console.warn(`[FacilityCard] 알 수 없는 카테고리: ${facility.category}`);
    return null;
  }

  const Icon = categoryConfig.icon;

  return (
    <Card
      id={`facility-${facility.id}`}
      className={cn(
        "group transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border",
        className
      )}
    >
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          {/* 카테고리 아이콘 */}
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110",
              categoryConfig.bgColor
            )}
          >
            <Icon className={cn("h-6 w-6", categoryConfig.color)} />
          </div>

          {/* 메인 정보 */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* 제목 및 거리 */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 break-words">
                  {facility.name}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    <Icon className={cn("h-3 w-3 shrink-0", categoryConfig.color)} />
                    {CATEGORY_LABELS[facility.category]}
                  </span>
                </div>
              </div>
              {facility.distance !== undefined && (
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary whitespace-nowrap">
                  {formatDistance(facility.distance)}
                </span>
              )}
            </div>

            {/* 주소 정보 */}
            <div className="space-y-1.5 text-xs">
              {facility.roadAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground break-words leading-relaxed">{facility.roadAddress}</p>
                    {facility.address !== facility.roadAddress && (
                      <p className="mt-0.5 text-xs text-muted-foreground break-words leading-relaxed">{facility.address}</p>
                    )}
                  </div>
                </div>
              )}
              {!facility.roadAddress && facility.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-foreground break-words leading-relaxed">{facility.address}</p>
                </div>
              )}
              {/* 전화번호 정보 */}
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {facility.phone ? (
                  <a
                    href={`tel:${facility.phone}`}
                    onClick={handlePhoneClick}
                    className="font-medium text-primary hover:underline transition-colors break-all"
                  >
                    {facility.phone}
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">전화번호 정보 없음</span>
                )}
              </div>
              
              {/* 영업 시간 정보 */}
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="flex items-center gap-2 flex-wrap">
                  {facility.operatingHours ? (
                    facility.operatingHours.is24Hours ? (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-xs">
                        24시간 영업
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground break-words">
                        {facility.operatingHours.hours || "영업 시간 정보 없음"}
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-muted-foreground">영업 시간 정보 없음</span>
                  )}
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {facility.phone ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handlePhoneClick}
                  className="shrink-0 gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs px-3"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">전화걸기</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="shrink-0 gap-1.5 text-xs px-3 opacity-50 cursor-not-allowed"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">전화번호 없음</span>
                </Button>
              )}
              {onMapClick && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMapClick}
                  className="flex-1 min-w-[100px] gap-1.5 transition-all hover:bg-primary hover:text-primary-foreground text-xs px-2"
                >
                  <Navigation className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap text-xs">지도에서 보기</span>
                </Button>
              )}
              {facility.link && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className={cn(
                    "gap-1.5 transition-all hover:bg-primary hover:text-primary-foreground text-xs px-2",
                    onMapClick ? "flex-1 min-w-[100px]" : "flex-1"
                  )}
                >
                  <a
                    href={facility.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap text-xs">네이버에서 보기</span>
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

