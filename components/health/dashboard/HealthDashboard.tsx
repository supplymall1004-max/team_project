/**
 * @file components/health/dashboard/HealthDashboard.tsx
 * @description 통합 건강 대시보드 컴포넌트
 *
 * 모든 건강 정보를 한 화면에서 확인할 수 있는 통합 대시보드입니다.
 * 여러 Dashboard 컴포넌트를 통합하여 하나의 진입점을 제공합니다.
 *
 * 주요 기능:
 * 1. 개인 건강 요약 (HealthSummaryCard)
 * 2. 가족 건강 개요 (FamilyHealthOverview)
 * 3. 건강 알림 목록 (HealthAlertsList)
 * 4. 건강 시각화 (HealthDashboard from visualization)
 *
 * @dependencies
 * - @/components/health/dashboard/HealthSummaryCard
 * - @/components/health/dashboard/HealthAlertsList
 * - @/components/health/family-health-overview
 * - @/components/health/visualization/HealthDashboard
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Heart, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HealthSummaryCard } from "./HealthSummaryCard";
import { HealthAlertsList } from "./HealthAlertsList";
import { FamilyHealthOverview } from "@/components/health/family-health-overview";
import { HealthDashboard as VisualizationDashboard } from "@/components/health/visualization/HealthDashboard";
import type {
  HealthDashboardProps,
  HealthSummary,
  HealthAlert,
  FamilyMemberHealthSummary,
} from "./types";
import { LoadingSpinner } from "@/components/loading-spinner";
import { getHealthProfile } from "@/actions/health/profile";
import { getDashboardSummary } from "@/actions/health/dashboard";

/**
 * 건강 점수에 따른 상태 반환
 */
function getHealthStatus(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score >= 80) {
    return { label: "우수", color: "text-green-600", bgColor: "bg-green-50" };
  } else if (score >= 60) {
    return { label: "양호", color: "text-blue-600", bgColor: "bg-blue-50" };
  } else if (score >= 40) {
    return { label: "보통", color: "text-yellow-600", bgColor: "bg-yellow-50" };
  } else {
    return { label: "주의", color: "text-red-600", bgColor: "bg-red-50" };
  }
}

/**
 * 통합 건강 대시보드 컴포넌트
 */
export function HealthDashboard({
  mode = "integrated",
  userId,
  className,
  showFamilyOverview = true,
  showAlerts = true,
  showVisualization = false,
}: HealthDashboardProps) {
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [familyMembers, setFamilyMembers] = useState<
    FamilyMemberHealthSummary[]
  >([]);
  const [overallHealthScore, setOverallHealthScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // 대시보드 데이터 조회
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.group("[HealthDashboard] 대시보드 데이터 조회");

        // 개인 건강 요약 조회
        if (mode === "summary" || mode === "integrated") {
          try {
            const profile = await getHealthProfile();

            if (profile) {

              // BMI 계산
              let bmi = null;
              if (profile?.height_cm && profile?.weight_kg) {
                const heightM = profile.height_cm / 100;
                bmi =
                  Math.round((profile.weight_kg / (heightM * heightM)) * 10) /
                  10;
              }

              // 건강 점수 계산
              let healthScore = 50;
              if (profile) {
                if (profile.daily_calorie_goal > 0) healthScore += 10;
                if (
                  profile.activity_level &&
                  profile.activity_level !== "sedentary"
                )
                  healthScore += 15;
                if (profile.height_cm && profile.weight_kg) healthScore += 10;
                if (profile.diseases?.length === 0) healthScore += 15;
              }
              healthScore = Math.min(100, Math.max(0, healthScore));

              const mockSummary: HealthSummary = {
                profile,
                recentHospitalVisits: 1,
                activeMedications: 2,
                upcomingVaccinations: 2,
                lastHealthCheckup: "2024-01-15",
                healthScore,
                bmi,
                recommendations: [
                  "주 3회 이상 유산소 운동을 권장합니다",
                  "수분 섭취를 늘려보세요 (하루 2L 이상)",
                  "채소와 단백질 위주의 식단을 유지하세요",
                  "정기적인 건강검진을 받으세요",
                ],
              };

              setSummary(mockSummary);
            }
          } catch (error) {
            console.error("건강 요약 데이터 조회 실패:", error);
          }
        }

        // 통합 대시보드 데이터 조회
        if (mode === "integrated" || mode === "family") {
          try {
            const summary = await getDashboardSummary();
            console.log("✅ 대시보드 데이터 조회 완료:", summary);
            setFamilyMembers(summary.familyMembers || []);
            setAlerts(summary.alerts || []);
            setOverallHealthScore(summary.overallHealthScore || 0);
          } catch (error) {
            console.error("통합 대시보드 데이터 조회 실패:", error);
          }
        }

        console.groupEnd();
      } catch (error) {
        console.error("❌ 대시보드 데이터 조회 실패:", error);
        console.groupEnd();
        toast({
          title: "데이터 조회 실패",
          description:
            error instanceof Error
              ? error.message
              : "건강 대시보드 정보를 불러오는데 실패했습니다.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [mode, toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 모드별 렌더링
  if (mode === "summary") {
    if (!summary) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              건강 정보를 불러올 수 없습니다
            </h3>
            <p className="text-gray-600 mb-4">
              건강 프로필을 먼저 설정해주세요.
            </p>
          </CardContent>
        </Card>
      );
    }

    return <HealthSummaryCard summary={summary} className={className} />;
  }

  if (mode === "visualization") {
    return (
      <HealthVisualizationDashboard userId={userId} className={className} />
    );
  }

  // 통합 모드 (기본)
  const overallStatus = getHealthStatus(overallHealthScore);

  return (
    <div className={`space-y-6 ${className || ""}`}>
      {/* 전체 건강 점수 */}
      {(mode === "integrated" || mode === "family") && overallHealthScore > 0 && (
        <Card className={`${overallStatus.bgColor} border-2`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className={`h-6 w-6 ${overallStatus.color}`} />
              <h2 className="text-2xl font-bold">전체 건강 점수</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="text-5xl font-bold">{overallHealthScore}</div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {overallStatus.label}
                </Badge>
              </div>
              <Progress value={overallHealthScore} className="h-3" />
              <p className="text-sm text-muted-foreground">
                가족 구성원 {familyMembers.length}명의 평균 건강 점수입니다.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 탭 네비게이션 */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">건강 개요</TabsTrigger>
          {showFamilyOverview && (
            <TabsTrigger value="family">가족 건강</TabsTrigger>
          )}
          {showAlerts && <TabsTrigger value="alerts">건강 알림</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* 개인 건강 요약 */}
          {summary && <HealthSummaryCard summary={summary} />}

          {/* 건강 시각화 */}
          {showVisualization && (
            <div className="mt-6">
              <h3 className="text-xl font-bold mb-4">건강 시각화</h3>
              <VisualizationDashboard userId={userId} />
            </div>
          )}
        </TabsContent>

        {showFamilyOverview && (
          <TabsContent value="family" className="space-y-4">
            <FamilyHealthOverview />
          </TabsContent>
        )}

        {showAlerts && (
          <TabsContent value="alerts" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6" />
                건강 알림
              </h2>
              <HealthAlertsList alerts={alerts} />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
