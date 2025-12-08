/**
 * @file components/checkpoint-banner.tsx
 * @description Discord 스타일의 체크포인트 배너 컴포넌트
 *
 * 오른쪽 상단에 고정되어 표시되는 알림 배너로, 사용자에게 특정 이벤트나 활동을 알립니다.
 * Discord의 "체크포인트" 알림과 유사한 디자인과 동작을 구현합니다.
 *
 * 주요 기능:
 * 1. 오른쪽 상단 고정 위치
 * 2. 빛나는 녹색 테두리 효과
 * 3. 닫기 기능 및 localStorage 상태 저장
 * 4. 부드러운 애니메이션 효과
 *
 * @dependencies
 * - lucide-react: 아이콘
 * - tailwindcss: 스타일링
 */

"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CheckpointBannerProps {
  /** 배너 제목 */
  title?: string;
  /** 배너 본문 텍스트 */
  message: string;
  /** 클릭 시 이동할 URL (선택사항) */
  actionUrl?: string;
  /** localStorage에 저장할 키 (기본값: 'checkpoint_dismissed') */
  storageKey?: string;
  /** 배너를 표시할 조건 (기본값: true) */
  shouldShow?: boolean;
  /** 닫기 버튼 클릭 시 콜백 */
  onClose?: () => void;
  /** 액션 버튼 클릭 시 콜백 */
  onAction?: () => void;
}

export function CheckpointBanner({
  title = "체크포인트",
  message,
  actionUrl,
  storageKey = "checkpoint_dismissed",
  shouldShow = true,
  onClose,
  onAction,
}: CheckpointBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 컴포넌트 마운트 확인 및 localStorage 체크
  useEffect(() => {
    setIsMounted(true);
    
    if (!shouldShow) {
      return;
    }

    // localStorage에서 닫힌 상태 확인
    // 팝업 시스템과 호환: 타임스탬프 또는 "true" 모두 확인
    const dismissed = localStorage.getItem(storageKey);
    if (dismissed) {
      // 타임스탬프인 경우 (팝업 시스템 방식)
      const dismissedTime = parseInt(dismissed, 10);
      if (!isNaN(dismissedTime)) {
        const now = Date.now();
        if (now < dismissedTime) {
          console.log("✅ 체크포인트 배너가 이미 닫혀있음 (타임스탬프)");
          return;
        } else {
          // 기간이 지났으면 삭제
          localStorage.removeItem(storageKey);
        }
      } else if (dismissed === "true") {
        // "true"인 경우 (기존 방식)
        console.log("✅ 체크포인트 배너가 이미 닫혀있음");
        return;
      }
    }

    // 약간의 지연 후 표시 (애니메이션 효과를 위해)
    const timer = setTimeout(() => {
      setIsVisible(true);
      console.log("✅ 체크포인트 배너 표시");
    }, 500);

    return () => clearTimeout(timer);
  }, [storageKey, shouldShow]);

  // 닫기 핸들러
  const handleClose = () => {
    console.log("🔒 체크포인트 배너 닫기");
    setIsVisible(false);
    
    // localStorage에 닫힌 상태 저장
    try {
      localStorage.setItem(storageKey, "true");
      console.log("✅ 닫힌 상태 저장됨:", storageKey);
    } catch (error) {
      console.error("❌ localStorage 저장 실패:", error);
    }

    // 콜백 실행
    onClose?.();
  };

  // 액션 핸들러
  const handleAction = () => {
    console.log("👉 체크포인트 배너 액션 클릭");
    
    if (actionUrl) {
      window.location.href = actionUrl;
    }
    
    onAction?.();
  };

  // 마운트되지 않았거나 표시하지 않으면 렌더링하지 않음
  if (!isMounted || !shouldShow || !isVisible) {
    return null;
  }

  return (
    <div
      className={`
        fixed top-5 right-5 z-[1000]
        w-[320px] max-w-[calc(100vw-2rem)]
        bg-green-500 text-white
        rounded-lg p-4
        shadow-lg
        transition-all duration-300 ease-out
        ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"}
        border border-green-400/50
        hover:shadow-xl hover:scale-[1.02]
        animate-in slide-in-from-right-5 fade-in
      `}
      style={{
        boxShadow: `
          0 0 10px rgba(34, 197, 94, 0.5),
          0 0 20px rgba(34, 197, 94, 0.3),
          0 0 30px rgba(34, 197, 94, 0.2),
          0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06)
        `,
      }}
      role="alert"
      aria-live="polite"
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">{title}</h3>
          <p className="text-xs text-green-50 leading-relaxed">{message}</p>
        </div>
        
        {/* 닫기 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="
            h-6 w-6 p-0
            text-white hover:text-white
            hover:bg-green-600/50
            rounded
            flex-shrink-0
          "
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 액션 버튼 */}
      {(actionUrl || onAction) && (
        <button
          onClick={handleAction}
          className="
            mt-3 w-full
            flex items-center justify-center gap-2
            bg-white/20 hover:bg-white/30
            text-white text-xs font-medium
            rounded px-3 py-2
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-white/50
          "
        >
          <span>자세히 보기</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

