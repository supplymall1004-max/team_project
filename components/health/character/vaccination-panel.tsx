/**
 * @file components/health/character/vaccination-panel.tsx
 * @description 백신 패널 컴포넌트
 *
 * 캐릭터창의 백신 정보를 표시합니다.
 * - 완료된 백신 기록
 * - 예정된 백신 일정
 * - 다음 백신 D-Day 카운트다운
 *
 * @dependencies
 * - @/components/ui/card: Card, CardContent, CardHeader, CardTitle
 * - @/components/ui/badge: Badge
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Syringe, Calendar, CheckCircle2 } from "lucide-react";
import type { CharacterData } from "@/types/character";
import { motion } from "framer-motion";
import { cardHoverVariants } from "@/lib/animations/character-animations";

interface VaccinationPanelProps {
  data: CharacterData["vaccinations"];
  className?: string;
}

/**
 * 우선순위별 색상
 */
function getPriorityColor(priority: "required" | "recommended" | "optional") {
  switch (priority) {
    case "required":
      return "bg-red-500/20 text-red-400 border-red-500/50";
    case "recommended":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    case "optional":
      return "bg-blue-500/20 text-blue-400 border-blue-500/50";
  }
}

/**
 * 백신 패널 컴포넌트
 */
export function VaccinationPanel({
  data,
  className,
}: VaccinationPanelProps) {
  return (
    <motion.div
      variants={cardHoverVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
    >
      <Card
        className={cn(
          "bg-gradient-to-br from-gray-800/90 to-gray-900/90",
          "border-gray-700/50",
          "backdrop-blur-sm",
          "transition-all duration-300",
          className
        )}
      >
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Syringe className="w-5 h-5 text-cyan-400" />
          예방접종
        </CardTitle>
        <CardDescription className="text-gray-400">
          완료: {data.completed.length}개 · 예정: {data.scheduled.length}개
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 다음 백신 일정 */}
        {data.next ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Calendar className="w-4 h-4" />
              <span>다음 접종 예정</span>
            </div>
            <div
              className={cn(
                "p-3 rounded-lg border",
                "bg-gradient-to-r from-cyan-500/10 to-cyan-600/10",
                "border-cyan-500/50",
                data.daysUntil !== null && data.daysUntil <= 7
                  ? "ring-2 ring-cyan-400/50"
                  : ""
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">
                  {data.next.vaccine_name}
                </h4>
                <Badge
                  className={cn(
                    "text-xs",
                    getPriorityColor(data.next.priority)
                  )}
                >
                  {data.next.priority === "required"
                    ? "필수"
                    : data.next.priority === "recommended"
                      ? "권장"
                      : "선택"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  권장일:{" "}
                  {new Date(data.next.recommended_date).toLocaleDateString(
                    "ko-KR"
                  )}
                </p>
                {data.daysUntil !== null && (
                  <div
                    className={cn(
                      "px-3 py-1 rounded-full text-sm font-bold",
                      data.daysUntil <= 0
                        ? "bg-red-500/20 text-red-400 border border-red-500/50"
                        : data.daysUntil <= 7
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                          : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                    )}
                  >
                    {data.daysUntil <= 0
                      ? `연체 ${Math.abs(data.daysUntil)}일`
                      : `D-${data.daysUntil}`}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 text-sm">
            예정된 예방접종이 없습니다.
          </div>
        )}

        {/* 최근 완료된 백신 (최대 3개) */}
        {data.completed.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>최근 완료된 접종</span>
            </div>
            <div className="space-y-2">
              {data.completed.slice(0, 3).map((vaccination) => (
                <div
                  key={vaccination.id}
                  className="p-3 bg-gray-700/50 rounded-lg border border-gray-600/50"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white text-sm">
                      {vaccination.vaccine_name}
                    </h4>
                    {vaccination.completed_date && (
                      <span className="text-xs text-gray-400">
                        {new Date(
                          vaccination.completed_date
                        ).toLocaleDateString("ko-KR")}
                      </span>
                    )}
                  </div>
                  {vaccination.dose_number && vaccination.total_doses && (
                    <p className="text-xs text-gray-500 mt-1">
                      {vaccination.dose_number}/{vaccination.total_doses}차 접종
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </motion.div>
  );
}

