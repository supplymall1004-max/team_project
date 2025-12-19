'use client';

/**
 * @file premium-diet-summary.tsx
 * @description 프리미엄 종합 식단 리포트 컴포넌트
 *
 * 주요 기능:
 * 1. 모든 건강 정보를 종합한 칼로리 및 영양소 계산 결과 표시
 * 2. 식단 구성 원리 설명
 * 3. 각 건강 상태별 적용된 필터링 규칙 요약
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Crown, Calculator, TrendingUp, AlertTriangle, Info, Sparkles } from 'lucide-react';
import { generatePremiumDietReport, type PremiumDietReport } from '@/lib/diet/premium-diet-report-generator';
import type { UserHealthProfile } from '@/types/health';
import { getCurrentSubscription } from '@/actions/payments/get-subscription';
import Link from 'next/link';

interface PremiumDietSummaryProps {
  healthProfile: UserHealthProfile | null;
}

export function PremiumDietSummary({ healthProfile }: PremiumDietSummaryProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState<PremiumDietReport | null>(null);

  useEffect(() => {
    const checkPremium = async () => {
      try {
        const subscription = await getCurrentSubscription();
        setIsPremium(subscription.isPremium);
      } catch (error) {
        console.error('[PremiumDietSummary] 프리미엄 확인 실패:', error);
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPremium();
  }, []);

  useEffect(() => {
    if (healthProfile && isPremium) {
      try {
        const generatedReport = generatePremiumDietReport(healthProfile);
        setReport(generatedReport);
      } catch (error) {
        console.error('[PremiumDietSummary] 리포트 생성 실패:', error);
      }
    }
  }, [healthProfile, isPremium]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isPremium) {
    return (
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-600" />
            <span className="bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
              프리미엄 기능
            </span>
          </CardTitle>
          <CardDescription>
            종합 식단 리포트는 프리미엄 회원만 이용할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>프리미엄으로 업그레이드하세요</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-4">
                프리미엄 회원이 되시면 다음과 같은 종합 식단 리포트를 받아보실 수 있습니다:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm mb-4">
                <li>모든 건강 정보를 종합한 칼로리 및 영양소 계산</li>
                <li>식단 구성 원리 상세 설명</li>
                <li>각 건강 상태별 적용된 필터링 규칙 요약</li>
                <li>영양소 목표 달성도 시각화</li>
              </ul>
              <Link href="/settings/premium">
                <Button className="w-full">
                  <Crown className="h-4 w-4 mr-2" />
                  프리미엄으로 업그레이드
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!healthProfile) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>건강 정보가 필요합니다</AlertTitle>
            <AlertDescription>
              종합 리포트를 생성하려면 건강 정보를 입력해주세요.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            리포트를 생성할 수 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-purple-600" />
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            건강 맞춤 식단 종합 리포트
          </span>
        </CardTitle>
        <CardDescription>
          모든 건강 정보를 종합하여 계산된 맞춤형 식단 가이드입니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 종합 칼로리 계산 */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            종합 칼로리 계산
          </h3>
          <div className="bg-white p-4 rounded-lg border border-purple-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">기초대사량 × 활동 계수</span>
              <span className="font-mono font-semibold">{report.totalCalories.base.toLocaleString()} kcal</span>
            </div>
            {report.totalCalories.adjustments.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                {report.totalCalories.adjustments.map((adj, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {adj.type} 조정: {adj.reason}
                    </span>
                    <span className={`font-mono ${adj.value < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {adj.value > 0 ? '+' : ''}{adj.value.toLocaleString()} kcal
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t-2 border-purple-300">
              <span className="font-semibold">최종 목표 칼로리</span>
              <span className="font-mono text-2xl font-bold text-purple-600">
                {report.totalCalories.final.toLocaleString()} kcal
              </span>
            </div>
          </div>
        </div>

        {/* 영양소 배분 */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            영양소 배분
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-blue-700">탄수화물</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {report.macronutrients.carbs.min} - {report.macronutrients.carbs.max} g
                </div>
                <div className="text-sm text-muted-foreground">
                  {report.macronutrients.carbs.calories.min} - {report.macronutrients.carbs.calories.max} kcal
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-green-700">단백질</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {report.macronutrients.protein.min} - {report.macronutrients.protein.max} g
                </div>
                <div className="text-sm text-muted-foreground">
                  {report.macronutrients.protein.calories.min} - {report.macronutrients.protein.calories.max} kcal
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-orange-700">지방</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {report.macronutrients.fat.min} - {report.macronutrients.fat.max} g
                </div>
                <div className="text-sm text-muted-foreground">
                  {report.macronutrients.fat.calories.min} - {report.macronutrients.fat.calories.max} kcal
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 미네랄 제한 */}
        {report.micronutrients && Object.keys(report.micronutrients).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">미네랄 제한</h3>
            <div className="space-y-2">
              {report.micronutrients.sodium && (
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="font-medium">나트륨</span>
                  <Badge variant="outline" className="bg-white">
                    최대 {report.micronutrients.sodium.toLocaleString()} mg
                  </Badge>
                </div>
              )}
              {report.micronutrients.potassium && (
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="font-medium">칼륨</span>
                  <Badge variant="outline" className="bg-white">
                    최대 {report.micronutrients.potassium.toLocaleString()} mg
                  </Badge>
                </div>
              )}
              {report.micronutrients.phosphorus && (
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="font-medium">인</span>
                  <Badge variant="outline" className="bg-white">
                    최대 {report.micronutrients.phosphorus.toLocaleString()} mg
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 적용된 제한 사항 */}
        {report.appliedRestrictions.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              적용된 제한 사항
            </h3>
            <div className="space-y-2">
              {report.appliedRestrictions.map((restriction, index) => (
                <Alert
                  key={index}
                  variant={restriction.severity === 'high' ? 'destructive' : 'default'}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{restriction.category}</AlertTitle>
                  <AlertDescription>{restriction.description}</AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* 식단 구성 원리 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">식단 구성 원리</h3>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">
                  {report.dietCompositionLogic}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
