/**
 * @file components/health/character/deworming-panel.tsx
 * @description 구충제 패널 컴포넌트
 *
 * 캐릭터창의 구충제 복용 정보를 표시합니다.
 * - 최근 구충제 복용 기록
 * - 다음 복용 예정일
 * - D-Day 카운트다운
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
import { Pill, Calendar } from "lucide-react";
import type { CharacterData } from "@/types/character";
import { motion } from "framer-motion";
import { cardHoverVariants } from "@/lib/animations/character-animations";

interface DewormingPanelProps {
  data: CharacterData["deworming"];
  className?: string;
}

/**
 * 구충제 패널 컴포넌트
 */
export function DewormingPanel({
  data,
  className,
}: DewormingPanelProps) {
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
          <Pill className="w-5 h-5 text-orange-400" />
          구충제 복용
        </CardTitle>
        <CardDescription className="text-gray-400">
          구충제 복용 기록 및 일정
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 최근 복용 기록 */}
        {data.last && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Calendar className="w-4 h-4" />
              <span>최근 복용</span>
            </div>
            <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">
                  {data.last.medication_name}
                </h4>
                <span className="text-xs text-gray-400">
                  {new Date(data.last.taken_date).toLocaleDateString("ko-KR")}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                용량: {data.last.dosage}
              </p>
              {data.cycleDays && (
                <p className="text-xs text-gray-500 mt-1">
                  복용 주기: {data.cycleDays}일
                </p>
              )}
            </div>
          </div>
        )}

        {/* 다음 복용 예정일 */}
        {data.next ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Calendar className="w-4 h-4" />
              <span>다음 복용 예정</span>
            </div>
            <div
              className={cn(
                "p-3 rounded-lg border",
                "bg-gradient-to-r from-orange-500/10 to-orange-600/10",
                "border-orange-500/50",
                data.daysUntil !== null && data.daysUntil <= 7
                  ? "ring-2 ring-orange-400/50"
                  : ""
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  예정일: {data.next.toLocaleDateString("ko-KR")}
                </p>
                {data.daysUntil !== null && (
                  <div
                    className={cn(
                      "px-3 py-1 rounded-full text-sm font-bold",
                      data.daysUntil <= 0
                        ? "bg-red-500/20 text-red-400 border border-red-500/50"
                        : data.daysUntil <= 7
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                          : "bg-orange-500/20 text-orange-400 border border-orange-500/50"
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
            다음 복용 예정일이 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
    </motion.div>
  );
}

