/**
 * @file app/health/family/notifications/page.tsx
 * @description 알림 설정 페이지
 *
 * 사용자가 식단 알림 설정을 관리할 수 있는 페이지
 */

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { NotificationSettingsClient } from "@/components/health/notification-settings-client";

/**
 * headers() API를 사용하므로 정적 프리렌더를 강제하지 않음
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NotificationsPage() {
  console.group("📋 알림 설정 페이지 로딩");

  try {
    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              인증이 필요합니다
            </h1>
            <p className="text-gray-600">
              로그인 후 이용해주세요.
            </p>
          </div>
        </div>
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 사용자의 Supabase user_id 조회
    const { data: userData } = await supabase
      .from("users")
      .select("id, name")
      .eq("clerk_id", userId)
      .single();

    if (!userData) {
      console.error("❌ 사용자 정보 없음");
      console.groupEnd();
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              사용자 정보를 찾을 수 없습니다
            </h1>
          </div>
        </div>
      );
    }

    // 현재 알림 설정 조회
    console.log("알림 설정 조회 시작 - 사용자 ID:", userData.id);
    const { data: settings, error: settingsError } = await supabase
      .from("diet_notification_settings")
      .select("*")
      .eq("user_id", userData.id)
      .maybeSingle();

    if (settingsError) {
      console.error("❌ 알림 설정 조회 실패:", settingsError);
      console.error("사용자 ID:", userData.id);
      throw new Error(`설정 조회 실패: ${settingsError.message}`);
    }

    const notificationSettings = settings || {
      popup_enabled: true,
      browser_enabled: false,
      notification_time: "05:00:00",
      last_notification_date: null,
      last_dismissed_date: null,
    };

    console.log("현재 알림 설정:", {
      fromDatabase: !!settings,
      settings: notificationSettings,
      popupEnabled: notificationSettings.popup_enabled,
      lastNotification: notificationSettings.last_notification_date,
      lastDismissed: notificationSettings.last_dismissed_date,
    });
    console.groupEnd();

    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            알림 설정
          </h1>
          <p className="text-lg text-gray-600">
            식단 추천 알림을 원하는 방식으로 설정하세요.
          </p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-600">설정을 불러오는 중...</span>
          </div>
        }>
          <NotificationSettingsClient
            initialSettings={notificationSettings}
            userName={userData.name || "사용자"}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error("❌ 페이지 로딩 오류:", error);
    console.groupEnd();

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            오류가 발생했습니다
          </h1>
          <p className="text-gray-600">
            잠시 후 다시 시도해주세요.
          </p>
        </div>
      </div>
    );
  }
}

export const metadata = {
  title: "알림 설정 | 맛의 아카이브",
  description: "식단 추천 알림 설정을 관리하세요.",
};
