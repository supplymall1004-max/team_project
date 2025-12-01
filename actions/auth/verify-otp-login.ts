/**
 * @file actions/auth/verify-otp-login.ts
 * @description 로그인 시 OTP 검증
 * 
 * Clerk 로그인 후 MFA가 활성화된 사용자는 추가로 OTP 코드를 검증해야 함
 */

"use server";

import speakeasy from "speakeasy";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { z } from "zod";

const VerifyLoginOTPSchema = z.object({
  clerkUserId: z.string().min(1, "사용자 ID가 필요합니다"),
  token: z.string().length(6, "OTP 코드는 6자리입니다"),
});

export interface VerifyLoginOTPResponse {
  success: true;
  message: string;
}

export interface VerifyLoginOTPError {
  success: false;
  error: string;
}

export type VerifyLoginOTPResult = VerifyLoginOTPResponse | VerifyLoginOTPError;

/**
 * 로그인 시 OTP 코드 검증
 */
export async function verifyLoginOTP(
  clerkUserId: string,
  token: string
): Promise<VerifyLoginOTPResult> {
  try {
    console.group("[Auth][VerifyLoginOTP]");
    console.log("event", "start");
    console.log("clerk_user_id", clerkUserId);

    // 입력 검증
    const validatedInput = VerifyLoginOTPSchema.parse({ clerkUserId, token });

    // Supabase에서 사용자 정보 및 MFA 설정 조회
    const supabase = getServiceRoleClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, mfa_secret, mfa_enabled, mfa_backup_codes")
      .eq("clerk_id", validatedInput.clerkUserId)
      .single();

    if (userError || !user) {
      console.error("database_error", userError);
      console.groupEnd();
      return {
        success: false,
        error: "사용자 정보를 찾을 수 없습니다",
      };
    }

    // MFA가 비활성화된 경우
    if (!user.mfa_enabled || !user.mfa_secret) {
      console.warn("mfa_not_enabled");
      console.groupEnd();
      return {
        success: false,
        error: "2단계 인증이 설정되지 않았습니다",
      };
    }

    console.log("user_id", user.id);
    console.log("mfa_enabled", user.mfa_enabled);

    // 복구 코드 확인
    const backupCodes = user.mfa_backup_codes || [];
    if (backupCodes.includes(validatedInput.token)) {
      console.log("backup_code_used", "✓");

      // 사용된 복구 코드 제거
      const updatedBackupCodes = backupCodes.filter((code) => code !== validatedInput.token);
      await supabase
        .from("users")
        .update({ mfa_backup_codes: updatedBackupCodes })
        .eq("id", user.id);

      console.log("status", "success");
      console.groupEnd();

      return {
        success: true,
        message: "복구 코드로 인증되었습니다",
      };
    }

    // OTP 코드 검증
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: "base32",
      token: validatedInput.token,
      window: 2, // ±2 타임스텝 허용 (약 ±60초)
    });

    if (!verified) {
      console.warn("verification_failed", "Invalid OTP token");
      console.groupEnd();
      return {
        success: false,
        error: "잘못된 인증 코드입니다. 다시 시도해주세요.",
      };
    }

    console.log("verification_success", "✓");
    console.log("status", "success");
    console.groupEnd();

    return {
      success: true,
      message: "인증되었습니다",
    };
  } catch (error) {
    console.error("[Auth][VerifyLoginOTP] unexpected_error", error);
    console.groupEnd();

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
    };
  }
}

/**
 * 사용자의 MFA 활성화 여부 확인
 */
export async function checkMFARequired(clerkUserId: string): Promise<boolean> {
  try {
    const supabase = getServiceRoleClient();
    const { data: user, error } = await supabase
      .from("users")
      .select("mfa_enabled")
      .eq("clerk_id", clerkUserId)
      .single();

    if (error || !user) {
      return false;
    }

    return user.mfa_enabled || false;
  } catch (error) {
    console.error("[Auth][CheckMFARequired] error", error);
    return false;
  }
}





















