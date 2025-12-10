/**
 * @file health-management-preview.tsx
 * @description 건강 관리 미리보기 컴포넌트
 *
 * 주요 기능:
 * 1. 가족 건강, 건강 트렌드, 건강 알림, 목표 달성률 미리보기
 * 2. 각 섹션별 요약 정보 표시
 * 3. 전체보기 링크 제공
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Section } from '@/components/section';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Activity, Heart, Bell, Target } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

interface FamilyHealthSummary {
  memberId: string;
  name: string;
  healthScore: number;
  lastCheckup: string;
}

export function HealthManagementPreview() {
  const { user, isLoaded } = useUser();
  const [familyHealth, setFamilyHealth] = useState<FamilyHealthSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) {
      setIsLoading(false);
      return;
    }

    // 임시 데이터 (실제로는 API에서 가져옴)
    setFamilyHealth([
      { memberId: 'self', name: '나', healthScore: 85, lastCheckup: '2024.12.15' },
      { memberId: 'mom', name: '엄마', healthScore: 78, lastCheckup: '2024.11.20' },
      { memberId: 'dad', name: '아빠', healthScore: 72, lastCheckup: '2024.10.05' },
    ]);
    setIsLoading(false);
  }, [user, isLoaded]);

  const getStars = (score: number) => {
    const stars = Math.round((score / 100) * 5);
    return '⭐'.repeat(stars);
  };

  return (
    <Section
      id="health-management"
      className="bg-green-50/50"
      title="💚 건강 관리"
      description="가족 건강을 한눈에 확인하고 관리하세요"
    >
      <div className="space-y-6">
        {/* 가족 건강 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Heart className="h-5 w-5 text-green-600" />
              👨‍👩‍👧‍👦 가족 건강
            </h3>
            <Button asChild variant="ghost" size="sm">
              <Link href="/health?tab=family">
                더보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-24 bg-gray-200 rounded"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {familyHealth.map((member) => (
                <Card key={member.memberId} className="hover:shadow-lg transition-all cursor-pointer group">
                  <CardHeader>
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <CardDescription>건강점수</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-green-600">{member.healthScore}</span>
                      <span className="text-sm text-muted-foreground">점</span>
                      <span className="text-sm">{getStars(member.healthScore)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      최근 검진: {member.lastCheckup}
                    </p>
                    <Button asChild variant="outline" size="sm" className="w-full group-hover:bg-green-50">
                      <Link href={`/health/dashboard?member=${member.memberId}`}>
                        상세보기
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 건강 트렌드 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              📊 건강 트렌드
            </h3>
            <Button asChild variant="ghost" size="sm">
              <Link href="/health?tab=dashboard">
                더보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="text-base">최근 3개월 건강 데이터</CardTitle>
              <CardDescription>체중, 활동량, 영양 섭취 추이</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-sm">차트 영역</span>
              </div>
              <Button asChild variant="outline" className="w-full mt-4">
                <Link href="/health?tab=dashboard">상세 차트 보기</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 건강 알림 및 목표 달성 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 건강 알림 */}
          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-5 w-5 text-green-600" />
                🔔 건강 알림
              </CardTitle>
              <CardDescription>예방접종, 건강검진, 약물 복용 알림</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="text-sm space-y-1">
                <li>• 예방접종 예정일: 할머니 독감 예방접종 (2025.02.15)</li>
                <li>• 건강검진 권장일: 아빠 정기 건강검진 (2025.02.20)</li>
                <li>• 약물 복용: 할머니 혈압약 오전 9시 (완료 ✓)</li>
              </ul>
              <Button asChild variant="outline" className="w-full mt-4">
                <Link href="/health?tab=dashboard">더보기</Link>
              </Button>
            </CardContent>
          </Card>

          {/* 목표 달성률 */}
          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                🎯 목표 달성률
              </CardTitle>
              <CardDescription>건강 목표 달성률 확인</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">주간 목표</span>
                  <span className="text-2xl font-bold text-green-600">75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• 운동 목표: 3회 / 3회 완료</p>
                <p>• 칼로리 목표: 14,000kcal / 14,000kcal</p>
              </div>
              <Button asChild variant="outline" className="w-full mt-2">
                <Link href="/health?tab=dashboard">상세보기</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 전체보기 버튼 */}
        <div className="flex justify-center pt-4">
          <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
            <Link href="/health">
              건강 관리 전체보기 <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}

