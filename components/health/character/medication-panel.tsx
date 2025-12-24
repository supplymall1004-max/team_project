/**
 * @file components/health/character/medication-panel.tsx
 * @description 약물 복용 패널 컴포넌트
 *
 * 캐릭터창의 약물 복용 정보를 표시합니다.
 * - 복용 중인 약물 목록
 * - 오늘 복용 여부 체크
 * - 복용하지 않은 약물 강조 표시
 *
 * @dependencies
 * - @/components/ui/card: Card, CardContent, CardHeader, CardTitle
 * - @/components/ui/button: Button
 * - @/components/ui/checkbox: Checkbox
 * - @/lib/utils: cn
 * - @/types/character: CharacterData
 */

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Pill, CheckCircle2, Clock } from "lucide-react";
import type { CharacterData } from "@/types/character";
import { motion } from "framer-motion";
import { cardHoverVariants } from "@/lib/animations/character-animations";

interface MedicationPanelProps {
  data: CharacterData["medications"];
  memberId: string;
  className?: string;
}

/**
 * 약물 복용 체크 API 호출
 */
async function checkMedication(
  medicationId: string,
  checked: boolean
): Promise<void> {
  console.group("[MedicationPanel] 약물 복용 체크");
  console.log("약물 ID:", medicationId);
  console.log("체크 상태:", checked);

  try {
    // 오늘 날짜의 reminder log를 찾아서 체크/해제
    const today = new Date().toISOString().split("T")[0];
    const response = await fetch(
      `/api/health/medications/${medicationId}/check?date=${today}`,
      {
        method: checked ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("약물 복용 체크 실패");
    }

    console.log("✅ 약물 복용 체크 완료");
    console.groupEnd();
  } catch (error) {
    console.error("❌ 약물 복용 체크 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 약물 복용 패널 컴포넌트
 */
export function MedicationPanel({
  data,
  memberId,
  className,
}: MedicationPanelProps) {
  const [checkedIds, setCheckedIds] = useState<string[]>(data.todayChecked);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const handleCheckChange = async (
    medicationId: string,
    checked: boolean
  ) => {
    setLoadingIds((prev) => new Set(prev).add(medicationId));

    try {
      await checkMedication(medicationId, checked);
      setCheckedIds((prev) =>
        checked
          ? [...prev, medicationId]
          : prev.filter((id) => id !== medicationId)
      );
    } catch (error) {
      console.error("약물 복용 체크 실패:", error);
      // 에러 발생 시 이전 상태로 복원
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(medicationId);
        return next;
      });
    }
  };

  if (data.active.length === 0) {
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
              <Pill className="w-5 h-5 text-blue-400" />
              복용 중인 약물
            </CardTitle>
            <CardDescription className="text-gray-400">
              현재 복용 중인 약물이 없습니다.
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>
    );
  }

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
          <Pill className="w-5 h-5 text-blue-400" />
          복용 중인 약물
        </CardTitle>
        <CardDescription className="text-gray-400">
          {data.active.length}개 · 오늘 복용 완료: {checkedIds.length}개
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.active.map((med) => {
            const isChecked = checkedIds.includes(med.id);
            const isLoading = loadingIds.has(med.id);
            const isMissed = data.missed.some((m) => m.id === med.id);

            return (
              <div
                key={med.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg",
                  "bg-gray-700/50 border",
                  isMissed && !isChecked
                    ? "border-red-500/50 bg-red-500/10"
                    : isChecked
                      ? "border-green-500/50 bg-green-500/10"
                      : "border-gray-600/50",
                  "transition-all duration-200",
                  "hover:bg-gray-700/70"
                )}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white">
                      {med.medication_name}
                    </h4>
                    {isMissed && !isChecked && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/50">
                        복용 필요
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    {med.dosage} · {med.frequency}
                  </p>
                  {med.notes && (
                    <p className="text-xs text-gray-500">{med.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {isChecked ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-medium">완료</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Clock className="w-5 h-5" />
                      <span className="text-sm font-medium">대기</span>
                    </div>
                  )}

                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      handleCheckChange(med.id, checked === true)
                    }
                    disabled={isLoading}
                    className={cn(
                      "w-5 h-5",
                      isChecked && "border-green-400 bg-green-400/20"
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}

