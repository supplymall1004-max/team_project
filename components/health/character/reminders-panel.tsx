/**
 * @file components/health/character/reminders-panel.tsx
 * @description 리마인드 및 일정 패널 컴포넌트
 *
 * 캐릭터창의 리마인드 및 일정을 표시합니다.
 * - 긴급 리마인드 (오늘 또는 내일)
 * - 다가올 리마인드 (이번 주)
 * - D-Day 카운트다운
 * - 우선순위별 색상 구분
 *
 * @dependencies
 * - @/components/ui/card: Card, CardContent, CardHeader, CardTitle
 * - @/components/ui/badge: Badge
 * - @/lib/utils: cn
 * - @/types/character: CharacterData, ReminderItem
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
import { Clock, AlertTriangle, Calendar } from "lucide-react";
import Link from "next/link";
import type { CharacterData, ReminderItem } from "@/types/character";

interface RemindersPanelProps {
  data: CharacterData["reminders"];
  memberId: string;
  className?: string;
}

/**
 * 리마인드 타입별 아이콘
 */
function getReminderIcon(type: ReminderItem["type"]) {
  switch (type) {
    case "medication":
      return "💊";
    case "checkup":
      return "🏥";
    case "vaccination":
      return "💉";
    case "deworming":
      return "🐛";
    case "lifecycle_event":
      return "🎯";
    default:
      return "📌";
  }
}

/**
 * 우선순위별 색상
 */
function getPriorityColor(priority: ReminderItem["priority"]) {
  switch (priority) {
    case "urgent":
      return {
        bgColor: "bg-red-500/20",
        textColor: "text-red-400",
        borderColor: "border-red-500/50",
        dDayBg: "bg-red-500/20",
        dDayText: "text-red-400",
        dDayBorder: "border-red-500/50",
      };
    case "high":
      return {
        bgColor: "bg-orange-500/20",
        textColor: "text-orange-400",
        borderColor: "border-orange-500/50",
        dDayBg: "bg-orange-500/20",
        dDayText: "text-orange-400",
        dDayBorder: "border-orange-500/50",
      };
    case "normal":
      return {
        bgColor: "bg-yellow-500/20",
        textColor: "text-yellow-400",
        borderColor: "border-yellow-500/50",
        dDayBg: "bg-yellow-500/20",
        dDayText: "text-yellow-400",
        dDayBorder: "border-yellow-500/50",
      };
    case "low":
      return {
        bgColor: "bg-blue-500/20",
        textColor: "text-blue-400",
        borderColor: "border-blue-500/50",
        dDayBg: "bg-blue-500/20",
        dDayText: "text-blue-400",
        dDayBorder: "border-blue-500/50",
      };
  }
}

/**
 * 리마인드 및 일정 패널 컴포넌트
 */
export function RemindersPanel({
  data,
  memberId,
  className,
}: RemindersPanelProps) {
  const allReminders = data.all;

  if (allReminders.length === 0) {
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
            <Clock className="w-5 h-5 text-green-400" />
            리마인드 및 일정
          </CardTitle>
          <CardDescription className="text-gray-400">
            현재 리마인드가 없습니다.
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
          <Clock className="w-5 h-5 text-green-400" />
          리마인드 및 일정
        </CardTitle>
        <CardDescription className="text-gray-400">
          긴급: {data.urgent.length}개 · 예정: {data.upcoming.length}개
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 긴급 리마인드 */}
        {data.urgent.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-400 text-sm font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>긴급 리마인드</span>
            </div>
            <div className="space-y-2">
              {data.urgent.slice(0, 3).map((reminder) => {
                const colors = getPriorityColor(reminder.priority);

                return (
                  <div
                    key={reminder.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      colors.bgColor,
                      colors.borderColor,
                      "transition-all duration-200",
                      "hover:scale-[1.02]"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">
                            {getReminderIcon(reminder.type)}
                          </span>
                          <h4 className={cn("font-semibold text-sm", colors.textColor)}>
                            {reminder.title}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-400">{reminder.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(reminder.dueDate).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-bold ml-2",
                          colors.dDayBg,
                          colors.dDayText,
                          colors.dDayBorder,
                          "border"
                        )}
                      >
                        {reminder.daysUntil === 0
                          ? "오늘"
                          : reminder.daysUntil < 0
                            ? `${Math.abs(reminder.daysUntil)}일 지남`
                            : `D-${reminder.daysUntil}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 다가올 리마인드 */}
        {data.upcoming.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-yellow-400 text-sm font-semibold">
              <Calendar className="w-4 h-4" />
              <span>다가올 리마인드</span>
            </div>
            <div className="space-y-2">
              {data.upcoming.slice(0, 3).map((reminder) => {
                const colors = getPriorityColor(reminder.priority);

                return (
                  <div
                    key={reminder.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      colors.bgColor,
                      colors.borderColor,
                      "transition-all duration-200",
                      "hover:scale-[1.02]"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">
                            {getReminderIcon(reminder.type)}
                          </span>
                          <h4 className={cn("font-semibold text-sm", colors.textColor)}>
                            {reminder.title}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-400">{reminder.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(reminder.dueDate).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-bold ml-2",
                          colors.dDayBg,
                          colors.dDayText,
                          colors.dDayBorder,
                          "border"
                        )}
                      >
                        D-{reminder.daysUntil}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 전체보기 링크 */}
        {allReminders.length > 6 && (
          <div className="pt-2 border-t border-gray-700/50">
            <Link
              href={`/health/family/${memberId}/reminders`}
              className="text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              전체 리마인드 보기 ({allReminders.length}개) →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

