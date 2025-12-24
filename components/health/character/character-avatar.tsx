/**
 * @file components/health/character/character-avatar.tsx
 * @description 캐릭터 아바타 컴포넌트
 *
 * 게임 HUD 스타일의 캐릭터 아바타를 표시합니다.
 * - 사진 또는 아이콘 폴백 지원
 * - 건강 상태에 따른 테두리 색상 변경
 * - 게임 스타일 장식 효과 (건강 점수 배지)
 * - 호버 효과 및 애니메이션
 *
 * @dependencies
 * - @/components/ui/avatar: Avatar, AvatarImage, AvatarFallback
 * - @/lib/utils: cn
 * - next/image: Image
 * - lucide-react: User, Baby, GraduationCap
 */

"use client";

import Image from "next/image";
import { User, Baby, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CharacterData } from "@/types/character";

interface CharacterAvatarProps {
  member: CharacterData["member"];
  healthStatus: CharacterData["importantInfo"]["health_status"];
  healthScore: number;
  size?: "sm" | "md" | "lg" | "xl";
  showBadge?: boolean;
  className?: string;
}

/**
 * 나이 기반 아이콘 선택
 */
function getAgeBasedIcon(age: number, gender: string | null) {
  if (age < 7) {
    return <Baby className="w-full h-full text-yellow-400" />;
  }
  if (age < 20) {
    return <GraduationCap className="w-full h-full text-blue-400" />;
  }
  return <User className="w-full h-full text-gray-400" />;
}

/**
 * 건강 상태별 테두리 색상
 */
function getHealthBorderColor(
  status: CharacterData["importantInfo"]["health_status"]
) {
  switch (status) {
    case "excellent":
      return "border-green-400 shadow-green-400/50";
    case "good":
      return "border-blue-400 shadow-blue-400/50";
    case "fair":
      return "border-yellow-400 shadow-yellow-400/50";
    case "needs_attention":
      return "border-red-400 shadow-red-400/50";
  }
}

/**
 * 크기별 클래스
 */
function getSizeClasses(size: "sm" | "md" | "lg" | "xl") {
  switch (size) {
    case "sm":
      return "w-16 h-16";
    case "md":
      return "w-20 h-20";
    case "lg":
      return "w-32 h-32";
    case "xl":
      return "w-40 h-40";
  }
}

/**
 * 캐릭터 아바타 컴포넌트
 */
export function CharacterAvatar({
  member,
  healthStatus,
  healthScore,
  size = "lg",
  showBadge = true,
  className,
}: CharacterAvatarProps) {
  const sizeClasses = getSizeClasses(size);
  const borderColor = getHealthBorderColor(healthStatus);
  const age = member.birth_date
    ? new Date().getFullYear() - new Date(member.birth_date).getFullYear()
    : 0;

  const hasPhoto =
    member.avatar_type === "photo" && member.photo_url;

  return (
    <div className={cn("relative", className)}>
      {/* 아바타 원형 프레임 */}
      <div
        className={cn(
          "relative rounded-full overflow-hidden",
          "border-4",
          borderColor,
          "shadow-lg",
          "bg-gradient-to-br from-gray-800 to-gray-900",
          sizeClasses,
          "group-hover:scale-110 transition-transform duration-300",
          "group"
        )}
      >
        {hasPhoto ? (
          <Image
            src={member.photo_url!}
            alt={member.name}
            fill
            className="object-cover"
            sizes={`${size === "sm" ? "64px" : size === "md" ? "80px" : size === "lg" ? "128px" : "160px"}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            {getAgeBasedIcon(age, member.gender)}
          </div>
        )}
      </div>

      {/* 건강 점수 배지 (게임 스타일) */}
      {showBadge && (
        <div
          className={cn(
            "absolute -top-1 -right-1",
            "w-8 h-8 rounded-full",
            "bg-gradient-to-br from-yellow-400 to-yellow-600",
            "border-2 border-white",
            "shadow-md",
            "flex items-center justify-center",
            "group-hover:scale-110 transition-transform duration-300"
          )}
        >
          <span className="text-xs font-bold text-yellow-900">
            {healthScore}
          </span>
        </div>
      )}

      {/* 네온 효과 (호버 시) */}
      <div
        className={cn(
          "absolute inset-0 rounded-full",
          "opacity-0 group-hover:opacity-100",
          "transition-opacity duration-300",
          "pointer-events-none",
          borderColor.replace("border-", "shadow-").replace("shadow-", "shadow-[0_0_20px_")
        )}
        style={{
          boxShadow: `0 0 20px ${
            healthStatus === "excellent"
              ? "rgba(74, 222, 128, 0.5)"
              : healthStatus === "good"
                ? "rgba(96, 165, 250, 0.5)"
                : healthStatus === "fair"
                  ? "rgba(250, 204, 21, 0.5)"
                  : "rgba(248, 113, 113, 0.5)"
          }`,
        }}
      />
    </div>
  );
}

