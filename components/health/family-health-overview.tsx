/**
 * @file components/health/family-health-overview.tsx
 * @description 가족 건강 정보 통합 뷰 컴포넌트
 *
 * 가족 구성원들의 건강 정보를 종합적으로 보여줍니다:
 * - 가족 구성원별 건강 요약
 * - 가족 전체 건강 트렌드
 * - 가족 건강 알림 및 권장사항
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Heart,
  Calendar,
  Pill,
  Stethoscope,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  User,
  UserCheck,
  Baby,
  UserX
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  birth_date: string;
  gender: "male" | "female" | "other" | null;
  avatar_url?: string;
  health_score: number;
  recent_visits: number;
  active_medications: number;
  upcoming_vaccinations: number;
  last_checkup: string | null;
  health_status: "excellent" | "good" | "fair" | "needs_attention";
}

interface FamilyHealthData {
  members: FamilyMember[];
  familyAverageScore: number;
  totalUpcomingVaccinations: number;
  activeHealthConcerns: number;
  recentActivities: Array<{
    id: string;
    member_name: string;
    type: "visit" | "medication" | "vaccination" | "checkup";
    description: string;
    date: string;
  }>;
}

export function FamilyHealthOverview() {
  const [familyData, setFamilyData] = useState<FamilyHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // 가족 건강 데이터 조회
  useEffect(() => {
    const fetchFamilyHealthData = async () => {
      try {
        setLoading(true);

        // 모의 데이터 (실제로는 API에서 가져와야 함)
        const mockFamilyData: FamilyHealthData = {
          members: [
            {
              id: "user",
              name: "김철수",
              relationship: "본인",
              birth_date: "1985-03-15",
              gender: "male",
              health_score: 85,
              recent_visits: 1,
              active_medications: 2,
              upcoming_vaccinations: 1,
              last_checkup: "2024-01-15",
              health_status: "good",
            },
            {
              id: "spouse",
              name: "김영희",
              relationship: "배우자",
              birth_date: "1987-07-22",
              gender: "female",
              health_score: 90,
              recent_visits: 0,
              active_medications: 1,
              upcoming_vaccinations: 1,
              last_checkup: "2024-02-10",
              health_status: "excellent",
            },
            {
              id: "child1",
              name: "김민준",
              relationship: "자녀",
              birth_date: "2018-11-08",
              gender: "male",
              health_score: 95,
              recent_visits: 0,
              active_medications: 0,
              upcoming_vaccinations: 2,
              last_checkup: "2024-03-01",
              health_status: "excellent",
            },
          ],
          familyAverageScore: 90,
          totalUpcomingVaccinations: 4,
          activeHealthConcerns: 1,
          recentActivities: [
            {
              id: "1",
              member_name: "김철수",
              type: "medication",
              description: "혈압약 복용",
              date: "2024-12-08",
            },
            {
              id: "2",
              member_name: "김민준",
              type: "vaccination",
              description: "인플루엔자 예방접종",
              date: "2024-12-07",
            },
            {
              id: "3",
              member_name: "김영희",
              type: "checkup",
              description: "종합건강검진 완료",
              date: "2024-12-05",
            },
          ],
        };

        setFamilyData(mockFamilyData);
      } catch (error) {
        console.error("가족 건강 데이터 조회 실패:", error);
        toast({
          title: "데이터 조회 실패",
          description: "가족 건강 정보를 불러오는데 실패했습니다.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyHealthData();
  }, [toast]);

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-100 text-green-800 border-green-200";
      case "good":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "fair":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "needs_attention":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getHealthStatusText = (status: string) => {
    switch (status) {
      case "excellent":
        return "매우 건강함";
      case "good":
        return "건강함";
      case "fair":
        return "보통";
      case "needs_attention":
        return "관리가 필요함";
      default:
        return "알 수 없음";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "visit":
        return <Stethoscope className="w-4 h-4 text-blue-500" />;
      case "medication":
        return <Pill className="w-4 h-4 text-purple-500" />;
      case "vaccination":
        return <Calendar className="w-4 h-4 text-red-500" />;
      case "checkup":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRelationshipIcon = (relationship: string) => {
    switch (relationship) {
      case "본인":
        return <User className="w-4 h-4" />;
      case "배우자":
        return <UserCheck className="w-4 h-4" />;
      case "자녀":
        return <Baby className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
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
    );
  }

  if (!familyData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            가족 정보를 불러올 수 없습니다
          </h3>
          <p className="text-gray-600 mb-4">
            가족 구성원을 먼저 등록해주세요.
          </p>
          <Button asChild>
            <Link href="/health/profile">가족 관리하기</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { members, familyAverageScore, totalUpcomingVaccinations, activeHealthConcerns, recentActivities } = familyData;

  return (
    <div className="space-y-6">
      {/* 가족 건강 개요 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">가족 평균 건강점수</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{familyAverageScore}</div>
            <Progress value={familyAverageScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {familyAverageScore >= 85 ? "가족 모두 건강함" :
               familyAverageScore >= 70 ? "대체로 건강함" : "관리가 필요함"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">다가오는 예방주사</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUpcomingVaccinations}</div>
            <p className="text-xs text-muted-foreground">이번 달 예정</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">건강 관심사</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeHealthConcerns}</div>
            <p className="text-xs text-muted-foreground">주의가 필요한 항목</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최근 활동</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentActivities.length}</div>
            <p className="text-xs text-muted-foreground">지난 7일간</p>
          </CardContent>
        </Card>
      </div>

      {/* 가족 구성원별 건강 카드 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar_url} />
                  <AvatarFallback>
                    {member.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getRelationshipIcon(member.relationship)}
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                  </div>
                  <p className="text-sm text-gray-500">{member.relationship}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* 건강 점수 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">건강 점수</span>
                  <Badge className={getHealthStatusColor(member.health_status)}>
                    {getHealthStatusText(member.health_status)}
                  </Badge>
                </div>
                <Progress value={member.health_score} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">{member.health_score}점</p>
              </div>

              {/* 건강 지표들 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="font-medium">{member.recent_visits}</p>
                    <p className="text-xs text-gray-500">병원 방문</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="font-medium">{member.active_medications}</p>
                    <p className="text-xs text-gray-500">복용 약물</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="font-medium">{member.upcoming_vaccinations}</p>
                    <p className="text-xs text-gray-500">예방주사</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="font-medium">
                      {member.last_checkup
                        ? new Date(member.last_checkup).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                        : "없음"}
                    </p>
                    <p className="text-xs text-gray-500">최근 검진</p>
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="pt-2">
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link href={`/health/family/${member.id}`}>
                    자세히 보기
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 최근 활동 및 알림 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 최근 활동 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              최근 건강 활동
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.member_name}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.date).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {recentActivities.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>최근 건강 활동이 없습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 가족 건강 알림 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              가족 건강 알림
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {totalUpcomingVaccinations > 0 && (
                <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-900">예방주사 일정</p>
                    <p className="text-sm text-orange-700">
                      이번 달 {totalUpcomingVaccinations}건의 예방주사 일정이 있습니다.
                    </p>
                  </div>
                </div>
              )}

              {members.some(m => !m.last_checkup || new Date(m.last_checkup) < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">건강검진 권장</p>
                    <p className="text-sm text-blue-700">
                      1년 이상 건강검진을 받지 않은 가족 구성원이 있습니다.
                    </p>
                  </div>
                </div>
              )}

              {members.some(m => m.active_medications > 0) && (
                <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <Pill className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-purple-900">약물 복용 관리</p>
                    <p className="text-sm text-purple-700">
                      복용 중인 약물이 있는 가족 구성원이 있습니다.
                    </p>
                  </div>
                </div>
              )}

              {familyAverageScore < 70 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <Heart className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">건강 관리 필요</p>
                    <p className="text-sm text-red-700">
                      가족 평균 건강 점수가 낮습니다. 종합 건강 관리를 고려해보세요.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link href="/health/vaccinations">예방주사 일정 관리</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

