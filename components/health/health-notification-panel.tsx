/**
 * @file components/health/health-notification-panel.tsx
 * @description 건강 알림 전용 패널 컴포넌트
 *
 * 게임 요소와 완전히 분리된 건강 알림 전용 패널입니다.
 * - 생애주기별 알림
 * - 리마인드 및 일정
 * - 약물 복용 알림
 * - 예방접종 알림
 * - 건강검진 알림
 *
 * @dependencies
 * - @/components/health/character/lifecycle-notifications-panel
 * - @/components/health/character/reminders-panel
 * - @/components/health/character/medication-panel
 * - @/components/health/character/vaccination-panel
 * - @/components/health/character/checkup-panel
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CharacterData } from "@/types/character";

// 건강 관련 패널들
import { LifecycleNotificationsPanel } from "@/components/health/character/lifecycle-notifications-panel";
import { RemindersPanel } from "@/components/health/character/reminders-panel";
import { MedicationPanel } from "@/components/health/character/medication-panel";
import { VaccinationPanel } from "@/components/health/character/vaccination-panel";
import { CheckupPanel } from "@/components/health/character/checkup-panel";
import { DewormingPanel } from "@/components/health/character/deworming-panel";

interface HealthNotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  characterData: CharacterData;
  memberId: string;
}

/**
 * 건강 알림 전용 패널 컴포넌트
 */
export function HealthNotificationPanel({
  isOpen,
  onClose,
  characterData,
  memberId,
}: HealthNotificationPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 오버레이 */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 알림 패널 */}
          <motion.div
            className={cn(
              "fixed top-0 right-0 h-full w-full max-w-md",
              "bg-gradient-to-b from-green-900 via-green-800 to-green-900",
              "border-l border-green-600/50",
              "z-50 overflow-y-auto"
            )}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="p-6 space-y-6">
              {/* 헤더 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-6 h-6 text-green-300" />
                  <h2 className="text-2xl font-bold text-green-50">
                    건강 알림
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-green-200 hover:text-green-50 hover:bg-green-800/50"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* 알림 내용 */}
              <div className="space-y-4">
                {/* 생애주기별 알림 */}
                <LifecycleNotificationsPanel
                  data={characterData.lifecycleNotifications}
                />

                {/* 리마인드 및 일정 */}
                <RemindersPanel
                  data={characterData.reminders}
                  memberId={memberId}
                />

                {/* 약물 복용 알림 */}
                <MedicationPanel
                  data={characterData.medications}
                  memberId={memberId}
                />

                {/* 예방접종 알림 */}
                <VaccinationPanel data={characterData.vaccinations} />

                {/* 건강검진 알림 */}
                <CheckupPanel data={characterData.checkups} />

                {/* 구충제 알림 */}
                <DewormingPanel data={characterData.deworming} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

