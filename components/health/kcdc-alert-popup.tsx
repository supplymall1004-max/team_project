/**
 * @file components/health/kcdc-alert-popup.tsx
 * @description KCDC (질병관리청) 알림 팝업 컴포넌트
 * 
 * 독감, 예방접종, 질병 발생 알림 표시
 */

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  Info,
  AlertCircle,
  ExternalLink,
  X,
} from "lucide-react";
import type { KcdcAlert } from "@/types/kcdc";
import { cn } from "@/lib/utils";

interface KcdcAlertPopupProps {
  alerts: KcdcAlert[];
  open: boolean;
  onClose: () => void;
  onDismiss?: (alertId: string) => void;
}

const SEVERITY_CONFIG = {
  info: {
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    label: "정보",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    label: "경고",
  },
  critical: {
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    label: "긴급",
  },
};

const ALERT_TYPE_LABELS = {
  flu: "독감 알림",
  vaccination: "예방접종 안내",
  disease_outbreak: "질병 발생",
};

export function KcdcAlertPopup({
  alerts,
  open,
  onClose,
  onDismiss,
}: KcdcAlertPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // alerts 배열이 변경되면 currentIndex를 유효한 범위로 조정
  useEffect(() => {
    if (alerts.length > 0 && currentIndex >= alerts.length) {
      setCurrentIndex(Math.max(0, alerts.length - 1));
    }
  }, [alerts.length, currentIndex]);

  if (alerts.length === 0) {
    return null;
  }

  // currentIndex가 유효한 범위 내에 있는지 확인
  const safeIndex = Math.max(0, Math.min(currentIndex, alerts.length - 1));
  const currentAlert = alerts[safeIndex];

  // currentAlert가 없거나 severity가 없으면 null 반환
  if (!currentAlert || !currentAlert.severity) {
    return null;
  }

  // severity가 유효한 값인지 확인하고 기본값 사용
  const severity = currentAlert.severity as keyof typeof SEVERITY_CONFIG;
  const severityConfig = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.info;
  const SeverityIcon = severityConfig.icon;

  const handleNext = () => {
    if (safeIndex < alerts.length - 1) {
      setCurrentIndex(safeIndex + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (safeIndex > 0) {
      setCurrentIndex(safeIndex - 1);
    }
  };

  const handleDismiss = () => {
    onDismiss?.(currentAlert.id);
    handleNext();
  };

  const handleClose = () => {
    setCurrentIndex(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SeverityIcon className={cn("h-5 w-5", severityConfig.color)} />
              <DialogTitle className="text-lg">
                {ALERT_TYPE_LABELS[currentAlert.alert_type]}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={severityConfig.color}>
                {severityConfig.label}
              </Badge>
              {alerts.length > 1 && (
                <Badge variant="secondary">
                  {safeIndex + 1} / {alerts.length}
                </Badge>
              )}
            </div>
          </div>
          <DialogDescription className="sr-only">
            {currentAlert.title} - {currentAlert.content?.substring(0, 100) || "질병관리청 알림"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 제목 */}
          <div>
            <h3 className="font-semibold text-lg">{currentAlert.title}</h3>
            {currentAlert.published_at && (
              <p className="text-sm text-muted-foreground mt-1">
                발표일:{" "}
                {new Date(currentAlert.published_at).toLocaleDateString("ko-KR")}
              </p>
            )}
          </div>

          {/* 내용 */}
          <Alert className={cn(severityConfig.bgColor, severityConfig.borderColor)}>
            <AlertDescription className="text-sm whitespace-pre-wrap">
              {currentAlert.content}
            </AlertDescription>
          </Alert>

          {/* 독감 정보 */}
          {currentAlert.alert_type === "flu" && currentAlert.flu_stage && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                {currentAlert.flu_stage} 단계
              </Badge>
              {currentAlert.flu_week && (
                <span className="text-sm text-muted-foreground">
                  ({currentAlert.flu_week})
                </span>
              )}
            </div>
          )}

          {/* 예방접종 정보 */}
          {currentAlert.alert_type === "vaccination" && (
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              {currentAlert.vaccine_name && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">백신:</span>
                  <Badge variant="secondary">{currentAlert.vaccine_name}</Badge>
                </div>
              )}
              {currentAlert.target_age_group && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">대상:</span>
                  <Badge variant="outline">{currentAlert.target_age_group}</Badge>
                </div>
              )}
              {currentAlert.recommended_date && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">권장일:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(currentAlert.recommended_date).toLocaleDateString(
                      "ko-KR"
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 출처 링크 */}
          {currentAlert.source_url && (
            <div className="pt-2">
              <a
                href={currentAlert.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                자세히 보기 (질병관리청)
              </a>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            {safeIndex > 0 && (
              <Button variant="outline" onClick={handlePrevious} className="flex-1">
                이전
              </Button>
            )}
            {alerts.length > 1 && onDismiss && (
              <Button
                variant="ghost"
                onClick={handleDismiss}
                className="flex-1"
              >
                다시 보지 않기
              </Button>
            )}
          </div>
          <Button onClick={handleNext} className="flex-1">
            {safeIndex < alerts.length - 1 ? "다음" : "확인"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


