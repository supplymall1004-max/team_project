/**
 * @file components/health/premium/infection-risk-card.tsx
 * @description 감염병 위험 지수 카드 컴포넌트 (프리미엄 전용)
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  RefreshCw,
  Shield,
} from "lucide-react";
import { PremiumGate, PremiumBadge } from "@/components/premium/premium-gate";
import { getCurrentSubscription } from "@/actions/payments/get-subscription";
import type { InfectionRiskScore, RiskLevel } from "@/types/kcdc";
import { cn } from "@/lib/utils";

interface InfectionRiskCardProps {
  familyMemberId?: string;
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

export function InfectionRiskCard({
  familyMemberId,
  className,
}: InfectionRiskCardProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [riskScore, setRiskScore] = useState<InfectionRiskScore | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkPremiumAndLoad();
  }, []);

  const checkPremiumAndLoad = async () => {
    try {
      const subscription = await getCurrentSubscription();
      setIsPremium(subscription.isPremium || false);

      if (subscription.isPremium) {
        await loadRiskScore();
      }
    } catch (err) {
      console.error("프리미엄 체크 실패:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRiskScore = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (familyMemberId) {
        params.append("family_member_id", familyMemberId);
      }

      const response = await fetch(
        `/api/health/kcdc-premium/risk-scores?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("위험 지수 조회에 실패했습니다.");
      }

      const data = await response.json();
      setRiskScore(data.data);
    } catch (err) {
      console.error("위험 지수 조회 실패:", err);
      setError(err instanceof Error ? err.message : "위험 지수를 불러올 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculate = async () => {
    try {
      setIsCalculating(true);
      setError(null);

      const response = await fetch("/api/health/kcdc-premium/risk-scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          family_member_id: familyMemberId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "위험 지수 계산에 실패했습니다.");
      }

      const data = await response.json();
      setRiskScore(data.data);
    } catch (err) {
      console.error("위험 지수 계산 실패:", err);
      setError(err instanceof Error ? err.message : "위험 지수 계산에 실패했습니다.");
    } finally {
      setIsCalculating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            감염병 위험 지수
            <PremiumBadge />
          </CardTitle>
          <CardDescription>개인 건강 정보 기반 위험도 평가</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <PremiumGate isPremium={isPremium} variant="card">
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            감염병 위험 지수
            <PremiumBadge />
          </CardTitle>
          <CardDescription>
            개인 건강 정보 기반 위험도 평가
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {riskScore ? (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">위험 지수</div>
                  <div className="text-3xl font-bold">{riskScore.risk_score}</div>
                </div>
                <div
                  className={cn(
                    "rounded-lg border-2 p-4",
                    RISK_LEVEL_CONFIG[riskScore.risk_level].bgColor,
                    RISK_LEVEL_CONFIG[riskScore.risk_level].borderColor
                  )}
                >
                  {(() => {
                    const Icon = RISK_LEVEL_CONFIG[riskScore.risk_level].icon;
                    return (
                      <Icon
                        className={cn(
                          "w-8 h-8",
                          RISK_LEVEL_CONFIG[riskScore.risk_level].color
                        )}
                      />
                    );
                  })()}
                </div>
              </div>

              <Badge
                variant="outline"
                className={cn(
                  RISK_LEVEL_CONFIG[riskScore.risk_level].color,
                  RISK_LEVEL_CONFIG[riskScore.risk_level].borderColor
                )}
              >
                {RISK_LEVEL_CONFIG[riskScore.risk_level].label}
              </Badge>

              {riskScore.recommendations && riskScore.recommendations.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold">권장 사항</div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {riskScore.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {riskScore.calculated_at && (
                <div className="text-xs text-muted-foreground">
                  계산일: {new Date(riskScore.calculated_at).toLocaleString("ko-KR")}
                </div>
              )}

              <Button
                onClick={handleCalculate}
                disabled={isCalculating}
                variant="outline"
                className="w-full"
              >
                {isCalculating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    계산 중...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    다시 계산하기
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>위험 지수가 아직 계산되지 않았습니다.</p>
                <p className="text-sm mt-2">
                  건강 정보를 기반으로 감염병 위험도를 평가해보세요.
                </p>
              </div>
              <Button
                onClick={handleCalculate}
                disabled={isCalculating}
                className="w-full"
              >
                {isCalculating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    계산 중...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    위험 지수 계산하기
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </PremiumGate>
  );
}

