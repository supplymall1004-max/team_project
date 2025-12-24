/**
 * @file components/health/character/important-info-panel.tsx
 * @description 중요 정보 패널 컴포넌트
 *
 * 캐릭터창의 중요한 건강 정보를 표시합니다.
 * - 질병 목록
 * - 알레르기 목록
 * - 건강 점수 및 상태
 *
 * @dependencies
 * - @/components/ui/card: Card, CardContent, CardHeader, CardTitle
 * - @/lib/utils: cn
 * - @/types/character: CharacterData
 * - @/types/family: DISEASE_LABELS, ALLERGY_LABELS
 */

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, Heart, Shield } from "lucide-react";
import { DISEASE_LABELS, ALLERGY_LABELS } from "@/types/family";
import type { CharacterData } from "@/types/character";
import { motion } from "framer-motion";
import { cardHoverVariants, neonColors } from "@/lib/animations/character-animations";

interface ImportantInfoPanelProps {
  data: CharacterData["importantInfo"];
  className?: string;
}

/**
 * 건강 상태별 색상 및 텍스트
 */
function getHealthStatusInfo(
  status: CharacterData["importantInfo"]["health_status"]
) {
  switch (status) {
    case "excellent":
      return {
        color: "text-green-400",
        bgColor: "bg-green-400/20",
        borderColor: "border-green-400/50",
        label: "우수",
      };
    case "good":
      return {
        color: "text-blue-400",
        bgColor: "bg-blue-400/20",
        borderColor: "border-blue-400/50",
        label: "양호",
      };
    case "fair":
      return {
        color: "text-yellow-400",
        bgColor: "bg-yellow-400/20",
        borderColor: "border-yellow-400/50",
        label: "보통",
      };
    case "needs_attention":
      return {
        color: "text-red-400",
        bgColor: "bg-red-400/20",
        borderColor: "border-red-400/50",
        label: "주의 필요",
      };
  }
}

/**
 * 중요 정보 패널 컴포넌트
 */
export function ImportantInfoPanel({
  data,
  className,
}: ImportantInfoPanelProps) {
  const statusInfo = getHealthStatusInfo(data.health_status);
  const neonColor = neonColors[data.health_status];

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
        style={{
          boxShadow: `0 0 15px ${neonColor.glow}`,
        }}
      >
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          중요 정보
        </CardTitle>
        <CardDescription className="text-gray-400">
          질병, 알레르기, 건강 점수
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 건강 점수 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Heart className="w-4 h-4" />
              <span>건강 점수</span>
            </div>
            <div
              className={cn(
                "px-3 py-1 rounded-full text-sm font-bold",
                statusInfo.bgColor,
                statusInfo.color,
                statusInfo.borderColor,
                "border"
              )}
            >
              {data.health_score}점 ({statusInfo.label})
            </div>
          </div>
        </div>

        {/* 질병 목록 */}
        {data.diseases.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>질병</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.diseases.map((disease, index) => (
                <Badge
                  key={index}
                  variant="destructive"
                  className="bg-red-500/20 text-red-400 border-red-500/50"
                >
                  {DISEASE_LABELS[disease] || disease}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 알레르기 목록 */}
        {data.allergies.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Shield className="w-4 h-4" />
              <span>알레르기</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.allergies.map((allergy, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                >
                  {ALLERGY_LABELS[allergy] || allergy}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 정보 없음 */}
        {data.diseases.length === 0 && data.allergies.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            등록된 질병 및 알레르기 정보가 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
    </motion.div>
  );
}

