/**
 * @file components/health/character/lifecycle-notifications-panel.tsx
 * @description 생애주기별 알림 패널 컴포넌트
 *
 * 캐릭터창의 생애주기별 알림을 표시합니다.
 * - 우선순위별 그룹화 (High/Medium/Low)
 * - 네온 효과 적용
 * - 간소화된 카드 형태
 *
 * @dependencies
 * - @/components/ui/card: Card, CardContent, CardHeader, CardTitle
 * - @/components/ui/badge: Badge
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BellRing, AlertCircle, Info } from "lucide-react";
import type { CharacterData } from "@/types/character";

interface LifecycleNotificationsPanelProps {
  data: CharacterData["lifecycleNotifications"];
  className?: string;
}

/**
 * 우선순위별 색상 및 아이콘
 */
function getPriorityConfig(priority: "high" | "urgent" | "normal" | "medium" | "low") {
  if (priority === "high" || priority === "urgent") {
    return {
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/50",
      shadowColor: "shadow-[0_0_15px_rgba(239,68,68,0.4)]",
      label: priority === "urgent" ? "긴급" : "높음",
      icon: AlertCircle,
    };
  }
  if (priority === "normal" || priority === "medium") {
    return {
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/50",
      shadowColor: "shadow-[0_0_15px_rgba(234,179,8,0.4)]",
      label: "보통",
      icon: BellRing,
    };
  }
  return {
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/50",
    shadowColor: "shadow-[0_0_15px_rgba(59,130,246,0.4)]",
    label: "낮음",
    icon: Info,
  };
}

/**
 * 생애주기별 알림 패널 컴포넌트
 */
export function LifecycleNotificationsPanel({
  data,
  className,
}: LifecycleNotificationsPanelProps) {
  const allNotifications = [
    ...data.high,
    ...data.medium,
    ...data.low,
  ];

  if (allNotifications.length === 0) {
    return (
      <Card
        className={cn(
          "bg-gradient-to-br from-gray-800/90 to-gray-900/90",
          "border-gray-700/50",
          "backdrop-blur-sm",
          className
        )}
      >
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BellRing className="w-5 h-5 text-purple-400" />
            생애주기별 알림
          </CardTitle>
          <CardDescription className="text-gray-400">
            현재 알림이 없습니다.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "bg-gradient-to-br from-gray-800/90 to-gray-900/90",
        "border-gray-700/50",
        "backdrop-blur-sm",
        className
      )}
    >
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BellRing className="w-5 h-5 text-purple-400" />
          생애주기별 알림
        </CardTitle>
        <CardDescription className="text-gray-400">
          높음: {data.high.length}개 · 보통: {data.medium.length}개 · 낮음:{" "}
          {data.low.length}개
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* High 우선순위 알림 */}
        {data.high.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-400 text-sm font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>높은 우선순위</span>
            </div>
            <div className="space-y-2">
              {data.high.slice(0, 3).map((notification) => {
                const config = getPriorityConfig(notification.priority);
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      config.bgColor,
                      config.borderColor,
                      "transition-all duration-200",
                      "hover:scale-[1.02]",
                      config.shadowColor
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={cn("w-4 h-4", config.color)} />
                          <h4 className={cn("font-semibold text-sm", config.color)}>
                            {notification.title}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          "text-xs ml-2",
                          config.bgColor,
                          config.color,
                          config.borderColor,
                          "border"
                        )}
                      >
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Medium 우선순위 알림 */}
        {data.medium.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-yellow-400 text-sm font-semibold">
              <BellRing className="w-4 h-4" />
              <span>보통 우선순위</span>
            </div>
            <div className="space-y-2">
              {data.medium.slice(0, 2).map((notification) => {
                const config = getPriorityConfig(notification.priority);
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      config.bgColor,
                      config.borderColor,
                      "transition-all duration-200",
                      "hover:scale-[1.02]"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={cn("w-4 h-4", config.color)} />
                          <h4 className={cn("font-semibold text-sm", config.color)}>
                            {notification.title}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          "text-xs ml-2",
                          config.bgColor,
                          config.color,
                          config.borderColor,
                          "border"
                        )}
                      >
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Low 우선순위 알림 (최대 1개만 표시) */}
        {data.low.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold">
              <Info className="w-4 h-4" />
              <span>낮은 우선순위</span>
            </div>
            <div className="space-y-2">
              {data.low.slice(0, 1).map((notification) => {
                const config = getPriorityConfig(notification.priority);
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      config.bgColor,
                      config.borderColor,
                      "transition-all duration-200",
                      "hover:scale-[1.02]"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={cn("w-4 h-4", config.color)} />
                          <h4 className={cn("font-semibold text-sm", config.color)}>
                            {notification.title}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          "text-xs ml-2",
                          config.bgColor,
                          config.color,
                          config.borderColor,
                          "border"
                        )}
                      >
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

