/**
 * @file components/health/diet/weekly-nutrition-report.tsx
 * @description 일주일간 영양소 분석 리포트
 *
 * 일주일간 실제 섭취 식단을 분석하여 부족한 영양소를 알려줍니다.
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { analyzeWeeklyNutrition } from "@/lib/health/weekly-nutrition-analysis";
import { getHealthProfile } from "@/actions/health/profile";
import { useUser } from "@clerk/nextjs";

interface WeeklyNutritionReportProps {
  weekStartDate: string; // 'YYYY-MM-DD' (월요일)
}

export function WeeklyNutritionReport({
  weekStartDate,
}: WeeklyNutritionReportProps) {
  const { user } = useUser();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadAnalysis = async () => {
      try {
        // 건강 프로필 조회 (Server Action)
        const healthProfile = await getHealthProfile();
        if (!healthProfile) {
          setLoading(false);
          return;
        }

        // 일주일간 영양소 분석 (로컬 스토리지 사용)
        const result = await analyzeWeeklyNutrition(
          user.id,
          weekStartDate,
          healthProfile
        );

        setAnalysis(result);
      } catch (error) {
        console.error("[WeeklyNutritionReport] 분석 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [user, weekStartDate]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">분석 중...</div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            분석할 데이터가 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          일주일간 영양소 분석
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 부족한 영양소 */}
        {analysis.deficiencies.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-semibold">부족한 영양소</h3>
            </div>
            <div className="space-y-2">
              {analysis.deficiencies.map((def: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-700">{def.name}</p>
                    <p className="text-sm text-gray-600">
                      목표: {Math.round(def.recommended)} | 실제:{" "}
                      {Math.round(def.actual)} | 부족:{" "}
                      {Math.round(def.deficiency)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-orange-600">
                    {def.percentage}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 초과한 영양소 */}
        {analysis.excesses.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-semibold">초과한 영양소</h3>
            </div>
            <div className="space-y-2">
              {analysis.excesses.map((exc: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-700">{exc.name}</p>
                    <p className="text-sm text-gray-600">
                      목표: {Math.round(exc.recommended)} | 실제:{" "}
                      {Math.round(exc.actual)} | 초과: {Math.round(exc.excess)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-red-600">
                    {exc.percentage}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 권장사항 */}
        {analysis.recommendations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-600">
              <CheckCircle2 className="h-5 w-5" />
              <h3 className="font-semibold">개선 권장사항</h3>
            </div>
            <div className="space-y-2">
              {analysis.recommendations.map((rec: string, index: number) => (
                <div
                  key={index}
                  className="p-3 bg-blue-50 rounded-lg text-sm text-gray-700"
                >
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 모든 영양소가 적정 범위인 경우 */}
        {analysis.deficiencies.length === 0 &&
          analysis.excesses.length === 0 && (
            <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-green-700 font-medium">
                일주일간 영양소 섭취가 목표에 잘 맞습니다!
              </p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}

