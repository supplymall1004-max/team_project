/**
 * @file weekly-diet-summary.tsx
 * @description 주간 식단 요약 섹션 컴포넌트
 * 
 * 배달의민족 앱의 주간 식단 요약을 참고하여 구현했습니다.
 * 
 * 주요 기능:
 * 1. 이번 주 식단 요약 표시
 * 2. 7일 캘린더 미리보기 (요일, 날짜)
 * 3. 총 칼로리 표시 (실제 데이터 기반)
 * 4. "전체보기" 링크로 주간 식단 페이지로 이동
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { weeklyDietCache } from "@/lib/diet/weekly-diet-cache";

interface WeeklyNutritionStats {
  day_of_week: number; // 1=월요일, 7=일요일
  date: string; // 'YYYY-MM-DD'
  total_calories: number;
}

interface WeeklyDietSummaryData {
  exists: boolean;
  nutritionStats?: WeeklyNutritionStats[];
  weekStartDate?: string;
}

const weekDays = ["월", "화", "수", "목", "금", "토", "일"];

export function WeeklyDietSummary() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WeeklyDietSummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadWeeklyDiet = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.groupCollapsed("[WeeklyDietSummary] 주간 식단 조회");
      console.log("인증 상태 확인 중...");

      // Clerk 인증 상태 확인
      if (!isLoaded) {
        console.log("인증 상태 로딩 중...");
        return; // 아직 로딩 중
      }

      if (!user || !user.id) {
        console.warn("⚠️ 인증되지 않은 사용자");
        console.log("user 객체:", user);
        console.groupEnd();
        setError("로그인이 필요합니다");
        setData(null);
        return;
      }

      console.log("✅ 인증 완료 - 사용자 ID:", user.id);

      // 1. 캐시 확인
      const cachedData = weeklyDietCache.getCachedWeeklyDiet(user.id, 'this');
      if (cachedData) {
        console.log("✅ 캐시된 데이터 사용");
        console.log("📊 캐시된 영양 통계:", cachedData.nutritionStats);
        const totalCal = cachedData.nutritionStats.reduce(
          (sum: number, stat: any) => sum + (stat.total_calories || 0),
          0
        );
        console.log("📊 총 칼로리 (캐시):", totalCal, "kcal");

        setData({
          exists: true,
          nutritionStats: cachedData.nutritionStats,
          weekStartDate: cachedData.weekStartDate,
        });
        console.groupEnd();
        return;
      }

      console.log("⚠️ 캐시 없음 - API 호출: /api/diet/weekly/this");

      // 2. 캐시가 없으면 API 호출
      const response = await fetch("/api/diet/weekly/this", {
        next: { revalidate: 60 }, // 60초마다 재검증
        cache: "force-cache", // 캐시 우선 사용
      });

      if (!response.ok) {
        // 404는 주간 식단이 없는 정상 케이스
        if (response.status === 404) {
          console.log("⚠️ 주간 식단 없음 (정상 케이스)");
          console.groupEnd();
          setData({ exists: false });
          return;
        }

        // 401은 인증 실패
        if (response.status === 401) {
          console.error("❌ 인증 실패 - 로그인 상태를 확인해주세요");
          console.groupEnd();
          setError("인증이 만료되었습니다. 다시 로그인해주세요");
          setData(null);
          return;
        }

        // 기타 서버 오류
        const errorText = await response.text();
        console.error("❌ 주간 식단 조회 실패:", response.status, errorText);
        console.groupEnd();

        let errorMessage = "주간 식단을 불러오는 데 실패했습니다";
        if (response.status === 500) {
          errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요";
        } else if (response.status >= 400 && response.status < 500) {
          errorMessage = "요청에 문제가 있습니다. 페이지를 새로고침해주세요";
        }

        setError(errorMessage);
        setData(null);
        return;
      }

      const responseData = await response.json();
      console.log("✅ API 응답 데이터:", responseData);

      if (responseData.exists && responseData.nutritionStats) {
        // 영양 통계 검증 및 로깅
        console.log("📊 영양 통계:", responseData.nutritionStats);
        const totalCal = responseData.nutritionStats.reduce(
          (sum: number, stat: any) => sum + (stat.total_calories || 0),
          0
        );
        console.log("📊 총 칼로리 (API):", totalCal, "kcal");
        console.log("📊 일별 칼로리:", responseData.nutritionStats.map((s: any) => ({
          날짜: s.date,
          요일: weekDays[s.day_of_week - 1] || "?",
          칼로리: s.total_calories || 0
        })));

        const summaryData = {
          exists: true,
          nutritionStats: responseData.nutritionStats,
          weekStartDate: responseData.weekStartDate,
        };

        // 캐시에 저장
        weeklyDietCache.setCachedWeeklyDiet(user.id, 'this', {
          metadata: responseData.metadata,
          dailyPlans: responseData.dailyPlans || [],
          shoppingList: responseData.shoppingList || [],
          nutritionStats: responseData.nutritionStats,
          weekStartDate: responseData.weekStartDate || "",
        });

        setData(summaryData);
      } else {
        setData({ exists: false });
      }

      console.groupEnd();
    } catch (err: any) {
      console.error("❌ 주간 식단 조회 실패:", err);
      console.error("❌ 오류 타입:", err?.constructor?.name);
      console.error("❌ 오류 스택:", err?.stack);
      console.groupEnd();

      let errorMessage = "알 수 없는 오류가 발생했습니다";
      if (err?.message?.includes("fetch")) {
        errorMessage = "네트워크 연결을 확인해주세요";
      } else if (err?.message) {
        errorMessage = `오류: ${err.message}`;
      }

      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      loadWeeklyDiet();
    }
  }, [isLoaded, loadWeeklyDiet]);

  // 총 칼로리 계산 (모든 날짜의 칼로리 합산)
  const totalCalories = data?.nutritionStats?.reduce(
    (sum, stat) => {
      if (!stat) return sum;
      const calories = typeof stat.total_calories === 'number' 
        ? stat.total_calories 
        : Number(stat.total_calories) || 0;
      return sum + calories;
    },
    0
  ) || 0;

  // 디버깅: 총 칼로리 로그 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development' && data?.nutritionStats && data.nutritionStats.length > 0) {
    console.log(`[WeeklyDietSummary] 총 칼로리: ${totalCalories.toLocaleString()}kcal (${data.nutritionStats.length}일)`);
    console.log(`[WeeklyDietSummary] 일별 칼로리:`, data.nutritionStats.map(s => ({
      날짜: s.date,
      요일: weekDays[s.day_of_week - 1] || "?",
      칼로리: s.total_calories || 0
    })));
  }

  // 인증이 로딩 중이거나 실패한 경우
  if (!isLoaded || (isLoaded && !user)) {
    return (
      <section className="px-4 py-6 sm:px-6 sm:py-8 bg-gradient-to-r from-teal-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">
                {!isLoaded ? "로딩 중..." : "로그인이 필요합니다"}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 주간 식단이 없으면 섹션 숨김
  if (!loading && (!data || !data.exists)) {
    return null;
  }

  // 7일 날짜 배열 생성 (이번 주 월요일부터)
  const getWeekDates = (): string[] => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=일요일, 1=월요일, ...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  const weekDates = data?.weekStartDate
    ? (() => {
        const start = new Date(data.weekStartDate);
        const dates: string[] = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          dates.push(date.toISOString().split("T")[0]);
        }
        return dates;
      })()
    : getWeekDates();

  return (
    <section className="px-4 py-6 sm:px-6 sm:py-8 bg-gradient-to-r from-teal-50 to-blue-50">
      <div className="max-w-6xl mx-auto">
        {/* 섹션 헤더 */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" aria-hidden="true" />
            <h2 className="text-lg font-bold text-gray-900">이번 주 식단 요약</h2>
          </div>
          <Link
            href="/diet/weekly"
            className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded"
            onClick={() => {
              console.groupCollapsed("[WeeklyDietSummary] 전체보기 클릭");
              console.log("href: /diet/weekly");
              console.log("timestamp:", Date.now());
              console.groupEnd();
            }}
            aria-label="주간 식단 전체보기 페이지로 이동"
          >
            전체보기
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">로딩 중...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-red-500">{error}</div>
            </div>
          ) : (
            <>
              {/* 7일 캘린더 미리보기 */}
              <div className="grid grid-cols-7 gap-2 sm:gap-4 mb-6">
                {weekDates.map((date, index) => {
                  const stat = data?.nutritionStats?.find(
                    (s) => s && s.date === date
                  );
                  const dateObj = new Date(date);
                  // 유효한 날짜인지 확인
                  const dayOfMonth = isNaN(dateObj.getTime()) ? 0 : dateObj.getDate();
                  const calories = stat?.total_calories || 0;
                  const hasData = !!stat && calories > 0;

                  return (
                    <div
                      key={date}
                      className="flex flex-col items-center gap-1 sm:gap-2"
                    >
                      {/* 요일 */}
                      <div className="text-xs sm:text-sm font-medium text-gray-600">
                        {weekDays[index]}
                      </div>

                      {/* 날짜 원형 배경 */}
                      <div
                        className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center",
                          "text-sm sm:text-base font-semibold",
                          hasData
                            ? "bg-teal-100 text-teal-700"
                            : "bg-gray-100 text-gray-400"
                        )}
                      >
                        {dayOfMonth}
                      </div>

                      {/* 칼로리 표시 (작은 텍스트) */}
                      {hasData && stat && (
                        <div className="text-xs text-gray-500">
                          {(stat.total_calories || 0).toLocaleString()}kcal
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 총 칼로리 표시 */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-sm sm:text-base font-medium text-gray-700">
                  총 칼로리
                </span>
                <span className="text-lg sm:text-xl font-bold text-teal-600">
                  {totalCalories.toLocaleString()} kcal
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

