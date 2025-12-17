import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NaverMoreLinksSection } from "@/components/health/medical-facilities/naver-more-links-section";

describe("NaverMoreLinksSection", () => {
  const openSpy = vi.fn();

  beforeEach(() => {
    openSpy.mockClear();
    // @ts-expect-error - test double for window.open
    window.open = openSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("4개의 '더 많은 보기' 카드가 렌더링된다", () => {
    render(<NaverMoreLinksSection currentLocation={null} />);

    expect(screen.getByText("네이버지도 약국 더보기")).toBeInTheDocument();
    expect(screen.getByText("네이버지도 병원 더보기")).toBeInTheDocument();
    expect(screen.getByText("네이버지도 동물병원 더보기")).toBeInTheDocument();
    expect(screen.getByText("네이버지도 동물약국 더보기")).toBeInTheDocument();

    // 버튼은 4개
    expect(screen.getAllByRole("button", { name: "네이버지도" })).toHaveLength(
      4,
    );
  });

  it("현재 위치가 있으면 좌표 기반 URL로 window.open을 호출한다", () => {
    render(
      <NaverMoreLinksSection currentLocation={{ lat: 37.5, lon: 127.0 }} />,
    );

    const buttons = screen.getAllByRole("button", { name: "네이버지도" });
    fireEvent.click(buttons[0]); // 약국

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy.mock.calls[0]?.[0]).toContain(
      "https://map.naver.com/p/search/",
    );
    expect(openSpy.mock.calls[0]?.[0]).toContain("?c=37.5,127,15");
    expect(openSpy.mock.calls[0]?.[1]).toBe("_blank");
  });
});
