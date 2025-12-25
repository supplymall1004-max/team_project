/**
 * @file app/api/family/diet/[date]/route.ts
 * @description 특정 날짜 가족 식단 조회 API
 *
 * GET /api/family/diet/[date] - 가족 식단 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NutritionInfo } from "@/types/health";
import { DISEASE_LABELS, ALLERGY_LABELS } from "@/types/family";

/**
 * GET /api/family/diet/[date]
 * 특정 날짜의 가족 식단 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  try {
    console.group("📋 GET /api/family/diet/[date]");
    const searchParams = request.nextUrl.searchParams;
    const includeSummary = searchParams.get("scope") === "previous";

    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date } = await params;
    console.log("📅 조회 날짜:", date);
    console.log(
      "📋 scope 파라미터:",
      includeSummary ? "previous (요약 포함)" : "없음",
    );

    // 사용자 정보 확인 및 자동 동기화
    console.log("🔍 사용자 정보 확인 중...");
    const userRow = await ensureSupabaseUser();

    if (!userRow) {
      console.error("❌ 사용자 정보 없음 (동기화 실패)");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "User not found. Please try again after user synchronization.",
        },
        { status: 404 },
      );
    }

    console.log("✅ 사용자 정보 확인 완료:", userRow.id);
    const supabaseUserId = userRow.id;

    // diet_plans는 조회/저장 시 권한 이슈(PGRST301: No suitable key)가 자주 발생할 수 있어
    // 서버 API에서는 Service Role 클라이언트를 사용해 안정적으로 조회합니다.
    // (개발 환경에서는 RLS도 비활성화되어 있어 안전합니다.)
    const supabase = getServiceRoleClient();

    // 해당 날짜의 모든 식단 조회
    let plans: any[] = [];
    console.log("🔍 식단 데이터 조회 중...");
    console.log("   - user_id:", supabaseUserId);
    console.log("   - plan_date:", date);

    const { data: planRows, error } = await supabase
      .from("diet_plans")
      .select("*")
      .eq("user_id", supabaseUserId)
      .eq("plan_date", date)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ 조회 실패:", error);
      console.warn("⚠️ diet_plans 조회 오류로 인해 빈 요약으로 대체합니다.");
    } else {
      plans = planRows ?? [];
      console.log(`📊 조회된 식단 데이터 개수: ${plans.length}개`);
      if (plans.length > 0) {
        console.log(
          "📊 식단 데이터 상세:",
          plans.map((p) => ({
            id: p.id,
            meal_type: p.meal_type,
            family_member_id: p.family_member_id,
            is_unified: p.is_unified,
            recipe_title: p.recipe_title,
            calories: p.calories,
          })),
        );
      } else {
        console.warn("⚠️ 해당 날짜에 식단 데이터가 없습니다");
      }
    }

    // 개인별 + 통합 식단으로 그룹핑
    const groupedPlans: Record<string, any[]> = {
      user: [],
      unified: [],
    };

    if (plans.length > 0) {
      for (const plan of plans) {
        if (plan.is_unified) {
          groupedPlans.unified.push(plan);
        } else if (plan.family_member_id) {
          const memberId = plan.family_member_id;
          if (!groupedPlans[memberId]) {
            groupedPlans[memberId] = [];
          }
          groupedPlans[memberId].push(plan);
        } else {
          groupedPlans.user.push(plan);
        }
      }
    }

    // 식사별로 재구성
    const result: Record<string, any> = {};

    for (const [memberId, planList] of Object.entries(groupedPlans)) {
      if (planList.length === 0 && memberId !== "user") continue;

      result[memberId] = {
        breakfast: groupByMealType(planList, "breakfast"),
        lunch: groupByMealType(planList, "lunch"),
        dinner: groupByMealType(planList, "dinner"),
        snack: groupByMealType(planList, "snack"),
      };
    }

    console.log(`✅ ${Object.keys(result).length}개 식단 그룹 조회 성공`);

    let summary: FamilyDietSummary | null = null;
    if (includeSummary) {
      summary = await buildFamilyDietSummary({
        supabase,
        userId: supabaseUserId,
        userName: userRow.name ?? "본인",
        plans: result,
      });
    }

    console.groupEnd();

    return NextResponse.json({
      date,
      plans: result,
      ...(summary ? { summary } : {}),
    });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * 식사 타입별로 레시피 그룹핑
 */
function groupByMealType(plans: any[], mealType: string) {
  const meals = plans.filter((p) => p.meal_type === mealType);

  if (meals.length === 0) return null;

  return meals.map((meal) => ({
    recipe_id: meal.recipe_id,
    title: meal.recipe_title,
    description: meal.recipe_description,
    ingredients: meal.ingredients,
    instructions: meal.instructions,
    nutrition: {
      calories: meal.calories,
      protein: meal.protein_g,
      carbs: meal.carbs_g,
      fat: meal.fat_g,
      sodium: meal.sodium_mg,
      fiber: meal.fiber_g,
    },
  }));
}

type MemberMeals = {
  breakfast: any[] | null;
  lunch: any[] | null;
  dinner: any[] | null;
  snack: any[] | null;
};

interface HealthFlag {
  type: "disease" | "allergy";
  code: string;
  label: string;
}

interface FamilyMemberSummary {
  id: string;
  name: string;
  relationship?: string | null;
  role: "self" | "member";
  includeInUnified: boolean;
  diseases: string[];
  allergies: string[];
  notes: string[];
  healthFlags: HealthFlag[];
}

interface FamilyDietSummary {
  memberTabs: FamilyMemberSummary[];
  nutrientTotals: NutritionInfo | null;
  includedMemberIds: string[];
  exclusionNotes: string[];
  planExists: boolean;
}

async function buildFamilyDietSummary({
  supabase,
  userId,
  userName,
  plans,
}: {
  supabase: SupabaseClient;
  userId: string;
  userName: string;
  plans: Record<string, MemberMeals>;
}): Promise<FamilyDietSummary | null> {
  // 가족 구성원은 Service Role 클라이언트로 조회 (RLS 우회)
  // 반려동물 제외 (member_type이 'pet'이 아닌 경우만 조회)
  const serviceClient = getServiceRoleClient();
  const { data: familyMembersData, error: familyMembersError } =
    await serviceClient
      .from("family_members")
      .select(
        "id, name, relationship, diseases, allergies, include_in_unified_diet, member_type",
      )
      .eq("user_id", userId)
      .or("member_type.is.null,member_type.neq.pet") // member_type이 null이거나 'pet'이 아닌 경우만
      .order("created_at", { ascending: true });

  if (familyMembersError) {
    console.error("❌ 가족 구성원 조회 실패:", familyMembersError);
  }

  const familyMembers = Array.isArray(familyMembersData)
    ? familyMembersData
    : [];

  console.group("[buildFamilyDietSummary] 가족 구성원 조회");
  console.log("조회된 가족 구성원 수:", familyMembers.length);
  console.log("가족 구성원 데이터:", familyMembers);
  if (familyMembersError) {
    console.error("가족 구성원 조회 에러:", familyMembersError);
  }
  console.groupEnd();

  const { data: healthProfile } = await supabase
    .from("user_health_profiles")
    .select("diseases, allergies")
    .eq("user_id", userId)
    .maybeSingle();

  const memberTabs: FamilyMemberSummary[] = [
    {
      id: "self",
      name: userName,
      relationship: "self",
      role: "self",
      includeInUnified: true,
      diseases: (healthProfile?.diseases as string[]) || [],
      allergies: (healthProfile?.allergies as string[]) || [],
      notes: buildMemberNotes(
        userName,
        healthProfile?.diseases,
        healthProfile?.allergies,
      ),
      healthFlags: buildHealthFlags(
        healthProfile?.diseases,
        healthProfile?.allergies,
      ),
    },
    ...familyMembers.map((member) => ({
      id: member.id,
      name: member.name,
      relationship: member.relationship,
      role: "member" as const,
      includeInUnified: member.include_in_unified_diet !== false,
      diseases: (member.diseases as string[]) || [],
      allergies: (member.allergies as string[]) || [],
      notes: buildMemberNotes(member.name, member.diseases, member.allergies),
      healthFlags: buildHealthFlags(member.diseases, member.allergies),
    })),
  ];

  console.group("[buildFamilyDietSummary] memberTabs 생성 완료");
  console.log("전체 memberTabs 개수:", memberTabs.length);
  console.log("memberTabs 상세:", memberTabs);
  console.groupEnd();

  console.group("[buildFamilyDietSummary] 영양소 계산");
  console.log("plans.unified 존재 여부:", !!plans.unified);
  console.log("plans.unified 데이터:", plans.unified);

  const nutrientTotals = aggregateNutritionFromPlan(plans.unified);
  console.log("계산된 영양소 합계:", nutrientTotals);
  console.groupEnd();

  const includedMemberIds = memberTabs
    .filter((member) => member.includeInUnified !== false)
    .map((member) => member.id);

  const exclusionNotes = memberTabs.flatMap((member) =>
    member.notes.map((note) => `${member.name}: ${note}`),
  );

  const planExists = Boolean(plans.unified);
  console.log("✅ 최종 요약 생성 완료:", {
    memberTabsCount: memberTabs.length,
    hasNutrientTotals: !!nutrientTotals,
    includedMemberIds,
    planExists,
  });

  return {
    memberTabs,
    nutrientTotals,
    includedMemberIds,
    exclusionNotes,
    planExists,
  };
}

function aggregateNutritionFromPlan(
  plan?: MemberMeals | null,
): NutritionInfo | null {
  if (!plan) {
    return null;
  }

  const totals = {
    calories: 0,
    carbohydrates: 0,
    protein: 0,
    fat: 0,
    sodium: 0,
  };

  let hasData = false;

  (["breakfast", "lunch", "dinner", "snack"] as const).forEach((mealType) => {
    const entries = plan[mealType];
    if (Array.isArray(entries) && entries.length > 0) {
      hasData = true;
      entries.forEach((entry) => {
        const nutrition = entry?.nutrition || {};
        totals.calories += Number(nutrition.calories) || 0;
        const carbsValue = nutrition.carbohydrates ?? nutrition.carbs;
        totals.carbohydrates += Number(carbsValue) || 0;
        totals.protein += Number(nutrition.protein) || 0;
        totals.fat += Number(nutrition.fat) || 0;
        totals.sodium += Number(nutrition.sodium) || 0;
      });
    }
  });

  if (!hasData) {
    return null;
  }

  return {
    calories: Math.round(totals.calories),
    carbohydrates: Number(totals.carbohydrates.toFixed(1)),
    protein: Number(totals.protein.toFixed(1)),
    fat: Number(totals.fat.toFixed(1)),
    sodium: totals.sodium > 0 ? Math.round(totals.sodium) : null,
  };
}

function buildMemberNotes(
  memberName: string,
  diseases?: string[] | null,
  allergies?: string[] | null,
): string[] {
  const notes: string[] = [];
  const diseaseSet = new Set<string>();
  const allergySet = new Set<string>();

  // 질병 처리: 객체 또는 문자열 모두 처리
  diseases?.forEach((disease) => {
    let code: string;
    if (typeof disease === 'string') {
      code = disease;
    } else if (disease && typeof disease === 'object' && 'code' in disease) {
      code = String(disease.code);
    } else {
      code = String(disease);
    }
    if (code) diseaseSet.add(code);
  });

  // 알레르기 처리: 객체 또는 문자열 모두 처리
  allergies?.forEach((allergy) => {
    let code: string;
    if (typeof allergy === 'string') {
      code = allergy;
    } else if (allergy && typeof allergy === 'object' && 'code' in allergy) {
      code = String(allergy.code);
    } else {
      code = String(allergy);
    }
    if (code) allergySet.add(code);
  });

  // 질병 메시지 통합 (중복 제거)
  if (diseaseSet.size > 0) {
    const diseaseLabels = Array.from(diseaseSet)
      .map(code => {
        // 직접 매핑 확인
        if (DISEASE_LABELS[code]) {
          return DISEASE_LABELS[code];
        }
        // 부분 일치로 매핑 (예: diabetes_type2 -> diabetes)
        if (code.includes('diabetes')) {
          if (code.includes('type1')) return DISEASE_LABELS.diabetes_type1 || '1형 당뇨병';
          if (code.includes('type2')) return DISEASE_LABELS.diabetes_type2 || '2형 당뇨병';
          if (code.includes('gestational')) return DISEASE_LABELS.gestational_diabetes || '임신성 당뇨병';
          return DISEASE_LABELS.diabetes || '당뇨병';
        }
        if (code.includes('hypertension') || code.includes('high_blood_pressure')) {
          return DISEASE_LABELS.hypertension || '고혈압';
        }
        if (code.includes('hyperlipidemia') || code.includes('high_cholesterol') || code.includes('dyslipidemia')) {
          return DISEASE_LABELS.hyperlipidemia || '고지혈증';
        }
        if (code.includes('kidney') || code === 'ckd' || code.includes('renal')) {
          return DISEASE_LABELS.kidney_disease || '신장질환';
        }
        if (code.includes('obesity') || code.includes('overweight')) {
          return DISEASE_LABELS.obesity || '비만';
        }
        // 매핑되지 않은 경우 코드를 한글로 변환 시도
        return code.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      })
      .filter(Boolean);
    if (diseaseLabels.length > 0) {
      notes.push(`${diseaseLabels.join(', ')} 관리`);
    }
  }

  // 알레르기 메시지 통합 (중복 제거)
  if (allergySet.size > 0) {
    const allergyLabels = Array.from(allergySet)
      .map(code => ALLERGY_LABELS[code] ?? code)
      .filter(Boolean);
    if (allergyLabels.length > 0) {
      notes.push(`${allergyLabels.join(', ')} 알레르기 관리`);
    }
  }

  console.group("[FamilyDietTabs] summary-notes");
  console.log(memberName, notes);
  console.groupEnd();

  return notes;
}

function buildHealthFlags(
  diseases?: string[] | null,
  allergies?: string[] | null,
): HealthFlag[] {
  const flags: HealthFlag[] = [];
  const diseaseSet = new Set<string>();
  const allergySet = new Set<string>();

  // 질병 처리: 객체 또는 문자열 모두 처리
  diseases?.forEach((disease) => {
    let code: string;
    if (typeof disease === 'string') {
      code = disease;
    } else if (disease && typeof disease === 'object' && 'code' in disease) {
      code = String(disease.code);
    } else {
      code = String(disease);
    }
    if (code) diseaseSet.add(code);
  });

  // 알레르기 처리: 객체 또는 문자열 모두 처리
  allergies?.forEach((allergy) => {
    let code: string;
    if (typeof allergy === 'string') {
      code = allergy;
    } else if (allergy && typeof allergy === 'object' && 'code' in allergy) {
      code = String(allergy.code);
    } else {
      code = String(allergy);
    }
    if (code) allergySet.add(code);
  });

  // 질병 플래그 생성 (중복 제거)
  diseaseSet.forEach((code) => {
    let label = DISEASE_LABELS[code];
    
    // 매핑이 없으면 부분 일치로 찾기
    if (!label) {
      if (code.includes('diabetes')) {
        if (code.includes('type1')) label = DISEASE_LABELS.diabetes_type1 || '1형 당뇨병';
        else if (code.includes('type2')) label = DISEASE_LABELS.diabetes_type2 || '2형 당뇨병';
        else if (code.includes('gestational')) label = DISEASE_LABELS.gestational_diabetes || '임신성 당뇨병';
        else label = DISEASE_LABELS.diabetes || '당뇨병';
      } else if (code.includes('hypertension') || code.includes('high_blood_pressure')) {
        label = DISEASE_LABELS.hypertension || '고혈압';
      } else if (code.includes('hyperlipidemia') || code.includes('high_cholesterol') || code.includes('dyslipidemia')) {
        label = DISEASE_LABELS.hyperlipidemia || '고지혈증';
      } else if (code.includes('kidney') || code === 'ckd' || code.includes('renal')) {
        label = DISEASE_LABELS.kidney_disease || '신장질환';
      } else if (code.includes('obesity') || code.includes('overweight')) {
        label = DISEASE_LABELS.obesity || '비만';
      } else {
        // 최후의 수단: 코드를 한글로 변환 시도
        label = code.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }
    
    flags.push({
      type: "disease",
      code,
      label,
    });
  });

  // 알레르기 플래그 생성 (중복 제거)
  allergySet.forEach((code) => {
    const label = ALLERGY_LABELS[code] ?? code;
    flags.push({
      type: "allergy",
      code,
      label,
    });
  });

  return flags;
}
