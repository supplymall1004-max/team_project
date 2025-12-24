/**
 * @file components/health/character/health-trends-panel.tsx
 * @description 건강 트렌드 요약 패널 컴포넌트
 *
 * 캐릭터창의 건강 트렌드 요약을 표시합니다.
 * - 체중 추이 요약 (최근 변화)
 * - 건강 점수 추이 요약
 * - 간단한 통계 정보
 *
 * @dependencies
 * - @/components/ui/card: Card, CardContent, CardHeader, CardTitle
 * - @/lib/utils: cn
 * - @/types/character: CharacterData
 */

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import type { CharacterData } from "@/types/character";

interface HealthTrendsPanelProps {
  data: CharacterData["healthTrends"];
  className?: string;
}

/**
 * 추이 방향 계산 (증가/감소/유지)
 */
function calculateTrend(
  data: Array<{ date: string; value: number }>
): "up" | "down" | "stable" | null {
  if (data.length < 2) return null;

  const sorted = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const first = sorted[0].value;
  const last = sorted[sorted.length - 1].value;
  const diff = last - first;
  const threshold = Math.abs(first * 0.02); // 2% 변화량을 임계값으로

  if (Math.abs(diff) < threshold) return "stable";
  return diff > 0 ? "up" : "down";
}

/**
 * 최근 변화량 계산
 */
function calculateChange(
  data: Array<{ date: string; value: number }>
): { value: number; percentage: number } | null {
  if (data.length < 2) return null;

  const sorted = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const first = sorted[0].value;
  const last = sorted[sorted.length - 1].value;
  const diff = last - first;
  const percentage = first !== 0 ? (diff / first) * 100 : 0;

  return { value: diff, percentage };
}

/**
 * 건강 트렌드 요약 패널 컴포넌트
 */
export function HealthTrendsPanel({
  data,
  className,
}: HealthTrendsPanelProps) {
  // 체중 추이 요약
  const weightTrend = data.weight.length >= 2
    ? calculateTrend(
        data.weight.map((w) => ({ date: w.date, value: w.weight_kg }))
      )
    : null;
  const weightChange = data.weight.length >= 2
    ? calculateChange(
        data.weight.map((w) => ({ date: w.date, value: w.weight_kg }))
      )
    : null;

  // 건강 점수 추이 요약
  const healthScoreTrend = data.healthScore.length >= 2
    ? calculateTrend(
        data.healthScore.map((h) => ({ date: h.date, value: h.score }))
      )
    : null;
  const healthScoreChange = data.healthScore.length >= 2
    ? calculateChange(
        data.healthScore.map((h) => ({ date: h.date, value: h.score }))
      )
    : null;

  const hasData =
    data.weight.length > 0 ||
    data.activity.length > 0 ||
    data.nutrition.length > 0 ||
    data.healthScore.length > 0;

  if (!hasData) {
    return (
      <Card
        className={cn(
          "bg-gradient-to-br from-gray-800/90 to-gray-900/90",
          "border-gray-700/50",
          "backdrop-blur-sm",
          className
        )}
      >
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            건강 트렌드
          </CardTitle>
          <CardDescription className="text-gray-400">
            건강 트렌드 데이터가 없습니다.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "bg-gradient-to-br from-gray-800/90 to-gray-900/90",
        "border-gray-700/50",
        "backdrop-blur-sm",
        className
      )}
    >
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          건강 트렌드 (최근 3개월)
        </CardTitle>
        <CardDescription className="text-gray-400">
          건강 지표 변화 추이 요약
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 체중 추이 */}
        {data.weight.length > 0 && (
          <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-white text-sm">체중 추이</h4>
              {weightTrend && (
                <div className="flex items-center gap-1">
                  {weightTrend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-red-400" />
                  ) : weightTrend === "down" ? (
                    <TrendingDown className="w-4 h-4 text-green-400" />
                  ) : (
                    <Minus className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-white">
                {data.weight[data.weight.length - 1]?.weight_kg.toFixed(1)}kg
              </span>
              {weightChange && (
                <span
                  className={cn(
                    "text-xs",
                    weightChange.value > 0
                      ? "text-red-400"
                      : weightChange.value < 0
                        ? "text-green-400"
                        : "text-gray-400"
                  )}
                >
                  {weightChange.value > 0 ? "+" : ""}
                  {weightChange.value.toFixed(1)}kg (
                  {weightChange.percentage > 0 ? "+" : ""}
                  {weightChange.percentage.toFixed(1)}%)
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              최근 기록:{" "}
              {new Date(
                data.weight[data.weight.length - 1]?.date
              ).toLocaleDateString("ko-KR")}
            </p>
          </div>
        )}

        {/* 건강 점수 추이 */}
        {data.healthScore.length > 0 && (
          <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-white text-sm">건강 점수</h4>
              {healthScoreTrend && (
                <div className="flex items-center gap-1">
                  {healthScoreTrend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : healthScoreTrend === "down" ? (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  ) : (
                    <Minus className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-white">
                {data.healthScore[data.healthScore.length - 1]?.score}점
              </span>
              {healthScoreChange && (
                <span
                  className={cn(
                    "text-xs",
                    healthScoreChange.value > 0
                      ? "text-green-400"
                      : healthScoreChange.value < 0
                        ? "text-red-400"
                        : "text-gray-400"
                  )}
                >
                  {healthScoreChange.value > 0 ? "+" : ""}
                  {healthScoreChange.value.toFixed(1)}점
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              최근 업데이트:{" "}
              {new Date(
                data.healthScore[data.healthScore.length - 1]?.date
              ).toLocaleDateString("ko-KR")}
            </p>
          </div>
        )}

        {/* 활동량 및 영양 섭취 (데이터가 있는 경우만 표시) */}
        {(data.activity.length > 0 || data.nutrition.length > 0) && (
          <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600/50">
            <h4 className="font-semibold text-white text-sm mb-2">
              추가 지표
            </h4>
            <div className="space-y-1 text-xs text-gray-400">
              {data.activity.length > 0 && (
                <p>활동량 기록: {data.activity.length}건</p>
              )}
              {data.nutrition.length > 0 && (
                <p>영양 섭취 기록: {data.nutrition.length}건</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

