/**
 * @file supabase/functions/schedule-vaccination-notifications/index.ts
 * @description 예방주사 알림 스케줄러 Edge Function
 *
 * 매일 오전 9시에 실행되어 예정된 예방주사 알림을 발송
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { scheduleVaccinationNotifications } from "../../../lib/health/vaccination-notification-service.ts";

// 환경 변수
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: any;
  schema: string;
  old_record: any | null;
}

Deno.serve(async (req) => {
  try {
    console.group("[EdgeFunction] 예방주사 알림 스케줄러 시작");

    // Supabase 클라이언트 생성
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 예방주사 알림 스케줄링 실행
    const result = await scheduleVaccinationNotifications();

    console.log("✅ 예방주사 알림 스케줄링 완료:", result);
    console.groupEnd();

    return new Response(
      JSON.stringify({
        success: true,
        message: "예방주사 알림 스케줄링이 완료되었습니다.",
        result,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ 예방주사 알림 스케줄러 실행 실패:", error);
    console.groupEnd();

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

