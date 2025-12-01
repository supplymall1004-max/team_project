/**
 * @file __tests__/use-toast.test.ts
 * @description 토스트 옵션 정규화 유틸 테스트 (TDD 1단계)
 */

import { describe, expect, it } from "vitest";
import {
  DEFAULT_TOAST_DURATION,
  normalizeToastOptions,
  type ToastInput,
} from "@/lib/toast/normalize-toast";

describe("normalizeToastOptions", () => {
  const baseInput: ToastInput = {
    title: "테스트",
    description: "내용",
  };

  it("기본값을 적용한다", () => {
    const result = normalizeToastOptions(baseInput);
    expect(result).toMatchObject({
      title: "테스트",
      description: "내용",
      duration: DEFAULT_TOAST_DURATION,
      variant: "default",
    });
  });

  it("문자열을 trim 처리하고 공백만 있는 description 은 제거한다", () => {
    const result = normalizeToastOptions({
      title: "  알림  ",
      description: "   ",
    });

    expect(result.title).toBe("알림");
    expect(result.description).toBeUndefined();
  });

  it("duration 이 0 이하라면 기본값으로 대체한다", () => {
    const result = normalizeToastOptions({
      title: "완료",
      duration: 0,
    });

    expect(result.duration).toBe(DEFAULT_TOAST_DURATION);
  });

  it("사용자 지정 duration 과 variant 를 우선한다", () => {
    const result = normalizeToastOptions({
      title: "완료",
      duration: 1000,
      variant: "success",
    });

    expect(result.duration).toBe(1000);
    expect(result.variant).toBe("success");
  });

  it("타이틀 누락 또는 공백일 때 기본 타이틀을 부여한다", () => {
    expect(normalizeToastOptions({ description: "본문" }).title).toBe("알림");
    expect(normalizeToastOptions({ title: "   " }).title).toBe("알림");
  });
});


