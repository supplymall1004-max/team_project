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
import { motion } from "framer-motion";
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
        {/* 뒤로가기 버튼 - GDWEB 스타일 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link href="/diet">
            <Button
              variant="ghost"
              className="mb-6 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              건강식단으로 돌아가기
            </Button>
          </Link>
        </motion.div>

        {/* 메인 카드 - GDWEB 스타일 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-6 shadow-2xl border-2 border-orange-200/50 overflow-hidden gdweb-card bg-gradient-to-br from-white via-orange-50/30 to-white backdrop-blur-md">
            <div className="grid md:grid-cols-2 gap-0">
              {/* 이미지 섹션 */}
              <motion.div
                className="relative aspect-square bg-gradient-to-br from-emerald-100 to-amber-100"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
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
              </motion.div>

              {/* 정보 섹션 */}
              <div className="p-8 flex flex-col justify-center">
                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-5xl">{fruit.emoji}</span>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                      {fruit.name}
                    </h1>
                  </div>
                  <p className="text-gray-600 text-lg">제철과일 상세 정보</p>
                </motion.div>

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
        </motion.div>

        {/* 영양 정보 카드 - GDWEB 스타일 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="mb-6 gdweb-card bg-gradient-to-br from-white via-orange-50/30 to-white backdrop-blur-md border-2 border-orange-200/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                <CheckCircle2 className="h-5 w-5 text-orange-600" />
                영양 정보
              </CardTitle>
              <CardDescription>{fruit.nutrition.servingSize} 기준</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                  className="text-center p-4 bg-white/80 rounded-xl border border-orange-100 hover:shadow-md transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -4 }}
                >
                  <div className="text-2xl font-bold text-orange-600">{fruit.nutrition.calories}</div>
                  <div className="text-sm text-gray-600">칼로리 (kcal)</div>
                </motion.div>
                <motion.div
                  className="text-center p-4 bg-white/80 rounded-xl border border-orange-100 hover:shadow-md transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -4 }}
                >
                  <div className="text-2xl font-bold text-orange-600">{fruit.nutrition.protein}g</div>
                  <div className="text-sm text-gray-600">단백질</div>
                </motion.div>
                <motion.div
                  className="text-center p-4 bg-white/80 rounded-xl border border-orange-100 hover:shadow-md transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -4 }}
                >
                  <div className="text-2xl font-bold text-orange-600">{fruit.nutrition.carbs}g</div>
                  <div className="text-sm text-gray-600">탄수화물</div>
                </motion.div>
                <motion.div
                  className="text-center p-4 bg-white/80 rounded-xl border border-orange-100 hover:shadow-md transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -4 }}
                >
                  <div className="text-2xl font-bold text-orange-600">{fruit.nutrition.fat}g</div>
                  <div className="text-sm text-gray-600">지방</div>
                </motion.div>
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
        </motion.div>

        {/* 건강 효능 카드 - GDWEB 스타일 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="mb-6 gdweb-card bg-gradient-to-br from-white via-orange-50/30 to-white backdrop-blur-md border-2 border-orange-200/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                <Heart className="h-5 w-5 text-orange-600 fill-orange-600" />
                건강 효능
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {fruit.benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <Badge
                      variant="secondary"
                      className="text-sm py-2 px-4 bg-gradient-to-br from-orange-100 to-orange-200 text-orange-800 border border-orange-300 hover:shadow-md transition-all duration-300"
                    >
                      {benefit}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

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
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  asChild
                  className="w-full bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{
                    boxShadow: "0 8px 32px rgba(255, 107, 53, 0.3)",
                  }}
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
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-2 border-orange-300 text-orange-700 hover:bg-gradient-to-br hover:from-orange-50 hover:to-orange-100 font-semibold transition-all duration-300"
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
              </motion.div>
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

