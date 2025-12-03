/**
 * @file app/(dashboard)/diet/weekly/page.tsx
 * @description 주간 식단 페이지
 * 
 * 기능:
 * - 주간 식단 생성
 * - 주간 식단 캘린더 뷰
 * - 장보기 리스트
 * - 영양 통계 차트
 */

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { WeeklyDietClient } from "./weekly-diet-client";

export default async function WeeklyDietPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">주간 식단</h1>
          <p className="text-muted-foreground mt-2">
            7일간의 식단을 한눈에 확인하고, 장보기 리스트를 관리하세요
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingState />}>
        <WeeklyDietClient />
      </Suspense>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
      <div className="grid grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
























