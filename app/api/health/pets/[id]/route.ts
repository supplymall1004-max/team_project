/**
 * @file app/api/health/pets/[id]/route.ts
 * @description 반려동물 프로필 상세 관리 API
 * 
 * GET /api/health/pets/[id] - 반려동물 상세 조회
 * PATCH /api/health/pets/[id] - 반려동물 수정
 * DELETE /api/health/pets/[id] - 반려동물 삭제
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { calculatePetLifecycle } from "@/lib/health/pet-lifecycle-calculator";
import { PetProfileInput } from "@/types/pet";

/**
 * GET /api/health/pets/[id]
 * 반려동물 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.group(`🐾 GET /api/health/pets/${id}`);
    console.log("📍 반려동물 상세 조회");

    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 사용자 확인 및 동기화
    const userData = await ensureSupabaseUser();
    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없거나 동기화 실패");
      console.groupEnd();
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const supabaseUserId = userData.id;
    const supabase = getServiceRoleClient();

    // 반려동물 조회 (본인 소유 확인)
    const { data: pet, error } = await supabase
      .from("family_members")
      .select("*")
      .eq("id", id)
      .eq("user_id", supabaseUserId)
      .eq("member_type", "pet")
      .single();

    if (error || !pet) {
      console.error("❌ 반려동물 조회 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "Pet not found" },
        { status: 404 }
      );
    }

    // 생애주기 정보 계산
    let lifecycleInfo;
    if (pet.birth_date && pet.pet_type) {
      lifecycleInfo = calculatePetLifecycle(
        pet.pet_type as 'dog' | 'cat' | 'other',
        pet.birth_date
      );
    }

    console.log("✅ 반려동물 조회 완료:", { id: pet.id, name: pet.name });
    console.groupEnd();

    return NextResponse.json({
      pet: {
        ...pet,
        age: lifecycleInfo?.age,
        lifecycleInfo,
      },
    });
  } catch (error) {
    console.error("❌ 예상치 못한 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/health/pets/[id]
 * 반려동물 수정
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.group(`✏️ PATCH /api/health/pets/${id}`);
    console.log("📍 반려동물 수정");

    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: Partial<PetProfileInput> = await request.json();
    console.log("수정 데이터:", body);

    // 사용자 확인 및 동기화
    const userData = await ensureSupabaseUser();
    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없거나 동기화 실패");
      console.groupEnd();
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const supabaseUserId = userData.id;
    const supabase = getServiceRoleClient();

    // 기존 반려동물 조회 (본인 소유 확인)
    const { data: existingPet, error: fetchError } = await supabase
      .from("family_members")
      .select("*")
      .eq("id", id)
      .eq("user_id", supabaseUserId)
      .eq("member_type", "pet")
      .single();

    if (fetchError || !existingPet) {
      console.error("❌ 반려동물 조회 실패:", fetchError);
      console.groupEnd();
      return NextResponse.json(
        { error: "Pet not found" },
        { status: 404 }
      );
    }

    // 생애주기 단계 재계산 (생년월일이나 종류가 변경된 경우)
    let lifecycleStage = existingPet.lifecycle_stage;
    if (body.birth_date || body.pet_type) {
      const birthDate = body.birth_date || existingPet.birth_date;
      const petType = (body.pet_type || existingPet.pet_type) as 'dog' | 'cat' | 'other';
      if (birthDate && petType) {
        const lifecycleInfo = calculatePetLifecycle(petType, birthDate);
        lifecycleStage = lifecycleInfo.stage;
      }
    }

    // 업데이트 데이터 준비
    const updateData: Record<string, any> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.birth_date !== undefined) updateData.birth_date = body.birth_date;
    if (body.pet_type !== undefined) updateData.pet_type = body.pet_type;
    if (body.breed !== undefined) updateData.breed = body.breed || null;
    if (body.gender !== undefined) updateData.gender = body.gender || null;
    if (body.relationship !== undefined) updateData.relationship = body.relationship;
    if (body.weight_kg !== undefined) updateData.weight_kg = body.weight_kg || null;
    if (body.photo_url !== undefined) updateData.photo_url = body.photo_url || null;
    if (body.pet_metadata !== undefined) updateData.pet_metadata = body.pet_metadata || {};
    if (lifecycleStage !== undefined) updateData.lifecycle_stage = lifecycleStage;

    // 반려동물 수정
    const { data: updatedPet, error } = await supabase
      .from("family_members")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", supabaseUserId)
      .select()
      .single();

    if (error) {
      console.error("❌ 반려동물 수정 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "Database error", message: error.message },
        { status: 500 }
      );
    }

    // 생애주기 정보 재계산
    let lifecycleInfo;
    if (updatedPet.birth_date && updatedPet.pet_type) {
      lifecycleInfo = calculatePetLifecycle(
        updatedPet.pet_type as 'dog' | 'cat' | 'other',
        updatedPet.birth_date
      );
    }

    console.log("✅ 반려동물 수정 완료:", { id: updatedPet.id, name: updatedPet.name });
    console.groupEnd();

    return NextResponse.json({
      pet: {
        ...updatedPet,
        age: lifecycleInfo?.age,
        lifecycleInfo,
      },
    });
  } catch (error) {
    console.error("❌ 예상치 못한 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/health/pets/[id]
 * 반려동물 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.group(`🗑️ DELETE /api/health/pets/${id}`);
    console.log("📍 반려동물 삭제");

    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 사용자 확인 및 동기화
    const userData = await ensureSupabaseUser();
    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없거나 동기화 실패");
      console.groupEnd();
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const supabaseUserId = userData.id;
    const supabase = getServiceRoleClient();

    // 기존 반려동물 조회 (본인 소유 확인)
    const { data: existingPet, error: fetchError } = await supabase
      .from("family_members")
      .select("id, name")
      .eq("id", id)
      .eq("user_id", supabaseUserId)
      .eq("member_type", "pet")
      .single();

    if (fetchError || !existingPet) {
      console.error("❌ 반려동물 조회 실패:", fetchError);
      console.groupEnd();
      return NextResponse.json(
        { error: "Pet not found" },
        { status: 404 }
      );
    }

    // 반려동물 삭제 (CASCADE로 관련 기록도 함께 삭제됨)
    const { error } = await supabase
      .from("family_members")
      .delete()
      .eq("id", id)
      .eq("user_id", supabaseUserId);

    if (error) {
      console.error("❌ 반려동물 삭제 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "Database error", message: error.message },
        { status: 500 }
      );
    }

    console.log("✅ 반려동물 삭제 완료:", { id, name: existingPet.name });
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "반려동물이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("❌ 예상치 못한 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

