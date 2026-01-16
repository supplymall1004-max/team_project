/**
 * @file actions/fridge/manage-ingredients.ts
 * @description 냉장고 식재료 관리 Server Actions
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface AddFridgeItemInput {
  name: string;
  quantity?: string;
  expiryDate: string;
  purchaseDate?: string;
  category?: string;
  barcode?: string;
  imageUrl?: string;
}

/**
 * 냉장고에 식재료 추가
 */
export async function addFridgeItem(input: AddFridgeItemInput) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다" };
    }

    const supabase = await createClerkSupabaseClient();

    // 사용자 ID 조회
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!userData) {
      return { success: false, error: "사용자를 찾을 수 없습니다" };
    }

    // 식재료 추가
    const { data, error } = await supabase
      .from("fridge_ingredients")
      .insert({
        user_id: userData.id,
        name: input.name,
        quantity: input.quantity,
        expiry_date: input.expiryDate,
        purchase_date: input.purchaseDate,
        category: input.category,
        barcode: input.barcode,
        image_url: input.imageUrl,
      })
      .select()
      .single();

    if (error) {
      console.error("[AddFridgeItem] 오류:", error);
      return { success: false, error: "식재료 추가에 실패했습니다" };
    }

    revalidatePath("/fridge");
    return { success: true, data };
  } catch (error) {
    console.error("[AddFridgeItem] 예외:", error);
    return { success: false, error: "예기치 않은 오류가 발생했습니다" };
  }
}

/**
 * 냉장고 식재료 목록 조회
 */
export async function getFridgeItems() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다", items: [] };
    }

    const supabase = await createClerkSupabaseClient();

    // 사용자 ID 조회
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!userData) {
      return { success: false, error: "사용자를 찾을 수 없습니다", items: [] };
    }

    // 식재료 목록 조회
    const { data, error } = await supabase
      .from("fridge_ingredients")
      .select("*")
      .eq("user_id", userData.id)
      .order("expiry_date", { ascending: true });

    if (error) {
      console.error("[GetFridgeItems] 오류:", error);
      return { success: false, error: "목록 조회에 실패했습니다", items: [] };
    }

    return { success: true, items: data || [] };
  } catch (error) {
    console.error("[GetFridgeItems] 예외:", error);
    return { success: false, error: "예기치 않은 오류가 발생했습니다", items: [] };
  }
}

/**
 * 냉장고 식재료 삭제
 */
export async function deleteFridgeItem(itemId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다" };
    }

    const supabase = await createClerkSupabaseClient();

    // 사용자 ID 조회
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!userData) {
      return { success: false, error: "사용자를 찾을 수 없습니다" };
    }

    // 본인의 식재료인지 확인 후 삭제
    const { error } = await supabase
      .from("fridge_ingredients")
      .delete()
      .eq("id", itemId)
      .eq("user_id", userData.id);

    if (error) {
      console.error("[DeleteFridgeItem] 오류:", error);
      return { success: false, error: "삭제에 실패했습니다" };
    }

    revalidatePath("/fridge");
    return { success: true };
  } catch (error) {
    console.error("[DeleteFridgeItem] 예외:", error);
    return { success: false, error: "예기치 않은 오류가 발생했습니다" };
  }
}

/**
 * 냉장고 식재료 수정
 */
export async function updateFridgeItem(itemId: string, input: Partial<AddFridgeItemInput>) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다" };
    }

    const supabase = await createClerkSupabaseClient();

    // 사용자 ID 조회
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!userData) {
      return { success: false, error: "사용자를 찾을 수 없습니다" };
    }

    // 본인의 식재료인지 확인 후 수정
    const updateData: any = {};
    if (input.name) updateData.name = input.name;
    if (input.quantity !== undefined) updateData.quantity = input.quantity;
    if (input.expiryDate) updateData.expiry_date = input.expiryDate;
    if (input.purchaseDate !== undefined) updateData.purchase_date = input.purchaseDate;
    if (input.category !== undefined) updateData.category = input.category;

    const { error } = await supabase
      .from("fridge_ingredients")
      .update(updateData)
      .eq("id", itemId)
      .eq("user_id", userData.id);

    if (error) {
      console.error("[UpdateFridgeItem] 오류:", error);
      return { success: false, error: "수정에 실패했습니다" };
    }

    revalidatePath("/fridge");
    return { success: true };
  } catch (error) {
    console.error("[UpdateFridgeItem] 예외:", error);
    return { success: false, error: "예기치 않은 오류가 발생했습니다" };
  }
}

