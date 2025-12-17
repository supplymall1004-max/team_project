/**
 * @file LocationPermissionToggle.tsx
 * @description 홈/설정에서 공통으로 사용하는 "위치 사용" 토글 UI
 *
 * 이 토글은 OS(설정 앱)의 권한 토글을 직접 바꾸는 것이 아니라,
 * 우리 앱 내부에서 "위치 기능을 사용할지"를 ON/OFF로 관리합니다.
 *
 * 사용자가 ON으로 전환하면:
 * - (옵션) caller가 전달한 onEnableRequest를 실행하여
 *   브라우저 위치 권한 팝업(허용/차단)을 실제로 트리거할 수 있습니다.
 *
 * @dependencies
 * - hooks/use-location-preference
 * - shadcn/ui Switch
 */

"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertCircle, MapPin } from "lucide-react";

import { useLocationPreference } from "@/hooks/use-location-preference";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface LocationPermissionToggleProps {
  className?: string;
  /**
   * 토글이 ON으로 바뀐 직후 실행됩니다.
   * 여기서 navigator.geolocation.getCurrentPosition 등을 호출하면
   * 모바일 브라우저가 권한 팝업을 띄울 수 있습니다.
   */
  onEnableRequest?: () => Promise<void> | void;
}

interface EnableErrorState {
  message: string;
}

function getGeolocationStatusLabel(
  status: PermissionState | "unsupported" | "unknown",
): string {
  switch (status) {
    case "granted":
      return "허용됨";
    case "prompt":
      return "요청 필요";
    case "denied":
      return "차단됨";
    case "unsupported":
      return "미지원";
    default:
      return "알 수 없음";
  }
}

async function safeQueryGeolocationPermission(): Promise<
  PermissionState | "unsupported" | "unknown"
> {
  try {
    if (typeof window === "undefined") return "unknown";
    if (!("permissions" in navigator)) return "unsupported";
    // Permissions API는 일부 브라우저에서 부분 지원입니다.
    const result = await (navigator.permissions as any).query({
      name: "geolocation",
    });
    const state = result?.state as PermissionState | undefined;
    return state ?? "unknown";
  } catch (error) {
    console.warn("[location] permissions.query failed:", error);
    return "unknown";
  }
}

export function LocationPermissionToggle(props: LocationPermissionToggleProps) {
  const { className, onEnableRequest } = props;
  const { isLocationEnabled, isLoaded, setIsLocationEnabled } =
    useLocationPreference();

  const [enableError, setEnableError] = useState<EnableErrorState | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    PermissionState | "unsupported" | "unknown"
  >("unknown");

  const permissionLabel = useMemo(() => {
    return getGeolocationStatusLabel(permissionStatus);
  }, [permissionStatus]);

  const refreshPermissionStatus = useCallback(async () => {
    const next = await safeQueryGeolocationPermission();
    console.log("[location] permission status:", next);
    setPermissionStatus(next);
  }, []);

  const handleToggle = useCallback(
    async (nextChecked: boolean) => {
      setEnableError(null);
      setIsLocationEnabled(nextChecked);

      console.group("[location] ui toggle changed");
      console.log("checked:", nextChecked);
      console.groupEnd();

      if (!nextChecked) return;

      try {
        await refreshPermissionStatus();
        await onEnableRequest?.();
        await refreshPermissionStatus();
      } catch (error) {
        // 권한 거부는 사용자 선택으로 발생할 수 있어 error로 남기지 않습니다.
        const isPermissionDeniedMessage =
          error instanceof Error &&
          (error.message.includes("권한") ||
            error.message.includes("Geolocation") ||
            error.message.includes("denied"));

        if (isPermissionDeniedMessage) {
          console.warn("[location] enable request denied:", error);
        } else {
          console.error("[location] enable request failed:", error);
        }
        setEnableError({
          message:
            error instanceof Error
              ? error.message
              : "위치 권한 요청 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        });
      }
    },
    [onEnableRequest, refreshPermissionStatus, setIsLocationEnabled],
  );

  return (
    <div className={cn("rounded-lg border bg-white p-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <p className="font-semibold text-gray-900">위치 사용</p>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            네이버지도에서 <strong>현재 위치 추적</strong>을 할 때만 사용합니다.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            브라우저 권한 상태:{" "}
            <span className="font-medium text-gray-700">{permissionLabel}</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Switch
            aria-label="위치 사용 토글"
            checked={isLoaded ? isLocationEnabled : false}
            onCheckedChange={(checked) => {
              // Radix는 boolean을 전달합니다.
              void handleToggle(checked);
            }}
          />
        </div>
      </div>

      {enableError && (
        <div className="mt-3">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{enableError.message}</AlertDescription>
          </Alert>
        </div>
      )}

      {permissionStatus === "denied" && (
        <div className="mt-3 text-sm text-gray-700">
          <p className="font-medium">권한이 차단되어 있어요.</p>
          <p className="mt-1 text-gray-600">
            휴대폰/브라우저 설정에서 이 사이트의 <strong>위치</strong>를{" "}
            <strong>허용</strong>으로 바꾼 뒤, 다시 “위치 새로고침”을
            눌러주세요.
          </p>
        </div>
      )}
    </div>
  );
}
