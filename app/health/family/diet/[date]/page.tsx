/**
 * @file app/health/family/diet/[date]/page.tsx
 * @description 가족 맞춤 식단 표시 페이지
 *
 * 이 페이지는 특정 날짜의 가족 식단을 표시합니다.
 * - 개인별 식단과 통합 식단을 탭으로 전환하여 보여줍니다.
 * - 각 구성원의 건강 정보와 식단을 함께 표시합니다.
 *
 * @dependencies
 * - FamilyDietView 컴포넌트
 * - 가족 구성원 정보 조회
 * - 식단 데이터 조회
 */

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { FamilyDietView } from "@/components/family/family-diet-view";
import type { FamilyMember } from "@/types/family";

interface PageProps {
  params: Promise<{ date: string }>;
}

export default async function FamilyDietPage({ params }: PageProps) {
  console.group("📅 가족 식단 페이지 로딩");

  const { date } = await params;
  console.log("조회 날짜:", date);

  try {
    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              인증이 필요합니다
            </h1>
            <p className="text-gray-600">
              로그인 후 이용해주세요.
            </p>
          </div>
        </div>
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 사용자의 Supabase user_id 조회
    const { data: userData } = await supabase
      .from("users")
      .select("id, name")
      .eq("clerk_id", userId)
      .single();

    if (!userData) {
      console.error("❌ 사용자 정보 없음");
      console.groupEnd();
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              사용자 정보를 찾을 수 없습니다
            </h1>
          </div>
        </div>
      );
    }

    // 가족 구성원 조회
    const { data: familyMembers } = await supabase
      .from("family_members")
      .select("*")
      .eq("user_id", userData.id)
      .order("created_at", { ascending: true });

    console.log(`✅ ${familyMembers?.length || 0}명의 가족 구성원 조회`);

    console.groupEnd();

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            가족 맞춤 식단
          </h1>
          <p className="text-lg text-gray-600">
            {new Date(date).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-600">식단을 불러오는 중...</span>
          </div>
        }>
          <FamilyDietView
            targetDate={date}
            userName={userData.name || "사용자"}
            familyMembers={familyMembers || []}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error("❌ 페이지 로딩 오류:", error);
    console.groupEnd();

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            오류가 발생했습니다
          </h1>
          <p className="text-gray-600">
            잠시 후 다시 시도해주세요.
          </p>
        </div>
      </div>
    );
  }
}

export const metadata = {
  title: "가족 맞춤 식단 | 맛의 아카이브",
  description: "가족 구성원별 맞춤 식단과 통합 식단을 확인하세요.",
};
