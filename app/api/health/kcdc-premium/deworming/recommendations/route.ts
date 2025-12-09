/**
 * @file app/api/health/kcdc-premium/deworming/recommendations/route.ts
@description 구충제 추천 API

GET /api/health/kcdc-premium/deworming/recommendations - 사용자 연령대 기반 구충제 추천
*/

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import { getDewormingMedications } from "@/lib/kcdc/deworming-manager";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { calculateAge } from "@/lib/utils/age-calculator";

/**
 * GET /api/health/kcdc-premium/deworming/recommendations
 * 사용자 연령대 기반 구충제 추천
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/kcdc-premium/deworming/recommendations");

    // 1. 프리미엄 체크
    const premiumCheck = await checkPremiumAccess();
    if (!premiumCheck.isPremium || !premiumCheck.userId) {
      console.log("❌ 프리미엄 접근 거부");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Premium access required",
          message: premiumCheck.error || "이 기능은 프리미엄 전용입니다.",
        },
        { status: 403 }
      );
    }

    // 2. 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const familyMemberId = searchParams.get("family_member_id");

    // 3. 사용자 또는 가족 구성원의 나이 조회
    const supabase = getServiceRoleClient();
    let age: number | null = null;
    let ageGroup: string | null = null;

    if (familyMemberId) {
      // 가족 구성원 정보 조회
      const { data: member, error: memberError } = await supabase
        .from("family_members")
        .select("birth_date")
        .eq("id", familyMemberId)
        .eq("user_id", premiumCheck.userId)
        .single();

      if (memberError || !member) {
        console.error("❌ 가족 구성원 조회 실패:", memberError);
        console.groupEnd();
        return NextResponse.json(
          {
            error: "Family member not found",
            message: "가족 구성원을 찾을 수 없습니다.",
          },
          { status: 404 }
        );
      }

      if (member.birth_date) {
        const ageResult = calculateAge(member.birth_date);
        age = ageResult.years;
      }
    } else {
      // 본인 정보 조회
      const { data: profile, error: profileError } = await supabase
        .from("user_health_profiles")
        .select("age, birth_date")
        .eq("user_id", premiumCheck.userId)
        .single();

      if (profileError) {
        console.error("❌ 건강 프로필 조회 실패:", profileError);
        console.groupEnd();
        return NextResponse.json(
          {
            error: "Health profile not found",
            message: "건강 프로필을 찾을 수 없습니다.",
          },
          { status: 404 }
        );
      }

      if (profile?.birth_date) {
        const ageResult = calculateAge(profile.birth_date);
        age = ageResult.years;
      } else if (profile?.age) {
        age = profile.age;
      }
    }

    // 4. 연령대 결정
    if (age !== null) {
      if (age < 6) {
        ageGroup = "infant";
      } else if (age < 13) {
        ageGroup = "child";
      } else if (age < 19) {
        ageGroup = "adolescent";
      } else {
        ageGroup = "adult";
      }
    }

    console.log("👤 사용자 정보:", {
      age,
      ageGroup,
      familyMemberId: familyMemberId || "본인",
    });

    // 5. 구충제 목록 조회 (연령대 필터 적용)
    const medications = await getDewormingMedications(ageGroup || undefined);

    // 6. 연령대별 추천 구충제 필터링
    const recommendedMedications = medications.filter((med) => {
      // age_group이 null이면 모든 연령대에 적합
      if (!med.age_group) {
        return true;
      }
      // 연령대가 일치하는 경우
      return med.age_group === ageGroup;
    });

    console.log("✅ 추천 구충제:", recommendedMedications.length, "개");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: {
        recommendations: recommendedMedications,
        userInfo: {
          age,
          ageGroup,
          familyMemberId: familyMemberId || null,
        },
        summary: {
          totalMedications: recommendedMedications.length,
          ageGroup: ageGroup || "unknown",
        },
      },
    });
  } catch (error) {
    console.error("❌ API 오류:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error
            ? error.message
            : "구충제 추천 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

