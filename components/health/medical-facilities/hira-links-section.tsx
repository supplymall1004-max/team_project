/**
 * @file hira-links-section.tsx
 * @description 건강보험심사평가원(HIRA) "더 많은 보기" 링크 카드 섹션
 *
 * 의료시설 페이지에서 건강보험심사평가원 홈페이지로 연결하는 카드 링크 모음입니다.
 *
 * 주요 기능:
 * - 현재 운영중인 약국 찾기
 * - 소아 야간 진료기관(20시 이후)
 * - 현재 운영중인 병원 찾기
 *
 * @dependencies
 * - lucide-react: ExternalLink, Pill, Hospital, Clock 아이콘
 * - shadcn/ui Button: 링크 버튼
 */

"use client";

import React from "react";
import { ExternalLink, Pill, Hospital, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HiraLinkItem {
  key: "pharmacy" | "pediatric_night" | "hospital";
  label: string;
  description: string; // 찾는 방법 설명
  cardClassName: string;
  accentClassName: string;
  icon: React.ReactNode;
}

// 모든 카드가 동일한 HIRA 홈페이지 링크 사용
const HIRA_BASE_URL = "https://www.hira.or.kr/ra/hosp/getHealthMap.do?pgmid=HIRAA030002010000&WT.gnb=%EB%B3%91%EC%9B%90+%C2%B7+%EC%95%BD%EA%B5%AD%EC%B0%BE%EA%B8%B0#a";

const HIRA_LINK_ITEMS: HiraLinkItem[] = [
  {
    key: "pharmacy",
    label: "약국 찾기",
    description: "병원/약국 종류별 찾기 → 종류(약국) → 진료과목(전체선택) → 기타(실시간 문 연 병원)",
    cardClassName: "border-blue-200/80 bg-blue-50/70",
    accentClassName: "bg-blue-600",
    icon: <Pill className="h-4 w-4 text-blue-700" aria-hidden="true" />,
  },
  {
    key: "pediatric_night",
    label: "소아 야간 진료기관(20시 이후)",
    description: "병원/약국 종류별 찾기 → 종류(병원) → 진료과목(전체선택) → 기타(소아 야간 진료기관(20시 이후))",
    cardClassName: "border-purple-200/80 bg-purple-50/70",
    accentClassName: "bg-purple-600",
    icon: <Clock className="h-4 w-4 text-purple-700" aria-hidden="true" />,
  },
  {
    key: "hospital",
    label: "병원 찾기",
    description: "병원/약국 종류별 찾기 → 종류(병원) → 진료과목(전체선택) → 기타(실시간 문 연 병원)",
    cardClassName: "border-indigo-200/80 bg-indigo-50/70",
    accentClassName: "bg-indigo-600",
    icon: <Hospital className="h-4 w-4 text-indigo-700" aria-hidden="true" />,
  },
];

export function HiraLinksSection() {
  return (
    <section className="mt-6">
      <div className="rounded-2xl border border-blue-200/70 bg-gradient-to-b from-blue-50/80 to-white p-5 shadow-sm ring-1 ring-blue-200/30">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Hospital
                className="h-5 w-5 text-blue-700"
                aria-hidden="true"
              />
              <h2 className="text-base font-semibold text-foreground">
                건강보험심사평가원 더보기
              </h2>
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[11px] font-medium text-blue-700">
                HIRA
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              더 많은 의료기관 정보는 건강보험심사평가원에서 확인하세요.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HIRA_LINK_ITEMS.map((item) => {
            return (
              <div
                key={item.key}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-xl border p-4 transition-all",
                  "shadow-[0_1px_0_rgba(0,0,0,0.03)] hover:-translate-y-0.5 hover:shadow-md",
                  item.cardClassName,
                )}
              >
                {/* 상단: 아이콘 + 제목 */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={cn(
                      "h-10 w-1 shrink-0 rounded-full",
                      item.accentClassName,
                    )}
                    aria-hidden="true"
                  />

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/70 ring-1 ring-black/5 shrink-0">
                    {item.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">
                      {item.label}
                    </div>
                  </div>
                </div>

                {/* 중간: 찾는 방법 설명 */}
                <div className="mb-3 px-1">
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </div>
                </div>

                {/* 하단: 바로가기 버튼 */}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "gap-2 border-transparent bg-blue-600 text-white shadow-sm",
                      "hover:bg-blue-700 hover:text-white",
                      "focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2",
                    )}
                    onClick={() => {
                      console.log(
                        "[HiraLinksSection] 건강보험심사평가원 링크 오픈:",
                        { key: item.key, url: HIRA_BASE_URL },
                      );
                      window.open(HIRA_BASE_URL, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    바로가기
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 건강보험심사평가원 홈페이지 주석 */}
        <div className="mt-4 pt-4 border-t border-blue-200/50">
          <p className="text-xs text-muted-foreground text-center">
            건강보험심사평가원 홈페이지
          </p>
        </div>
      </div>
    </section>
  );
}
