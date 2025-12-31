/**
 * @file actions/health/confirm-medication-reminder.ts
 * @description 약물 복용 알림 확인 Server Action
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { confirmMedicationReminder } from "@/lib/health/medication-reminder-service";

export async function confirmMedicationReminderAction(
  reminderLogId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "인증이 필요합니다.",
      };
    }

    await confirmMedicationReminder(reminderLogId);

    return {
      success: true,
    };
  } catch (error) {
    console.error("❌ 약물 복용 알림 확인 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

