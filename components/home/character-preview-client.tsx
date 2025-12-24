/**
 * @file components/home/character-preview-client.tsx
 * @description 홈페이지 캐릭터창 미리보기 클라이언트 컴포넌트
 *
 * framer-motion을 사용하는 클라이언트 컴포넌트입니다.
 * 서버 컴포넌트인 CharacterPreview에서 데이터를 받아 애니메이션과 함께 표시합니다.
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { User } from "lucide-react";
import { motion } from "framer-motion";
import {
  cardHoverVariants,
  panelContainerVariants,
  panelStaggerVariants,
  neonColors,
} from "@/lib/animations/character-animations";

/**
 * 건강 상태별 네온 색상
 */
function getHealthStatusColor(status: "excellent" | "good" | "fair" | "needs_attention") {
  const neonColor = neonColors[status];
  return {
    border: neonColor.border,
    text: neonColor.text,
    shadow: neonColor.shadow,
    glow: neonColor.glow,
  };
}

/**
 * 건강 점수 배지 컴포넌트
 */
function HealthScoreBadge({
  score,
  status,
}: {
  score: number | null;
  status: "excellent" | "good" | "fair" | "needs_attention";
}) {
  if (score === null) {
    return (
      <div className="text-sm text-muted-foreground">점수 없음</div>
    );
  }

  const healthColor = getHealthStatusColor(status);

  return (
    <motion.div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
        "bg-black/20 backdrop-blur-sm border-2",
        healthColor.border,
        healthColor.text,
        "shadow-lg"
      )}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{
        boxShadow: `0 0 10px ${healthColor.glow}`,
      }}
    >
      <span>{score}점</span>
    </motion.div>
  );
}

/**
 * 캐릭터 카드 컴포넌트
 */
function CharacterCard({
  id,
  name,
  photo_url,
  avatar_type,
  health_score,
  health_status,
  relationship,
  age,
}: {
  id: string;
  name: string;
  photo_url: string | null;
  avatar_type: "photo" | "icon";
  health_score: number | null;
  health_status: "excellent" | "good" | "fair" | "needs_attention";
  relationship: string | null;
  age: number;
}) {
  const memberPath = `/health/family/${id}/character`;
  const healthColor = getHealthStatusColor(health_status);

  return (
    <motion.div
      variants={panelStaggerVariants}
      initial="initial"
      animate="animate"
    >
      <Link href={memberPath}>
        <motion.div
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
        >
          <Card
            className={cn(
              "group relative overflow-hidden",
              "bg-gradient-to-br from-gray-900/90 to-gray-800/90",
              "border-2",
              healthColor.border,
              "transition-all duration-300",
              "cursor-pointer"
            )}
            style={{
              boxShadow: `0 0 15px ${healthColor.glow}`,
            }}
          >
            <CardContent className="p-4">
              <div className="flex flex-col items-center gap-3">
                {/* 아바타 */}
                <motion.div
                  className={cn(
                    "relative w-20 h-20 rounded-full",
                    "border-2",
                    healthColor.border,
                    "shadow-lg",
                    "overflow-hidden"
                  )}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  style={{
                    boxShadow: `0 0 20px ${healthColor.glow}`,
                  }}
                >
                  {avatar_type === "photo" && photo_url ? (
                    <Image
                      src={photo_url}
                      alt={name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </motion.div>

                {/* 이름 및 관계 */}
                <div className="text-center">
                  <h3 className="font-bold text-white text-sm">{name}</h3>
                  {relationship && (
                    <p className="text-xs text-gray-400">{relationship}</p>
                  )}
                  {age > 0 && (
                    <p className="text-xs text-gray-500">{age}세</p>
                  )}
                </div>

                {/* 건강 점수 */}
                <HealthScoreBadge score={health_score} status={health_status} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Link>
    </motion.div>
  );
}

/**
 * 캐릭터 카드 목록 타입
 */
export interface CharacterCardData {
  id: string;
  name: string;
  photo_url: string | null;
  avatar_type: "photo" | "icon";
  health_score: number | null;
  health_status: "excellent" | "good" | "fair" | "needs_attention";
  relationship: string | null;
  age: number;
}

/**
 * 홈페이지 캐릭터창 미리보기 클라이언트 컴포넌트
 */
export function CharacterPreviewClient({
  cards,
}: {
  cards: CharacterCardData[];
}) {
  return (
    <motion.div
      className="space-y-6"
      variants={panelContainerVariants}
      initial="initial"
      animate="animate"
    >
      {/* 가족 구성원 캐릭터 카드 그리드 */}
      {cards.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {cards.map((card) => (
            <CharacterCard key={card.id} {...card} />
          ))}
        </div>
      ) : (
        <motion.div
          className="text-center py-12 text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p>가족 구성원이 없습니다.</p>
          <p className="text-sm mt-2">
            건강 관리 페이지에서 가족 구성원을 추가해주세요.
          </p>
        </motion.div>
      )}

      {/* 전체보기 버튼 */}
      <motion.div
        className="flex justify-center pt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <motion.div
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Link
            href="/health/dashboard"
            className={cn(
              "inline-block px-6 py-3 rounded-lg",
              "bg-green-600 hover:bg-green-700",
              "text-white font-medium",
              "transition-colors duration-200",
              "shadow-lg hover:shadow-xl"
            )}
          >
            건강 대시보드 전체보기 →
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

