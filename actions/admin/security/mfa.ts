/**
 * @file actions/admin/security/mfa.ts
 * @description MFA(2단계 인증) 관련 Server Actions
 * 
 * 주요 기능:
 * 1. MFA 비밀키 생성 및 QR 코드 URL 반환
 * 2. OTP 코드 검증
 * 3. MFA 활성화/비활성화
 * 4. 복구 코드 생성
 * 
 * @dependencies
 * - speakeasy: TOTP 생성/검증
 * - qrcode: QR 코드 생성
 * - @/lib/supabase/server: Supabase 클라이언트
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { z } from "zod";

// ===========================
// 스키마 정의
// ===========================

const VerifyOTPSchema = z.object({
  token: z.string().length(6, "OTP 코드는 6자리입니다"),
});

// ===========================
// 타입 정의
// ===========================

export interface MFASetupResponse {
  success: true;
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFASetupError {
  success: false;
  error: string;
}

export interface MFAVerifyResponse {
  success: true;
  message: string;
}

export interface MFAVerifyError {
  success: false;
  error: string;
}

export interface MFAStatusResponse {
  success: true;
  enabled: boolean;
}

export interface MFAStatusError {
  success: false;
  error: string;
}

export type MFASetupResult = MFASetupResponse | MFASetupError;
export type MFAVerifyResult = MFAVerifyResponse | MFAVerifyError;
export type MFAStatusResult = MFAStatusResponse | MFAStatusError;

// ===========================
// Helper 함수
// ===========================

/**
 * 복구 코드 생성 (10개)
 */
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

// ===========================
// Server Actions
// ===========================

/**
 * MFA 설정 시작 - 비밀키 및 QR 코드 생성
 */
export async function setupMFA(): Promise<MFASetupResult> {
  try {
    console.group("[MFA][Setup]");
    console.log("event", "start");

    // Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.error("auth_error", "User not authenticated");
      console.groupEnd();
      return {
        success: false,
        error: "로그인이 필요합니다",
      };
    }

    console.log("clerk_user_id", userId);

    // Supabase에서 사용자 정보 조회
    const supabase = getServiceRoleClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, mfa_enabled")
      .eq("clerk_id", userId)
      .single();

    if (userError || !user) {
      console.error("database_error", userError);
      console.groupEnd();
      return {
        success: false,
        error: "사용자 정보를 찾을 수 없습니다",
      };
    }

    console.log("user_id", user.id);

    // 이미 MFA가 활성화되어 있는지 확인
    if (user.mfa_enabled) {
      console.warn("mfa_already_enabled");
      console.groupEnd();
      return {
        success: false,
        error: "이미 2단계 인증이 활성화되어 있습니다",
      };
    }

    // TOTP 비밀키 생성
    const secret = speakeasy.generateSecret({
      name: `Team Project (${user.name || userId})`,
      issuer: "Team Project",
    });

    console.log("secret_generated", "✓");
    console.log("secret_base32", secret.base32);

    // QR 코드 생성
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || "");
    console.log("qr_code_generated", "✓");

    // 복구 코드 생성
    const backupCodes = generateBackupCodes();
    console.log("backup_codes_generated", backupCodes.length);

    // 비밀키를 데이터베이스에 임시 저장 (아직 활성화 안 됨)
    const { error: updateError } = await supabase
      .from("users")
      .update({
        mfa_secret: secret.base32,
        mfa_backup_codes: backupCodes,
        mfa_enabled: false, // 아직 활성화 안 함
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("database_update_error", updateError);
      console.groupEnd();
      return {
        success: false,
        error: "MFA 설정 중 오류가 발생했습니다",
      };
    }

    console.log("status", "success");
    console.groupEnd();

    return {
      success: true,
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
    };
  } catch (error) {
    console.error("[MFA][Setup] unexpected_error", error);
    console.groupEnd();

    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
    };
  }
}

/**
 * OTP 코드 검증 및 MFA 활성화
 */
export async function verifyAndEnableMFA(token: string): Promise<MFAVerifyResult> {
  try {
    console.group("[MFA][VerifyAndEnable]");
    console.log("event", "start");

    // 입력 검증
    const validatedInput = VerifyOTPSchema.parse({ token });
    console.log("token_length", validatedInput.token.length);

    // Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.error("auth_error", "User not authenticated");
      console.groupEnd();
      return {
        success: false,
        error: "로그인이 필요합니다",
      };
    }

    // Supabase에서 사용자 정보 및 비밀키 조회
    const supabase = getServiceRoleClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, mfa_secret, mfa_enabled")
      .eq("clerk_id", userId)
      .single();

    if (userError || !user) {
      console.error("database_error", userError);
      console.groupEnd();
      return {
        success: false,
        error: "사용자 정보를 찾을 수 없습니다",
      };
    }

    if (!user.mfa_secret) {
      console.error("no_secret", "MFA secret not found");
      console.groupEnd();
      return {
        success: false,
        error: "MFA 설정을 먼저 시작해주세요",
      };
    }

    console.log("user_id", user.id);

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

    // MFA 활성화
    const { error: updateError } = await supabase
      .from("users")
      .update({
        mfa_enabled: true,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("database_update_error", updateError);
      console.groupEnd();
      return {
        success: false,
        error: "MFA 활성화 중 오류가 발생했습니다",
      };
    }

    console.log("status", "success");
    console.groupEnd();

    return {
      success: true,
      message: "2단계 인증이 성공적으로 활성화되었습니다",
    };
  } catch (error) {
    console.error("[MFA][VerifyAndEnable] unexpected_error", error);
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
 * MFA 비활성화
 */
export async function disableMFA(): Promise<MFAVerifyResult> {
  try {
    console.group("[MFA][Disable]");
    console.log("event", "start");

    // Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.error("auth_error", "User not authenticated");
      console.groupEnd();
      return {
        success: false,
        error: "로그인이 필요합니다",
      };
    }

    // Supabase에서 사용자 정보 조회
    const supabase = getServiceRoleClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, mfa_enabled")
      .eq("clerk_id", userId)
      .single();

    if (userError || !user) {
      console.error("database_error", userError);
      console.groupEnd();
      return {
        success: false,
        error: "사용자 정보를 찾을 수 없습니다",
      };
    }

    console.log("user_id", user.id);

    // MFA 비활성화
    const { error: updateError } = await supabase
      .from("users")
      .update({
        mfa_enabled: false,
        mfa_secret: null,
        mfa_backup_codes: null,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("database_update_error", updateError);
      console.groupEnd();
      return {
        success: false,
        error: "MFA 비활성화 중 오류가 발생했습니다",
      };
    }

    console.log("status", "success");
    console.groupEnd();

    return {
      success: true,
      message: "2단계 인증이 비활성화되었습니다",
    };
  } catch (error) {
    console.error("[MFA][Disable] unexpected_error", error);
    console.groupEnd();

    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
    };
  }
}

/**
 * MFA 활성화 상태 조회
 */
export async function getMFAStatus(): Promise<MFAStatusResult> {
  try {
    console.group("[MFA][GetStatus]");
    console.log("event", "start");

    // Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.error("auth_error", "User not authenticated");
      console.groupEnd();
      return {
        success: false,
        error: "로그인이 필요합니다",
      };
    }

    // Supabase에서 사용자 MFA 상태 조회
    const supabase = getServiceRoleClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("mfa_enabled")
      .eq("clerk_id", userId)
      .single();

    if (userError || !user) {
      console.error("database_error", userError);
      console.groupEnd();
      return {
        success: false,
        error: "사용자 정보를 찾을 수 없습니다",
      };
    }

    console.log("mfa_enabled", user.mfa_enabled);
    console.groupEnd();

    return {
      success: true,
      enabled: user.mfa_enabled || false,
    };
  } catch (error) {
    console.error("[MFA][GetStatus] unexpected_error", error);
    console.groupEnd();

    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
    };
  }
}

