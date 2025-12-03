/**
 * @file meal-kit-service.ts
 * @description 밀키트 서비스 (쿠팡 API + 폴백)
 *
 * 주요 기능:
 * 1. 쿠팡 파트너스 API 연동 시도
 * 2. API 실패 시 수동 등록된 밀키트 목록 사용
 * 3. 밀키트 제품 조회 및 필터링
 */

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type { MealKit, MealKitProduct } from "@/types/diet";
import type { MealType } from "@/types/health";

/**
 * 쿠팡 파트너스 API로 밀키트 제품 조회
 * (현재는 시뮬레이션, 실제 API 연동 시 구현)
 */
async function fetchCoupangMealKits(
  category?: string,
  mealType?: MealType
): Promise<MealKitProduct[]> {
  console.group("[MealKitService] 쿠팡 API 호출 시도");
  console.log("category:", category);
  console.log("mealType:", mealType);

  // 환경 변수 확인
  const apiKey = process.env.COUPANG_PARTNER_API_KEY;
  const apiSecret = process.env.COUPANG_PARTNER_SECRET;

  if (!apiKey || !apiSecret) {
    console.log("⚠️ 쿠팡 API 키가 설정되지 않음 - 폴백으로 전환");
    console.groupEnd();
    return [];
  }

  try {
    // TODO: 실제 쿠팡 파트너스 API 호출 구현
    // 현재는 시뮬레이션으로 빈 배열 반환
    console.log("⚠️ 쿠팡 API 연동은 아직 구현되지 않음 - 폴백으로 전환");
    console.groupEnd();
    return [];
  } catch (error) {
    console.error("❌ 쿠팡 API 호출 실패:", error);
    console.log("폴백으로 전환");
    console.groupEnd();
    return [];
  }
}

/**
 * 수동 등록된 밀키트 목록 조회 (폴백)
 */
async function fetchManualMealKits(
  category?: string,
  mealType?: MealType
): Promise<MealKit[]> {
  console.group("[MealKitService] 수동 등록 밀키트 조회");
  console.log("category:", category);
  console.log("mealType:", mealType);

  try {
    const supabase = await createClerkSupabaseClient();

    let query = supabase.from("meal_kits").select("*").eq("is_active", true);

    if (category) {
      query = query.eq("category", category);
    }

    if (mealType) {
      query = query.contains("meal_type", [mealType]);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("❌ 수동 등록 밀키트 조회 실패:", error);
      console.groupEnd();
      return [];
    }

    console.log("✅ 수동 등록 밀키트 조회 성공:", data?.length || 0, "개");
    console.groupEnd();
    return (data as MealKit[]) || [];
  } catch (error) {
    console.error("❌ 수동 등록 밀키트 조회 오류:", error);
    console.groupEnd();
    return [];
  }
}

/**
 * 캐시된 쿠팡 제품 조회
 */
async function fetchCachedCoupangProducts(
  category?: string,
  mealType?: MealType
): Promise<MealKitProduct[]> {
  console.group("[MealKitService] 캐시된 쿠팡 제품 조회");
  console.log("category:", category);
  console.log("mealType:", mealType);

  try {
    const supabase = await createClerkSupabaseClient();

    let query = supabase
      .from("meal_kit_products")
      .select("*")
      .eq("is_active", true)
      .eq("is_available", true)
      .eq("sync_status", "success");

    if (category) {
      query = query.eq("category", category);
    }

    if (mealType) {
      query = query.contains("meal_type", [mealType]);
    }

    // 최근 동기화된 제품만 (24시간 이내)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    query = query.gte("last_synced_at", oneDayAgo.toISOString());

    const { data, error } = await query.order("last_synced_at", { ascending: false }).limit(50);

    if (error) {
      console.error("❌ 캐시된 쿠팡 제품 조회 실패:", error);
      console.groupEnd();
      return [];
    }

    console.log("✅ 캐시된 쿠팡 제품 조회 성공:", data?.length || 0, "개");
    console.groupEnd();
    return (data as MealKitProduct[]) || [];
  } catch (error) {
    console.error("❌ 캐시된 쿠팡 제품 조회 오류:", error);
    console.groupEnd();
    return [];
  }
}

/**
 * 밀키트 목록 조회 (통합)
 * 1. 쿠팡 API 시도
 * 2. 실패 시 캐시된 쿠팡 제품 조회
 * 3. 둘 다 없으면 수동 등록 제품 조회
 */
export async function getMealKits(
  options: {
    category?: string;
    mealType?: MealType;
    useCoupang?: boolean; // 쿠팡 API 사용 여부
  } = {}
): Promise<{
  success: boolean;
  mealKits?: MealKit[];
  coupangProducts?: MealKitProduct[];
  error?: string;
}> {
  console.group("[MealKitService] 밀키트 목록 조회");
  console.log("options:", options);

  const { category, mealType, useCoupang = true } = options;

  try {
    // 1. 쿠팡 API 시도 (옵션이 활성화된 경우)
    if (useCoupang) {
      const coupangProducts = await fetchCoupangMealKits(category, mealType);
      if (coupangProducts.length > 0) {
        console.log("✅ 쿠팡 API에서 제품 조회 성공");
        console.groupEnd();
        return {
          success: true,
          coupangProducts,
        };
      }

      // 2. 캐시된 쿠팡 제품 조회
      const cachedProducts = await fetchCachedCoupangProducts(category, mealType);
      if (cachedProducts.length > 0) {
        console.log("✅ 캐시된 쿠팡 제품 조회 성공");
        console.groupEnd();
        return {
          success: true,
          coupangProducts: cachedProducts,
        };
      }
    }

    // 3. 수동 등록 제품 조회 (폴백)
    const manualMealKits = await fetchManualMealKits(category, mealType);
    console.log("✅ 수동 등록 밀키트 조회 성공");
    console.groupEnd();
    return {
      success: true,
      mealKits: manualMealKits,
    };
  } catch (error) {
    console.error("❌ 밀키트 목록 조회 오류:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

/**
 * 밀키트 제품 상세 정보 조회
 */
export async function getMealKitById(
  id: string,
  isCoupangProduct: boolean = false
): Promise<{
  success: boolean;
  mealKit?: MealKit;
  coupangProduct?: MealKitProduct;
  error?: string;
}> {
  console.group("[MealKitService] 밀키트 상세 조회");
  console.log("id:", id);
  console.log("isCoupangProduct:", isCoupangProduct);

  try {
    const supabase = await createClerkSupabaseClient();

    if (isCoupangProduct) {
      const { data, error } = await supabase
        .from("meal_kit_products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("❌ 쿠팡 제품 조회 실패:", error);
        console.groupEnd();
        return { success: false, error: "제품을 찾을 수 없습니다." };
      }

      console.log("✅ 쿠팡 제품 조회 성공");
      console.groupEnd();
      return { success: true, coupangProduct: data as MealKitProduct };
    } else {
      const { data, error } = await supabase
        .from("meal_kits")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("❌ 밀키트 조회 실패:", error);
        console.groupEnd();
        return { success: false, error: "제품을 찾을 수 없습니다." };
      }

      console.log("✅ 밀키트 조회 성공");
      console.groupEnd();
      return { success: true, mealKit: data as MealKit };
    }
  } catch (error) {
    console.error("❌ 밀키트 상세 조회 오류:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

















