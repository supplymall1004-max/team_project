/**
 * @file components/health/character/basic-info-panel.tsx
 * @description 기본 정보 패널 컴포넌트
 *
 * 캐릭터창의 기본 건강 정보를 표시합니다.
 * - 이름, 나이
 * - 키, 체중
 * - 체지방율, 근육량
 * - BMI
 *
 * @dependencies
 * - @/components/ui/card: Card, CardContent, CardHeader, CardTitle
 * - @/lib/utils: cn
 * - @/types/character: CharacterData
 */

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Ruler, Weight, Activity, Calculator } from "lucide-react";
import type { CharacterData } from "@/types/character";
import { motion } from "framer-motion";
import { cardHoverVariants } from "@/lib/animations/character-animations";

interface BasicInfoPanelProps {
  data: CharacterData["basicInfo"];
  className?: string;
}

/**
 * 기본 정보 패널 컴포넌트
 */
export function BasicInfoPanel({
  data,
  className,
}: BasicInfoPanelProps) {
  return (
    <motion.div
      variants={cardHoverVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
    >
      <Card
        className={cn(
          "bg-gradient-to-br from-gray-800/90 to-gray-900/90",
          "border-gray-700/50",
          "backdrop-blur-sm",
          "transition-all duration-300",
          className
        )}
      >
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-400" />
          기본 정보
        </CardTitle>
        <CardDescription className="text-gray-400">
          건강 관리 기본 지표
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 나이 */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <span>나이</span>
            </div>
            <p className="text-2xl font-bold text-white">{data.age}세</p>
          </div>

          {/* 키 */}
          {data.height_cm && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Ruler className="w-4 h-4" />
                <span>키</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {data.height_cm}cm
              </p>
            </div>
          )}

          {/* 체중 */}
          {data.weight_kg && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Weight className="w-4 h-4" />
                <span>체중</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {data.weight_kg}kg
              </p>
            </div>
          )}

          {/* BMI */}
          {data.bmi && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Calculator className="w-4 h-4" />
                <span>BMI</span>
              </div>
              <p className="text-2xl font-bold text-white">{data.bmi}</p>
              <p className="text-xs text-gray-500">
                {data.bmi < 18.5
                  ? "저체중"
                  : data.bmi < 23
                    ? "정상"
                    : data.bmi < 25
                      ? "과체중"
                      : "비만"}
              </p>
            </div>
          )}

          {/* 체지방율 */}
          {data.body_fat_percentage && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Activity className="w-4 h-4" />
                <span>체지방율</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {data.body_fat_percentage}%
              </p>
            </div>
          )}

          {/* 근육량 */}
          {data.muscle_mass_kg && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Activity className="w-4 h-4" />
                <span>근육량</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {data.muscle_mass_kg}kg
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}

