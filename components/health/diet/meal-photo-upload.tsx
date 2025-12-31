/**
 * @file components/health/diet/meal-photo-upload.tsx
 * @description 식사 사진 업로드 컴포넌트
 *
 * 거부감 없는 자연스러운 UI/UX로 식사 사진을 업로드하고 분석합니다.
 */

"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { analyzeMealPhotoAction } from "@/actions/health/analyze-meal-photo";
import {
  saveMealPhoto,
  updateMealPhotoAnalysis,
  fileToBase64,
  type MealPhotoAnalysis,
} from "@/lib/storage/meal-photo-storage";
import { saveActualDietRecord } from "@/lib/storage/actual-diet-storage";
import { useUser } from "@clerk/nextjs";

interface MealPhotoUploadProps {
  date: string; // 'YYYY-MM-DD'
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  onAnalysisComplete?: (analysis: MealPhotoAnalysis) => void;
}

export function MealPhotoUpload({
  date,
  mealType,
  onAnalysisComplete,
}: MealPhotoUploadProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MealPhotoAnalysis | null>(null);

  const mealTypeLabels = {
    breakfast: "아침",
    lunch: "점심",
    dinner: "저녁",
    snack: "간식",
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "파일 크기 초과",
        description: "5MB 이하의 이미지만 업로드 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    // 이미지 파일 검증
    if (!file.type.startsWith("image/")) {
      toast({
        title: "잘못된 파일 형식",
        description: "이미지 파일만 업로드 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !user) return;

    setIsAnalyzing(true);

    try {
      // 1. 이미지를 Base64로 변환
      const imageBase64 = await fileToBase64(selectedFile);

      // 2. 서버에서 AI 분석 수행
      const result = await analyzeMealPhotoAction(
        imageBase64,
        date,
        mealType
      );

      if (!result.success || !result.analysis) {
        throw new Error(result.error || "분석 실패");
      }

      // 3. 로컬 스토리지에 사진 저장
      const photoId = await saveMealPhoto(
        user.id,
        date,
        mealType,
        selectedFile
      );

      // 4. 분석 결과 업데이트
      await updateMealPhotoAnalysis(photoId, result.analysis);

      // 5. 실제 섭취 식단 기록 저장
      await saveActualDietRecord(
        user.id,
        date,
        mealType,
        result.analysis.foods.map((food) => ({
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          sodium: food.sodium,
        })),
        photoId,
        "photo_analysis"
      );

      setAnalysisResult(result.analysis);

      toast({
        title: "분석 완료",
        description: `${result.analysis.foods.length}개의 음식을 인식했습니다.`,
      });

      onAnalysisComplete?.(result.analysis);
    } catch (error) {
      console.error("[MealPhotoUpload] 분석 실패:", error);
      toast({
        title: "분석 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {mealTypeLabels[mealType]} 식사 사진
            </h3>
            {selectedFile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-gray-500"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {!preview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id={`meal-photo-${mealType}`}
              />
              <label
                htmlFor={`meal-photo-${mealType}`}
                className="cursor-pointer flex flex-col items-center justify-center space-y-4"
              >
                <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    사진을 찍어주세요
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    또는 클릭하여 선택
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border">
                <img
                  src={preview}
                  alt="식사 사진"
                  className="w-full h-64 object-cover"
                />
              </div>

              {!analysisResult ? (
                <div className="space-y-3">
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        AI가 음식을 분석하고 있어요...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        영양소 분석하기
                      </>
                    )}
                  </Button>
                  {isAnalyzing && (
                    <p className="text-xs text-center text-gray-500">
                      잠시만 기다려주세요. 사진을 분석 중입니다.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">분석 완료</span>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4 space-y-3 border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <p className="text-sm font-semibold text-gray-800">
                        분석 완료! {analysisResult.foods.length}개의 음식을 인식했어요
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.foods.map((food, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-white text-gray-700 hover:bg-gray-100"
                        >
                          {food.name}
                        </Badge>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-green-200">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">칼로리: </span>
                          <span className="font-semibold text-gray-800">
                            {analysisResult.totalNutrition.calories}kcal
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">단백질: </span>
                          <span className="font-semibold text-gray-800">
                            {analysisResult.totalNutrition.protein}g
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">탄수화물: </span>
                          <span className="font-semibold text-gray-800">
                            {analysisResult.totalNutrition.carbs}g
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">지방: </span>
                          <span className="font-semibold text-gray-800">
                            {analysisResult.totalNutrition.fat}g
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

