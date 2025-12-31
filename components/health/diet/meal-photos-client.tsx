/**
 * @file components/health/diet/meal-photos-client.tsx
 * @description 식사 사진 관리 클라이언트 컴포넌트
 */

"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MealPhotoUpload } from "./meal-photo-upload";
import { DietComparison } from "./diet-comparison";
import { WeeklyNutritionReport } from "./weekly-nutrition-report";
import { getMealPhotosByDate } from "@/lib/storage/meal-photo-storage";
import { useUser } from "@clerk/nextjs";

export function MealPhotosClient() {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [photos, setPhotos] = useState<any[]>([]);

  // 날짜를 YYYY-MM-DD 형식으로 변환
  const dateString = selectedDate.toISOString().split("T")[0];
  const weekStartDate = getWeekStartDate(selectedDate);

  useEffect(() => {
    if (!user) return;

    const loadPhotos = async () => {
      const loadedPhotos = await getMealPhotosByDate(user.id, dateString);
      setPhotos(loadedPhotos);
    };

    loadPhotos();
  }, [user, dateString]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">사진 업로드</TabsTrigger>
          <TabsTrigger value="comparison">식단 비교</TabsTrigger>
          <TabsTrigger value="analysis">주간 분석</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">날짜 선택</h3>
                <Calendar
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                    }
                  }}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <MealPhotoUpload
                date={dateString}
                mealType="breakfast"
                onAnalysisComplete={() => {
                  // 사진 목록 새로고침
                  if (user) {
                    getMealPhotosByDate(user.id, dateString).then(setPhotos);
                  }
                }}
              />
              <MealPhotoUpload
                date={dateString}
                mealType="lunch"
                onAnalysisComplete={() => {
                  if (user) {
                    getMealPhotosByDate(user.id, dateString).then(setPhotos);
                  }
                }}
              />
              <MealPhotoUpload
                date={dateString}
                mealType="dinner"
                onAnalysisComplete={() => {
                  if (user) {
                    getMealPhotosByDate(user.id, dateString).then(setPhotos);
                  }
                }}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          <DietComparison date={dateString} />
        </TabsContent>

        <TabsContent value="analysis">
          <WeeklyNutritionReport weekStartDate={weekStartDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

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

