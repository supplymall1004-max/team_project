/**
 * @file components/health/diet-conflict-warning.tsx
 * @description 식단 충돌 경고 메시지 컴포넌트
 *
 * 주요 기능:
 * 1. 질병과 특수 식단 간의 충돌 경고 표시
 * 2. 심각도별 색상 구분 (절대 금지: 빨강, 경고: 주황, 주의: 노랑)
 * 3. 의학적 근거 및 대안 제시
 * 4. 의사 상담 권장 메시지
 */

"use client";

import { AlertTriangle, X, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ConflictCheckResult, DietConflict } from "@/lib/health/diet-conflict-manager";
import { DISEASE_LABELS } from "@/types/health";
import { SPECIAL_DIET_LABELS } from "@/types/health";

interface DietConflictWarningProps {
  conflictResult: ConflictCheckResult;
  onDismiss?: () => void;
  showDismissButton?: boolean;
  compact?: boolean;
}

/**
 * 식단 충돌 경고 컴포넌트
 */
export function DietConflictWarning({
  conflictResult,
  onDismiss,
  showDismissButton = false,
  compact = false,
}: DietConflictWarningProps) {
  if (!conflictResult.hasConflict) {
    return null;
  }

  const { conflicts, blockedOptions, warnings, cautions } = conflictResult;

  // 절대 금지 충돌
  const absoluteConflicts = conflicts.filter((c) => c.severity === "absolute");
  // 경고 충돌
  const warningConflicts = warnings;
  // 주의 충돌
  const cautionConflicts = cautions;

  return (
    <div className="space-y-3">
      {/* 절대 금지 경고 */}
      {absoluteConflicts.length > 0 && (
        <Alert variant="destructive" className="border-red-500 bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-900 font-semibold">
            선택할 수 없는 식단이 있습니다
          </AlertTitle>
          <AlertDescription className="text-red-800 space-y-3 mt-2">
            {absoluteConflicts.map((conflict, index) => (
              <ConflictItem key={index} conflict={conflict} severity="absolute" />
            ))}
            {showDismissButton && onDismiss && (
              <div className="flex justify-end mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDismiss}
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  확인
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* 경고 메시지 */}
      {warningConflicts.length > 0 && (
        <Alert variant="default" className="border-orange-500 bg-orange-50">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <AlertTitle className="text-orange-900 font-semibold">
            주의가 필요한 식단입니다
          </AlertTitle>
          <AlertDescription className="text-orange-800 space-y-3 mt-2">
            {warningConflicts.map((conflict, index) => (
              <ConflictItem key={index} conflict={conflict} severity="warning" />
            ))}
            <div className="mt-3 p-2 bg-orange-100 rounded-md text-sm">
              <strong>⚠️ 의사 상담 권장:</strong> 이 식단을 선택하기 전에 반드시 담당 의사와 상담하시기 바랍니다.
            </div>
            {showDismissButton && onDismiss && (
              <div className="flex justify-end mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDismiss}
                  className="text-orange-700 border-orange-300 hover:bg-orange-100"
                >
                  확인
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* 주의 메시지 */}
      {cautionConflicts.length > 0 && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50">
          <Info className="h-5 w-5 text-yellow-600" />
          <AlertTitle className="text-yellow-900 font-semibold">
            참고사항
          </AlertTitle>
          <AlertDescription className="text-yellow-800 space-y-3 mt-2">
            {cautionConflicts.map((conflict, index) => (
              <ConflictItem key={index} conflict={conflict} severity="caution" />
            ))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * 개별 충돌 항목 컴포넌트
 */
interface ConflictItemProps {
  conflict: DietConflict;
  severity: "absolute" | "warning" | "caution";
}

function ConflictItem({ conflict, severity }: ConflictItemProps) {
  const diseaseLabel =
    DISEASE_LABELS[conflict.diseaseCode as keyof typeof DISEASE_LABELS] ||
    conflict.diseaseCode;
  const dietLabel =
    SPECIAL_DIET_LABELS[conflict.dietType as keyof typeof SPECIAL_DIET_LABELS] ||
    (conflict.dietType === "diet_mode" ? "다이어트 모드" : conflict.dietType);

  return (
    <div className="space-y-2">
      <div className="font-medium">
        <span className="text-inherit">{diseaseLabel}</span> +{" "}
        <span className="text-inherit">{dietLabel}</span>
      </div>
      <div className="text-sm space-y-1">
        <p className="text-inherit opacity-90">{conflict.reason}</p>
        {conflict.alternativeSuggestion && (
          <div className="mt-2 p-2 bg-white/50 rounded-md">
            <strong className="text-inherit">💡 대안:</strong>{" "}
            <span className="text-inherit">{conflict.alternativeSuggestion}</span>
          </div>
        )}
        <p className="text-xs text-inherit opacity-75 mt-1">
          출처: {conflict.medicalSource}
        </p>
      </div>
    </div>
  );
}

/**
 * 간단한 충돌 요약 컴포넌트 (compact 모드)
 */
export function DietConflictSummary({
  conflictResult,
}: {
  conflictResult: ConflictCheckResult;
}) {
  if (!conflictResult.hasConflict) {
    return null;
  }

  const { blockedOptions, warnings } = conflictResult;

  return (
    <div className="text-sm text-muted-foreground space-y-1">
      {blockedOptions.length > 0 && (
        <div className="flex items-center gap-1 text-red-600">
          <AlertTriangle className="h-4 w-4" />
          <span>
            {blockedOptions.length}개 옵션 선택 불가
          </span>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="flex items-center gap-1 text-orange-600">
          <AlertTriangle className="h-4 w-4" />
          <span>
            {warnings.length}개 옵션 주의 필요
          </span>
        </div>
      )}
    </div>
  );
}

