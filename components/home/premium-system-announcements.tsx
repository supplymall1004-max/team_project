/**
 * @file premium-system-announcements.tsx
 * @description 시스템 공지사항 섹션 (냉장고 문 선반)
 *
 * 시스템 공지사항과 건강 팁을 표시합니다.
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Lightbulb } from "lucide-react";
import { getPremiumDrawerData } from "@/actions/health/premium-drawer";
import type { SystemAnnouncement } from "@/types/premium-drawer";

export function PremiumSystemAnnouncements() {
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getPremiumDrawerData();
        setAnnouncements(result.systemAnnouncements.slice(0, 2)); // 최대 2개
      } catch (error) {
        console.error("❌ 시스템 공지사항 데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-24 bg-gray-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4 text-sm min-h-[80px] flex items-center justify-center">
        시스템 공지사항이 없습니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {announcements.map((announcement, index) => (
        <motion.div
          key={announcement.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-yellow-50/95 backdrop-blur-sm border border-yellow-200 rounded-lg p-2.5 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-2">
            <Bell className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-800 line-clamp-1">
                {announcement.title}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

