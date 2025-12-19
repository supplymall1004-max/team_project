'use client';

/**
 * @file health-info-tabs.tsx
 * @description 건강 맞춤 식단 가이드 탭 컴포넌트
 *
 * 주요 기능:
 * 1. 사용자 건강 정보 기반 활성화된 탭만 표시
 * 2. 각 탭별 상세 정보 표시 (칼로리 계산법, 주의사항, 영양소 가이드라인 등)
 * 3. 탭별 아이콘 및 색상 구분
 */

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calculator, AlertTriangle, UtensilsCrossed, Info, CheckCircle2, XCircle } from 'lucide-react';
import type { HealthTabType, HealthTabInfo } from '@/types/health-tabs';
import { HEALTH_TAB_CONFIGS } from '@/types/health-tabs';
import { getActiveHealthTabs } from '@/lib/health/health-tab-activator';
import { getHealthTabContent } from '@/lib/health/health-content-loader';
import type { UserHealthProfile } from '@/types/health';

interface HealthInfoTabsProps {
  healthProfile?: UserHealthProfile | null;
  initialTab?: HealthTabType;
}

export function HealthInfoTabs({ healthProfile, initialTab }: HealthInfoTabsProps) {
  const [activeTabs, setActiveTabs] = useState<HealthTabType[]>([]);
  const [selectedTab, setSelectedTab] = useState<HealthTabType | null>(null);
  const [tabInfos, setTabInfos] = useState<HealthTabInfo[]>([]);

  useEffect(() => {
    if (healthProfile) {
      const tabs = getActiveHealthTabs(healthProfile);
      setActiveTabs(tabs);

      // 탭 정보 생성
      const infos: HealthTabInfo[] = tabs.map((tabType) => {
        const config = HEALTH_TAB_CONFIGS[tabType];
        const content = getHealthTabContent(tabType);
        return {
          type: tabType,
          title: config.title,
          icon: config.icon,
          description: config.description,
          isActive: true,
          content,
        };
      });

      setTabInfos(infos);

      // 초기 탭 설정
      if (initialTab && tabs.includes(initialTab)) {
        setSelectedTab(initialTab);
      } else if (tabs.length > 0) {
        setSelectedTab(tabs[0]);
      }
    }
  }, [healthProfile, initialTab]);

  if (!healthProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>건강 맞춤 식단 가이드</CardTitle>
          <CardDescription>
            건강 정보를 입력하시면 맞춤형 식단 가이드를 제공해드립니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>건강 정보가 필요합니다</AlertTitle>
            <AlertDescription>
              <a href="/health/profile" className="text-primary hover:underline">
                건강 정보 입력 페이지
              </a>
              에서 건강 정보를 입력해주세요.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (activeTabs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>건강 맞춤 식단 가이드</CardTitle>
          <CardDescription>
            현재 활성화된 건강 정보 탭이 없습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>건강 정보를 추가해주세요</AlertTitle>
            <AlertDescription>
              질병, 알레르기, 임신 상태 등의 건강 정보를 입력하시면 맞춤형 가이드를 제공해드립니다.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const selectedTabInfo = tabInfos.find((info) => info.type === selectedTab);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            건강 맞춤 식단 가이드
          </CardTitle>
          <CardDescription>
            입력하신 건강 정보를 바탕으로 맞춤형 칼로리 계산법과 식단 가이드를 제공합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={selectedTab || undefined}
            onValueChange={(value) => setSelectedTab(value as HealthTabType)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-6">
              {tabInfos.map((tabInfo) => (
                <TabsTrigger
                  key={tabInfo.type}
                  value={tabInfo.type}
                  className="flex flex-col items-center gap-1 py-3"
                >
                  <span className="text-2xl">{tabInfo.icon}</span>
                  <span className="text-xs md:text-sm">{tabInfo.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {tabInfos.map((tabInfo) => (
              <TabsContent key={tabInfo.type} value={tabInfo.type} className="space-y-6">
                <div className="space-y-6">
                  {/* 칼로리 계산법 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        칼로리 계산법
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">계산 공식</h4>
                        <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                          {tabInfo.content.calorieCalculation.formula}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">설명</h4>
                        <p className="text-sm text-muted-foreground">
                          {tabInfo.content.calorieCalculation.explanation}
                        </p>
                      </div>
                      {tabInfo.content.calorieCalculation.steps && (
                        <div>
                          <h4 className="font-semibold mb-2">계산 단계</h4>
                          <ol className="list-decimal list-inside space-y-2 text-sm">
                            {tabInfo.content.calorieCalculation.steps.map((step, index) => (
                              <li key={index} className="space-y-1">
                                <span className="font-medium">{step.description}</span>
                                {step.calculation && (
                                  <div className="ml-4 mt-1 bg-muted p-2 rounded text-xs font-mono">
                                    {step.calculation}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {tabInfo.content.calorieCalculation.example && (
                        <div>
                          <h4 className="font-semibold mb-2">예시</h4>
                          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm">
                            {tabInfo.content.calorieCalculation.example}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* 주의사항 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        주의사항
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {tabInfo.content.precautions.map((precaution, index) => (
                          <Alert
                            key={index}
                            variant={precaution.severity === 'high' ? 'destructive' : 'default'}
                          >
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>{precaution.title}</AlertTitle>
                            <AlertDescription>{precaution.description}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 영양소 가이드라인 */}
                  <Card>
                    <CardHeader>
                      <CardTitle>영양소 가이드라인</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-3">3대 영양소 비율</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="font-semibold text-blue-900 mb-1">탄수화물</div>
                            <div className="text-2xl font-bold text-blue-700">
                              {tabInfo.content.nutritionGuidelines.macronutrients.carbs.min}-
                              {tabInfo.content.nutritionGuidelines.macronutrients.carbs.max}
                              {tabInfo.content.nutritionGuidelines.macronutrients.carbs.unit}
                            </div>
                            {tabInfo.content.nutritionGuidelines.macronutrients.carbs.description && (
                              <div className="text-xs text-blue-600 mt-1">
                                {tabInfo.content.nutritionGuidelines.macronutrients.carbs.description}
                              </div>
                            )}
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="font-semibold text-green-900 mb-1">단백질</div>
                            <div className="text-2xl font-bold text-green-700">
                              {tabInfo.content.nutritionGuidelines.macronutrients.protein.min}-
                              {tabInfo.content.nutritionGuidelines.macronutrients.protein.max}
                              {tabInfo.content.nutritionGuidelines.macronutrients.protein.unit}
                            </div>
                            {tabInfo.content.nutritionGuidelines.macronutrients.protein.description && (
                              <div className="text-xs text-green-600 mt-1">
                                {tabInfo.content.nutritionGuidelines.macronutrients.protein.description}
                              </div>
                            )}
                          </div>
                          <div className="bg-orange-50 p-4 rounded-lg">
                            <div className="font-semibold text-orange-900 mb-1">지방</div>
                            <div className="text-2xl font-bold text-orange-700">
                              {tabInfo.content.nutritionGuidelines.macronutrients.fat.min}-
                              {tabInfo.content.nutritionGuidelines.macronutrients.fat.max}
                              {tabInfo.content.nutritionGuidelines.macronutrients.fat.unit}
                            </div>
                            {tabInfo.content.nutritionGuidelines.macronutrients.fat.description && (
                              <div className="text-xs text-orange-600 mt-1">
                                {tabInfo.content.nutritionGuidelines.macronutrients.fat.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {tabInfo.content.nutritionGuidelines.micronutrients && (
                        <div>
                          <h4 className="font-semibold mb-3">미네랄 제한</h4>
                          <div className="space-y-2">
                            {tabInfo.content.nutritionGuidelines.micronutrients.sodium && (
                              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                                <span className="font-medium">나트륨</span>
                                <Badge variant="outline">
                                  최대 {tabInfo.content.nutritionGuidelines.micronutrients.sodium.max}
                                  {tabInfo.content.nutritionGuidelines.micronutrients.sodium.unit}
                                </Badge>
                              </div>
                            )}
                            {tabInfo.content.nutritionGuidelines.micronutrients.potassium && (
                              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                                <span className="font-medium">칼륨</span>
                                <Badge variant="outline">
                                  최대 {tabInfo.content.nutritionGuidelines.micronutrients.potassium.max}
                                  {tabInfo.content.nutritionGuidelines.micronutrients.potassium.unit}
                                </Badge>
                              </div>
                            )}
                            {tabInfo.content.nutritionGuidelines.micronutrients.phosphorus && (
                              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                                <span className="font-medium">인</span>
                                <Badge variant="outline">
                                  최대 {tabInfo.content.nutritionGuidelines.micronutrients.phosphorus.max}
                                  {tabInfo.content.nutritionGuidelines.micronutrients.phosphorus.unit}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* 제외/권장 식품 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                          <XCircle className="h-5 w-5" />
                          피해야 할 식품
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {tabInfo.content.excludedFoods.map((food, index) => (
                            <div key={index} className="p-2 bg-red-50 rounded border border-red-200">
                              <div className="font-medium text-red-900">{food.name}</div>
                              <div className="text-xs text-red-700 mt-1">{food.reason}</div>
                              {food.category && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {food.category}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-5 w-5" />
                          권장 식품
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {tabInfo.content.recommendedFoods.map((food, index) => (
                            <div key={index} className="p-2 bg-green-50 rounded border border-green-200">
                              <div className="font-medium text-green-900">{food.name}</div>
                              <div className="text-xs text-green-700 mt-1">{food.benefit}</div>
                              {food.category && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {food.category}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 식사 계획 팁 */}
                  {tabInfo.content.mealPlanningTips.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>식사 계획 팁</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {tabInfo.content.mealPlanningTips.map((tip, index) => (
                            <div key={index} className="flex gap-3">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{tip.tip}</div>
                                {tip.description && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {tip.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 참고 자료 */}
                  {tabInfo.content.references && tabInfo.content.references.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>참고 자료</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {tabInfo.content.references.map((ref, index) => (
                            <li key={index}>{ref}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
