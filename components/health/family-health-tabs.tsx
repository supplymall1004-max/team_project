/**
 * @file components/health/family-health-tabs.tsx
 * @description 가족 구성원별 건강 정보 탭 컴포넌트
 *
 * 가족 구성원별로 건강 정보를 탭 형태로 보여줍니다
 */

"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  User,
  UserCheck,
  Baby,
  Heart,
  Activity,
  Pill,
  Stethoscope,
  Calendar,
  TrendingUp,
  Target,
  Zap
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
  health_profile?: {
    age: number | null;
    height_cm: number | null;
    weight_kg: number | null;
    activity_level: string | null;
    daily_calorie_goal: number;
    diseases: string[];
    allergies: string[];
    dietary_preferences: string[];
  };
  health_summary?: {
    health_score: number;
    recent_visits: number;
    active_medications: number;
    upcoming_vaccinations: number;
    last_checkup: string | null;
    bmi: number | null;
  };
}

interface FamilyHealthTabsProps {
  userId: string;
}

export function FamilyHealthTabs({ userId }: FamilyHealthTabsProps) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // 가족 구성원 데이터 조회
  useEffect(() => {
    const fetchFamilyMembers = async () => {
      try {
        setLoading(true);

        // 모의 데이터 (실제로는 API에서 가져와야 함)
        const mockMembers: FamilyMember[] = [
          {
            id: "user",
            name: "김철수",
            relationship: "본인",
            birth_date: "1985-03-15",
            gender: "male",
            health_profile: {
              age: 39,
              height_cm: 175,
              weight_kg: 75,
              activity_level: "moderate",
              daily_calorie_goal: 2200,
              diseases: [],
              allergies: ["peanut"],
              dietary_preferences: ["low_carb"],
            },
            health_summary: {
              health_score: 85,
              recent_visits: 1,
              active_medications: 2,
              upcoming_vaccinations: 1,
              last_checkup: "2024-01-15",
              bmi: 24.5,
            },
          },
          {
            id: "spouse",
            name: "김영희",
            relationship: "배우자",
            birth_date: "1987-07-22",
            gender: "female",
            health_profile: {
              age: 37,
              height_cm: 162,
              weight_kg: 55,
              activity_level: "light",
              daily_calorie_goal: 1800,
              diseases: [],
              allergies: [],
              dietary_preferences: ["vegetarian"],
            },
            health_summary: {
              health_score: 90,
              recent_visits: 0,
              active_medications: 1,
              upcoming_vaccinations: 1,
              last_checkup: "2024-02-10",
              bmi: 21.0,
            },
          },
          {
            id: "child1",
            name: "김민준",
            relationship: "자녀",
            birth_date: "2018-11-08",
            gender: "male",
            health_profile: {
              age: 6,
              height_cm: 120,
              weight_kg: 25,
              activity_level: "active",
              daily_calorie_goal: 1600,
              diseases: [],
              allergies: [],
              dietary_preferences: [],
            },
            health_summary: {
              health_score: 95,
              recent_visits: 0,
              active_medications: 0,
              upcoming_vaccinations: 2,
              last_checkup: "2024-03-01",
              bmi: 17.4,
            },
          },
        ];

        setMembers(mockMembers);
      } catch (error) {
        console.error("가족 구성원 데이터 조회 실패:", error);
        toast({
          title: "데이터 조회 실패",
          description: "가족 정보를 불러오는데 실패했습니다.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyMembers();
  }, [toast]);

  const getRelationshipIcon = (relationship: string) => {
    switch (relationship) {
      case "본인":
        return <User className="w-4 h-4" />;
      case "배우자":
        return <UserCheck className="w-4 h-4" />;
      case "자녀":
        return <Baby className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getBMIStatus = (bmi: number | null) => {
    if (!bmi) return { text: "측정 필요", color: "bg-gray-100 text-gray-800" };

    if (bmi < 18.5) return { text: "저체중", color: "bg-blue-100 text-blue-800" };
    if (bmi < 23) return { text: "정상", color: "bg-green-100 text-green-800" };
    if (bmi < 25) return { text: "과체중", color: "bg-yellow-100 text-yellow-800" };
    if (bmi < 30) return { text: "비만", color: "bg-orange-100 text-orange-800" };
    return { text: "고도비만", color: "bg-red-100 text-red-800" };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            가족 구성원이 없습니다
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>가족 건강 정보</CardTitle>
        <p className="text-sm text-gray-600">
          가족 구성원별 건강 정보를 확인하세요.
        </p>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue={members[0]?.id} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {members.map((member) => (
              <TabsTrigger key={member.id} value={member.id} className="flex items-center gap-2">
                {getRelationshipIcon(member.relationship)}
                <span>{member.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {members.map((member) => (
            <TabsContent key={member.id} value={member.id} className="space-y-6 mt-6">
              {/* 기본 정보 카드 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback className="text-lg">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getRelationshipIcon(member.relationship)}
                        <h3 className="text-xl font-semibold">{member.name}</h3>
                        <Badge variant="outline">{member.relationship}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {member.gender === "male" ? "남성" : member.gender === "female" ? "여성" : "기타"} •
                        만 {member.health_profile?.age || "?"}세 •
                        출생일: {new Date(member.birth_date).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* 건강 요약 그리드 */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">건강 점수</CardTitle>
                    <Heart className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{member.health_summary?.health_score || 0}</div>
                    <Progress value={member.health_summary?.health_score || 0} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">BMI</CardTitle>
                    <Activity className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {member.health_summary?.bmi ? member.health_summary.bmi.toFixed(1) : "측정 필요"}
                    </div>
                    <Badge className={`mt-2 ${getBMIStatus(member.health_summary?.bmi || null).color}`}>
                      {getBMIStatus(member.health_summary?.bmi || null).text}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">칼로리 목표</CardTitle>
                    <Target className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {member.health_profile?.daily_calorie_goal || 0}
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
                      {member.health_profile?.activity_level === "sedentary" ? "거의 없음" :
                       member.health_profile?.activity_level === "light" ? "가벼움" :
                       member.health_profile?.activity_level === "moderate" ? "보통" :
                       member.health_profile?.activity_level === "active" ? "활발함" :
                       member.health_profile?.activity_level === "very_active" ? "매우 활발함" :
                       "설정 필요"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 건강 기록 요약 */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">병원 방문</CardTitle>
                    <Stethoscope className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{member.health_summary?.recent_visits || 0}</div>
                    <p className="text-xs text-muted-foreground">최근 3개월</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">복용 약물</CardTitle>
                    <Pill className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{member.health_summary?.active_medications || 0}</div>
                    <p className="text-xs text-muted-foreground">현재 복용 중</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">예방주사</CardTitle>
                    <Calendar className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{member.health_summary?.upcoming_vaccinations || 0}</div>
                    <p className="text-xs text-muted-foreground">다가오는 일정</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">마지막 검진</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-medium">
                      {member.health_summary?.last_checkup
                        ? new Date(member.health_summary.last_checkup).toLocaleDateString('ko-KR')
                        : "없음"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {member.health_summary?.last_checkup
                        ? `${Math.floor((Date.now() - new Date(member.health_summary.last_checkup).getTime()) / (1000 * 60 * 60 * 24))}일 전`
                        : "정기 검진 권장"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 상세 건강 정보 */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* 신체 정보 */}
                <Card>
                  <CardHeader>
                    <CardTitle>신체 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">키:</span>
                        <span className="ml-2">{member.health_profile?.height_cm ? `${member.health_profile.height_cm}cm` : "미측정"}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">체중:</span>
                        <span className="ml-2">{member.health_profile?.weight_kg ? `${member.health_profile.weight_kg}kg` : "미측정"}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/health/profile">신체 정보 수정</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 건강 특성 */}
                <Card>
                  <CardHeader>
                    <CardTitle>건강 특성</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {member.health_profile?.diseases && member.health_profile.diseases.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700 text-sm">질병:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {member.health_profile.diseases.map((disease, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {disease}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {member.health_profile?.allergies && member.health_profile.allergies.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700 text-sm">알레르기:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {member.health_profile.allergies.map((allergy, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {allergy}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {member.health_profile?.dietary_preferences && member.health_profile.dietary_preferences.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700 text-sm">식단 선호:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {member.health_profile.dietary_preferences.map((pref, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {pref}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/health/profile">건강 정보 수정</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex gap-2 pt-4">
                <Button asChild>
                  <Link href={`/health/family/${member.id}`}>
                    상세 건강 기록 보기
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/health/vaccinations?family_member_id=${member.id}`}>
                    예방주사 일정 관리
                  </Link>
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

