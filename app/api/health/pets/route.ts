/**
 * @file app/api/health/pets/route.ts
 * @description 반려동물 프로필 관리 API
 * 
 * GET /api/health/pets - 반려동물 목록 조회
 * POST /api/health/pets - 반려동물 등록
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { calculatePetLifecycle } from "@/lib/health/pet-lifecycle-calculator";
import { PetProfileInput } from "@/types/pet";

/**
 * GET /api/health/pets
 * 반려동물 목록 조회
 */
export async function GET() {
  try {
    console.group("🐾 GET /api/health/pets");
    console.log("📍 반려동물 목록 조회");

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

    console.log("✅ 사용자 확인 완료:", { id: userData.id, name: userData.name });
    const supabaseUserId = userData.id;
    const supabase = getServiceRoleClient();

    // 반려동물 목록 조회 (member_type = 'pet')
    const { data: pets, error } = await supabase
      .from("family_members")
      .select("*")
      .eq("user_id", supabaseUserId)
      .eq("member_type", "pet")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ 반려동물 조회 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "Database error", message: error.message },
        { status: 500 }
      );
    }

    // 생애주기 정보 계산
    const petsWithLifecycle = (pets || []).map((pet) => {
      if (pet.birth_date && pet.pet_type) {
        const lifecycleInfo = calculatePetLifecycle(
          pet.pet_type as 'dog' | 'cat' | 'other',
          pet.birth_date
        );
        return {
          ...pet,
          lifecycle_stage: lifecycleInfo.stage,
          age: lifecycleInfo.age,
          lifecycleInfo,
        };
      }
      return pet;
    });

    console.log(`✅ 반려동물 ${petsWithLifecycle.length}마리 조회 완료`);
    console.groupEnd();

    return NextResponse.json({
      pets: petsWithLifecycle,
      count: petsWithLifecycle.length,
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
 * POST /api/health/pets
 * 반려동물 등록
 */
export async function POST(request: NextRequest) {
  try {
    console.group("➕ POST /api/health/pets");
    console.log("📍 반려동물 등록");

    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: PetProfileInput = await request.json();
    console.log("요청 데이터:", body);

    // 필수 필드 검증
    if (!body.name || !body.birth_date || !body.pet_type) {
      console.error("❌ 필수 필드 누락");
      console.groupEnd();
      return NextResponse.json(
        { error: "Validation error", message: "이름, 생년월일, 반려동물 종류는 필수입니다." },
        { status: 400 }
      );
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

    console.log("✅ 사용자 확인 완료:", { id: userData.id, name: userData.name });
    const supabaseUserId = userData.id;
    const supabase = getServiceRoleClient();

    // 생애주기 단계 계산
    const lifecycleInfo = calculatePetLifecycle(body.pet_type, body.birth_date);
    console.log("✅ 생애주기 계산 완료:", { stage: lifecycleInfo.stage, age: lifecycleInfo.age });

    // 반려동물 등록 (family_members 테이블에 member_type='pet'로 저장)
    // relationship 필드는 NOT NULL이므로 반드시 값이 필요함
    const relationship = body.relationship && body.relationship.trim() !== '' 
      ? body.relationship.trim() 
      : 'pet';
    
    const { data: newPet, error } = await supabase
      .from("family_members")
      .insert({
        user_id: supabaseUserId,
        name: body.name,
        birth_date: body.birth_date,
        member_type: "pet",
        pet_type: body.pet_type,
        breed: body.breed && body.breed.trim() !== '' ? body.breed.trim() : null,
        gender: body.gender || null,
        relationship: relationship, // NOT NULL 필드이므로 항상 값이 있어야 함
        weight_kg: body.weight_kg || null,
        photo_url: body.photo_url && body.photo_url.trim() !== '' ? body.photo_url.trim() : null,
        lifecycle_stage: lifecycleInfo.stage,
        pet_metadata: body.pet_metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error("❌ 반려동물 등록 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "Database error", message: error.message },
        { status: 500 }
      );
    }

    console.log("✅ 반려동물 등록 완료:", { id: newPet.id, name: newPet.name });
    console.groupEnd();

    return NextResponse.json({
      pet: {
        ...newPet,
        age: lifecycleInfo.age,
        lifecycleInfo,
      },
    }, { status: 201 });
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

