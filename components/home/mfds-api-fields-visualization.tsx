/**
 * @file mfds-api-fields-visualization.tsx
 * @description 식약처 API 필드 시각화 컴포넌트
 *
 * 주요 기능:
 * 1. 영양 정보 필드들을 차트로 시각화
 * 2. 조리 방법 필드 통계 시각화
 * 3. 이미지 필드 정보 시각화
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Section } from "@/components/section";
import { BarChart3, Image as ImageIcon, ChefHat, TrendingUp } from "lucide-react";

/**
 * 영양 정보 필드 시각화
 */
function NutritionFieldsChart() {
  const nutritionFields = [
    { name: "INFO_ENG", label: "칼로리", unit: "kcal", color: "bg-orange-500", value: 100 },
    { name: "INFO_CAR", label: "탄수화물", unit: "g", color: "bg-blue-500", value: 80 },
    { name: "INFO_PRO", label: "단백질", unit: "g", color: "bg-green-500", value: 70 },
    { name: "INFO_FAT", label: "지방", unit: "g", color: "bg-yellow-500", value: 60 },
    { name: "INFO_NA", label: "나트륨", unit: "mg", color: "bg-red-500", value: 50 },
    { name: "INFO_FIBER", label: "식이섬유", unit: "g", color: "bg-purple-500", value: 40 },
    { name: "INFO_K", label: "칼륨", unit: "mg", color: "bg-pink-500", value: 30, optional: true },
    { name: "INFO_P", label: "인", unit: "mg", color: "bg-indigo-500", value: 25, optional: true },
    { name: "INFO_GI", label: "GI 지수", unit: "", color: "bg-teal-500", value: 20, optional: true },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          <CardTitle>영양 정보 필드</CardTitle>
        </div>
        <CardDescription>식약처 API에서 제공하는 영양소 정보 필드들</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {nutritionFields.map((field) => (
            <div key={field.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{field.label}</span>
                  <span className="text-xs text-gray-500">({field.unit})</span>
                  {field.optional && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                      선택
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-gray-600">{field.name}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full ${field.color} transition-all duration-500`}
                  style={{ width: `${field.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>참고:</strong> 필수 필드(INFO_ENG, INFO_CAR, INFO_PRO, INFO_FAT, INFO_NA,
            INFO_FIBER)는 모든 레시피에 포함되며, 선택 필드(INFO_K, INFO_P, INFO_GI)는 일부
            레시피에만 제공됩니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 조리 방법 필드 시각화
 */
function ManualFieldsChart() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-green-600" />
          <CardTitle>조리 방법 필드</CardTitle>
        </div>
        <CardDescription>단계별 조리 방법 텍스트 및 이미지 필드</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <h4 className="font-semibold text-sm mb-2 text-green-900">텍스트 필드</h4>
              <div className="space-y-1">
                <p className="text-xs text-gray-600">MANUAL01 ~ MANUAL20</p>
                <p className="text-xs text-gray-500">최대 20단계 조리 방법 설명</p>
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <h4 className="font-semibold text-sm mb-2 text-blue-900">이미지 필드</h4>
              <div className="space-y-1">
                <p className="text-xs text-gray-600">MANUAL_IMG01 ~ MANUAL_IMG20</p>
                <p className="text-xs text-gray-500">각 단계별 조리 이미지 URL</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
            <div className="flex gap-1">
              {Array.from({ length: 20 }, (_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full bg-teal-500 opacity-70"
                  title={`단계 ${i + 1}`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600 ml-2">총 20단계 지원</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 이미지 필드 시각화
 */
function ImageFieldsChart() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-600" />
          <CardTitle>이미지 필드</CardTitle>
        </div>
        <CardDescription>레시피 관련 이미지 URL 필드</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <h4 className="font-semibold text-sm mb-2 text-purple-900">ATT_FILE_NO_MAIN</h4>
              <p className="text-xs text-gray-600 mb-2">대표 이미지</p>
              <div className="w-full h-24 bg-gray-200 rounded flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-2">레시피 카드 썸네일용</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
              <h4 className="font-semibold text-sm mb-2 text-indigo-900">ATT_FILE_NO_MK</h4>
              <p className="text-xs text-gray-600 mb-2">만드는 법 이미지</p>
              <div className="w-full h-24 bg-gray-200 rounded flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-2">상세 페이지 및 인쇄용</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 필드 통계 시각화
 */
function FieldsStatistics() {
  const stats = [
    { label: "총 필드 수", value: "72개", color: "text-blue-600" },
    { label: "기본 정보", value: "4개", color: "text-green-600" },
    { label: "영양 정보", value: "9개", color: "text-orange-600" },
    { label: "조리 방법", value: "40개", color: "text-purple-600" },
    { label: "이미지", value: "22개", color: "text-pink-600" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-600" />
          <CardTitle>필드 통계</CardTitle>
        </div>
        <CardDescription>식약처 API 필드 분류별 통계</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 메인 시각화 컴포넌트
 */
export function MfdsApiFieldsVisualization() {
  return (
    <Section
      id="mfds-api-fields-visualization"
      title="📊 식약처 API 필드 시각화"
      description="식약처 API에서 제공하는 필드들을 시각적으로 확인할 수 있습니다."
    >
      <div className="space-y-6">
        <FieldsStatistics />
        <NutritionFieldsChart />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ManualFieldsChart />
          <ImageFieldsChart />
        </div>
      </div>
    </Section>
  );
}

