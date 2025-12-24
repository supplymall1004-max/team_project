/**
 * @file components/health/character/checkup-panel.tsx
 * @description 건강검진 패널 컴포넌트
 *
 * 캐릭터창의 건강검진 정보를 표시합니다.
 * - 최근 건강검진 기록
 * - 다음 건강검진 권장 일정
 * - D-Day 카운트다운
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
import { Stethoscope, Calendar, AlertCircle } from "lucide-react";
import type { CharacterData } from "@/types/character";
import { motion } from "framer-motion";
import { cardHoverVariants } from "@/lib/animations/character-animations";

interface CheckupPanelProps {
  data: CharacterData["checkups"];
  className?: string;
}

/**
 * 우선순위별 색상
 */
function getPriorityColor(priority: "high" | "medium" | "low") {
  switch (priority) {
    case "high":
      return "bg-red-500/20 text-red-400 border-red-500/50";
    case "medium":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    case "low":
      return "bg-blue-500/20 text-blue-400 border-blue-500/50";
  }
}

/**
 * 건강검진 패널 컴포넌트
 */
export function CheckupPanel({
  data,
  className,
}: CheckupPanelProps) {
  return (
    <motion.div
      variants={cardHoverVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      className={className}
    >
      <Card
        className={cn(
          "bg-gradient-to-br from-gray-800/90 to-gray-900/90",
          "border-gray-700/50",
          "backdrop-blur-sm"
        )}
      >
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-purple-400" />
          건강검진
        </CardTitle>
        <CardDescription className="text-gray-400">
          최근 검진 및 권장 일정
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 최근 건강검진 */}
        {data.last && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Calendar className="w-4 h-4" />
              <span>최근 검진</span>
            </div>
            <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">
                  {data.last.checkup_type === "national"
                    ? "국민건강검진"
                    : data.last.checkup_type === "cancer"
                      ? "암 검진"
                      : "특수 검진"}
                </h4>
                <span className="text-xs text-gray-400">
                  {new Date(data.last.checkup_date).toLocaleDateString("ko-KR")}
                </span>
              </div>
              {data.last.checkup_site && (
                <p className="text-sm text-gray-400">
                  {data.last.checkup_site}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 다음 건강검진 권장 일정 */}
        {data.next ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>다음 검진 권장</span>
            </div>
            <div
              className={cn(
                "p-3 rounded-lg border",
                "bg-gradient-to-r from-purple-500/10 to-purple-600/10",
                "border-purple-500/50",
                data.daysUntil !== null && data.daysUntil <= 30 && "ring-2 ring-purple-400/50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">
                  {data.next.checkup_name}
                </h4>
                <Badge
                  className={cn(
                    "text-xs",
                    getPriorityColor(data.next.priority)
                  )}
                >
                  {data.next.priority === "high"
                    ? "높음"
                    : data.next.priority === "medium"
                      ? "보통"
                      : "낮음"}
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
                        : data.daysUntil <= 30
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/50"
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
            권장 건강검진 일정이 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
    </motion.div>
  );
}

