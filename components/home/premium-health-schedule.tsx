/**
 * @file premium-health-schedule.tsx
 * @description 일정 섹션 (하단 선반)
 *
 * 오늘/내일/이번 주 건강 관련 일정을 표시합니다.
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { getPremiumDrawerData } from "@/actions/health/premium-drawer";
import type { ScheduleItem } from "@/types/premium-drawer";
import { Badge } from "@/components/ui/badge";

export function PremiumHealthSchedule() {
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getPremiumDrawerData();
        setTodaySchedule(result.todaySchedule);
        setUpcomingSchedule(result.upcomingSchedule.slice(0, 2)); // 최대 2개
      } catch (error) {
        console.error("❌ 일정 데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const getScheduleTypeColor = (type: string) => {
    switch (type) {
      case "vaccination":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "checkup":
        return "bg-purple-50 border-purple-200 text-purple-700";
      case "hospital":
        return "bg-orange-50 border-orange-200 text-orange-700";
      case "medication":
        return "bg-red-50 border-red-200 text-red-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const getScheduleTypeLabel = (type: string) => {
    switch (type) {
      case "vaccination":
        return "예방접종";
      case "checkup":
        return "건강검진";
      case "hospital":
        return "병원 방문";
      case "medication":
        return "약물 복용";
      default:
        return "일정";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduleDate = new Date(date);
    scheduleDate.setHours(0, 0, 0, 0);

    if (scheduleDate.getTime() === today.getTime()) {
      return "오늘";
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (scheduleDate.getTime() === tomorrow.getTime()) {
      return "내일";
    }

    return date.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
    });
  };

  const allSchedule = [
    ...todaySchedule.slice(0, 2),
    ...upcomingSchedule.slice(0, 2),
  ];

  if (allSchedule.length === 0) {
    return (
      <div className="text-center text-gray-500 py-2 text-xs">
        다가오는 일정이 없습니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {allSchedule.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`${getScheduleTypeColor(item.type)} border rounded-lg p-2`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-800 line-clamp-1">
                  {item.title}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">
                    {formatDate(item.date)}
                  </span>
                  {item.time && (
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">{item.time}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              {getScheduleTypeLabel(item.type)}
            </Badge>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

