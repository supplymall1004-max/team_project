/**
 * @file __tests__/location-permission-toggle.test.tsx
 * @description "위치 사용" 토글의 저장/권한 트리거 동작 테스트
 *
 * - localStorage에 값이 저장되는지
 * - ON으로 바꿀 때 onEnableRequest가 호출되는지
 */

import { describe, expect, it, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { LocationPermissionToggle } from "@/components/location/LocationPermissionToggle";

function mockLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

describe("LocationPermissionToggle", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const ls = mockLocalStorage();
    Object.defineProperty(window, "localStorage", {
      value: ls,
      configurable: true,
    });
  });

  it("기본값은 OFF이며, 클릭하면 localStorage에 true가 저장되고 onEnableRequest가 호출된다", async () => {
    const onEnableRequest = vi.fn(async () => {});

    render(<LocationPermissionToggle onEnableRequest={onEnableRequest} />);

    const toggle = screen.getByLabelText("위치 사용 토글");
    expect(toggle).toHaveAttribute("data-state", "unchecked");

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(onEnableRequest).toHaveBeenCalledTimes(1);
    });

    // 내부 훅이 key를 사용해 저장하므로, setItem 호출 결과로 간접 검증
    expect(window.localStorage.getItem("app.location.enabled.v1")).toBe("true");
  });

  it("ON 상태에서 다시 클릭하면 localStorage에 false가 저장된다", async () => {
    window.localStorage.setItem("app.location.enabled.v1", "true");

    render(<LocationPermissionToggle />);

    const toggle = screen.getByLabelText("위치 사용 토글");

    // 초기 렌더는 hydration 후 effect에서 로드되므로 대기
    await waitFor(() => {
      expect(toggle).toHaveAttribute("data-state", "checked");
    });

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(window.localStorage.getItem("app.location.enabled.v1")).toBe("false");
    });
  });
});

