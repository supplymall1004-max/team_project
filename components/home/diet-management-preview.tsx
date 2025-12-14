/**
 * @file diet-management-preview.tsx
 * @description 식단 관리 미리보기 컴포넌트
 *
 * 주요 기능:
 * 1. 오늘의 식단, 주간 식단, 건강 시각화 미리보기
 * 2. 각 섹션별 요약 정보 표시
 * 3. 전체보기 링크 제공
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Section } from '@/components/section';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, TrendingUp, Sun, Moon, Coffee } from 'lucide-react';
import { HealthVisualizationPreview } from './health-visualization-preview';
import { useUser } from '@clerk/nextjs';
import type { DailyDietPlan } from '@/types/health';

export function DietManagementPreview() {
  const { user, isLoaded } = useUser();
  const [dietPlan, setDietPlan] = useState<DailyDietPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) {
      setIsLoading(false);
      return;
    }

    async function loadDietPlan() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/diet/plan?date=${today}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.dietPlan) {
            setDietPlan(data.dietPlan);
          }
        }
      } catch (error) {
        console.error('[DietManagementPreview] 식단 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDietPlan();
  }, [user, isLoaded]);

  return (
    <Section
      id="diet-management"
      className="bg-purple-50/50"
      title="🍽️ 식단 관리"
      description="AI 기반 개인 맞춤 식단으로 건강한 식생활을 시작하세요"
    >
      <div className="space-y-6">
        {/* 오늘의 식단 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Sun className="h-5 w-5 text-purple-600" />
              🤖 오늘의 건강 맞춤 식단
            </h3>
            <Button asChild variant="ghost" size="sm">
              <Link href="/diet?tab=today">
                더보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-32 bg-gray-200 rounded-lg"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : dietPlan ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { type: 'breakfast', icon: Sun, label: '아침', meal: dietPlan.breakfast },
                { type: 'lunch', icon: Sun, label: '점심', meal: dietPlan.lunch },
                { type: 'dinner', icon: Moon, label: '저녁', meal: dietPlan.dinner },
                { type: 'snack', icon: Coffee, label: '간식', meal: dietPlan.snack },
              ].map(({ type, icon: Icon, label, meal }) => (
                <Card key={type} className="hover:shadow-lg transition-all cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">식단 이미지</span>
                    </div>
                    <CardDescription className="text-xs">
                      {meal?.recipe?.title || '식단 없음'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-semibold">
                      {meal?.calories?.toFixed(0) || 0}kcal
                    </p>
                    <Button asChild variant="outline" size="sm" className="w-full mt-2 group-hover:bg-purple-50">
                      <Link href={`/diet/${type}/${new Date().toISOString().split('T')[0]}`}>
                        상세보기
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  오늘의 식단이 아직 생성되지 않았습니다
                </p>
                <Button asChild>
                  <Link href="/diet">식단 생성하기</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 주간 식단 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              📅 주간 식단
            </h3>
            <Button asChild variant="ghost" size="sm">
              <Link href="/diet?tab=weekly">
                더보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="text-base">이번 주 식단 요약</CardTitle>
              <CardDescription>7일간의 식단을 한눈에 확인하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">주간 총 칼로리</p>
                  <p className="text-2xl font-bold text-purple-600">14,000kcal</p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/diet/weekly">캘린더 보기</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 건강 시각화 미리보기 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              💚 건강 시각화
            </h3>
            <Button asChild variant="ghost" size="sm">
              <Link href="/diet?tab=visualization">
                더보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <HealthVisualizationPreview compact={true} />
        </div>

        {/* 전체보기 버튼 */}
        <div className="flex justify-center pt-4">
          <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
            <Link href="/diet">
              식단 관리 전체보기 <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}

