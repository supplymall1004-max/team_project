/**
 * @file hooks/use-toast.ts
 * @description Sonner 기반 토스트 훅
 *
 * 주요 기능:
 * 1. 토스트 입력값을 정규화하여 일관된 UI 제공
 * 2. 변형(variant)에 따른 시각적 상태 구분
 * 3. 핵심 이벤트를 콘솔 로그로 남겨 디버깅 용이성 확보
 */

"use client";

import { useCallback } from "react";
import { toast as sonnerToast, type ExternalToast } from "sonner";

import {
  normalizeToastOptions,
  type ToastInput,
  type ToastVariant,
} from "@/lib/toast/normalize-toast";

type ToastInvoker = (message: string, options?: ExternalToast) => string | number;

const TOAST_VARIANT_EXECUTORS: Record<ToastVariant, ToastInvoker> = {
  default: (message, options) => sonnerToast(message, options),
  success: (message, options) => sonnerToast.success(message, options),
  destructive: (message, options) => sonnerToast.error(message, options),
};

interface UseToastResult {
  toast: (input: ToastInput) => void;
}

export function useToast(): UseToastResult {
  const showToast = useCallback((input: ToastInput) => {
    const normalized = normalizeToastOptions(input);

    console.group("[Toast]");
    console.log("title", normalized.title);
    console.log("variant", normalized.variant);
    console.log("duration", normalized.duration);
    console.groupEnd();

    const executor = TOAST_VARIANT_EXECUTORS[normalized.variant];
    executor(normalized.title, {
      description: normalized.description,
      duration: normalized.duration,
    });
  }, []);

  return { toast: showToast };
}


