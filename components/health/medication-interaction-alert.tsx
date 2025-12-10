/**
 * @file components/health/medication-interaction-alert.tsx
 * @description 약물 상호작용 알림 컴포넌트
 *
 * 약물 상호작용 검사 결과를 표시하고 사용자에게 알림을 제공합니다.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle,
  Pill,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * 약물 상호작용 검사 결과
 */
interface InteractionCheckResult {
  hasInteractions: boolean;
  interactions: Array<{
    medicationA: string;
    medicationB: string;
    level: "severe" | "moderate" | "mild" | "info";
    description: string | null;
    recommendation: string | null;
    source: string;
  }>;
  severeCount: number;
  moderateCount: number;
  mildCount: number;
  infoCount: number;
}

interface MedicationInteractionAlertProps {
  familyMemberId?: string | null;
  medicationName?: string; // 새 약물 추가 시 검사할 약물명
  onCheckComplete?: (result: InteractionCheckResult) => void;
}

/**
 * 위험도에 따른 아이콘 및 색상
 */
function getLevelIcon(level: InteractionCheckResult["interactions"][0]["level"]): {
  icon: typeof AlertTriangle;
  color: string;
  bgColor: string;
  label: string;
} {
  switch (level) {
    case "severe":
      return {
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50 border-red-200",
        label: "위험",
      };
    case "moderate":
      return {
        icon: AlertTriangle,
        color: "text-orange-600",
        bgColor: "bg-orange-50 border-orange-200",
        label: "주의",
      };
    case "mild":
      return {
        icon: Info,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 border-yellow-200",
        label: "경미",
      };
    case "info":
      return {
        icon: Info,
        color: "text-blue-600",
        bgColor: "bg-blue-50 border-blue-200",
        label: "정보",
      };
  }
}

export function MedicationInteractionAlert({
  familyMemberId,
  medicationName,
  onCheckComplete,
}: MedicationInteractionAlertProps) {
  const [result, setResult] = useState<InteractionCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkInteractions = async () => {
      try {
        setLoading(true);
        console.group("[MedicationInteractionAlert] 약물 상호작용 검사");

        let response: Response;

        if (medicationName) {
          // 새 약물 추가 시 검사
          response = await fetch("/api/health/medications/interactions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              medication_name: medicationName,
              family_member_id: familyMemberId,
            }),
          });
        } else {
          // 현재 복용 중인 약물 검사
          const params = new URLSearchParams();
          if (familyMemberId) {
            params.append("family_member_id", familyMemberId);
          }
          response = await fetch(
            `/api/health/medications/interactions?${params.toString()}`
          );
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "약물 상호작용 검사 실패");
        }

        console.log("✅ 약물 상호작용 검사 완료:", data.data);
        setResult(data.data);
        onCheckComplete?.(data.data);
        console.groupEnd();
      } catch (error) {
        console.error("❌ 약물 상호작용 검사 실패:", error);
        console.groupEnd();
        toast({
          title: "검사 실패",
          description:
            error instanceof Error
              ? error.message
              : "약물 상호작용 검사 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkInteractions();
  }, [familyMemberId, medicationName, onCheckComplete, toast]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">약물 상호작용 검사 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return null;
  }

  if (!result.hasInteractions) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">상호작용 없음</AlertTitle>
        <AlertDescription className="text-green-700">
          {medicationName
            ? `${medicationName}과(와) 현재 복용 중인 약물 간 상호작용이 없습니다.`
            : "현재 복용 중인 약물 간 상호작용이 없습니다."}
        </AlertDescription>
      </Alert>
    );
  }

  // 위험도별로 정렬 (severe > moderate > mild > info)
  const sortedInteractions = [...result.interactions].sort((a, b) => {
    const order = { severe: 0, moderate: 1, mild: 2, info: 3 };
    return order[a.level] - order[b.level];
  });

  return (
    <div className="space-y-4">
      {/* 요약 정보 */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            약물 상호작용 발견
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {result.severeCount > 0 && (
              <div>
                <div className="text-sm text-muted-foreground">위험</div>
                <div className="text-2xl font-bold text-red-600">{result.severeCount}건</div>
              </div>
            )}
            {result.moderateCount > 0 && (
              <div>
                <div className="text-sm text-muted-foreground">주의</div>
                <div className="text-2xl font-bold text-orange-600">{result.moderateCount}건</div>
              </div>
            )}
            {result.mildCount > 0 && (
              <div>
                <div className="text-sm text-muted-foreground">경미</div>
                <div className="text-2xl font-bold text-yellow-600">{result.mildCount}건</div>
              </div>
            )}
            {result.infoCount > 0 && (
              <div>
                <div className="text-sm text-muted-foreground">정보</div>
                <div className="text-2xl font-bold text-blue-600">{result.infoCount}건</div>
              </div>
            )}
          </div>
          <p className="mt-4 text-sm text-red-700">
            {result.severeCount > 0 && (
              <strong className="font-semibold">
                위험한 상호작용이 발견되었습니다. 즉시 의사나 약사에게 상담하세요.
              </strong>
            )}
            {result.severeCount === 0 && result.moderateCount > 0 && (
              <strong className="font-semibold">
                주의가 필요한 상호작용이 있습니다. 의사나 약사에게 상담을 권장합니다.
              </strong>
            )}
          </p>
        </CardContent>
      </Card>

      {/* 상세 상호작용 목록 */}
      <div className="space-y-3">
        {sortedInteractions.map((interaction, index) => {
          const levelInfo = getLevelIcon(interaction.level);
          const LevelIcon = levelInfo.icon;

          return (
            <Card
              key={index}
              className={`border-l-4 ${levelInfo.bgColor}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <LevelIcon className={`h-5 w-5 ${levelInfo.color} mt-0.5 flex-shrink-0`} />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">
                        {interaction.medicationA} + {interaction.medicationB}
                      </h3>
                      <Badge
                        variant={
                          interaction.level === "severe"
                            ? "destructive"
                            : interaction.level === "moderate"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {levelInfo.label}
                      </Badge>
                      {interaction.source && (
                        <Badge variant="outline" className="text-xs">
                          {interaction.source === "mfds"
                            ? "식약처"
                            : interaction.source === "manual"
                              ? "수동 입력"
                              : "외부 API"}
                        </Badge>
                      )}
                    </div>
                    {interaction.description && (
                      <p className="text-sm text-muted-foreground">
                        {interaction.description}
                      </p>
                    )}
                    {interaction.recommendation && (
                      <div className="p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-sm font-medium mb-1">권장사항:</p>
                        <p className="text-sm text-muted-foreground">
                          {interaction.recommendation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 안내 메시지 */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>중요 안내</AlertTitle>
        <AlertDescription>
          이 정보는 참고용이며, 실제 약물 복용 전 반드시 의사나 약사에게 상담하시기 바랍니다.
          약물 상호작용은 개인 건강 상태에 따라 다를 수 있습니다.
        </AlertDescription>
      </Alert>
    </div>
  );
}

