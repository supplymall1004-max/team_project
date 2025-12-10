/**
 * @file components/health/family-health-comparison.tsx
 * @description 가족 건강 비교 분석 컴포넌트
 *
 * 가족 구성원 간 건강 상태를 비교하고 패턴을 분석하여 표시합니다.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Heart,
  Activity,
  Pill,
  Stethoscope,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

/**
 * 가족 구성원 건강 비교 데이터
 */
interface FamilyMemberComparison {
  id: string;
  name: string;
  relationship: string | null;
  age: number | null;
  gender: string | null;
  healthScore: number;
  bmi: number | null;
  activeMedications: number;
  recentCheckupDate: string | null;
  vaccinationCompletionRate: number;
}

/**
 * 가족 건강 비교 결과
 */
interface FamilyHealthComparisonData {
  members: FamilyMemberComparison[];
  averages: {
    healthScore: number;
    bmi: number | null;
    activeMedications: number;
    vaccinationCompletionRate: number;
  };
  insights: string[];
  commonHealthIssues: string[];
}

/**
 * 건강 점수에 따른 상태 반환
 */
function getHealthStatus(score: number): {
  label: string;
  color: string;
} {
  if (score >= 80) {
    return { label: "우수", color: "text-green-600" };
  } else if (score >= 60) {
    return { label: "양호", color: "text-blue-600" };
  } else if (score >= 40) {
    return { label: "보통", color: "text-yellow-600" };
  } else {
    return { label: "주의", color: "text-red-600" };
  }
}

/**
 * 평균 대비 비교 아이콘
 */
function getComparisonIcon(value: number, average: number) {
  if (value > average) {
    return { icon: TrendingUp, color: "text-green-600" };
  } else if (value < average) {
    return { icon: TrendingDown, color: "text-red-600" };
  } else {
    return { icon: Minus, color: "text-gray-400" };
  }
}

/**
 * 날짜 포맷팅
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return "없음";
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function FamilyHealthComparison() {
  const [comparisonData, setComparisonData] = useState<FamilyHealthComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchComparisonData = async () => {
      try {
        setLoading(true);
        console.group("[FamilyHealthComparison] 가족 건강 비교 데이터 조회");

        const response = await fetch("/api/health/family/comparison");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "가족 건강 비교 데이터 조회 실패");
        }

        console.log("✅ 가족 건강 비교 데이터 조회 완료:", result.data);
        setComparisonData(result.data);
        console.groupEnd();
      } catch (error) {
        console.error("❌ 가족 건강 비교 데이터 조회 실패:", error);
        console.groupEnd();
        toast({
          title: "데이터 조회 실패",
          description:
            error instanceof Error
              ? error.message
              : "가족 건강 비교 정보를 불러오는데 실패했습니다.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
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
    );
  }

  if (!comparisonData || comparisonData.members.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">비교할 가족 구성원이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const { members, averages, insights, commonHealthIssues } = comparisonData;

  return (
    <div className="space-y-6">
      {/* 평균 건강 지표 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            가족 평균 건강 지표
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">평균 건강 점수</div>
              <div className="text-2xl font-bold">{averages.healthScore}점</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">평균 BMI</div>
              <div className="text-2xl font-bold">
                {averages.bmi !== null ? averages.bmi.toFixed(1) : "-"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">평균 복용 약물</div>
              <div className="text-2xl font-bold">{averages.activeMedications}개</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">예방접종 완료율</div>
              <div className="text-2xl font-bold">
                {Math.round(averages.vaccinationCompletionRate * 100)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 구성원별 비교 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            구성원별 건강 비교
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => {
              const status = getHealthStatus(member.healthScore);
              const healthScoreComparison = getComparisonIcon(
                member.healthScore,
                averages.healthScore
              );
              const bmiComparison =
                member.bmi !== null && averages.bmi !== null
                  ? getComparisonIcon(member.bmi, averages.bmi)
                  : null;

              return (
                <div
                  key={member.id}
                  className="border rounded-lg p-4 space-y-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{member.name}</h3>
                      {member.relationship && (
                        <Badge variant="secondary">{member.relationship}</Badge>
                      )}
                      {member.age !== null && (
                        <span className="text-sm text-muted-foreground">{member.age}세</span>
                      )}
                    </div>
                    <Link
                      href={`/health/family/${member.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      상세 보기 →
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* 건강 점수 */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">건강 점수</span>
                        {healthScoreComparison && (
                          <healthScoreComparison.icon
                            className={`h-3 w-3 ${healthScoreComparison.color}`}
                          />
                        )}
                      </div>
                      <div className={`text-xl font-bold ${status.color}`}>
                        {member.healthScore}점
                      </div>
                      <Progress value={member.healthScore} className="h-2 mt-1" />
                    </div>

                    {/* BMI */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">BMI</span>
                        {bmiComparison && (
                          <bmiComparison.icon className={`h-3 w-3 ${bmiComparison.color}`} />
                        )}
                      </div>
                      <div className="text-xl font-bold">
                        {member.bmi !== null ? member.bmi.toFixed(1) : "-"}
                      </div>
                      {member.bmi !== null && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {member.bmi < 18.5
                            ? "저체중"
                            : member.bmi < 25
                              ? "정상"
                              : member.bmi < 30
                                ? "과체중"
                                : "비만"}
                        </div>
                      )}
                    </div>

                    {/* 복용 약물 */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Pill className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">복용 약물</span>
                      </div>
                      <div className="text-xl font-bold">{member.activeMedications}개</div>
                    </div>

                    {/* 예방접종 완료율 */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Stethoscope className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">예방접종</span>
                      </div>
                      <div className="text-xl font-bold">
                        {Math.round(member.vaccinationCompletionRate * 100)}%
                      </div>
                    </div>
                  </div>

                  {/* 최근 검진 날짜 */}
                  {member.recentCheckupDate && (
                    <div className="text-sm text-muted-foreground">
                      최근 검진: {formatDate(member.recentCheckupDate)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 건강 인사이트 */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              건강 인사이트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 공통 건강 이슈 */}
      {commonHealthIssues.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              공통 건강 이슈
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {commonHealthIssues.map((issue, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-white rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{issue}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

