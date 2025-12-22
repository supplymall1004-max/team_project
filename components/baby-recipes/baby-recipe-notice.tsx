/**
 * @file baby-recipe-notice.tsx
 * @description 이유식 레시피 안내 배너 컴포넌트
 *
 * docs/baby.md 내용을 바탕으로 이유식에 대한 기본 정보와 주의사항을 표시합니다.
 *
 * 주요 기능:
 * 1. 이유식의 목표 및 중요성 안내
 * 2. 단계별 진행 방법 요약
 * 3. 핵심 주의사항 강조
 * 4. 알레르기 테스트 원칙 안내
 *
 * @dependencies
 * - React 19
 * - Tailwind CSS v4
 * - lucide-react (아이콘)
 */

"use client";

import { AlertCircle, Info, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function BabyRecipeNotice() {
  console.log("[BabyRecipeNotice] 이유식 안내 배너 렌더링");

  return (
    <div className="space-y-6 mb-8 pt-4">
      {/* 주요 안내 */}
      <Alert className="border-pink-200 bg-pink-50">
        <Info className="h-4 w-4 text-pink-600" />
        <AlertTitle className="text-pink-900 font-semibold">
          이유식 시작 전 꼭 알아두세요
        </AlertTitle>
        <AlertDescription className="text-pink-800 mt-2">
          이유식은 아기가 모유나 분유 외의 음식을 처음으로 접하는 중요한 단계입니다.
          새로운 재료는 <strong>5~7일 간격으로 1가지씩만</strong> 추가하여 알레르기 반응을 확인하세요.
        </AlertDescription>
      </Alert>

      {/* 탭으로 정보 구성 */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="stages">단계별</TabsTrigger>
          <TabsTrigger value="important">주의사항</TabsTrigger>
          <TabsTrigger value="avoid">금지사항</TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                이유식의 목표
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <div>
                  <strong>영양 보충:</strong> 성장하면서 모유/분유만으로는 부족해지는 철분, 비타민 등 필수 영양소를 공급합니다.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <div>
                  <strong>씹고 삼키는 능력 발달:</strong> 구강 근육을 발달시키고 씹는 연습을 통해 언어 발달과 소화 기능 향상에 도움을 줍니다.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <div>
                  <strong>다양한 맛 경험:</strong> 다양한 식재료의 맛과 질감을 경험하게 하여 편식을 예방합니다.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <div>
                  <strong>성장 발달:</strong> 스스로 먹는 연습을 통해 자율성과 독립심을 기르는 데 도움을 줍니다.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                시작 시기
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                일반적으로 <strong>생후 4~6개월 사이</strong>에 시작하는 것이 권장됩니다.
                아기가 머리를 가눌 수 있고, 음식에 관심을 보이며, 혀 내밀기 반사가 줄어들면 시작할 준비가 된 것입니다.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 단계별 탭 */}
        <TabsContent value="stages" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 초기 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">초기 (4~6개월)</CardTitle>
                <CardDescription>매우 묽은 미음</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>질감:</strong> 모유/분유보다 약간 걸쭉하게</p>
                <p><strong>재료 크기:</strong> 고운 체에 거른 쌀가루/곡물</p>
                <p><strong>횟수:</strong> 1회 (오전 시간)</p>
                <p><strong>팁:</strong> 쌀 미음으로 시작하여 5~7일 간격으로 새로운 재료 1가지씩 추가</p>
              </CardContent>
            </Card>

            {/* 중기 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">중기 (7~8개월)</CardTitle>
                <CardDescription>약간 걸쭉한 죽</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>질감:</strong> 요구르트 농도</p>
                <p><strong>재료 크기:</strong> 작은 알갱이 (2~3mm)</p>
                <p><strong>횟수:</strong> 2회</p>
                <p><strong>팁:</strong> 다양한 재료(닭고기 등)를 섞어주고, 이유식 전에 모유/분유를 너무 많이 주지 않기</p>
              </CardContent>
            </Card>

            {/* 후기 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">후기 (9~11개월)</CardTitle>
                <CardDescription>진밥 (씹는 연습 시작)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>질감:</strong> 진밥</p>
                <p><strong>재료 크기:</strong> 콩알 크기 (5~7mm)</p>
                <p><strong>횟수:</strong> 3회</p>
                <p><strong>팁:</strong> 소고기, 생선 등 단백질을 적극적으로 사용하고, 간식 포함 다양한 식단 시도</p>
              </CardContent>
            </Card>

            {/* 완료기 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">완료기 (12개월+)</CardTitle>
                <CardDescription>일반 밥/국</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>질감:</strong> 어른 식단과 유사</p>
                <p><strong>재료 크기:</strong> 1cm 정도</p>
                <p><strong>횟수:</strong> 3회 + 간식</p>
                <p><strong>팁:</strong> 식재료를 다양화하고, 유아식으로 전환하며, 숟가락 사용 연습 시키기</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 주의사항 탭 */}
        <TabsContent value="important" className="space-y-4">
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                핵심 주의사항 3가지
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-amber-900 mb-2">1. 알레르기 테스트 및 새로운 재료 추가 원칙</h4>
                <p className="text-amber-800 text-sm">
                  새로운 재료는 <strong>5~7일 간격으로 1가지씩만</strong> 추가해야 합니다.
                  만약 아기가 알레르기 반응(두드러기, 구토, 설사 등)을 보였을 때, 어떤 재료가 원인인지 쉽게 파악하기 위해서입니다.
                  곡류(쌀) → 채소 → 고기(소고기, 닭고기) → 과일 순서로 시도하는 것이 일반적입니다.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-amber-900 mb-2">2. 철분 공급</h4>
                <p className="text-amber-800 text-sm">
                  생후 6개월 이후부터 아기가 엄마로부터 받은 철분이 고갈되기 시작합니다.
                  <strong>소고기는 이유식에 필수적인 식재료</strong>입니다. 초기 단계부터 소고기를 미음 형태로 만들어 꾸준히 먹여야 합니다.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-amber-900 mb-2">3. 위생 및 신선도</h4>
                <p className="text-amber-800 text-sm">
                  이유식 도구(칼, 도마, 냄비)는 어른 것과 분리하여 사용하고, 조리 전후로 <strong>손을 깨끗하게 씻어야 합니다.</strong>
                  한 번에 대량으로 만들기보다는, <strong>2~3일치 분량</strong>을 만들어 냉장 보관하고, 남은 재료는 냉동 보관하는 것이 안전합니다.
                  보관 시 <strong>밀폐 용기</strong>에 담아 날짜를 기재하는 습관이 좋습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 금지사항 탭 */}
        <TabsContent value="avoid" className="space-y-4">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <XCircle className="h-5 w-5 text-red-600" />
                피해야 할 것
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-red-900">소금, 설탕, 간장 등 인공 조미료</strong>
                  <p className="text-red-800 text-sm mt-1">
                    아기의 신장(콩팥)에 부담을 주고, 미각 발달에 좋지 않습니다. (만 1세 이후 소량 사용 가능)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-red-900">꿀</strong>
                  <p className="text-red-800 text-sm mt-1">
                    만 1세 미만 아기에게는 &apos;보툴리눔균&apos; 감염 위험이 있어 <strong>절대 먹이면 안 됩니다.</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-red-900">흰자</strong>
                  <p className="text-red-800 text-sm mt-1">
                    알레르기 유발 가능성이 높아, 보통 돌 이후에 시도하는 것을 권장합니다. 노른자는 초기 이유식부터 가능합니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-red-900">과도한 육수/물</strong>
                  <p className="text-red-800 text-sm mt-1">
                    지나친 물은 영양 밀도를 낮추므로, 적절한 농도를 유지해야 합니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
