/**
 * @file allergen-warning-card.tsx
 * @description 알레르기 증상 및 대처방법 안내 카드 컴포넌트
 *
 * 주요 기능:
 * 1. 알레르기 증상 분류 (가벼운 증상, 중증 증상)
 * 2. 응급 대처 방법 안내
 * 3. 에피네프린 사용법 설명
 * 4. 119 신고 및 의료처치 안내
 */

"use client";

import { useState } from "react";
import { AlertTriangle, Heart, Phone, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AllergenWarningCardProps {
  className?: string;
}

export function AllergenWarningCard({ className }: AllergenWarningCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={`border-amber-200 bg-amber-50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Shield className="h-5 w-5 text-amber-600" />
          알레르기 안전 안내
        </CardTitle>
        <p className="text-sm text-amber-700">
          음식 알레르기 반응 시 즉각적인 대처가 중요합니다
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 기본 안내 */}
        <div className="rounded-lg bg-white p-4 border border-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-semibold text-amber-800">알레르기 반응의 특징</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• 사람마다 다르게 나타날 수 있으며, 몇 분~몇 시간 이내 증상 발생</li>
                <li>• 가벼운 증상이라도 여러 신체 부위에서 동시 발생 시 주의 필요</li>
                <li>• 증상이 심해지면 생명을 위협하는 아나필락시스 쇼크로 진행될 수 있음</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 증상 분류 및 대처 방법 */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between border-amber-300 text-amber-800 hover:bg-amber-100">
              <span className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                증상 분류 및 대처 방법 자세히 보기
              </span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-4 mt-4">
            {/* 가벼운 증상 */}
            <div className="rounded-lg bg-white p-4 border border-amber-200">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                가벼운 증상 (Mild Symptoms)
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-amber-800 mb-2">피부 증상</p>
                  <ul className="text-amber-700 space-y-1">
                    <li>• 두드러기 (부풀어 오르고 가려움)</li>
                    <li>• 가벼운 발진</li>
                    <li>• 피부 따끔거림</li>
                    <li>• 입 주변, 눈 부위 약간의 부기</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-amber-800 mb-2">소화기/호흡기 증상</p>
                  <ul className="text-amber-700 space-y-1">
                    <li>• 입술이나 입속 따끔거림/가려움</li>
                    <li>• 가벼운 메스꺼움, 복부 불편감</li>
                    <li>• 콧물, 재채기, 코막힘</li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-200">
                <p className="font-medium text-green-800 mb-1">✅ 대처 방법:</p>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>1. 알레르기 식품 섭취 즉시 중단</li>
                  <li>2. 의사의 처방에 따라 항히스타민제 복용</li>
                  <li>3. 증상이 호전되는지 면밀히 관찰</li>
                  <li>4. 중증 증상으로 진행될 경우 대비하여 에피네프린 준비</li>
                </ul>
              </div>
            </div>

            {/* 중증 증상 */}
            <div className="rounded-lg bg-white p-4 border border-red-200 bg-red-50">
              <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                중증 증상 및 아나필락시스 쇼크 (Severe Symptoms)
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="font-medium text-red-800 mb-2">호흡기 증상 (가장 위험)</p>
                  <ul className="text-red-700 space-y-1">
                    <li>• 숨 가쁨, 쌕쌕거림 (천식 발작처럼)</li>
                    <li>• 반복적인 기침</li>
                    <li>• 목이 조이는 느낌</li>
                    <li>• 목소리가 쉰 목소리로 변함</li>
                    <li>• 삼키기 어려움</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-red-800 mb-2">심혈관계/기타 증상</p>
                  <ul className="text-red-700 space-y-1">
                    <li>• 갑작스러운 혈압 저하</li>
                    <li>• 어지러움, 현기증, 실신</li>
                    <li>• 맥박 약해지거나 빨라짐</li>
                    <li>• 피부 창백해지거나 파랗게 변함</li>
                    <li>• 얼굴/혀/목 심한 부기 (기도 막힐 수 있음)</li>
                    <li>• 심한 복통, 구토, 설사</li>
                    <li>• 갑작스러운 불안감, 혼란</li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-red-200 pt-4">
                <h5 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  🆘 응급 대처 행동 수칙
                </h5>

                <div className="space-y-3">
                  {/* 1단계: 에피네프린 */}
                  <div className="p-3 bg-red-100 rounded-md border border-red-300">
                    <p className="font-medium text-red-800 mb-2">1단계: 에피네프린 주사</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• 아나필락시스 증상 의심 시 즉시 에피네프린 자동 주사기 사용</li>
                      <li>• 에피네프린은 증상 완화 지연시키는 다른 약물보다 먼저 사용</li>
                      <li>• 허벅지에 주사 (바지 위로 직접 찌르기)</li>
                      <li>• 증상이 호전되지 않거나 재발 시 5분 후 두 번째 주사 준비</li>
                    </ul>
                  </div>

                  {/* 2단계: 119 신고 */}
                  <div className="p-3 bg-blue-100 rounded-md border border-blue-300">
                    <p className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      2단계: 119 신고 및 도움 요청
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• 에피네프린 주사 후 즉시 119에 전화</li>
                      <li>• &ldquo;음식 알레르기로 인한 아나필락시스 쇼크&rdquo;라고 명확히 알리기</li>
                      <li>• 에피네프린 사용 사실 반드시 전달</li>
                      <li>• 환자를 편평한 곳에 눕히고 다리를 심장보다 높게 올리기</li>
                      <li>• 호흡 어려움/구토 시 옆으로 눕혀 기도 막히지 않게 하기</li>
                      <li>• 앉히거나 걸어 다니게 하지 말 것</li>
                    </ul>
                  </div>

                  {/* 3단계: 응급실 이송 */}
                  <div className="p-3 bg-green-100 rounded-md border border-green-300">
                    <p className="font-medium text-green-800 mb-2">3단계: 응급실 이송 및 관찰</p>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• 증상이 완화되었더라도 반드시 응급실로 이송</li>
                      <li>• &ldquo;이중 반응&rdquo; (증상 재발) 가능성이 있으므로 의료진 관찰 필수</li>
                      <li>• 섭취한 식품과 에피네프린 사용 정보 상세히 전달</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* 핵심 메시지 */}
        <div className="rounded-lg bg-red-100 p-4 border border-red-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-800">💡 핵심 요약</p>
              <p className="text-sm text-red-700 mt-1">
                에피네프린은 구급차보다 빠르고, 증상이 심해지기를 기다리지 말고 바로 사용해야 생명을 살릴 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 추가 안내 */}
        <div className="text-xs text-amber-600 bg-amber-100 p-3 rounded-md border border-amber-300">
          <p className="font-medium mb-1">📞 추가 안내</p>
          <p>알레르기 환자는 반드시 의사 또는 알레르기 전문의와 상담하여 개인화된 응급 처치 계획을 세우고 에피네프린 자동 주사기 처방을 받아 휴대해야 합니다.</p>
        </div>
      </CardContent>
    </Card>
  );
}

