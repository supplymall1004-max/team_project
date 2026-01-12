/**
 * @file premium-pet-notifications.tsx
 * @description 반려동물 알림 섹션
 *
 * 반려동물(member_type = 'pet') 관련 알림만 표시합니다.
 * 예방접종, 건강검진, 약물 복용 등 반려동물 건강 관련 알림을 통합 표시합니다.
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Syringe, Stethoscope, Pill, AlertCircle, Check, PawPrint } from "lucide-react";
import Link from "next/link";
import { getPremiumDrawerData } from "@/actions/health/premium-drawer";
import { confirmMedicationReminderAction } from "@/actions/health/confirm-medication-reminder";
import type { Notification } from "@/types/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function PremiumPetNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmingIds, setConfirmingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadData() {
      console.log("🐾 [PremiumPetNotifications] 반려동물 알림 데이터 로드 시작");
      try {
        const result = await getPremiumDrawerData();
        
        // 반려동물 알림만 가져오기
        const petNotifications = result.petNotifications || [];
        
        // 중복 제거 및 정렬
        const uniqueNotifications = Array.from(
          new Map(petNotifications.map((n) => [n.id, n])).values()
        ).sort((a, b) => {
          const priorityOrder = { urgent: 1, high: 2, normal: 3, low: 4 };
          return (
            (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4)
          );
        });
        
        const finalNotifications = uniqueNotifications.slice(0, 5); // 최대 5개
        console.log("✅ [PremiumPetNotifications] 반려동물 알림 데이터 로드 완료:", finalNotifications.length, "개");
        setNotifications(finalNotifications);
      } catch (error) {
        console.error("❌ [PremiumPetNotifications] 반려동물 알림 데이터 로드 실패:", error);
        console.error("에러 상세:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : "Unknown",
        });
        // 에러가 발생해도 빈 배열로 설정하여 UI가 깨지지 않도록 함
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleConfirmMedication = async (notification: Notification) => {
    // 약물 알림인 경우에만 확인 가능
    if (notification.type !== "medication" || !notification.related_id) {
      return;
    }

    const reminderLogId = notification.related_id;
    setConfirmingIds((prev) => new Set(prev).add(reminderLogId));

    try {
      const result = await confirmMedicationReminderAction(reminderLogId);
      if (result.success) {
        // 알림 목록에서 제거 또는 상태 업데이트
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id)
        );
      } else {
        console.error("❌ 약물 복용 확인 실패:", result.error);
      }
    } catch (error) {
      console.error("❌ 약물 복용 확인 오류:", error);
    } finally {
      setConfirmingIds((prev) => {
        const next = new Set(prev);
        next.delete(reminderLogId);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-20 bg-gray-200/80 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4 text-sm min-h-[80px] flex items-center justify-center">
        반려동물 알림이 없습니다.
      </div>
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "medication":
        return Pill;
      case "vaccination":
        return Syringe;
      case "health":
      case "checkup":
        return Stethoscope;
      case "lifecycle_event":
        return Heart;
      default:
        return PawPrint;
    }
  };

  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-50 border-red-300 text-red-700";
      case "high":
        return "bg-orange-50 border-orange-300 text-orange-700";
      default:
        return "bg-gray-50 border-gray-300 text-gray-700";
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const notificationDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    if (notificationDate.getTime() === today.getTime()) {
      return `오늘 ${date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (notificationDate.getTime() === tomorrow.getTime()) {
      return `내일 ${date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    return date.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {notifications.map((notification, index) => {
        const Icon = getNotificationIcon(notification.type);
        const colorClass = getNotificationColor(notification.priority);
        const isMedication = notification.type === "medication";
        const isConfirming = notification.related_id
          ? confirmingIds.has(notification.related_id)
          : false;

        return (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`${colorClass} border rounded-lg p-2 hover:shadow-md transition-all ${
              notification.priority === "urgent" ? "animate-pulse" : ""
            }`}
          >
            <div className="flex items-start gap-2">
              <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-800 line-clamp-1">
                  {notification.title || "알림"}
                </div>
                {notification.scheduled_at && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {formatTime(notification.scheduled_at)}
                  </div>
                )}
              </div>
              {isMedication && notification.related_id && (
                <button
                  onClick={() => handleConfirmMedication(notification)}
                  disabled={isConfirming}
                  className="flex-shrink-0 w-6 h-6 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors"
                  title="복용 확인"
                >
                  <Check className="w-3 h-3 text-green-600" />
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

