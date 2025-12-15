/**
 * @file location-permission-guide.tsx
 * @description 위치 권한 안내 컴포넌트
 *
 * 위치 권한이 거부되었을 때 사용자에게 설정으로 이동하는 방법을 안내합니다.
 * 모바일 브라우저별로 다른 안내를 제공합니다.
 */

"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MapPin, Settings, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationPermissionGuideProps {
  onDismiss?: () => void;
  className?: string;
}

/**
 * 모바일 브라우저 및 OS 감지
 */
function detectDevice(): {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  browser: "safari" | "chrome" | "samsung" | "firefox" | "other";
} {
  if (typeof window === "undefined") {
    return {
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      browser: "other",
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isMobile = isIOS || isAndroid;

  let browser: "safari" | "chrome" | "samsung" | "firefox" | "other" = "other";
  if (isIOS) {
    browser = "safari";
  } else if (isAndroid) {
    if (/samsungbrowser/.test(userAgent)) {
      browser = "samsung";
    } else if (/chrome/.test(userAgent)) {
      browser = "chrome";
    } else if (/firefox/.test(userAgent)) {
      browser = "firefox";
    }
  }

  return { isMobile, isIOS, isAndroid, browser };
}

/**
 * 위치 권한 설정으로 이동하는 함수
 */
function openLocationSettings(): void {
  const device = detectDevice();

  if (device.isIOS) {
    // iOS Safari: 설정 앱으로 이동
    // 실제로는 브라우저에서 직접 설정 앱을 열 수 없으므로 안내만 제공
    alert(
      "설정 앱을 열어주세요:\n\n" +
      "1. 홈 화면에서 '설정' 앱 열기\n" +
      "2. 'Safari' 선택\n" +
      "3. '위치 서비스' 선택\n" +
      "4. '이 웹사이트' 또는 'Safari 웹사이트' 선택\n" +
      "5. '사용 중일 때' 또는 '항상' 선택"
    );
  } else if (device.isAndroid) {
    // Android: 앱 설정으로 이동 시도
    // Chrome의 경우 chrome://settings/content/location 링크는 모바일에서 작동하지 않음
    // 대신 안내 메시지 제공
    const instructions = getAndroidInstructions(device.browser);
    alert(instructions);
  } else {
    // 데스크톱: 브라우저 설정 안내
    alert(
      "브라우저 설정에서 위치 권한을 허용해주세요:\n\n" +
      "1. 브라우저 주소창 왼쪽의 자물쇠 아이콘 클릭\n" +
      "2. '위치' 권한을 '허용'으로 변경\n" +
      "3. 페이지 새로고침"
    );
  }
}

/**
 * Android 브라우저별 안내 메시지
 */
function getAndroidInstructions(
  browser: "safari" | "chrome" | "samsung" | "firefox" | "other"
): string {
  const baseInstructions = "설정 앱을 열어주세요:\n\n";

  switch (browser) {
    case "chrome":
      return (
        baseInstructions +
        "1. 설정 앱 열기\n" +
        "2. '앱' 또는 '애플리케이션' 선택\n" +
        "3. 'Chrome' 선택\n" +
        "4. '권한' 선택\n" +
        "5. '위치' 선택\n" +
        "6. '허용' 선택\n\n" +
        "또는\n\n" +
        "1. Chrome 앱 열기\n" +
        "2. 메뉴(⋮) → 설정\n" +
        "3. 사이트 설정 → 위치\n" +
        "4. 이 사이트의 위치 권한 허용"
      );
    case "samsung":
      return (
        baseInstructions +
        "1. 설정 앱 열기\n" +
        "2. '앱' 선택\n" +
        "3. 'Samsung Internet' 선택\n" +
        "4. '권한' 선택\n" +
        "5. '위치' 선택\n" +
        "6. '허용' 선택"
      );
    case "firefox":
      return (
        baseInstructions +
        "1. 설정 앱 열기\n" +
        "2. '앱' 선택\n" +
        "3. 'Firefox' 선택\n" +
        "4. '권한' 선택\n" +
        "5. '위치' 선택\n" +
        "6. '허용' 선택"
      );
    default:
      return (
        baseInstructions +
        "1. 설정 앱 열기\n" +
        "2. '앱' 또는 '애플리케이션' 선택\n" +
        "3. 사용 중인 브라우저 선택\n" +
        "4. '권한' 선택\n" +
        "5. '위치' 선택\n" +
        "6. '허용' 선택"
      );
  }
}

/**
 * 단계별 안내 메시지 생성
 */
function getStepByStepGuide(): {
  title: string;
  steps: string[];
} {
  const device = detectDevice();

  if (device.isIOS) {
    return {
      title: "iOS Safari 위치 권한 설정",
      steps: [
        "홈 화면에서 '설정' 앱 열기",
        "'Safari' 선택",
        "'위치 서비스' 선택",
        "'이 웹사이트' 또는 'Safari 웹사이트' 선택",
        "'사용 중일 때' 또는 '항상' 선택",
        "브라우저로 돌아와서 페이지 새로고침",
      ],
    };
  } else if (device.isAndroid) {
    const browserName =
      device.browser === "chrome"
        ? "Chrome"
        : device.browser === "samsung"
        ? "Samsung Internet"
        : device.browser === "firefox"
        ? "Firefox"
        : "브라우저";

    return {
      title: `Android ${browserName} 위치 권한 설정`,
      steps: [
        "설정 앱 열기",
        "'앱' 또는 '애플리케이션' 선택",
        `'${browserName}' 선택`,
        "'권한' 선택",
        "'위치' 선택",
        "'허용' 선택",
        "브라우저로 돌아와서 페이지 새로고침",
      ],
    };
  } else {
    return {
      title: "데스크톱 브라우저 위치 권한 설정",
      steps: [
        "브라우저 주소창 왼쪽의 자물쇠 아이콘 클릭",
        "'위치' 권한을 '허용'으로 변경",
        "페이지 새로고침",
      ],
    };
  }
}

export function LocationPermissionGuide({
  onDismiss,
  className,
}: LocationPermissionGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const device = detectDevice();
  const guide = getStepByStepGuide();

  return (
    <Alert className={cn("border-orange-500 bg-orange-50 dark:bg-orange-950/20", className)}>
      <div className="flex items-start gap-3">
        <MapPin className="h-5 w-5 shrink-0 text-orange-500 mt-0.5" />
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <AlertTitle className="text-orange-700 dark:text-orange-300 font-semibold">
                위치 권한이 필요합니다
              </AlertTitle>
              <AlertDescription className="text-orange-600 dark:text-orange-400 mt-1">
                정확한 검색을 위해 위치 권한을 허용해주세요.
              </AlertDescription>
            </div>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                onClick={onDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {!isExpanded ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="border-orange-500 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
              >
                <Settings className="h-4 w-4 mr-2" />
                설정 방법 보기
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={openLocationSettings}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <MapPin className="h-4 w-4 mr-2" />
                설정 앱 열기
              </Button>
            </div>
          ) : (
            <div className="space-y-3 pt-2 border-t border-orange-200 dark:border-orange-800">
              <div>
                <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-2">
                  {guide.title}
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-sm text-orange-700 dark:text-orange-300">
                  {guide.steps.map((step, index) => (
                    <li key={index} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="border-orange-500 text-orange-700 hover:bg-orange-100"
                >
                  간단히 보기
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={openLocationSettings}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  설정 앱 열기
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="border-orange-500 text-orange-700 hover:bg-orange-100"
                >
                  페이지 새로고침
                </Button>
              </div>
            </div>
          )}

          {device.isMobile && (
            <div className="text-xs text-orange-600 dark:text-orange-400 pt-2 border-t border-orange-200 dark:border-orange-800">
              💡 팁: 설정을 변경한 후 브라우저로 돌아와서 페이지를 새로고침해주세요.
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}
