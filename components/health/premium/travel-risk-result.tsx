/**
 * @file components/health/premium/travel-risk-result.tsx
 * @description 여행 위험도 평가 결과 컴포넌트 (프리미엄 전용)
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plane,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Shield,
  CheckSquare,
} from "lucide-react";
import type { TravelRiskAssessment, RiskLevel } from "@/types/kcdc";
import { cn } from "@/lib/utils";

interface TravelRiskResultProps {
  assessment: TravelRiskAssessment;
  className?: string;
}

const RISK_LEVEL_CONFIG: Record<
  RiskLevel,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: typeof AlertCircle;
  }
> = {
  low: {
    label: "낮음",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: CheckCircle2,
  },
  moderate: {
    label: "보통",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    icon: Info,
  },
  high: {
    label: "높음",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    icon: AlertTriangle,
  },
  critical: {
    label: "매우 높음",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: AlertCircle,
  },
};

export function TravelRiskResult({
  assessment,
  className,
}: TravelRiskResultProps) {
  const riskConfig = RISK_LEVEL_CONFIG[assessment.risk_level];

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5" />
            여행 위험도 평가
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(
              riskConfig.color,
              riskConfig.borderColor
            )}
          >
            {riskConfig.label}
          </Badge>
        </div>
        <CardDescription>
          {assessment.destination_country}
          {assessment.destination_region && ` - ${assessment.destination_region}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 질병 경보 */}
        {assessment.disease_alerts &&
          assessment.disease_alerts.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-semibold">질병 경보</div>
              <div className="space-y-2">
                {assessment.disease_alerts.map((alert, index) => (
                  <Alert
                    key={index}
                    variant={
                      alert.severity === "critical"
                        ? "destructive"
                        : alert.severity === "high"
                        ? "default"
                        : "default"
                    }
                  >
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      <div className="font-semibold">{alert.disease_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {alert.description}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

        {/* 예방 체크리스트 */}
        {assessment.prevention_checklist &&
          assessment.prevention_checklist.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-semibold flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                예방 체크리스트
              </div>
              <ul className="space-y-1 text-sm">
                {assessment.prevention_checklist.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckSquare className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        {/* 백신 요구사항 */}
        {assessment.vaccination_requirements &&
          assessment.vaccination_requirements.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4" />
                백신 요구사항
              </div>
              <div className="space-y-2">
                {assessment.vaccination_requirements.map((req, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="font-medium">{req.vaccine_name}</div>
                      {req.recommended_date && (
                        <div className="text-xs text-muted-foreground">
                          권장 접종일: {new Date(req.recommended_date).toLocaleDateString("ko-KR")}
                        </div>
                      )}
                    </div>
                    {req.required && (
                      <Badge variant="destructive">필수</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* 여행 일정 */}
        <div className="pt-4 border-t text-sm text-muted-foreground">
          <div>
            여행 기간:{" "}
            {new Date(assessment.travel_start_date).toLocaleDateString("ko-KR")}{" "}
            ~ {new Date(assessment.travel_end_date).toLocaleDateString("ko-KR")}
          </div>
          {assessment.created_at && (
            <div className="mt-1">
              평가일: {new Date(assessment.created_at).toLocaleString("ko-KR")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

