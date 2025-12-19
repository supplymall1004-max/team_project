/**
 * @file components/health/dashboard/HealthAlertsList.tsx
 * @description 건강 알림 목록 컴포넌트
 *
 * 예방접종, 건강검진, 약물 복용, 독감 경보 등의 알림을 표시합니다.
 * integrated-health-dashboard.tsx에서 추출한 알림 기능입니다.
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Pill,
  Stethoscope,
  Calendar,
  Bell,
} from "lucide-react";
import type { HealthAlert } from "./types";

interface HealthAlertsListProps {
  alerts: HealthAlert[];
  className?: string;
}

/**
 * 알림 우선순위에 따른 아이콘 및 색상
 */
function getAlertIcon(type: HealthAlert["type"]) {
  switch (type) {
    case "vaccination":
      return { icon: Stethoscope, color: "text-blue-600" };
    case "checkup":
      return { icon: Calendar, color: "text-green-600" };
    case "medication":
      return { icon: Pill, color: "text-purple-600" };
    case "flu_alert":
      return { icon: AlertTriangle, color: "text-orange-600" };
    default:
      return { icon: Bell, color: "text-gray-600" };
  }
}

/**
 * 날짜 포맷팅
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return "날짜 없음";
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * 날짜까지 남은 일수 계산
 */
function getDaysUntil(dateString: string | null): number | null {
  if (!dateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * 건강 알림 목록 컴포넌트
 */
export function HealthAlertsList({ alerts, className }: HealthAlertsListProps) {
  if (alerts.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
          <p className="text-muted-foreground">현재 알림이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-3 ${className || ""}`}>
      {alerts.map((alert) => {
        const { icon: AlertIcon, color } = getAlertIcon(alert.type);
        const daysUntil = getDaysUntil(alert.dueDate);
        const priorityColors = {
          high: "border-red-500 bg-red-50",
          medium: "border-yellow-500 bg-yellow-50",
          low: "border-blue-500 bg-blue-50",
        };

        return (
          <Card
            key={alert.id}
            className={`border-l-4 ${priorityColors[alert.priority]}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertIcon className={`h-5 w-5 ${color} mt-0.5`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{alert.title}</h3>
                    {alert.familyMemberName && (
                      <Badge variant="outline" className="text-xs">
                        {alert.familyMemberName}
                      </Badge>
                    )}
                    <Badge
                      variant={
                        alert.priority === "high"
                          ? "destructive"
                          : alert.priority === "medium"
                            ? "default"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {alert.priority === "high"
                        ? "높음"
                        : alert.priority === "medium"
                          ? "보통"
                          : "낮음"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {alert.description}
                  </p>
                  {daysUntil !== null && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {daysUntil > 0
                          ? `${daysUntil}일 후`
                          : daysUntil === 0
                            ? "오늘"
                            : `${Math.abs(daysUntil)}일 지남`}
                      </span>
                      {alert.dueDate && (
                        <span className="text-muted-foreground">
                          ({formatDate(alert.dueDate)})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
