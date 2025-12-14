/**
 * @file components/snacks/fruit-detail-client.tsx
 * @description 제철과일 상세 정보 클라이언트 컴포넌트
 * 
 * 주요 기능:
 * 1. 제철과일 상세 정보 표시
 * 2. 영양 정보 및 건강 효능 표시
 * 3. 판매 안내 메시지 (미구현 기능 안내)
 */

"use client";

import Image from "next/image";
import { ArrowLeft, ShoppingCart, AlertCircle, Heart, Calendar, CheckCircle2, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Fruit } from "@/lib/diet/seasonal-fruits";

interface FruitDetailClientProps {
  fruit: Fruit;
}

const SEASON_LABELS: Record<number, string> = {
  1: "1월",
  2: "2월",
  3: "3월",
  4: "4월",
  5: "5월",
  6: "6월",
  7: "7월",
  8: "8월",
  9: "9월",
  10: "10월",
  11: "11월",
  12: "12월",
};

const AVAILABILITY_LABELS: Record<"high" | "medium" | "low", string> = {
  high: "구매 용이",
  medium: "보통",
  low: "구매 어려움",
};

const AVAILABILITY_COLORS: Record<"high" | "medium" | "low", string> = {
  high: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-red-100 text-red-800",
};

export function FruitDetailClient({ fruit }: FruitDetailClientProps) {
  const seasonLabels = fruit.season.map((month) => SEASON_LABELS[month]).join(", ");
  const isCurrentlyInSeason = fruit.season.includes(new Date().getMonth() + 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* 뒤로가기 버튼 */}
        <Link href="/diet">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            건강식단으로 돌아가기
          </Button>
        </Link>

        {/* 메인 카드 */}
        <Card className="mb-6 shadow-lg border-0 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* 이미지 섹션 */}
            <div className="relative aspect-square bg-gradient-to-br from-emerald-100 to-amber-100">
              {fruit.imageUrl ? (
                <Image
                  src={fruit.imageUrl}
                  alt={fruit.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-9xl">{fruit.emoji}</span>
                </div>
              )}
              
              {/* 제철 배지 */}
              {isCurrentlyInSeason && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-emerald-500 text-white px-3 py-1 text-sm">
                    <Calendar className="h-3 w-3 mr-1" />
                    제철
                  </Badge>
                </div>
              )}
            </div>

            {/* 정보 섹션 */}
            <div className="p-8 flex flex-col justify-center">
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-5xl">{fruit.emoji}</span>
                  <h1 className="text-4xl font-bold text-gray-900">{fruit.name}</h1>
                </div>
                <p className="text-gray-600 text-lg">제철과일 상세 정보</p>
              </div>

              {/* 제철 시기 */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  <span className="font-semibold text-gray-900">제철 시기</span>
                </div>
                <p className="text-gray-700 ml-7">{seasonLabels}</p>
              </div>

              {/* 구매 용이성 */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="h-5 w-5 text-emerald-600" />
                  <span className="font-semibold text-gray-900">구매 용이성</span>
                </div>
                <Badge className={AVAILABILITY_COLORS[fruit.availability]}>
                  {AVAILABILITY_LABELS[fruit.availability]}
                </Badge>
              </div>

              {/* 어린이 추천 */}
              {fruit.goodForKids && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
                    <span className="font-semibold text-gray-900">성장기 어린이 추천</span>
                  </div>
                  <p className="text-gray-700 ml-7 text-sm">{fruit.kidsBenefits}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* 영양 정보 카드 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              영양 정보
            </CardTitle>
            <CardDescription>{fruit.nutrition.servingSize} 기준</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-700">{fruit.nutrition.calories}</div>
                <div className="text-sm text-gray-600">칼로리 (kcal)</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{fruit.nutrition.protein}g</div>
                <div className="text-sm text-gray-600">단백질</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-700">{fruit.nutrition.carbs}g</div>
                <div className="text-sm text-gray-600">탄수화물</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">{fruit.nutrition.fat}g</div>
                <div className="text-sm text-gray-600">지방</div>
              </div>
            </div>
            
            {/* 추가 영양소 */}
            {(fruit.nutrition.vitaminC || fruit.nutrition.calcium || fruit.nutrition.iron || fruit.nutrition.potassium) && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {fruit.nutrition.vitaminC && (
                    <div>
                      <span className="text-gray-600">비타민C: </span>
                      <span className="font-semibold">{fruit.nutrition.vitaminC}mg</span>
                    </div>
                  )}
                  {fruit.nutrition.calcium && (
                    <div>
                      <span className="text-gray-600">칼슘: </span>
                      <span className="font-semibold">{fruit.nutrition.calcium}mg</span>
                    </div>
                  )}
                  {fruit.nutrition.iron && (
                    <div>
                      <span className="text-gray-600">철분: </span>
                      <span className="font-semibold">{fruit.nutrition.iron}mg</span>
                    </div>
                  )}
                  {fruit.nutrition.potassium && (
                    <div>
                      <span className="text-gray-600">칼륨: </span>
                      <span className="font-semibold">{fruit.nutrition.potassium}mg</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 건강 효능 카드 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              건강 효능
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {fruit.benefits.map((benefit, index) => (
                <Badge key={index} variant="secondary" className="text-sm py-1.5 px-3">
                  {benefit}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 질병 주의사항 */}
        {fruit.avoidForDiseases && fruit.avoidForDiseases.length > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="h-5 w-5" />
                주의사항
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-900">
                다음 질병이 있는 경우 섭취를 주의하거나 의사와 상담하세요:{" "}
                <span className="font-semibold">{fruit.avoidForDiseases.join(", ")}</span>
              </p>
            </CardContent>
          </Card>
        )}

        {/* 구매 링크 섹션 */}
        <Card className="mb-6 border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <ShoppingCart className="h-5 w-5" />
              제철과일 구매하기
            </CardTitle>
            <CardDescription className="text-emerald-800">
              신선한 제철과일을 다양한 플랫폼에서 구매하실 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                asChild
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <a
                  href={`https://www.coupang.com/np/search?q=${encodeURIComponent(fruit.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  쿠팡에서 구매하기
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              >
                <a
                  href={`https://search.shopping.naver.com/search/all?query=${encodeURIComponent(fruit.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  네이버 쇼핑에서 구매하기
                </a>
              </Button>
            </div>
            <Alert className="border-blue-200 bg-blue-50 mt-4">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-xs">
                외부 쇼핑몰로 이동합니다. 구매 시 가격과 배송 정보를 확인하시기 바랍니다.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

