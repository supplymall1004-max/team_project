/**
 * @file app/api/users/notification-settings/route.ts
 * @description 사용자 알림 설정 관리 API
 *
 * GET /api/users/notification-settings - 알림 설정 조회
 * PUT /api/users/notification-settings - 알림 설정 업데이트
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * GET /api/users/notification-settings
 * 알림 설정 조회
 */
export async function GET() {
  try {
    console.group("⚙️ 사용자 알림 설정 조회");

    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ 사용자 인증 성공:", userId);

    // PGRST301 에러를 피하기 위해 service-role 클라이언트 사용
    const supabase = getServiceRoleClient();
    console.log("✅ Supabase Service Role 클라이언트 생성 완료");

    // 사용자 정보 조회
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("notification_settings")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (fetchError) {
      console.error("❌ 사용자 정보 조회 오류:", {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
      });
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to fetch user settings",
          details: fetchError.message,
          code: fetchError.code,
        },
        { status: 500 }
      );
    }

    console.log("✅ 사용자 데이터 조회 성공:", userData ? "데이터 있음" : "데이터 없음");

    // 기본값 설정
    const defaultSettings = {
      kcdcAlerts: false,
      healthPopups: false,
      generalNotifications: false,
      vaccinationReminders: true,
      medicationReminders: true,
      checkupReminders: true,
      appointmentReminders: true,
      petHealthReminders: true,
      petVaccinationReminders: true,
      petLifecycleReminders: true,
      smartNotifications: true,
      smartNotificationSensitivity: 'medium' as const,
    };

    const settings = userData?.notification_settings
      ? { ...defaultSettings, ...userData.notification_settings }
      : defaultSettings;

    console.log("✅ 알림 설정:", settings);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("❌ 설정 조회 오류 발생:");
    console.error("에러 타입:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("에러 메시지:", error instanceof Error ? error.message : String(error));
    console.error("에러 스택:", error instanceof Error ? error.stack : "스택 없음");
    console.error("전체 에러 객체:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    try {
      console.groupEnd();
    } catch {
      // groupEnd 실패 무시
    }
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.constructor.name : typeof error,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/notification-settings
 * 알림 설정 업데이트
 */
export async function PUT(request: NextRequest) {
  try {
    console.group("⚙️ 사용자 알림 설정 업데이트");

    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ 사용자 인증 성공:", userId);

    // PGRST301 에러를 피하기 위해 service-role 클라이언트 사용
    const supabase = getServiceRoleClient();
    console.log("✅ Supabase Service Role 클라이언트 생성 완료");

    // 요청 데이터 파싱
    let body;
    try {
      body = await request.json();
      console.log("📥 파싱된 요청 본문:", body);
    } catch (parseError) {
      console.error("❌ JSON 파싱 실패:", parseError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Invalid JSON",
          details: parseError instanceof Error ? parseError.message : "Failed to parse request body",
        },
        { status: 400 }
      );
    }

    const { 
      kcdcAlerts, 
      generalNotifications, 
      healthPopups,
      vaccinationReminders,
      medicationReminders,
      checkupReminders,
      appointmentReminders,
      petHealthReminders,
      petVaccinationReminders,
      petLifecycleReminders,
      smartNotifications,
      smartNotificationSensitivity,
    } = body;

    console.log("업데이트 요청:", {
      kcdcAlerts,
      generalNotifications,
      healthPopups,
    });

    // 유효성 검증
    if (kcdcAlerts !== undefined && typeof kcdcAlerts !== "boolean") {
      console.error("❌ kcdcAlerts 타입 오류");
      console.groupEnd();
      return NextResponse.json(
        { error: "kcdcAlerts must be boolean" },
        { status: 400 }
      );
    }

    if (generalNotifications !== undefined && typeof generalNotifications !== "boolean") {
      console.error("❌ generalNotifications 타입 오류");
      console.groupEnd();
      return NextResponse.json(
        { error: "generalNotifications must be boolean" },
        { status: 400 }
      );
    }

    if (healthPopups !== undefined && typeof healthPopups !== "boolean") {
      console.error("❌ healthPopups 타입 오류");
      console.groupEnd();
      return NextResponse.json(
        { error: "healthPopups must be boolean" },
        { status: 400 }
      );
    }

    // 기존 사용자 정보 조회
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id, notification_settings")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (fetchError) {
      console.error("❌ 사용자 정보 조회 오류:", {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
      });
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to fetch user",
          details: fetchError.message,
          code: fetchError.code,
        },
        { status: 500 }
      );
    }

    // 기존 설정 가져오기
    const existingSettings = (existingUser?.notification_settings as any) || {};

    // 새로운 설정 객체 생성 (기존 값 유지, 새 값으로 업데이트)
    const newSettings = {
      kcdcAlerts: kcdcAlerts !== undefined ? kcdcAlerts : (existingSettings.kcdcAlerts ?? false),
      generalNotifications: generalNotifications !== undefined ? generalNotifications : (existingSettings.generalNotifications ?? false),
      healthPopups: healthPopups !== undefined ? healthPopups : (existingSettings.healthPopups ?? false),
      vaccinationReminders: vaccinationReminders !== undefined ? vaccinationReminders : (existingSettings.vaccinationReminders ?? true),
      medicationReminders: medicationReminders !== undefined ? medicationReminders : (existingSettings.medicationReminders ?? true),
      checkupReminders: checkupReminders !== undefined ? checkupReminders : (existingSettings.checkupReminders ?? true),
      appointmentReminders: appointmentReminders !== undefined ? appointmentReminders : (existingSettings.appointmentReminders ?? true),
      petHealthReminders: petHealthReminders !== undefined ? petHealthReminders : (existingSettings.petHealthReminders ?? true),
      petVaccinationReminders: petVaccinationReminders !== undefined ? petVaccinationReminders : (existingSettings.petVaccinationReminders ?? true),
      petLifecycleReminders: petLifecycleReminders !== undefined ? petLifecycleReminders : (existingSettings.petLifecycleReminders ?? true),
      smartNotifications: smartNotifications !== undefined ? smartNotifications : (existingSettings.smartNotifications ?? true),
      smartNotificationSensitivity: smartNotificationSensitivity !== undefined ? smartNotificationSensitivity : (existingSettings.smartNotificationSensitivity ?? 'medium'),
    };

    // JSONB 저장을 위한 데이터 검증
    // Supabase는 JavaScript 객체를 자동으로 JSONB로 변환합니다
    // 객체를 직접 전달하는 것이 가장 안전합니다
    console.log("업데이트할 설정:", newSettings);
    console.log("설정 타입:", typeof newSettings);
    console.log("설정 구조:", JSON.stringify(newSettings, null, 2));
    
    // 데이터 검증: 모든 값이 boolean인지 확인
    const isValidSettings = 
      typeof newSettings.kcdcAlerts === 'boolean' &&
      typeof newSettings.generalNotifications === 'boolean' &&
      typeof newSettings.healthPopups === 'boolean';
    
    if (!isValidSettings) {
      console.error("❌ 설정 데이터 타입 검증 실패:", {
        kcdcAlerts: typeof newSettings.kcdcAlerts,
        generalNotifications: typeof newSettings.generalNotifications,
        healthPopups: typeof newSettings.healthPopups,
      });
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Invalid settings data",
          details: "설정 값이 올바른 형식이 아닙니다. 모든 값은 boolean이어야 합니다.",
        },
        { status: 400 }
      );
    }

    let result;

    if (existingUser) {
      // 기존 사용자 업데이트
      // JSONB 컬럼에 저장할 때는 JavaScript 객체를 직접 전달 (Supabase가 자동으로 JSONB로 변환)
      console.log("데이터베이스 업데이트 시작:", {
        clerk_id: userId,
        notification_settings: newSettings,
        settings_stringified: JSON.stringify(newSettings),
      });
      
      // Supabase에 전달할 데이터 준비
      // 명시적으로 JSONB 형식으로 변환하여 전달
      const updateData: { notification_settings: any } = {
        notification_settings: newSettings,
      };
      
      console.log("업데이트 데이터:", updateData);
      
      const { data, error: updateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("clerk_id", userId)
        .select()
        .single();

      if (updateError) {
        console.error("❌ 설정 업데이트 실패:", {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
        });
        console.error("저장하려던 데이터:", JSON.stringify(newSettings, null, 2));
        console.error("데이터 타입:", typeof newSettings);
        console.error("clerk_id:", userId);
        console.error("clerk_id 타입:", typeof userId);
        console.groupEnd();
        
        // "No suitable key or wrong key type" 에러에 대한 특별 처리
        if (updateError.message?.includes("No suitable key") || updateError.message?.includes("wrong key type")) {
          console.error("⚠️ 암호화 키 관련 에러로 의심됨");
          return NextResponse.json(
            {
              error: "Database configuration error",
              details: "데이터베이스 설정에 문제가 있습니다. 관리자에게 문의하세요.",
              message: updateError.message,
              code: updateError.code,
            },
            { status: 500 }
          );
        }
        
        return NextResponse.json(
          {
            error: "Failed to update settings",
            details: updateError.message,
            code: updateError.code,
            hint: updateError.hint,
          },
          { status: 500 }
        );
      }

      result = data;
      console.log("✅ 설정 업데이트 성공");
    } else {
      // 새 사용자 생성 (일반적으로는 SyncUserProvider에서 생성되지만, 안전을 위해)
      console.log("새 사용자 생성 시작:", {
        clerk_id: userId,
        notification_settings: newSettings,
        settings_stringified: JSON.stringify(newSettings),
      });
      
      // Supabase에 전달할 데이터 준비
      // 명시적으로 JSONB 형식으로 변환하여 전달
      const insertData = {
        clerk_id: userId,
        name: "사용자",
        notification_settings: newSettings,
      };
      
      console.log("삽입 데이터:", insertData);
      
      const { data, error: insertError } = await supabase
        .from("users")
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error("❌ 사용자 생성 실패:", {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        });
        console.error("저장하려던 데이터:", JSON.stringify(newSettings, null, 2));
        console.error("데이터 타입:", typeof newSettings);
        console.error("clerk_id:", userId);
        console.error("clerk_id 타입:", typeof userId);
        console.groupEnd();
        
        // "No suitable key or wrong key type" 에러에 대한 특별 처리
        if (insertError.message?.includes("No suitable key") || insertError.message?.includes("wrong key type")) {
          console.error("⚠️ 암호화 키 관련 에러로 의심됨");
          return NextResponse.json(
            {
              error: "Database configuration error",
              details: "데이터베이스 설정에 문제가 있습니다. 관리자에게 문의하세요.",
              message: insertError.message,
              code: insertError.code,
            },
            { status: 500 }
          );
        }
        
        return NextResponse.json(
          {
            error: "Failed to create user",
            details: insertError.message,
            code: insertError.code,
            hint: insertError.hint,
          },
          { status: 500 }
        );
      }

      result = data;
      console.log("✅ 사용자 생성 성공");
    }

    console.log("최종 설정:", result);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      settings: result.notification_settings,
    });
  } catch (error) {
    console.error("❌ 설정 업데이트 오류 발생:");
    console.error("에러 타입:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("에러 메시지:", error instanceof Error ? error.message : String(error));
    console.error("에러 스택:", error instanceof Error ? error.stack : "스택 없음");
    console.error("전체 에러 객체:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    try {
      console.groupEnd();
    } catch {
      // groupEnd 실패 무시
    }
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.constructor.name : typeof error,
      },
      { status: 500 }
    );
  }
}

