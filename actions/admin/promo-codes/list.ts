/**
 * @file actions/admin/promo-codes/list.ts
 * @description 관리자 프로모션 코드 목록 조회 Server Action
 *
 * 주요 기능:
 * 1. promo_codes 테이블에서 모든 프로모션 코드 조회
 * 2. 상태별 필터링 지원 (active, expired, used_up)
 * 3. 사용 통계 포함
 */

"use server";

import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { PromoCode, PromoCodeListItem } from "@/types/promo-code";

// 입력 스키마
const ListPromoCodesSchema = z.object({
  status: z.enum(["active", "expired", "used_up", "all"]).optional().default("all"),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

type ListPromoCodesInput = z.infer<typeof ListPromoCodesSchema>;

export interface ListPromoCodesResponse {
  success: true;
  data: PromoCodeListItem[];
  total: number;
  hasMore: boolean;
}

export interface ListPromoCodesError {
  success: false;
  error: string;
}

export type ListPromoCodesResult = ListPromoCodesResponse | ListPromoCodesError;

/**
 * 프로모션 코드 목록 조회
 */
export async function listPromoCodes(input?: ListPromoCodesInput): Promise<ListPromoCodesResult> {
  try {
    console.group("[AdminConsole][PromoCodes][List]");
    console.log("event", "start");
    console.log("input", input);

    // 입력 검증
    const validatedInput = ListPromoCodesSchema.parse(input || {});
    const { status, limit, offset } = validatedInput;

    // Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();

    // 쿼리 빌드
    console.log("📊 프로모션 코드 목록 조회 시작:", { status, limit, offset });
    
    let query = supabase
      .from("promo_codes")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    
    // 각 프로모션 코드의 실제 사용 횟수 조회
    if (data && data.length > 0) {
      const codeIds = data.map((code: PromoCode) => code.id);
      
      // promo_code_uses 테이블에서 각 코드별 사용 횟수 조회
      const { data: useCounts, error: useCountError } = await supabase
        .from("promo_code_uses")
        .select("promo_code_id")
        .in("promo_code_id", codeIds);
      
      if (!useCountError && useCounts) {
        // 코드별 사용 횟수 계산
        const useCountMap = new Map<string, number>();
        useCounts.forEach((use: { promo_code_id: string }) => {
          const currentCount = useCountMap.get(use.promo_code_id) || 0;
          useCountMap.set(use.promo_code_id, currentCount + 1);
        });
        
        // 실제 사용 횟수로 업데이트
        data.forEach((code: PromoCode) => {
          const actualUses = useCountMap.get(code.id) || 0;
          code.current_uses = actualUses;
        });
        
        console.log("✅ 실제 사용 횟수 계산 완료:", useCountMap);
      } else if (useCountError) {
        console.warn("⚠️ 사용 횟수 조회 실패 (기존 값 사용):", useCountError);
      }
    }

    if (error) {
      console.error("❌ 데이터베이스 오류:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      console.groupEnd();
      
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return {
          success: false,
          error: `테이블 'promo_codes'를 찾을 수 없습니다. 마이그레이션을 적용해주세요.`,
        };
      }
      
      return {
        success: false,
        error: `데이터베이스 오류: ${error.message}`,
      };
    }
    
    console.log("✅ 데이터 조회 성공:", { count: data?.length || 0, total: count || 0 });

    // 상태 계산 및 필터링
    const now = new Date();
    const codesWithStatus: PromoCodeListItem[] = (data || []).map((item: PromoCode) => {
      const validFrom = new Date(item.valid_from);
      const validUntil = new Date(item.valid_until);
      
      let codeStatus: 'active' | 'expired' | 'used_up' = 'active';
      
      if (item.max_uses !== null && item.current_uses >= item.max_uses) {
        codeStatus = 'used_up';
      } else if (now < validFrom || now > validUntil) {
        codeStatus = 'expired';
      }
      
      return {
        ...item,
        status: codeStatus,
      };
    });

    // 상태 필터 적용
    const filteredCodes = status === "all" 
      ? codesWithStatus 
      : codesWithStatus.filter(code => code.status === status);

    console.log("result_count", filteredCodes.length);
    console.log("total_count", count);
    console.groupEnd();

    return {
      success: true,
      data: filteredCodes,
      total: count || 0,
      hasMore: (count || 0) > offset + filteredCodes.length,
    };
  } catch (error) {
    console.error("❌ [AdminConsole][PromoCodes][List] 예상치 못한 오류:", {
      error,
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    console.groupEnd();

    return {
      success: false,
      error: error instanceof Error 
        ? error.message 
        : typeof error === "string" 
        ? error 
        : "알 수 없는 오류가 발생했습니다",
    };
  }
}

