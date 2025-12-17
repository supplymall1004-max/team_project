/**
 * @file naver-more-links-section.tsx
 * @description 네이버지도 "더 많은 보기" 링크 카드 섹션
 *
 * 의료시설 페이지에서 API로 모두를 보여주지 않고, 네이버지도에서 더 많은 결과를
 * 보도록 유도하는 카드 링크 모음입니다.
 *
 * 주요 기능:
 * - 약국/병원/동물병원/동물약국 4개 링크 카드 제공
 * - 현재 위치가 있으면 해당 좌표를 기준으로 네이버지도 검색을 오픈
 * - 현재 위치가 없으면 전국 검색으로 오픈
 *
 * @dependencies
 * - lucide-react: ExternalLink 아이콘
 * - shadcn/ui Button: 링크 버튼
 */

"use client";

import React from "react";
import {
  ExternalLink,
  Hospital,
  MapPinned,
  PawPrint,
  Pill,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LatLon {
  lat: number;
  lon: number;
}

interface NaverMoreLinksSectionProps {
  currentLocation?: LatLon | null;
}

interface NaverLinkItem {
  key: "pharmacy" | "hospital" | "animal_hospital" | "animal_pharmacy";
  label: string;
  query: string;
  cardClassName: string;
  accentClassName: string;
  icon: React.ReactNode;
}

const NAVER_LINK_ITEMS: NaverLinkItem[] = [
  {
    key: "pharmacy",
    label: "약국",
    query: "약국",
    cardClassName: "border-emerald-200/80 bg-emerald-50/70",
    accentClassName: "bg-[#03C75A]",
    icon: <Pill className="h-4 w-4 text-emerald-700" aria-hidden="true" />,
  },
  {
    key: "hospital",
    label: "병원",
    query: "병원",
    cardClassName: "border-teal-200/80 bg-teal-50/70",
    accentClassName: "bg-teal-500",
    icon: <Hospital className="h-4 w-4 text-teal-700" aria-hidden="true" />,
  },
  {
    key: "animal_hospital",
    label: "동물병원",
    query: "동물병원",
    cardClassName: "border-green-200/80 bg-green-50/70",
    accentClassName: "bg-green-600",
    icon: <PawPrint className="h-4 w-4 text-green-700" aria-hidden="true" />,
  },
  {
    key: "animal_pharmacy",
    label: "동물약국",
    query: "동물약국",
    cardClassName: "border-lime-200/80 bg-lime-50/70",
    accentClassName: "bg-lime-600",
    icon: <Pill className="h-4 w-4 text-lime-700" aria-hidden="true" />,
  },
];

function buildNaverMapSearchUrl(
  query: string,
  currentLocation?: LatLon | null,
): string {
  if (currentLocation) {
    // 줌 레벨 15
    return `https://map.naver.com/p/search/${encodeURIComponent(query)}?c=${currentLocation.lat},${currentLocation.lon},15,0,0,0,dh`;
  }

  // 전국 검색(기본 뷰)
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}?c=15.00,0,0,0,dh`;
}

export function NaverMoreLinksSection({
  currentLocation,
}: NaverMoreLinksSectionProps) {
  return (
    <section className="mt-6">
      <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-b from-emerald-50/80 to-white p-5 shadow-sm ring-1 ring-emerald-200/30">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <MapPinned
                className="h-5 w-5 text-emerald-700"
                aria-hidden="true"
              />
              <h2 className="text-base font-semibold text-foreground">
                네이버지도 더보기
              </h2>
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                NAVER
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              더 많은 결과는 네이버지도에서 확인하세요.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {NAVER_LINK_ITEMS.map((item) => {
            const url = buildNaverMapSearchUrl(item.query, currentLocation);
            return (
              <div
                key={item.key}
                className={cn(
                  "group relative flex items-center justify-between overflow-hidden rounded-xl border p-3 transition-all",
                  "shadow-[0_1px_0_rgba(0,0,0,0.03)] hover:-translate-y-0.5 hover:shadow-md",
                  item.cardClassName,
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      "h-10 w-1 shrink-0 rounded-full",
                      item.accentClassName,
                    )}
                    aria-hidden="true"
                  />

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/70 ring-1 ring-black/5">
                    {item.icon}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">
                      네이버지도 {item.label} 더보기
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {currentLocation ? "현재 위치 주변 검색" : "전국 검색"}
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "ml-3 shrink-0 gap-2 border-transparent bg-[#03C75A] text-white shadow-sm",
                    "hover:bg-[#02b650] hover:text-white",
                    "focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2",
                  )}
                  onClick={() => {
                    console.log(
                      "[NaverMoreLinksSection] 네이버지도 링크 오픈:",
                      { key: item.key, url },
                    );
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  네이버지도
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
