/**
 * @file supabase/functions/sync-kcdc-alerts/index.ts
 * @description KCDC 데이터 동기화 Edge Function
 * 
 * 크론 잡으로 매일 05:00 KST에 실행되어 KCDC API에서 최신 데이터를 가져옵니다.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const REFRESH_API_URL = Deno.env.get("REFRESH_API_URL") || "http://localhost:3000/api/health/kcdc/refresh";
const CRON_SECRET = Deno.env.get("CRON_SECRET");

serve(async (req) => {
  try {
    console.log("🏥 KCDC 데이터 동기화 Edge Function 시작");

    // CRON_SECRET 확인
    if (!CRON_SECRET) {
      console.error("❌ CRON_SECRET 환경 변수가 설정되지 않았습니다");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Refresh API 호출
    console.log("📡 Refresh API 호출:", REFRESH_API_URL);
    const response = await fetch(REFRESH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CRON_SECRET}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Refresh API 호출 실패:", response.status, data);
      return new Response(
        JSON.stringify({ error: "Refresh API call failed", details: data }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ KCDC 데이터 동기화 완료:", data);

    return new Response(
      JSON.stringify({
        success: true,
        message: "KCDC alerts synced successfully",
        result: data,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ KCDC 데이터 동기화 Edge Function 실패:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
























