/**
 * @file components/health/diet/meal-records-tab.tsx
 * @description 식단 기록 탭 컴포넌트
 *
 * 식사 사진 업로드, 식단 비교, 주간 분석을 통합한 탭
 * 사용자가 한 곳에서 모든 식사 관련 기능을 사용할 수 있도록 구성
 */

"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, TrendingUp, BarChart3, Calendar } from "lucide-react";
import { MealPhotoUpload } from "./meal-photo-upload";
import { DietComparison } from "./diet-comparison";
import { WeeklyNutritionReport } from "./weekly-nutrition-report";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

/**
 * 주차 시작일 계산 (월요일)
 */
function getWeekStartDate(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 월요일로 조정
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}

export function MealRecordsTab() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateString = selectedDate.toISOString().split("T")[0];
  const weekStartDate = getWeekStartDate(selectedDate);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold mb-2">📸 식사 기록 & 분석</h2>
        <p className="text-muted-foreground">
          식사 사진을 업로드하고 실제 섭취 영양소를 추적해보세요
        </p>
      </div>

      {/* 메인 탭 */}
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">사진 업로드</span>
            <span className="sm:hidden">업로드</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">식단 비교</span>
            <span className="sm:hidden">비교</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">주간 분석</span>
            <span className="sm:hidden">분석</span>
          </TabsTrigger>
        </TabsList>

        {/* 사진 업로드 탭 */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                날짜 선택
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input
                type="date"
                value={dateString}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MealPhotoUpload
              date={dateString}
              mealType="breakfast"
              onAnalysisComplete={() => {
                // 분석 완료 후 자동으로 식단 비교 탭으로 이동하거나 새로고침
                console.log("아침 식사 분석 완료");
              }}
            />
            <MealPhotoUpload
              date={dateString}
              mealType="lunch"
              onAnalysisComplete={() => {
                console.log("점심 식사 분석 완료");
              }}
            />
            <MealPhotoUpload
              date={dateString}
              mealType="dinner"
              onAnalysisComplete={() => {
                console.log("저녁 식사 분석 완료");
              }}
            />
            <MealPhotoUpload
              date={dateString}
              mealType="snack"
              onAnalysisComplete={() => {
                console.log("간식 분석 완료");
              }}
            />
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">사용 팁</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 식사 전에 사진을 찍으면 더 정확한 분석이 가능해요</li>
                    <li>• 여러 음식이 보이도록 사진을 찍어주세요</li>
                    <li>• 분석 후 "식단 비교" 탭에서 추천 식단과 비교해보세요</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 식단 비교 탭 */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                날짜 선택
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input
                type="date"
                value={dateString}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </CardContent>
          </Card>

          <DietComparison date={dateString} />
        </TabsContent>

        {/* 주간 분석 탭 */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                주차 선택
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input
                type="date"
                value={weekStartDate}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  setSelectedDate(newDate);
                }}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <p className="text-sm text-muted-foreground mt-2">
                주차의 월요일 날짜를 선택하세요
              </p>
            </CardContent>
          </Card>

          <WeeklyNutritionReport weekStartDate={weekStartDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

