/**
 * @file components/health/family-member-health-detail.tsx
 * @description 가족 구성원 건강 상세 컴포넌트
 *
 * 가족 구성원의 건강 상태를 상세하게 보여주는 컴포넌트입니다:
 * - 구성원 기본 정보
 * - 건강 점수 및 상세 분석
 * - 최근 건강검진 결과
 * - 현재 복용 중인 약물
 * - 예방접종 이력
 * - 건강 트렌드
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Heart,
  User,
  Stethoscope,
  Pill,
  Calendar,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

/**
 * 구성원 건강 상세 데이터
 */
interface MemberHealthDetail {
  member: {
    id: string;
    name: string;
    relationship: string | null;
    birth_date: string | null;
    gender: string | null;
  };
  healthScore: {
    totalScore: number;
    breakdown: {
      checkupScore: number;
      medicationScore: number;
      vaccinationScore: number;
      hospitalVisitScore: number;
      profileScore: number;
    };
    details: {
      checkupDetails: {
        hasRecentCheckup: boolean;
        normalResultsCount: number;
        abnormalResultsCount: number;
        totalCheckups: number;
      };
      medicationDetails: {
        activeMedications: number;
        hasRegularSchedule: boolean;
        complianceRate: number;
      };
      vaccinationDetails: {
        completedCount: number;
        requiredCount: number;
        completionRate: number;
      };
      hospitalVisitDetails: {
        recentVisitCount: number;
        visitFrequencyScore: number;
      };
      profileDetails: {
        completeness: number;
        hasBasicInfo: boolean;
        hasHealthGoals: boolean;
      };
    };
  };
  checkups: Array<{
    id: string;
    checkup_date: string;
    checkup_type: string;
    results: Record<string, any>;
  }>;
  medications: Array<{
    id: string;
    medication_name: string;
    dosage: string;
    frequency: string;
    start_date: string;
    end_date: string | null;
  }>;
  vaccinations: Array<{
    id: string;
    vaccine_name: string;
    completed_date: string | null;
    dose_number: number;
    total_doses: number;
  }>;
  hospitalRecords: Array<{
    id: string;
    visit_date: string;
    hospital_name: string;
    diagnosis: string[];
  }>;
  upcomingVaccinations: Array<{
    id: string;
    vaccine_name: string;
    recommended_date: string;
    priority: string;
  }>;
  upcomingCheckups: Array<{
    id: string;
    checkup_name: string;
    recommended_date: string;
    priority: string;
  }>;
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

interface FamilyMemberHealthDetailProps {
  memberId: string;
}

export function FamilyMemberHealthDetail({ memberId }: FamilyMemberHealthDetailProps) {
  const [detail, setDetail] = useState<MemberHealthDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        console.group("[FamilyMemberHealthDetail] 구성원 건강 상세 조회");

        const response = await fetch(`/api/health/family/${memberId}/summary`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "구성원 건강 상세 조회 실패");
        }

        console.log("✅ 구성원 건강 상세 조회 완료:", result.data);
        setDetail(result.data);
        console.groupEnd();
      } catch (error) {
        console.error("❌ 구성원 건강 상세 조회 실패:", error);
        console.groupEnd();
        toast({
          title: "데이터 조회 실패",
          description:
            error instanceof Error
              ? error.message
              : "구성원 건강 정보를 불러오는데 실패했습니다.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [memberId, toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(5)].map((_, i) => (
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

  if (!detail) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">구성원 건강 정보를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const { member, healthScore, checkups, medications, vaccinations, upcomingVaccinations, upcomingCheckups } = detail;
  const status = getHealthStatus(healthScore.totalScore);

  return (
    <div className="space-y-6">
      {/* 구성원 기본 정보 및 건강 점수 */}
      <Card className={`${status.bgColor} border-2`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            <span>{member.name}</span>
            {member.relationship && (
              <Badge variant="secondary">{member.relationship}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="text-5xl font-bold">{healthScore.totalScore}</div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {status.label}
            </Badge>
          </div>
          <Progress value={healthScore.totalScore} className="h-3" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">검진</div>
              <div className="font-semibold">{healthScore.breakdown.checkupScore}점</div>
            </div>
            <div>
              <div className="text-muted-foreground">약물</div>
              <div className="font-semibold">{healthScore.breakdown.medicationScore}점</div>
            </div>
            <div>
              <div className="text-muted-foreground">예방접종</div>
              <div className="font-semibold">{healthScore.breakdown.vaccinationScore}점</div>
            </div>
            <div>
              <div className="text-muted-foreground">병원 방문</div>
              <div className="font-semibold">{healthScore.breakdown.hospitalVisitScore}점</div>
            </div>
            <div>
              <div className="text-muted-foreground">프로필</div>
              <div className="font-semibold">{healthScore.breakdown.profileScore}점</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 최근 건강검진 결과 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            최근 건강검진 결과
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checkups.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              건강검진 기록이 없습니다.
            </p>
          ) : (
            <div className="space-y-4">
              {checkups.slice(0, 3).map((checkup) => (
                <div
                  key={checkup.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{checkup.checkup_type}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(checkup.checkup_date)}
                      </div>
                    </div>
                  </div>
                  {checkup.results && Object.keys(checkup.results).length > 0 && (
                    <div className="text-sm space-y-1">
                      {checkup.results.blood_pressure_systolic && (
                        <div>
                          혈압: {checkup.results.blood_pressure_systolic}/
                          {checkup.results.blood_pressure_diastolic} mmHg
                        </div>
                      )}
                      {checkup.results.blood_sugar && (
                        <div>혈당: {checkup.results.blood_sugar} mg/dL</div>
                      )}
                      {checkup.results.cholesterol_total && (
                        <div>총 콜레스테롤: {checkup.results.cholesterol_total} mg/dL</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <Link
                href="/health/checkups"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                전체 검진 기록 보기
                <TrendingUp className="h-3 w-3" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 현재 복용 중인 약물 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            현재 복용 중인 약물 ({medications.length}개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medications.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              복용 중인 약물이 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {medications.map((medication) => (
                <div
                  key={medication.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="font-semibold">{medication.medication_name}</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>용량: {medication.dosage}</div>
                    <div>복용 빈도: {medication.frequency}</div>
                    <div>시작일: {formatDate(medication.start_date)}</div>
                    {medication.end_date && (
                      <div>종료일: {formatDate(medication.end_date)}</div>
                    )}
                  </div>
                </div>
              ))}
              <Link
                href="/health/medication-records"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                전체 약물 기록 보기
                <TrendingUp className="h-3 w-3" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 예정된 예방접종 및 건강검진 */}
      {(upcomingVaccinations.length > 0 || upcomingCheckups.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              예정된 일정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingVaccinations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">예방접종</h3>
                <div className="space-y-2">
                  {upcomingVaccinations.slice(0, 3).map((vaccination) => (
                    <div
                      key={vaccination.id}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div>
                        <div className="font-medium">{vaccination.vaccine_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(vaccination.recommended_date)}
                        </div>
                      </div>
                      <Badge
                        variant={
                          vaccination.priority === "required"
                            ? "destructive"
                            : vaccination.priority === "recommended"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {vaccination.priority === "required"
                          ? "필수"
                          : vaccination.priority === "recommended"
                            ? "권장"
                            : "선택"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {upcomingCheckups.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">건강검진</h3>
                <div className="space-y-2">
                  {upcomingCheckups.slice(0, 3).map((checkup) => (
                    <div
                      key={checkup.id}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div>
                        <div className="font-medium">{checkup.checkup_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(checkup.recommended_date)}
                        </div>
                      </div>
                      <Badge
                        variant={
                          checkup.priority === "high"
                            ? "destructive"
                            : checkup.priority === "medium"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {checkup.priority === "high"
                          ? "높음"
                          : checkup.priority === "medium"
                            ? "보통"
                            : "낮음"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

