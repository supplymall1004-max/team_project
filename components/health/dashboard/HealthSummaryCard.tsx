/**
 * @file components/health/dashboard/HealthSummaryCard.tsx
 * @description 건강 요약 카드 컴포넌트
 *
 * 개인 건강 정보를 요약하여 표시하는 카드입니다.
 * health-summary-dashboard.tsx에서 추출한 핵심 기능입니다.
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Activity,
  Thermometer,
  Weight,
  Ruler,
  Pill,
  Stethoscope,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";
import type { HealthSummary } from "./types";

interface HealthSummaryCardProps {
  summary: HealthSummary;
  className?: string;
}

/**
 * 건강 요약 카드 컴포넌트
 */
export function HealthSummaryCard({ summary, className }: HealthSummaryCardProps) {
  const { profile, healthScore, bmi, recommendations } = summary;

  return (
    <div className={`space-y-6 ${className || ""}`}>
      {/* 건강 점수 및 기본 정보 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">건강 점수</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthScore}</div>
            <Progress value={healthScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {healthScore >= 80
                ? "매우 건강함"
                : healthScore >= 60
                  ? "건강함"
                  : healthScore >= 40
                    ? "보통"
                    : "관리가 필요함"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BMI</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bmi ? `${bmi}` : "측정 필요"}
            </div>
            <p className="text-xs text-muted-foreground">
              {bmi
                ? bmi < 18.5
                  ? "저체중"
                  : bmi < 23
                    ? "정상"
                    : bmi < 25
                      ? "과체중"
                      : bmi < 30
                        ? "비만"
                        : "고도비만"
                : "키와 체중을 입력해주세요"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">칼로리 목표</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profile?.daily_calorie_goal || 0}
            </div>
            <p className="text-xs text-muted-foreground">kcal/일</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활동 수준</CardTitle>
            <Zap className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {profile?.activity_level === "sedentary"
                ? "거의 없음"
                : profile?.activity_level === "light"
                  ? "가벼움"
                  : profile?.activity_level === "moderate"
                    ? "보통"
                    : profile?.activity_level === "active"
                      ? "활발함"
                      : profile?.activity_level === "very_active"
                        ? "매우 활발함"
                        : "설정 필요"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 건강 기록 요약 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최근 병원 방문</CardTitle>
            <Stethoscope className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.recentHospitalVisits}</div>
            <p className="text-xs text-muted-foreground">최근 3개월</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">복용 중인 약물</CardTitle>
            <Pill className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeMedications}</div>
            <p className="text-xs text-muted-foreground">현재 복용 중</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">예방주사 일정</CardTitle>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.upcomingVaccinations}</div>
            <p className="text-xs text-muted-foreground">다가오는 일정</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">마지막 건강검진</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {summary.lastHealthCheckup
                ? new Date(summary.lastHealthCheckup).toLocaleDateString("ko-KR")
                : "검진 필요"}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.lastHealthCheckup
                ? `${Math.floor(
                    (Date.now() - new Date(summary.lastHealthCheckup).getTime()) /
                      (1000 * 60 * 60 * 24),
                  )}일 전`
                : "정기 검진을 권장합니다"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 건강 프로필 상세 및 권장사항 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 건강 프로필 상세 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              건강 프로필 상세
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">나이:</span>
                <span className="ml-2">{profile?.age || "미설정"}세</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">성별:</span>
                <span className="ml-2">
                  {profile?.gender === "male"
                    ? "남성"
                    : profile?.gender === "female"
                      ? "여성"
                      : profile?.gender === "other"
                        ? "기타"
                        : "미설정"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">키:</span>
                <span className="ml-2">
                  {profile?.height_cm ? `${profile.height_cm}cm` : "미설정"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">체중:</span>
                <span className="ml-2">
                  {profile?.weight_kg ? `${profile.weight_kg}kg` : "미설정"}
                </span>
              </div>
            </div>

            {profile?.diseases && profile.diseases.length > 0 && (
              <div>
                <span className="font-medium text-gray-700 text-sm">질병:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.diseases.map((disease, index) => {
                    // diseases는 문자열 배열이거나 객체 배열일 수 있음
                    let diseaseName: string;
                    if (typeof disease === "string") {
                      diseaseName = disease;
                    } else if (disease && typeof disease === "object") {
                      diseaseName =
                        (disease as { custom_name?: string | null; code?: string })
                          ?.custom_name ||
                        (disease as { custom_name?: string | null; code?: string })
                          ?.code ||
                        "알 수 없음";
                    } else {
                      diseaseName = "알 수 없음";
                    }
                    return (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {diseaseName}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {profile?.allergies && profile.allergies.length > 0 && (
              <div>
                <span className="font-medium text-gray-700 text-sm">알레르기:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.allergies.map((allergy, index) => {
                    // allergies는 문자열 배열이거나 객체 배열일 수 있음
                    let allergyName: string;
                    if (typeof allergy === "string") {
                      allergyName = allergy;
                    } else if (allergy && typeof allergy === "object") {
                      allergyName =
                        (allergy as { custom_name?: string | null; code?: string })
                          ?.custom_name ||
                        (allergy as { custom_name?: string | null; code?: string })
                          ?.code ||
                        "알 수 없음";
                    } else {
                      allergyName = "알 수 없음";
                    }
                    return (
                      <Badge key={index} variant="outline" className="text-xs">
                        {allergyName}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button size="sm" variant="outline" asChild>
                <Link href="/health/profile">프로필 수정</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 건강 권장사항 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              건강 권장사항
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <Button size="sm" asChild>
                <Link href="/health/profile">더 자세히 보기</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
