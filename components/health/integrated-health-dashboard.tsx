/**
 * @file components/health/integrated-health-dashboard.tsx
 * @description 통합 건강 대시보드 컴포넌트
 *
 * 모든 건강 정보를 한 화면에서 확인할 수 있는 통합 대시보드입니다:
 * - 가족 구성원별 건강 상태 요약 카드
 * - 건강 알림 통합 표시 (예방접종, 건강검진, 약물 복용, 독감 경보)
 * - 건강 트렌드 차트
 * - 전체 건강 점수
 *
 * @dependencies
 * - @/components/ui/card: 카드 컴포넌트
 * - @/components/ui/badge: 배지 컴포넌트
 * - @/components/ui/progress: 진행률 컴포넌트
 * - @/hooks/use-toast: 토스트 알림
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Heart,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Pill,
  Stethoscope,
  Calendar,
  TrendingUp,
  Activity,
  Bell,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

/**
 * 가족 구성원 건강 요약
 */
interface FamilyMemberHealthSummary {
  id: string;
  name: string;
  relationship?: string | null;
  healthScore: number;
  recentCheckup: {
    date: string | null;
    hasAbnormalResults: boolean;
  } | null;
  activeMedications: number;
  upcomingVaccinations: number;
  upcomingCheckups: number;
}

/**
 * 건강 알림
 */
interface HealthAlert {
  id: string;
  type: "vaccination" | "checkup" | "medication" | "flu_alert";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  dueDate: string | null;
  familyMemberId: string | null;
  familyMemberName: string | null;
}

/**
 * 대시보드 데이터
 */
interface DashboardData {
  familyMembers: FamilyMemberHealthSummary[];
  alerts: HealthAlert[];
  trends: {
    [familyMemberId: string]: Array<{
      date: string;
      weight?: number | null;
      bloodPressure?: {
        systolic: number;
        diastolic: number;
      } | null;
      bloodSugar?: number | null;
    }>;
  };
  overallHealthScore: number;
}

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
 * 알림 우선순위에 따른 아이콘 및 색상
 */
function getAlertIcon(type: HealthAlert["type"]) {
  switch (type) {
    case "vaccination":
      return { icon: Stethoscope, color: "text-blue-600" };
    case "checkup":
      return { icon: Calendar, color: "text-green-600" };
    case "medication":
      return { icon: Pill, color: "text-purple-600" };
    case "flu_alert":
      return { icon: AlertTriangle, color: "text-orange-600" };
    default:
      return { icon: Bell, color: "text-gray-600" };
  }
}

/**
 * 날짜 포맷팅
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return "날짜 없음";
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * 날짜까지 남은 일수 계산
 */
function getDaysUntil(dateString: string | null): number | null {
  if (!dateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function IntegratedHealthDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // 대시보드 데이터 조회
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.group("[IntegratedHealthDashboard] 대시보드 데이터 조회");

        const response = await fetch("/api/health/dashboard/summary");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "대시보드 데이터 조회 실패");
        }

        console.log("✅ 대시보드 데이터 조회 완료:", result.data);
        setDashboardData(result.data);
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
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
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

  if (!dashboardData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">대시보드 데이터를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const { familyMembers, alerts, overallHealthScore } = dashboardData;
  const overallStatus = getHealthStatus(overallHealthScore);

  return (
    <div className="space-y-6">
      {/* 전체 건강 점수 */}
      <Card className={`${overallStatus.bgColor} border-2`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className={`h-6 w-6 ${overallStatus.color}`} />
            <span>전체 건강 점수</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
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

      {/* 가족 구성원별 건강 상태 */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Users className="h-6 w-6" />
          가족 건강 현황
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {familyMembers.map((member) => {
            const status = getHealthStatus(member.healthScore);
            return (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      <span>{member.name}</span>
                      {member.relationship && (
                        <Badge variant="secondary" className="text-xs">
                          {member.relationship}
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 건강 점수 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">건강 점수</span>
                      <span className={`font-bold ${status.color}`}>{member.healthScore}점</span>
                    </div>
                    <Progress value={member.healthScore} className="h-2" />
                  </div>

                  {/* 건강 정보 요약 */}
                  <div className="space-y-2 text-sm">
                    {member.recentCheckup && (
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">최근 검진:</span>
                        <span>
                          {formatDate(member.recentCheckup.date)}
                          {member.recentCheckup.hasAbnormalResults && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              이상
                            </Badge>
                          )}
                        </span>
                      </div>
                    )}
                    {member.activeMedications > 0 && (
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">복용 중 약물:</span>
                        <span>{member.activeMedications}개</span>
                      </div>
                    )}
                    {member.upcomingVaccinations > 0 && (
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">예정된 예방접종:</span>
                        <span>{member.upcomingVaccinations}개</span>
                      </div>
                    )}
                    {member.upcomingCheckups > 0 && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">예정된 검진:</span>
                        <span>{member.upcomingCheckups}개</span>
                      </div>
                    )}
                  </div>

                  {/* 상세 보기 링크 */}
                  {member.id && (
                    <Link
                      href={`/health/family/${member.id}`}
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      상세 보기
                      <TrendingUp className="h-3 w-3" />
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 건강 알림 */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Bell className="h-6 w-6" />
          건강 알림
        </h2>
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-muted-foreground">현재 알림이 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const { icon: AlertIcon, color } = getAlertIcon(alert.type);
              const daysUntil = getDaysUntil(alert.dueDate);
              const priorityColors = {
                high: "border-red-500 bg-red-50",
                medium: "border-yellow-500 bg-yellow-50",
                low: "border-blue-500 bg-blue-50",
              };

              return (
                <Card
                  key={alert.id}
                  className={`border-l-4 ${priorityColors[alert.priority]}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <AlertIcon className={`h-5 w-5 ${color} mt-0.5`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{alert.title}</h3>
                          {alert.familyMemberName && (
                            <Badge variant="outline" className="text-xs">
                              {alert.familyMemberName}
                            </Badge>
                          )}
                          <Badge
                            variant={
                              alert.priority === "high"
                                ? "destructive"
                                : alert.priority === "medium"
                                  ? "default"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {alert.priority === "high"
                              ? "높음"
                              : alert.priority === "medium"
                                ? "보통"
                                : "낮음"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.description}
                        </p>
                        {daysUntil !== null && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {daysUntil > 0
                                ? `${daysUntil}일 후`
                                : daysUntil === 0
                                  ? "오늘"
                                  : `${Math.abs(daysUntil)}일 지남`}
                            </span>
                            {alert.dueDate && (
                              <span className="text-muted-foreground">
                                ({formatDate(alert.dueDate)})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

