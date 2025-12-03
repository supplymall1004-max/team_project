/**
 * @file lib/toast/normalize-toast.ts
 * @description 토스트 옵션 정규화 유틸리티
 *
 * 주요 기능:
 * 1. 토스트 입력값 기본값/트리밍 처리
 * 2. 변형(variant)에 따른 표준화
 * 3. 재사용 가능한 순수 함수 제공 (테스트 용이)
 */

export type ToastVariant = "default" | "success" | "destructive";

export interface ToastInput {
  title?: string;
  description?: string;
  duration?: number;
  variant?: ToastVariant;
}

export interface NormalizedToastOptions {
  title: string;
  description?: string;
  duration: number;
  variant: ToastVariant;
}

export const DEFAULT_TOAST_DURATION = 4000;

const sanitizeText = (value?: string): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const normalizeToastOptions = (input: ToastInput): NormalizedToastOptions => {
  const title = sanitizeText(input.title) ?? "알림";
  const description = sanitizeText(input.description);
  const duration =
    typeof input.duration === "number" && Number.isFinite(input.duration) && input.duration > 0
      ? input.duration
      : DEFAULT_TOAST_DURATION;
  const variant: ToastVariant = input.variant ?? "default";

  return {
    title,
    description,
    duration,
    variant,
  };
};


