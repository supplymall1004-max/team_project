/**
 * @file health-visualization-preview.tsx
 * @description 건강 시각화 미리보기 컴포넌트
 *
 * 주요 기능:
 * 1. 건강 맞춤 식단 섹션에 표시할 시각화 미리보기
 * 2. 현재 건강 상태, 영양 균형, 식단 효과 예측 요약
 * 3. 클릭 시 상세 페이지로 이동
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Activity, Target, Heart, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HealthMetrics } from '@/types/health-visualization';

interface HealthVisualizationPreviewProps {
  className?: string;
  compact?: boolean; // 컴팩트 모드 (메인페이지용)
}

export function HealthVisualizationPreview({
  className,
  compact = false,
}: HealthVisualizationPreviewProps) {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    const maxRetries = 3;
    const retryDelay = 2000; // 2초

    async function fetchHealthMetrics() {
      try {
        setIsLoading(true);
        setError(null);

        console.log('[HealthVisualizationPreview] 건강 메트릭스 조회 시작', { retryCount: retryCountRef.current });

        const response = await fetch('/api/health/metrics', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          // 오류 응답의 상세 정보 확인
          let errorData: any = null;
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          
          try {
            const contentType = response.headers.get('content-type');
            const text = await response.text();
            console.log('[HealthVisualizationPreview] 에러 응답 본문:', text.substring(0, 200));
            console.log('[HealthVisualizationPreview] 응답 Content-Type:', contentType);
            
            // HTML 응답인 경우 (에러 페이지)
            if (contentType?.includes('text/html') || text.trim().startsWith('<!DOCTYPE')) {
              console.error('[HealthVisualizationPreview] HTML 응답 수신 - API 라우트 오류 가능성');
              errorMessage = '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
              
              // 사용자를 찾을 수 없는 경우 재시도 (사용자 동기화 대기)
              if (retryCountRef.current < maxRetries) {
                console.log(`[HealthVisualizationPreview] 재시도 중... (${retryCountRef.current + 1}/${maxRetries})`);
                retryCountRef.current++;
                setTimeout(fetchHealthMetrics, retryDelay);
                return;
              }
            } else if (text && text.trim()) {
              try {
                errorData = JSON.parse(text);
                errorMessage = errorData?.error || errorData?.message || errorMessage;
              } catch (parseError) {
                // JSON 파싱 실패 시 텍스트를 그대로 사용
                console.warn('[HealthVisualizationPreview] JSON 파싱 실패, 텍스트 그대로 사용:', parseError);
                errorMessage = text || errorMessage;
              }
            } else {
              console.warn('[HealthVisualizationPreview] 에러 응답 본문이 비어있음');
            }
          } catch (readError) {
            // 응답 본문 읽기 실패
            console.error('[HealthVisualizationPreview] 에러 응답 본문 읽기 실패:', readError);
          }
          
          // 사용자를 찾을 수 없는 경우 재시도 (사용자 동기화 대기)
          if (response.status === 404 && errorMessage.includes('사용자를 찾을 수 없습니다') && retryCountRef.current < maxRetries) {
            console.log(`[HealthVisualizationPreview] 사용자 동기화 대기 중... (${retryCountRef.current + 1}/${maxRetries})`);
            retryCountRef.current++;
            setTimeout(fetchHealthMetrics, retryDelay);
            return;
          }
          
          console.error('[HealthVisualizationPreview] 건강 메트릭스 조회 실패:', {
            status: response.status,
            statusText: response.statusText,
            errorData: errorData,
            errorMessage: errorMessage,
            retryCount: retryCountRef.current
          });
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('[HealthVisualizationPreview] 건강 메트릭스 조회 완료:', data);
        
        if (data.message) {
          console.log('[HealthVisualizationPreview] 메시지:', data.message);
        }

        setHealthMetrics(data.metrics);
        retryCountRef.current = 0; // 성공 시 재시도 카운터 리셋
      } catch (err) {
        console.error('[HealthVisualizationPreview] 건강 메트릭스 조회 실패:', err);
        setError(err instanceof Error ? err.message : '건강 데이터를 불러올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchHealthMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !healthMetrics) {
    return (
      <Card className={cn('border-orange-200 bg-orange-50/50', className)}>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            {error || '건강 데이터를 불러올 수 없습니다.'}
          </p>
          <Button asChild variant="outline" className="w-full mt-4">
            <Link href="/diet">건강 맞춤 식단으로 이동</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 건강 점수에 따른 상태
  const getHealthStatus = (score: number) => {
    if (score >= 90) return { text: '최상', color: 'bg-green-500', badge: 'bg-green-100 text-green-800' };
    if (score >= 75) return { text: '좋음', color: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800' };
    if (score >= 60) return { text: '보통', color: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800' };
    if (score >= 45) return { text: '주의', color: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800' };
    return { text: '위험', color: 'bg-red-500', badge: 'bg-red-100 text-red-800' };
  };

  const healthStatus = getHealthStatus(healthMetrics.overallHealthScore);

  // 별점 계산
  const stars = Math.round((healthMetrics.overallHealthScore / 100) * 5);
  const starDisplay = '⭐'.repeat(stars);

  if (compact) {
    // 컴팩트 모드 (메인페이지용)
    return (
      <div className={cn('space-y-4', className)}>
        <Card className="border-orange-200 bg-orange-50/50 hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5 text-orange-600" />
              현재 건강 상태
            </CardTitle>
            <CardDescription>오늘의 건강 메트릭스 요약</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {healthMetrics.overallHealthScore}
                  <span className="text-sm font-normal text-muted-foreground ml-1">점</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={healthStatus.badge}>{healthStatus.text}</Badge>
                  <span className="text-sm">{starDisplay}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">BMI</p>
                <p className="font-semibold">{healthMetrics.bmi.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">체지방률</p>
                <p className="font-semibold">{healthMetrics.bodyFatPercentage.toFixed(1)}%</p>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/health/visualization/status">
                상세보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 전체 모드 (챕터 페이지용)
  // 영양소 칼로리 기반 퍼센트 계산
  const carbCalories = healthMetrics.nutritionBalance.carbohydrates * 4;
  const proteinCalories = healthMetrics.nutritionBalance.protein * 4;
  const fatCalories = healthMetrics.nutritionBalance.fat * 9;
  const totalCalories = carbCalories + proteinCalories + fatCalories;
  
  const carbPercentage = totalCalories > 0 ? (carbCalories / totalCalories) * 100 : 0;
  const proteinPercentage = totalCalories > 0 ? (proteinCalories / totalCalories) * 100 : 0;
  const fatPercentage = totalCalories > 0 ? (fatCalories / totalCalories) * 100 : 0;

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 현재 건강 상태 */}
        <Card className="hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-600" />
              현재 건강 상태
            </CardTitle>
            <CardDescription>오늘의 건강 메트릭스</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-orange-600">
                  {healthMetrics.overallHealthScore}
                  <span className="text-sm font-normal text-muted-foreground ml-1">점</span>
                </span>
                <Badge className={healthStatus.badge}>{healthStatus.text}</Badge>
              </div>
              <div className="flex items-center gap-1 mb-2">
                <span className="text-sm">{starDisplay}</span>
              </div>
              <Progress value={healthMetrics.overallHealthScore} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
              <div>
                <p className="text-muted-foreground">BMI</p>
                <p className="font-semibold">{healthMetrics.bmi.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">체지방률</p>
                <p className="font-semibold">{healthMetrics.bodyFatPercentage.toFixed(1)}%</p>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/health/visualization/status">
                상세보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* 영양 균형 */}
        <Card className="hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              영양 균형
            </CardTitle>
            <CardDescription>탄수화물/단백질/지방 비율</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>탄수화물</span>
                  <span className="font-semibold">
                    {carbPercentage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={carbPercentage} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>단백질</span>
                  <span className="font-semibold">
                    {proteinPercentage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={proteinPercentage} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>지방</span>
                  <span className="font-semibold">
                    {fatPercentage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={fatPercentage} className="h-2" />
              </div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/health/visualization/nutrition">
                상세보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* 식단 효과 예측 */}
        <Card className="hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              식단 효과 예측
            </CardTitle>
            <CardDescription>목표 달성률 및 개선 포인트</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">목표 달성률</span>
                <span className="text-2xl font-bold text-orange-600">75%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            <div className="space-y-1 text-sm pt-2 border-t">
              <p className="text-muted-foreground">주요 개선 포인트:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>단백질 섭취 증가 권장</li>
                <li>운동 시간 확대 필요</li>
              </ul>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/health/visualization/impact">
                상세보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

