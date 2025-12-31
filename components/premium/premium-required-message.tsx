/**
 * @file premium-required-message.tsx
 * @description 프리미엄 필수 안내 메시지 컴포넌트
 * 
 * 프리미엄이 필요한 기능에 대한 안내 메시지를 표시합니다.
 */

"use client";

import Link from "next/link";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PremiumRequiredMessageProps {
  title?: string;
  message?: string;
  featureName?: string;
}

export function PremiumRequiredMessage({
  title = "프리미엄 회원 전용 기능",
  message = "이 기능을 이용하시려면 프리미엄 구독이 필요합니다.",
  featureName,
}: PremiumRequiredMessageProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-orange-500 p-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-orange-900 flex items-center justify-center gap-2">
          <Crown className="w-6 h-6 text-orange-600" />
          {title}
        </CardTitle>
        <CardDescription className="text-base text-orange-800 mt-2">
          {message}
        </CardDescription>
        {featureName && (
          <CardDescription className="text-sm text-orange-700 mt-1">
            {featureName}은(는) 프리미엄 회원만 이용할 수 있습니다.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white rounded-lg p-4 border border-orange-200">
          <h3 className="font-semibold text-orange-900 mb-2">프리미엄 혜택</h3>
          <ul className="space-y-2 text-sm text-orange-800">
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">✓</span>
              <span>광고 없는 HD 영상 시청</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">✓</span>
              <span>가족 맞춤 건강 식단 추천</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">✓</span>
              <span>예방접종 안내 및 맞춤 일정</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">✓</span>
              <span>북마크 무제한</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">✓</span>
              <span>전체 식단 히스토리</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">✓</span>
              <span>주간 식단 PDF 다운로드</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">✓</span>
              <span>월간 영양 리포트</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">✓</span>
              <span>우선 고객 지원</span>
            </li>
          </ul>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            size="lg"
          >
            <Link href="/pricing">
              <Crown className="w-4 h-4 mr-2" />
              프리미엄 구독하기
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-50"
            size="lg"
          >
            <Link href="/">
              홈으로 돌아가기
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

